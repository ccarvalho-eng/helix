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
  Join a client to a flow session.

  Returns `{:ok, client_count}` where client_count is the total number of clients
  currently connected to the flow.
  """
  @spec join_flow(flow_id(), client_id()) :: operation_result()
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
        Task.start(fn ->
          Phoenix.PubSub.broadcast(Helix.PubSub, "flow:#{flow_id}", {:flow_change, changes})
        end)

        GenServer.cast(pid, {:update_activity})

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
        status = GenServer.call(pid, :get_flow_status, 1000)

        if status.active do
          Map.put(acc, flow_id, Map.delete(status, :active))
        else
          acc
        end
      rescue
        _ -> acc
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

        Task.start(fn ->
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
    # Schedule periodic cleanup
    cleanup_timer = schedule_cleanup()

    {:ok,
     %{
       flow_id: flow_id,
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

      {:reply, {:ok, client_count}, %{state | clients: new_clients, last_activity: now}}
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
      Task.start(fn ->
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
end
