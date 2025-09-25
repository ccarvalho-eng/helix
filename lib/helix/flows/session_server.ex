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

  @doc """
  Start the SessionServer GenServer.
  """
  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(_opts) do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  @doc """
  Join a client to a flow session.

  Returns `{:ok, client_count}` where client_count is the total number of clients
  currently connected to the flow.
  """
  @spec join_flow(flow_id(), client_id()) :: operation_result()
  def join_flow(flow_id, client_id) do
    GenServer.call(__MODULE__, {:join_flow, flow_id, client_id})
  end

  @doc """
  Remove a client from a flow session.

  Returns `{:ok, client_count}` where client_count is the remaining number of clients
  connected to the flow after removal.
  """
  @spec leave_flow(flow_id(), client_id()) :: operation_result()
  def leave_flow(flow_id, client_id) do
    GenServer.call(__MODULE__, {:leave_flow, flow_id, client_id})
  end

  @doc """
  Get the status of a flow session.

  Returns either:
  - `%{active: false, client_count: 0}` if the flow doesn't exist
  - `%{active: true, client_count: count, last_activity: timestamp}` if active
  """
  @spec get_flow_status(flow_id()) :: flow_status()
  def get_flow_status(flow_id) do
    GenServer.call(__MODULE__, {:get_flow_status, flow_id})
  end

  @doc """
  Broadcast changes to all clients connected to a flow.

  Publishes a `{:flow_change, changes}` message to all subscribers of the flow's PubSub topic.
  Updates the flow's last_activity timestamp.
  """
  @spec broadcast_flow_change(flow_id(), map()) :: :ok
  def broadcast_flow_change(flow_id, changes) do
    GenServer.cast(__MODULE__, {:broadcast_flow_change, flow_id, changes})
  end

  @doc """
  Get a map of all active flow sessions.

  Returns a map where keys are flow IDs and values contain session information
  including client count and last activity timestamp.
  """
  @spec get_active_sessions() :: sessions_map()
  def get_active_sessions do
    GenServer.call(__MODULE__, :get_active_sessions)
  end

  @doc """
  Force close a flow session and remove all connected clients.

  Broadcasts a `{:flow_deleted, flow_id}` message to notify clients.
  Returns `{:ok, client_count}` where client_count is the number of clients
  that were disconnected.
  """
  @spec force_close_flow_session(flow_id()) :: operation_result()
  def force_close_flow_session(flow_id) do
    GenServer.call(__MODULE__, {:force_close_flow_session, flow_id})
  end

  # Server Callbacks

  @impl true
  def init(_state) do
    # Schedule periodic cleanup
    cleanup_timer = schedule_cleanup()
    {:ok, %{sessions: %{}, client_flows: %{}, cleanup_timer: cleanup_timer}}
  end

  @impl true
  def handle_call({:join_flow, flow_id, client_id}, _from, state) do
    case validate_flow_id(flow_id) do
      {:ok, validated_flow_id} ->
        safe_client_id = ensure_valid_client_id(client_id)

        {client_count, new_sessions, new_client_flows} =
          add_client_to_session(state, validated_flow_id, safe_client_id)

        Logger.debug(
          "Client #{safe_client_id} joined flow #{validated_flow_id}. Active clients: #{client_count}"
        )

        {:reply, {:ok, client_count},
         %{state | sessions: new_sessions, client_flows: new_client_flows}}

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:leave_flow, flow_id, client_id}, _from, state) do
    case validate_flow_id(flow_id) do
      {:ok, validated_flow_id} ->
        new_client_flows = Map.delete(state.client_flows, client_id)

        case Map.get(state.sessions, validated_flow_id) do
          nil ->
            {:reply, {:ok, 0}, %{state | client_flows: new_client_flows}}

          session ->
            {client_count, new_sessions} =
              remove_client_from_session(state.sessions, validated_flow_id, session, client_id)

            Logger.debug(
              "Client #{client_id} left flow #{validated_flow_id}. Remaining clients: #{client_count}"
            )

            {:reply, {:ok, client_count},
             %{state | sessions: new_sessions, client_flows: new_client_flows}}
        end

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_call({:get_flow_status, flow_id}, _from, state) do
    # Normalize flow_id the same way other functions do, but don't return error
    # for invalid IDs - just treat them as non-existent flows
    normalized_flow_id =
      case validate_flow_id(flow_id) do
        {:ok, validated_id} -> validated_id
        # Use original ID for lookup, will return inactive
        {:error, _} -> flow_id
      end

    case Map.get(state.sessions, normalized_flow_id) do
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
    case validate_flow_id(flow_id) do
      {:ok, validated_flow_id} ->
        case Map.get(state.sessions, validated_flow_id) do
          nil ->
            {:reply, {:ok, 0}, state}

          session ->
            client_count = MapSet.size(session.clients)
            {new_sessions, new_client_flows} = force_close_session(state, validated_flow_id)
            broadcast_flow_deletion(validated_flow_id)

            Logger.info(
              "Force closed flow session #{validated_flow_id} with #{client_count} clients"
            )

            {:reply, {:ok, client_count},
             %{state | sessions: new_sessions, client_flows: new_client_flows}}
        end

      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  @impl true
  def handle_cast({:broadcast_flow_change, flow_id, changes}, state) do
    # Validate and normalize flow_id to ensure consistency
    case validate_flow_id(flow_id) do
      {:ok, validated_flow_id} ->
        case Map.get(state.sessions, validated_flow_id) do
          nil ->
            Logger.warning(
              "Attempted to broadcast changes to non-existent flow session: #{validated_flow_id}"
            )

            {:noreply, state}

          session ->
            updated_session = %{
              session
              | last_activity: System.system_time(:second)
            }

            new_sessions = Map.put(state.sessions, validated_flow_id, updated_session)

            Phoenix.PubSub.broadcast(
              Helix.PubSub,
              "flow:#{validated_flow_id}",
              {:flow_change, changes}
            )

            Logger.debug(
              "Broadcasted flow changes for #{validated_flow_id} to #{MapSet.size(session.clients)} clients"
            )

            {:noreply, %{state | sessions: new_sessions}}
        end

      {:error, _reason} ->
        Logger.warning("Attempted to broadcast changes with invalid flow_id: #{inspect(flow_id)}")
        {:noreply, state}
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

    # Schedule next cleanup and update timer reference
    new_cleanup_timer = schedule_cleanup()

    {:noreply,
     %{
       state
       | sessions: new_sessions,
         client_flows: new_client_flows,
         cleanup_timer: new_cleanup_timer
     }}
  end

  @impl true
  def terminate(_reason, state) do
    # Cancel cleanup timer to prevent timer leaks
    if state.cleanup_timer do
      Process.cancel_timer(state.cleanup_timer)
    end

    :ok
  end

  # Private functions

  defp validate_flow_id(flow_id) when is_binary(flow_id) do
    trimmed = String.trim(flow_id)

    if byte_size(trimmed) == 0 do
      {:error, :invalid_flow_id}
    else
      {:ok, trimmed}
    end
  end

  defp validate_flow_id(_), do: {:error, :invalid_flow_id}

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
