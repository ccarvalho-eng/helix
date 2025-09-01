defmodule Helix.FlowServer do
  @moduledoc """
  GenServer that manages individual flow state in memory.
  Each active flow gets its own supervised process for real-time state management.
  """

  use GenServer
  require Logger

  alias Helix.FlowRegistry

  @auto_save_interval :timer.minutes(2)
  @cleanup_after :timer.minutes(30)

  defstruct [
    :id,
    :name,
    :description,
    :nodes,
    :edges,
    :viewport,
    :created_at,
    :updated_at,
    :last_activity,
    :connected_users
  ]

  # Client API

  @doc """
  Starts a new FlowServer process for the given flow_id.
  """
  def start_link(flow_id) when is_binary(flow_id) do
    GenServer.start_link(__MODULE__, flow_id, name: via_tuple(flow_id))
  end

  @doc """
  Creates a new flow with the given attributes.
  """
  def create_flow(flow_id, attrs \\ %{}) do
    case FlowRegistry.start_flow(flow_id) do
      {:ok, _pid} ->
        GenServer.call(via_tuple(flow_id), {:create_flow, attrs})

      error ->
        error
    end
  end

  @doc """
  Gets the current flow state.
  """
  def get_flow(flow_id) do
    case GenServer.whereis(via_tuple(flow_id)) do
      nil -> {:error, :not_found}
      _pid -> GenServer.call(via_tuple(flow_id), :get_flow)
    end
  end

  @doc """
  Updates the flow name and description.
  """
  def update_flow_metadata(flow_id, attrs) do
    GenServer.call(via_tuple(flow_id), {:update_metadata, attrs})
  end

  @doc """
  Updates the nodes in the flow.
  """
  def update_nodes(flow_id, nodes) do
    GenServer.call(via_tuple(flow_id), {:update_nodes, nodes})
  end

  @doc """
  Updates the edges in the flow.
  """
  def update_edges(flow_id, edges) do
    GenServer.call(via_tuple(flow_id), {:update_edges, edges})
  end

  @doc """
  Updates the viewport state.
  """
  def update_viewport(flow_id, viewport) do
    GenServer.call(via_tuple(flow_id), {:update_viewport, viewport})
  end

  @doc """
  Adds a connected user to track active users.
  """
  def user_joined(flow_id, user_id) do
    GenServer.cast(via_tuple(flow_id), {:user_joined, user_id})
  end

  @doc """
  Removes a connected user.
  """
  def user_left(flow_id, user_id) do
    GenServer.cast(via_tuple(flow_id), {:user_left, user_id})
  end

  @doc """
  Forces a save of the current state to localStorage.
  """
  def save_flow(flow_id) do
    GenServer.cast(via_tuple(flow_id), :save_flow)
  end

  @doc """
  Loads an existing flow from localStorage.
  """
  def load_flow(flow_id, flow_data) do
    case FlowRegistry.start_flow(flow_id) do
      {:ok, _pid} ->
        GenServer.call(via_tuple(flow_id), {:load_flow, flow_data})

      error ->
        error
    end
  end

  @doc """
  Returns via tuple for process registry.
  """
  def via_tuple(flow_id), do: {:via, Registry, {Helix.FlowProcessRegistry, flow_id}}

  # Server Callbacks

  @impl true
  def init(flow_id) do
    Logger.info("Starting FlowServer for flow_id: #{flow_id}")

    # Schedule periodic cleanup check
    Process.send_after(self(), :cleanup_check, @cleanup_after)

    state = %__MODULE__{
      id: flow_id,
      name: "Untitled Flow",
      description: "",
      nodes: [],
      edges: [],
      viewport: %{x: 0, y: 0, zoom: 1},
      created_at: DateTime.utc_now(),
      updated_at: DateTime.utc_now(),
      last_activity: DateTime.utc_now(),
      connected_users: MapSet.new()
    }

    {:ok, state}
  end

  @impl true
  def handle_call({:create_flow, attrs}, _from, state) do
    now = DateTime.utc_now()

    new_state = %{
      state
      | name: Map.get(attrs, :name, "Untitled Flow"),
        description: Map.get(attrs, :description, ""),
        nodes: Map.get(attrs, :nodes, []),
        edges: Map.get(attrs, :edges, []),
        viewport: Map.get(attrs, :viewport, %{x: 0, y: 0, zoom: 1}),
        created_at: now,
        updated_at: now,
        last_activity: now
    }

    broadcast_state_change(new_state)
    schedule_auto_save()

    {:reply, {:ok, flow_to_map(new_state)}, new_state}
  end

  @impl true
  def handle_call(:get_flow, _from, state) do
    {:reply, {:ok, flow_to_map(state)}, update_activity(state)}
  end

  @impl true
  def handle_call({:update_metadata, attrs}, _from, state) do
    now = DateTime.utc_now()

    new_state = %{
      state
      | name: Map.get(attrs, :name, state.name),
        description: Map.get(attrs, :description, state.description),
        updated_at: now,
        last_activity: now
    }

    broadcast_state_change(new_state)
    schedule_auto_save()

    {:reply, {:ok, flow_to_map(new_state)}, new_state}
  end

  @impl true
  def handle_call({:update_nodes, nodes}, _from, state) do
    now = DateTime.utc_now()

    new_state = %{state | nodes: nodes, updated_at: now, last_activity: now}

    broadcast_state_change(new_state, :nodes_updated)
    schedule_auto_save()

    {:reply, {:ok, flow_to_map(new_state)}, new_state}
  end

  @impl true
  def handle_call({:update_edges, edges}, _from, state) do
    now = DateTime.utc_now()

    new_state = %{state | edges: edges, updated_at: now, last_activity: now}

    broadcast_state_change(new_state, :edges_updated)
    schedule_auto_save()

    {:reply, {:ok, flow_to_map(new_state)}, new_state}
  end

  @impl true
  def handle_call({:update_viewport, viewport}, _from, state) do
    now = DateTime.utc_now()

    new_state = %{state | viewport: viewport, last_activity: now}

    # Don't broadcast viewport changes to avoid update loops
    {:reply, {:ok, flow_to_map(new_state)}, new_state}
  end

  @impl true
  def handle_call({:load_flow, flow_data}, _from, state) do
    now = DateTime.utc_now()

    new_state = %{
      state
      | name: Map.get(flow_data, "name", state.name),
        description: Map.get(flow_data, "description", state.description),
        nodes: Map.get(flow_data, "nodes", []),
        edges: Map.get(flow_data, "edges", []),
        viewport: Map.get(flow_data, "viewport", %{x: 0, y: 0, zoom: 1}),
        updated_at: now,
        last_activity: now
    }

    broadcast_state_change(new_state)

    {:reply, {:ok, flow_to_map(new_state)}, new_state}
  end

  @impl true
  def handle_cast({:user_joined, user_id}, state) do
    new_state = %{
      state
      | connected_users: MapSet.put(state.connected_users, user_id),
        last_activity: DateTime.utc_now()
    }

    broadcast_presence_change(new_state)

    {:noreply, new_state}
  end

  @impl true
  def handle_cast({:user_left, user_id}, state) do
    new_state = %{
      state
      | connected_users: MapSet.delete(state.connected_users, user_id),
        last_activity: DateTime.utc_now()
    }

    broadcast_presence_change(new_state)

    {:noreply, new_state}
  end

  @impl true
  def handle_cast(:save_flow, state) do
    save_to_storage(state)
    {:noreply, state}
  end

  @impl true
  def handle_info(:auto_save, state) do
    save_to_storage(state)
    {:noreply, state}
  end

  @impl true
  def handle_info(:cleanup_check, state) do
    if should_cleanup?(state) do
      Logger.info("Cleaning up inactive FlowServer for flow_id: #{state.id}")
      save_to_storage(state)
      {:stop, :normal, state}
    else
      # Schedule next cleanup check
      Process.send_after(self(), :cleanup_check, @cleanup_after)
      {:noreply, state}
    end
  end

  @impl true
  def terminate(reason, state) do
    Logger.info("FlowServer terminating for flow_id: #{state.id}, reason: #{inspect(reason)}")
    save_to_storage(state)
    :ok
  end

  # Private Functions

  defp flow_to_map(state) do
    %{
      id: state.id,
      name: state.name,
      description: state.description,
      nodes: state.nodes,
      edges: state.edges,
      viewport: state.viewport,
      created_at: state.created_at,
      updated_at: state.updated_at,
      connected_users: MapSet.to_list(state.connected_users)
    }
  end

  defp update_activity(state) do
    %{state | last_activity: DateTime.utc_now()}
  end

  defp broadcast_state_change(state, event \\ :state_updated) do
    Phoenix.PubSub.broadcast(
      Helix.PubSub,
      "flow:#{state.id}",
      {event, flow_to_map(state)}
    )
  end

  defp broadcast_presence_change(state) do
    Phoenix.PubSub.broadcast(
      Helix.PubSub,
      "flow:#{state.id}",
      {:presence_updated, %{connected_users: MapSet.to_list(state.connected_users)}}
    )
  end

  defp schedule_auto_save do
    Process.send_after(self(), :auto_save, @auto_save_interval)
  end

  defp should_cleanup?(state) do
    inactive_duration = DateTime.diff(DateTime.utc_now(), state.last_activity, :millisecond)
    MapSet.size(state.connected_users) == 0 and inactive_duration > @cleanup_after
  end

  defp save_to_storage(state) do
    # For now, we'll broadcast to clients to save locally
    # Later this can be enhanced to save to database
    Phoenix.PubSub.broadcast(
      Helix.PubSub,
      "flow:#{state.id}",
      {:save_requested, flow_to_map(state)}
    )
  end
end
