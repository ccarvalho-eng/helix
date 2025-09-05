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

    safe_client_id =
      case client_id do
        id when is_binary(id) ->
          trimmed = String.trim(id)
          if byte_size(trimmed) > 0, do: id, else: generate_anonymous_id()

        _ ->
          generate_anonymous_id()
      end

    new_client_flows = Map.put(state.client_flows, safe_client_id, flow_id)

    session = Map.get(state.sessions, flow_id, %{clients: MapSet.new(), last_activity: now})

    updated_session = %{
      clients: MapSet.put(session.clients, safe_client_id),
      last_activity: now
    }

    new_sessions = Map.put(state.sessions, flow_id, updated_session)
    client_count = MapSet.size(updated_session.clients)

    Logger.info(
      "Client #{safe_client_id} joined flow #{flow_id}. Active clients: #{client_count}"
    )

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
        # Update last activity atomically
        updated_session = %{session | last_activity: System.system_time(:second)}
        new_sessions = Map.put(state.sessions, flow_id, updated_session)

        # Broadcast original changes to all clients via Phoenix PubSub
        Phoenix.PubSub.broadcast(Helix.PubSub, "flow:#{flow_id}", {:flow_change, changes})

        Logger.debug(
          "Broadcasted flow changes for #{flow_id} to #{MapSet.size(session.clients)} clients"
        )

        {:noreply, %{state | sessions: new_sessions}}
    end

    now = System.system_time(:second)
    inactive_threshold = now - 30 * 60

    {inactive_flows, active_sessions} =
      state.sessions
      |> Enum.split_with(fn {_flow_id, session} ->
        session.last_activity < inactive_threshold
      end)

    if inactive_flows != [] do
      inactive_flow_ids = Enum.map(inactive_flows, fn {flow_id, _} -> flow_id end)

      Logger.info(
        "Cleaned up #{length(inactive_flows)} inactive flow sessions: #{inspect(inactive_flow_ids)}"
      )
    end

    new_sessions = Map.new(active_sessions)

    inactive_ids_set =
      inactive_flows
      |> Enum.map(fn {flow_id, _} -> flow_id end)
      |> MapSet.new()

    new_client_flows =
      state.client_flows
      |> Enum.reject(fn {_client_id, flow_id} -> MapSet.member?(inactive_ids_set, flow_id) end)
      |> Map.new()

    schedule_cleanup()
    {:noreply, %{state | sessions: new_sessions, client_flows: new_client_flows}}
    # Schedule next cleanup
    schedule_cleanup()

    {:noreply, %{state | sessions: new_sessions, client_flows: new_client_flows}}
  end

  # Private functions

  defp schedule_cleanup do
    # Clean up every 10 minutes
    Process.send_after(__MODULE__, :cleanup_inactive_sessions, 10 * 60 * 1000)
  end

  defp generate_anonymous_id do
    "anon:" <> Base.encode32(:crypto.strong_rand_bytes(8), padding: false)
  end
end
