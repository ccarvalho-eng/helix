defmodule HelixWeb.FlowChannel do
  @moduledoc """
  Phoenix Channel for real-time communication with FlowServer processes.
  Handles flow state synchronization, user presence, and collaborative features.
  """

  use HelixWeb, :channel

  alias Helix.FlowServer
  alias Helix.FlowRegistry

  require Logger

  @impl true
  def join("flow:" <> flow_id, %{"user_id" => user_id}, socket) do
    Logger.info("User #{user_id} attempting to join flow: #{flow_id}")

    case get_or_start_flow(flow_id) do
      {:ok, _flow_state} ->
        # Add user to the flow's connected users
        FlowServer.user_joined(flow_id, user_id)

        # Subscribe to flow updates
        Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

        socket =
          socket
          |> assign(:flow_id, flow_id)
          |> assign(:user_id, user_id)

        # Get updated flow state after user joined
        {:ok, updated_flow_state} = FlowServer.get_flow(flow_id)
        {:ok, updated_flow_state, socket}

      {:error, reason} ->
        Logger.error("Failed to join flow #{flow_id}: #{inspect(reason)}")
        {:error, %{reason: "failed_to_join"}}
    end
  end

  @impl true
  def join("flow:" <> _flow_id, _payload, _socket) do
    {:error, %{reason: "user_id_required"}}
  end

  @impl true
  def terminate(_reason, socket) do
    flow_id = socket.assigns[:flow_id]
    user_id = socket.assigns[:user_id]

    if flow_id && user_id do
      FlowServer.user_left(flow_id, user_id)
      Logger.info("User #{user_id} left flow: #{flow_id}")
    end

    :ok
  end

  # Channel event handlers

  @impl true
  def handle_in("get_flow", _payload, socket) do
    flow_id = socket.assigns.flow_id

    case FlowServer.get_flow(flow_id) do
      {:ok, flow_state} ->
        {:reply, {:ok, flow_state}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("update_metadata", payload, socket) do
    flow_id = socket.assigns.flow_id

    # Extract name and description if present
    attrs = %{}

    attrs =
      if Map.has_key?(payload, "name"), do: Map.put(attrs, :name, payload["name"]), else: attrs

    attrs =
      if Map.has_key?(payload, "description"),
        do: Map.put(attrs, :description, payload["description"]),
        else: attrs

    case FlowServer.update_flow_metadata(flow_id, attrs) do
      {:ok, flow_state} ->
        {:reply, {:ok, flow_state}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("update_nodes", %{"nodes" => nodes}, socket) when is_list(nodes) do
    flow_id = socket.assigns.flow_id

    case FlowServer.update_nodes(flow_id, nodes) do
      {:ok, flow_state} ->
        {:reply, {:ok, flow_state}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("update_edges", %{"edges" => edges}, socket) when is_list(edges) do
    flow_id = socket.assigns.flow_id

    case FlowServer.update_edges(flow_id, edges) do
      {:ok, flow_state} ->
        {:reply, {:ok, flow_state}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("update_viewport", %{"viewport" => viewport}, socket) do
    flow_id = socket.assigns.flow_id

    case FlowServer.update_viewport(flow_id, viewport) do
      {:ok, flow_state} ->
        {:reply, {:ok, flow_state}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("save_flow", _payload, socket) do
    flow_id = socket.assigns.flow_id

    FlowServer.save_flow(flow_id)
    {:reply, {:ok, %{saved: true}}, socket}
  end

  @impl true
  def handle_in("load_flow", %{"flow_data" => flow_data}, socket) do
    flow_id = socket.assigns.flow_id

    case FlowServer.load_flow(flow_id, flow_data) do
      {:ok, flow_state} ->
        {:reply, {:ok, flow_state}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in("create_flow", payload, socket) do
    flow_id = socket.assigns.flow_id

    # Convert string keys to atom keys for FlowServer
    attrs =
      payload
      |> Enum.into(%{}, fn
        {key, value} when is_binary(key) -> {String.to_atom(key), value}
        {key, value} -> {key, value}
      end)

    case FlowServer.create_flow(flow_id, attrs) do
      {:ok, flow_state} ->
        {:reply, {:ok, flow_state}, socket}

      {:error, reason} ->
        {:reply, {:error, %{reason: inspect(reason)}}, socket}
    end
  end

  @impl true
  def handle_in(_event, _payload, socket) do
    {:reply, {:error, %{reason: "Unknown event or malformed payload"}}, socket}
  end

  # Handle PubSub broadcasts from FlowServer

  @impl true
  def handle_info({:state_updated, flow_state}, socket) do
    push(socket, "flow_updated", flow_state)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:nodes_updated, flow_state}, socket) do
    push(socket, "nodes_updated", flow_state)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:edges_updated, flow_state}, socket) do
    push(socket, "edges_updated", flow_state)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:presence_updated, presence_data}, socket) do
    push(socket, "presence_updated", presence_data)
    {:noreply, socket}
  end

  @impl true
  def handle_info({:save_requested, flow_state}, socket) do
    push(socket, "save_requested", flow_state)
    {:noreply, socket}
  end

  # Private functions

  defp get_or_start_flow(flow_id) do
    case FlowRegistry.flow_active?(flow_id) do
      true ->
        FlowServer.get_flow(flow_id)

      false ->
        case FlowRegistry.start_flow(flow_id) do
          {:ok, _pid} ->
            FlowServer.get_flow(flow_id)

          error ->
            error
        end
    end
  end
end
