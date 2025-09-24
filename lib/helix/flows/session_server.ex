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

  # Client API

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @spec join_flow(flow_id(), client_id()) :: operation_result()
  def join_flow(flow_id, client_id) do
    GenServer.call(__MODULE__, {:join_flow, flow_id, client_id})
  end

  @spec leave_flow(flow_id(), client_id()) :: operation_result()
  def leave_flow(flow_id, client_id) do
    GenServer.call(__MODULE__, {:leave_flow, flow_id, client_id})
  end

  @spec get_flow_status(flow_id()) :: flow_status()
  def get_flow_status(flow_id) do
    GenServer.call(__MODULE__, {:get_flow_status, flow_id})
  end

  @spec broadcast_flow_change(flow_id(), map()) :: :ok
  def broadcast_flow_change(flow_id, changes) do
    GenServer.cast(__MODULE__, {:broadcast_flow_change, flow_id, changes})
  end

  @spec get_active_sessions() :: sessions_map()
  def get_active_sessions do
    GenServer.call(__MODULE__, :get_active_sessions)
  end

  @spec force_close_flow_session(flow_id()) :: operation_result()
  def force_close_flow_session(flow_id) do
    GenServer.call(__MODULE__, {:force_close_flow_session, flow_id})
  end

  # Server Callbacks

  @impl true
  def init(_state) do
    # Schedule periodic cleanup
    schedule_cleanup()
    {:ok, %{sessions: %{}, client_flows: %{}}}
  end

  @impl true
  def handle_call({:join_flow, flow_id, client_id}, _from, state) do
    safe_client_id = ensure_valid_client_id(client_id)

    {client_count, new_sessions, new_client_flows} =
      add_client_to_session(state, flow_id, safe_client_id)

    Logger.info(
      "Client #{safe_client_id} joined flow #{flow_id}. Active clients: #{client_count}"
    )

    {:reply, {:ok, client_count},
     %{state | sessions: new_sessions, client_flows: new_client_flows}}
  end

  @impl true
  def handle_call({:leave_flow, flow_id, client_id}, _from, state) do
    new_client_flows = Map.delete(state.client_flows, client_id)

    case Map.get(state.sessions, flow_id) do
      nil ->
        {:reply, {:ok, 0}, %{state | client_flows: new_client_flows}}

      session ->
        {client_count, new_sessions} =
          remove_client_from_session(state.sessions, flow_id, session, client_id)

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
    active_sessions = build_active_sessions_map(state.sessions)
    {:reply, active_sessions, state}
  end

  @impl true
  def handle_call({:force_close_flow_session, flow_id}, _from, state) do
    case Map.get(state.sessions, flow_id) do
      nil ->
        {:reply, {:ok, 0}, state}

      session ->
        client_count = MapSet.size(session.clients)
        {new_sessions, new_client_flows} = force_close_session(state, flow_id)
        broadcast_flow_deletion(flow_id)

        Logger.info("Force closed flow session #{flow_id} with #{client_count} clients")

        {:reply, {:ok, client_count},
         %{state | sessions: new_sessions, client_flows: new_client_flows}}
    end
  end

  @impl true
  def handle_cast({:broadcast_flow_change, flow_id, changes}, state) do
    case Map.get(state.sessions, flow_id) do
      nil ->
        Logger.warning("Attempted to broadcast changes to non-existent flow session: #{flow_id}")
        {:noreply, state}

      session ->
        updated_session = %{
          session
          | last_activity: System.system_time(:second)
        }

        new_sessions = Map.put(state.sessions, flow_id, updated_session)

        Phoenix.PubSub.broadcast(
          Helix.PubSub,
          "flow:#{flow_id}",
          {:flow_change, changes}
        )

        Logger.debug(
          "Broadcasted flow changes for #{flow_id} to #{MapSet.size(session.clients)} clients"
        )

        {:noreply, %{state | sessions: new_sessions}}
    end
  end

  @impl true
  def handle_info(:cleanup_inactive_sessions, state) do
    now = System.system_time(:second)
    # 30 minutes
    inactive_threshold = now - 30 * 60

    {inactive_flows, new_sessions, new_client_flows} =
      cleanup_inactive_sessions(state, inactive_threshold)

    if inactive_flows != [] do
      log_cleanup_results(inactive_flows)
    end

    schedule_cleanup()

    {:noreply, %{state | sessions: new_sessions, client_flows: new_client_flows}}
  end

  # Private functions

  defp ensure_valid_client_id(client_id) do
    case client_id do
      id when is_binary(id) ->
        trimmed = String.trim(id)
        if byte_size(trimmed) > 0, do: id, else: generate_anonymous_id()

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

  defp add_client_to_session(state, flow_id, safe_client_id) do
    now = System.system_time(:second)
    new_client_flows = Map.put(state.client_flows, safe_client_id, flow_id)

    session = Map.get(state.sessions, flow_id, %{clients: MapSet.new(), last_activity: now})

    updated_session = %{
      clients: MapSet.put(session.clients, safe_client_id),
      last_activity: now
    }

    new_sessions = Map.put(state.sessions, flow_id, updated_session)
    client_count = MapSet.size(updated_session.clients)

    {client_count, new_sessions, new_client_flows}
  end

  defp remove_client_from_session(sessions, flow_id, session, client_id) do
    updated_clients = MapSet.delete(session.clients, client_id)
    client_count = MapSet.size(updated_clients)

    new_sessions =
      if client_count == 0 do
        Logger.info("Flow #{flow_id} session ended - no more clients")
        Map.delete(sessions, flow_id)
      else
        updated_session = %{
          session
          | clients: updated_clients,
            last_activity: System.system_time(:second)
        }

        Map.put(sessions, flow_id, updated_session)
      end

    {client_count, new_sessions}
  end

  defp build_active_sessions_map(sessions) do
    sessions
    |> Enum.map(fn {flow_id, session} ->
      {flow_id,
       %{
         client_count: MapSet.size(session.clients),
         last_activity: session.last_activity
       }}
    end)
    |> Enum.into(%{})
  end

  defp force_close_session(state, flow_id) do
    new_sessions = Map.delete(state.sessions, flow_id)

    new_client_flows =
      state.client_flows
      |> Enum.reject(fn {_client_id, client_flow_id} ->
        client_flow_id == flow_id
      end)
      |> Map.new()

    {new_sessions, new_client_flows}
  end

  defp broadcast_flow_deletion(flow_id) do
    Phoenix.PubSub.broadcast(
      Helix.PubSub,
      "flow:#{flow_id}",
      {:flow_deleted, flow_id}
    )
  end

  defp cleanup_inactive_sessions(state, inactive_threshold) do
    {inactive_flows, active_sessions} =
      state.sessions
      |> Enum.split_with(fn {_flow_id, session} ->
        session.last_activity < inactive_threshold
      end)

    new_sessions = Map.new(active_sessions)

    inactive_ids_set =
      inactive_flows
      |> Enum.map(fn {flow_id, _} -> flow_id end)
      |> MapSet.new()

    new_client_flows =
      state.client_flows
      |> Enum.reject(fn {_client_id, flow_id} ->
        MapSet.member?(inactive_ids_set, flow_id)
      end)
      |> Map.new()

    {inactive_flows, new_sessions, new_client_flows}
  end

  defp log_cleanup_results(inactive_flows) do
    inactive_flow_ids = Enum.map(inactive_flows, fn {flow_id, _} -> flow_id end)

    Logger.info(
      "Cleaned up #{length(inactive_flows)} inactive flow sessions: #{inspect(inactive_flow_ids)}"
    )
  end
end
