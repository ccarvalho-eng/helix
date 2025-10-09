defmodule Helix.Flows.SessionServer do
  @moduledoc """
  GenServer that manages flow session state.
  """

  use GenServer
  require Logger

  alias Helix.Flows.Types

  @type flow_id :: Types.flow_id()
  @type client_id :: Types.client_id()
  @type flow_status :: Types.flow_status()
  @type sessions_map :: Types.sessions_map()
  @type operation_result :: Types.operation_result()

  # Resource limits
  @max_clients_per_flow 1000

  # Client API

  @doc """
  Start a SessionServer GenServer for a specific flow.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts) do
    flow_id = Keyword.fetch!(opts, :flow_id)
    name = Keyword.get(opts, :name)
    GenServer.start_link(__MODULE__, %{flow_id: flow_id}, name: name)
  end

  @doc """
  Child specification for dynamic supervisors.

  Sets restart policy to :transient so sessions are restarted only on abnormal exits,
  not when they terminate normally (e.g., when no clients remain).
  """
  def child_spec(opts) do
    %{
      id: {__MODULE__, Keyword.fetch!(opts, :flow_id)},
      start: {__MODULE__, :start_link, [opts]},
      restart: :transient,
      shutdown: 5_000,
      type: :worker
    }
  end

  @doc """
  Join a client to a flow session.

  Returns `{:ok, client_count, effective_client_id}` where:
  - client_count is the total number of clients currently connected to the flow
  - effective_client_id is the actual client_id used (may be generated if input was invalid)
  """
  @spec join_flow(flow_id(), client_id()) :: {:ok, pos_integer(), client_id()} | {:error, term()}
  def join_flow(flow_id, client_id) do
    case Helix.Flows.FlowSessionManager.get_or_start_session(flow_id) do
      {:ok, pid} -> GenServer.call(pid, {:join_flow, client_id}, 5000)
      error -> error
    end
  end

  @doc """
  Remove a client from a flow session.

  Returns `{:ok, client_count}` where client_count is the remaining number of clients
  connected to the flow after removal.
  """
  @spec leave_flow(flow_id(), client_id()) :: operation_result()
  def leave_flow(flow_id, client_id) do
    case Helix.Flows.FlowSessionManager.get_or_start_session(flow_id) do
      {:ok, pid} -> GenServer.call(pid, {:leave_flow, client_id}, 5000)
      error -> error
    end
  end

  @doc """
  Get the status of a flow session.

  Returns either:
  - `%{active: false, client_count: 0}` if the flow doesn't exist
  - `%{active: true, client_count: count, last_activity: timestamp}` if active
  """
  @spec get_flow_status(flow_id()) :: flow_status()
  def get_flow_status(flow_id) do
    case Registry.lookup(Helix.Flows.Registry, flow_id) do
      [{pid, _}] -> GenServer.call(pid, :get_flow_status, 5000)
      [] -> %{active: false, client_count: 0}
    end
  end

  @doc """
  Broadcast changes to all clients connected to a flow.

  Publishes a `{:flow_change, changes}` message to all subscribers of the flow's PubSub topic.
  Updates the flow's last_activity timestamp.
  """
  @spec broadcast_flow_change(flow_id(), map()) :: :ok
  def broadcast_flow_change(flow_id, changes) do
    case Registry.lookup(Helix.Flows.Registry, flow_id) do
      [{pid, _}] ->
        Task.Supervisor.start_child(Helix.TaskSupervisor, fn ->
          Phoenix.PubSub.broadcast(Helix.PubSub, "flow:#{flow_id}", {:flow_change, changes})
        end)

        GenServer.cast(pid, {:update_activity})

      [] ->
        :ok
    end
  end

  @doc """
  Persist flow changes to the database.

  Asynchronously persists nodes, edges, and viewport changes to the database
  using optimistic locking via the version field.

  ## Parameters
    - flow_id: The flow ID
    - changes: Map containing nodes, edges, and viewport data

  ## Returns
    - :ok
  """
  @spec persist_flow_changes(flow_id(), map()) :: :ok
  def persist_flow_changes(flow_id, changes) do
    case Registry.lookup(Helix.Flows.Registry, flow_id) do
      [{pid, _}] ->
        GenServer.cast(pid, {:persist_changes, changes})

      [] ->
        :ok
    end
  end

  @doc """
  Get a map of all active flow sessions.

  Returns a map where keys are flow IDs and values contain session information
  including client count and last activity timestamp.
  """
  @spec get_active_sessions() :: sessions_map()
  def get_active_sessions do
    Registry.select(Helix.Flows.Registry, [{{:"$1", :"$2", :_}, [], [{{:"$1", :"$2"}}]}])
    |> Enum.reduce(%{}, fn {flow_id, pid}, acc ->
      try do
        case GenServer.call(pid, :get_flow_status, 1_000) do
          status when is_map(status) ->
            if status.active do
              Map.put(acc, flow_id, Map.delete(status, :active))
            else
              acc
            end
        end
      rescue
        e ->
          Logger.warning("Failed to get status for #{flow_id}: #{inspect(e)}")
          acc
      end
    end)
  end

  @doc """
  Force close a flow session and remove all connected clients.

  Broadcasts a `{:flow_deleted, flow_id}` message to notify clients.
  Returns `{:ok, client_count}` where client_count is the number of clients
  that were disconnected.
  """
  @spec force_close_flow_session(flow_id()) :: operation_result()
  def force_close_flow_session(flow_id) when is_binary(flow_id) do
    trimmed_flow_id = String.trim(flow_id)

    if byte_size(trimmed_flow_id) == 0 do
      {:error, :invalid_flow_id}
    else
      do_force_close_flow_session(trimmed_flow_id)
    end
  end

  def force_close_flow_session(_), do: {:error, :invalid_flow_id}

  defp do_force_close_flow_session(flow_id) do
    case Registry.lookup(Helix.Flows.Registry, flow_id) do
      [{pid, _}] ->
        client_count =
          try do
            %{client_count: count} = GenServer.call(pid, :get_flow_status, 1000)
            count
          rescue
            _ -> 0
          end

        Helix.Flows.FlowSessionManager.stop_session(flow_id)

        Task.Supervisor.start_child(Helix.TaskSupervisor, fn ->
          Phoenix.PubSub.broadcast(Helix.PubSub, "flow:#{flow_id}", {:flow_deleted, flow_id})
        end)

        {:ok, client_count}

      [] ->
        {:ok, 0}
    end
  end

  # Server Callbacks

  @impl true
  def init(%{flow_id: flow_id}) do
    # Load flow data from database
    flow_data =
      case Helix.Flows.Storage.get_flow_with_data(flow_id) do
        {:ok, flow} ->
          %{
            nodes: flow.nodes,
            edges: flow.edges,
            viewport: %{
              x: flow.viewport_x,
              y: flow.viewport_y,
              zoom: flow.viewport_zoom
            },
            version: flow.version
          }

        {:error, :not_found} ->
          # Flow doesn't exist, initialize with empty state
          # This shouldn't happen due to validation in join_flow, but handle gracefully
          Logger.warning("Flow #{flow_id} not found in database during session init")
          nil
      end

    # Schedule periodic cleanup
    cleanup_timer = schedule_cleanup()

    {:ok,
     %{
       flow_id: flow_id,
       flow_data: flow_data,
       clients: MapSet.new(),
       last_activity: System.system_time(:second),
       cleanup_timer: cleanup_timer
     }}
  end

  @impl true
  def handle_call({:join_flow, client_id}, _from, state) do
    current_client_count = MapSet.size(state.clients)

    if current_client_count >= @max_clients_per_flow do
      Logger.warning("Max clients (#{@max_clients_per_flow}) reached for flow #{state.flow_id}")
      {:reply, {:error, :max_clients_reached}, state}
    else
      safe_client_id = ensure_valid_client_id(client_id)
      new_clients = MapSet.put(state.clients, safe_client_id)
      client_count = MapSet.size(new_clients)
      now = System.system_time(:second)

      Logger.debug(
        "Client #{safe_client_id} joined flow #{state.flow_id}. Active clients: #{client_count}"
      )

      :telemetry.execute([:helix, :session, :client_joined], %{client_count: client_count}, %{
        flow_id: state.flow_id
      })

      {:reply, {:ok, client_count, safe_client_id},
       %{state | clients: new_clients, last_activity: now}}
    end
  end

  @impl true
  def handle_call({:leave_flow, client_id}, _from, state) do
    new_clients = MapSet.delete(state.clients, client_id)
    client_count = MapSet.size(new_clients)
    now = System.system_time(:second)

    Logger.debug(
      "Client #{client_id} left flow #{state.flow_id}. Remaining clients: #{client_count}"
    )

    :telemetry.execute([:helix, :session, :client_left], %{client_count: client_count}, %{
      flow_id: state.flow_id
    })

    new_state = %{state | clients: new_clients, last_activity: now}

    if client_count == 0 do
      # Self-terminate when no clients remain
      {:stop, :normal, {:ok, client_count}, new_state}
    else
      {:reply, {:ok, client_count}, new_state}
    end
  end

  @impl true
  def handle_call(:get_flow_status, _from, state) do
    client_count = MapSet.size(state.clients)

    {:reply,
     %{
       active: client_count > 0,
       client_count: client_count,
       last_activity: state.last_activity
     }, state}
  end

  @impl true
  def handle_cast({:update_activity}, state) do
    {:noreply, %{state | last_activity: System.system_time(:second)}}
  end

  @impl true
  def handle_cast({:persist_changes, changes}, state) do
    # Persist changes asynchronously
    flow_id = state.flow_id
    current_version = get_in(state.flow_data, [:version]) || 1

    Task.Supervisor.start_child(Helix.TaskSupervisor, fn ->
      persist_to_database(flow_id, changes, current_version)
    end)

    # Update flow_data in state with the new changes
    updated_flow_data =
      if state.flow_data do
        state.flow_data
        |> Map.put(:nodes, Map.get(changes, :nodes, state.flow_data.nodes))
        |> Map.put(:edges, Map.get(changes, :edges, state.flow_data.edges))
        |> update_viewport(changes)
      else
        # Initialize flow_data if it doesn't exist
        %{
          nodes: Map.get(changes, :nodes, []),
          edges: Map.get(changes, :edges, []),
          viewport: Map.get(changes, :viewport, %{x: 0, y: 0, zoom: 1.0}),
          version: current_version
        }
      end

    {:noreply,
     %{state | flow_data: updated_flow_data, last_activity: System.system_time(:second)}}
  end

  @impl true
  def handle_info(:cleanup_inactive_sessions, state) do
    now = System.system_time(:second)
    # 30 minutes
    inactive_threshold = now - 30 * 60

    if state.last_activity < inactive_threshold do
      Logger.info("Session #{state.flow_id} inactive for 30+ minutes, terminating")
      {:stop, :normal, state}
    else
      # Schedule next cleanup and update timer reference
      new_cleanup_timer = schedule_cleanup()
      {:noreply, %{state | cleanup_timer: new_cleanup_timer}}
    end
  end

  @impl true
  def terminate(reason, state) do
    # Cancel cleanup timer to prevent timer leaks
    if state.cleanup_timer do
      Process.cancel_timer(state.cleanup_timer)
    end

    # Notify PubSub of session termination if clients exist
    unless MapSet.size(state.clients) == 0 do
      Task.Supervisor.start_child(Helix.TaskSupervisor, fn ->
        Phoenix.PubSub.broadcast(
          Helix.PubSub,
          "flow:#{state.flow_id}",
          {:flow_deleted, state.flow_id}
        )
      end)
    end

    Logger.info("SessionServer for flow #{state.flow_id} terminated: #{inspect(reason)}")
    :ok
  end

  # Private functions

  defp ensure_valid_client_id(client_id) do
    case client_id do
      id when is_binary(id) ->
        trimmed = String.trim(id)
        if byte_size(trimmed) > 0, do: trimmed, else: generate_anonymous_id()

      _ ->
        generate_anonymous_id()
    end
  end

  defp generate_anonymous_id do
    "anon:" <> Base.encode32(:crypto.strong_rand_bytes(8), padding: false)
  end

  defp schedule_cleanup do
    # 10 minutes
    Process.send_after(self(), :cleanup_inactive_sessions, 10 * 60 * 1000)
  end

  defp persist_to_database(flow_id, changes, current_version) do
    try do
      case Helix.Flows.Storage.get_flow(flow_id) do
        {:ok, flow} ->
          persist_flow_data(flow_id, flow, changes, current_version)

        {:error, :not_found} ->
          Logger.debug(
            "Flow #{flow_id} not found when attempting to persist changes (likely deleted)"
          )
      end
    rescue
      Ecto.NoResultsError ->
        Logger.debug("Flow #{flow_id} was deleted before persistence could complete")

      error in [DBConnection.ConnectionError] ->
        Logger.debug(
          "Database connection error during persistence for flow #{flow_id}: #{inspect(error.message)}"
        )

      error ->
        Logger.warning(
          "Unexpected error during persistence for flow #{flow_id}: #{inspect(error)}"
        )
    end
  end

  defp persist_flow_data(flow_id, flow, changes, current_version) do
    # Convert node maps to attribute maps for Storage.update_flow_data
    nodes_attrs =
      changes
      |> Map.get(:nodes, [])
      |> Enum.map(&node_to_attrs/1)

    edges_attrs =
      changes
      |> Map.get(:edges, [])
      |> Enum.map(&edge_to_attrs/1)

    # Update flow data with optimistic locking
    case Helix.Flows.Storage.update_flow_data(
           flow,
           nodes_attrs,
           edges_attrs,
           current_version
         ) do
      {:ok, updated_flow} ->
        Logger.debug(
          "Successfully persisted flow #{flow_id} changes (version #{updated_flow.version})"
        )

        persist_viewport_if_present(flow_id, updated_flow, changes)

      {:error, :version_conflict} ->
        Logger.warning(
          "Version conflict when persisting flow #{flow_id} (expected: #{current_version})"
        )

      {:error, reason} ->
        Logger.error("Failed to persist flow #{flow_id} changes: #{inspect(reason)}")
    end
  end

  defp persist_viewport_if_present(flow_id, updated_flow, changes) do
    if viewport = Map.get(changes, :viewport) do
      viewport_attrs = %{
        viewport_x: viewport.x,
        viewport_y: viewport.y,
        viewport_zoom: viewport.zoom
      }

      case Helix.Flows.Storage.update_flow(updated_flow, viewport_attrs) do
        {:ok, _} ->
          Logger.debug("Successfully updated viewport for flow #{flow_id}")

        {:error, reason} ->
          Logger.warning("Failed to update viewport for flow #{flow_id}: #{inspect(reason)}")
      end
    end
  end

  defp node_to_attrs(node) when is_map(node) do
    %{
      node_id: node.node_id,
      type: node.type,
      position_x: node.position_x,
      position_y: node.position_y,
      width: Map.get(node, :width),
      height: Map.get(node, :height),
      data: Map.get(node, :data, %{})
    }
  end

  defp edge_to_attrs(edge) when is_map(edge) do
    %{
      edge_id: edge.edge_id,
      source_node_id: edge.source_node_id,
      target_node_id: edge.target_node_id,
      source_handle: Map.get(edge, :source_handle),
      target_handle: Map.get(edge, :target_handle),
      edge_type: Map.get(edge, :edge_type),
      animated: Map.get(edge, :animated, false),
      data: Map.get(edge, :data, %{})
    }
  end

  defp update_viewport(flow_data, changes) do
    case Map.get(changes, :viewport) do
      nil ->
        flow_data

      viewport ->
        Map.put(flow_data, :viewport, viewport)
    end
  end
end
