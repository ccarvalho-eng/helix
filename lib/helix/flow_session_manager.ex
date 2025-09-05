defmodule Helix.FlowSessionManager do
  @moduledoc """
  GenServer to manage active flow sessions in memory.

  This handles:
  - Tracking which flows have active sessions
  - Managing connected clients per flow
  - Auto-cleanup of inactive sessions
  - Broadcasting flow changes to connected clients
  """

  use GenServer
  require Logger

  # Client API

  def start_link(_opts \\ []) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @doc """
  Join a flow session. Returns the current client count.
  """
  def join_flow(flow_id, client_id) do
    GenServer.call(__MODULE__, {:join_flow, flow_id, client_id})
  end

  @doc """
  Leave a flow session. Returns the remaining client count.
  """
  def leave_flow(flow_id, client_id) do
    GenServer.call(__MODULE__, {:leave_flow, flow_id, client_id})
  end

  @doc """
  Get status of a flow session.
  """
  def get_flow_status(flow_id) do
    GenServer.call(__MODULE__, {:get_flow_status, flow_id})
  end

  @doc """
  Broadcast flow changes to all clients in a flow session.
  """
  def broadcast_flow_change(flow_id, changes) do
    GenServer.cast(__MODULE__, {:broadcast_flow_change, flow_id, changes})
  end

  @doc """
  Get all active flow sessions.
  """
  def get_active_sessions do
    GenServer.call(__MODULE__, :get_active_sessions)
  end

  # Server Callbacks

  @impl true
  def init(_) do
    # Schedule periodic cleanup
    schedule_cleanup()

    {:ok,
     %{
       # flow_id => %{clients: MapSet, last_activity: timestamp}
       sessions: %{},
       # client_id => flow_id (for cleanup tracking)
       client_flows: %{}
     }}
  end

  @impl true
  def handle_call({:join_flow, flow_id, client_id}, _from, state) do
    now = System.system_time(:second)

    # Update client_flows mapping
    new_client_flows = Map.put(state.client_flows, client_id, flow_id)

    # Update or create session
    session = Map.get(state.sessions, flow_id, %{clients: MapSet.new(), last_activity: now})

    updated_session = %{
      clients: MapSet.put(session.clients, client_id),
      last_activity: now
    }

    new_sessions = Map.put(state.sessions, flow_id, updated_session)
    client_count = MapSet.size(updated_session.clients)

    Logger.info("Client #{client_id} joined flow #{flow_id}. Active clients: #{client_count}")

    {:reply, {:ok, client_count},
     %{state | sessions: new_sessions, client_flows: new_client_flows}}
  end

  @impl true
  def handle_call({:leave_flow, flow_id, client_id}, _from, state) do
    # Remove from client_flows mapping
    new_client_flows = Map.delete(state.client_flows, client_id)

    case Map.get(state.sessions, flow_id) do
      nil ->
        {:reply, {:ok, 0}, %{state | client_flows: new_client_flows}}

      session ->
        updated_clients = MapSet.delete(session.clients, client_id)
        client_count = MapSet.size(updated_clients)

        new_sessions =
          if client_count == 0 do
            # Remove empty session
            Logger.info("Flow #{flow_id} session ended - no more clients")
            Map.delete(state.sessions, flow_id)
          else
            # Update session
            updated_session = %{
              session
              | clients: updated_clients,
                last_activity: System.system_time(:second)
            }

            Map.put(state.sessions, flow_id, updated_session)
          end

        Logger.info(
          "Client #{client_id} left flow #{flow_id}. Remaining clients: #{client_count}"
        )

        {:reply, {:ok, client_count},
         %{state | sessions: new_sessions, client_flows: new_client_flows}}
    end
  end

  @impl true
  def handle_call({:get_flow_status, flow_id}, _from, state) do
    case Map.get(state.sessions, flow_id) do
      nil ->
        {:reply, %{active: false, client_count: 0}, state}

      session ->
        {:reply,
         %{
           active: true,
           client_count: MapSet.size(session.clients),
           last_activity: session.last_activity
         }, state}
    end
  end

  @impl true
  def handle_call(:get_active_sessions, _from, state) do
    active_sessions =
      state.sessions
      |> Enum.map(fn {flow_id, session} ->
        {flow_id,
         %{client_count: MapSet.size(session.clients), last_activity: session.last_activity}}
      end)
      |> Enum.into(%{})

    {:reply, active_sessions, state}
  end

  @impl true
  def handle_cast({:broadcast_flow_change, flow_id, changes}, state) do
    case Map.get(state.sessions, flow_id) do
      nil ->
        # No active session, nothing to broadcast
        Logger.warning("Attempted to broadcast changes to non-existent flow session: #{flow_id}")
        {:noreply, state}

      session ->
        # Validate changes structure
        case validate_flow_changes(changes) do
          {:ok, validated_changes} ->
            # Update last activity atomically
            updated_session = %{session | last_activity: System.system_time(:second)}
            new_sessions = Map.put(state.sessions, flow_id, updated_session)

            # Add change metadata for tracking
            change_payload =
              Map.put(validated_changes, :__metadata, %{
                timestamp: System.system_time(:millisecond),
                session_id: flow_id,
                client_count: MapSet.size(session.clients)
              })

            # Broadcast to all clients via Phoenix PubSub
            Phoenix.PubSub.broadcast(
              Helix.PubSub,
              "flow:#{flow_id}",
              {:flow_change, change_payload}
            )

            Logger.debug(
              "Broadcasted validated flow changes for #{flow_id} to #{MapSet.size(session.clients)} clients"
            )

            {:noreply, %{state | sessions: new_sessions}}

          {:error, reason} ->
            Logger.error("Invalid flow changes for #{flow_id}: #{inspect(reason)}")
            {:noreply, state}
        end
    end
  end

  @impl true
  def handle_info(:cleanup_inactive_sessions, state) do
    now = System.system_time(:second)
    # Remove sessions inactive for more than 30 minutes
    inactive_threshold = now - 30 * 60

    {inactive_flows, active_sessions} =
      state.sessions
      |> Enum.split_with(fn {_flow_id, session} ->
        session.last_activity < inactive_threshold
      end)

    if length(inactive_flows) > 0 do
      inactive_flow_ids = Enum.map(inactive_flows, fn {flow_id, _} -> flow_id end)

      Logger.info(
        "Cleaned up #{length(inactive_flows)} inactive flow sessions: #{inspect(inactive_flow_ids)}"
      )
    end

    # Remove inactive sessions and update client_flows
    new_sessions = Map.new(active_sessions)

    new_client_flows =
      state.client_flows
      |> Enum.reject(fn {_client_id, flow_id} ->
        Enum.any?(inactive_flows, fn {inactive_flow_id, _} -> inactive_flow_id == flow_id end)
      end)
      |> Map.new()

    # Schedule next cleanup
    schedule_cleanup()

    {:noreply, %{state | sessions: new_sessions, client_flows: new_client_flows}}
  end

  # Private functions

  defp schedule_cleanup do
    # Clean up every 10 minutes
    Process.send_after(__MODULE__, :cleanup_inactive_sessions, 10 * 60 * 1000)
  end

  defp validate_flow_changes(changes) when is_map(changes) do
    with :ok <- validate_nodes_field(changes),
         :ok <- validate_edges_field(changes),
         :ok <- validate_viewport_field(changes) do
      {:ok, changes}
    else
      {:error, reason} -> {:error, reason}
    end
  rescue
    _ -> {:error, "invalid changes structure"}
  end

  defp validate_flow_changes(_), do: {:error, "changes must be an object"}

  defp validate_nodes_field(changes) do
    case Map.get(changes, "nodes") do
      nil -> :ok
      nodes when is_list(nodes) -> validate_nodes_list(nodes)
      _ -> {:error, "nodes must be a list"}
    end
  end

  defp validate_edges_field(changes) do
    case Map.get(changes, "edges") do
      nil -> :ok
      edges when is_list(edges) -> validate_edges_list(edges)
      _ -> {:error, "edges must be a list"}
    end
  end

  defp validate_viewport_field(changes) do
    case Map.get(changes, "viewport") do
      nil -> :ok
      viewport when is_map(viewport) -> validate_viewport_map(viewport)
      _ -> {:error, "viewport must be an object"}
    end
  end

  defp validate_nodes_list(nodes) do
    Enum.each(nodes, &validate_node/1)
    :ok
  catch
    :throw, {:error, reason} -> {:error, reason}
  end

  defp validate_edges_list(edges) do
    Enum.each(edges, &validate_edge/1)
    :ok
  catch
    :throw, {:error, reason} -> {:error, reason}
  end

  defp validate_viewport_map(viewport) do
    validate_viewport(viewport)
    :ok
  catch
    :throw, {:error, reason} -> {:error, reason}
  end

  defp validate_node(node) when is_map(node) do
    with :ok <- validate_node_id(node),
         :ok <- validate_node_position(node) do
      node
    else
      {:error, reason} -> throw({:error, reason})
    end
  end

  defp validate_node(_), do: throw({:error, "node must be an object"})

  defp validate_node_id(node) do
    id = Map.get(node, "id")

    if is_binary(id) and String.length(id) > 0 do
      :ok
    else
      {:error, "node id must be a non-empty string"}
    end
  end

  defp validate_node_position(node) do
    case Map.get(node, "position") do
      nil -> :ok
      position when is_map(position) -> validate_position_coordinates(position)
      _ -> {:error, "node position must be an object"}
    end
  end

  defp validate_position_coordinates(position) do
    x = Map.get(position, "x")
    y = Map.get(position, "y")

    if (x != nil and not is_number(x)) or (y != nil and not is_number(y)) do
      {:error, "node position must have numeric x and y coordinates"}
    else
      :ok
    end
  end

  defp validate_edge(edge) when is_map(edge) do
    # Validate required edge fields
    id = Map.get(edge, "id")
    source = Map.get(edge, "source")
    target = Map.get(edge, "target")

    unless is_binary(id) and String.length(id) > 0 do
      throw({:error, "edge id must be a non-empty string"})
    end

    unless is_binary(source) and String.length(source) > 0 do
      throw({:error, "edge source must be a non-empty string"})
    end

    unless is_binary(target) and String.length(target) > 0 do
      throw({:error, "edge target must be a non-empty string"})
    end

    # Return original edge (validation passed)
    edge
  end

  defp validate_edge(_), do: throw({:error, "edge must be an object"})

  defp validate_viewport(viewport) when is_map(viewport) do
    x = Map.get(viewport, "x")
    y = Map.get(viewport, "y")
    zoom = Map.get(viewport, "zoom")

    unless is_number(x) do
      throw({:error, "viewport x must be a number"})
    end

    unless is_number(y) do
      throw({:error, "viewport y must be a number"})
    end

    unless is_number(zoom) and zoom > 0 do
      throw({:error, "viewport zoom must be a positive number"})
    end

    %{
      "x" => x,
      "y" => y,
      "zoom" => zoom
    }
  end

  defp validate_viewport(_), do: throw({:error, "viewport must be an object"})
end
