defmodule HelixWeb.FlowChannel do
  @moduledoc """
  Phoenix Channel for real-time flow updates.

  Handles:
  - Joining/leaving flow channels
  - Broadcasting flow changes to connected clients
  - Managing client session state
  """

  use HelixWeb, :channel

  alias Helix.FlowSessionManager
  require Logger

  @impl true
  def join("flow:" <> flow_id, _payload, socket) do
    # Basic validation - ensure flow_id is not empty and has valid format
    # Allow alphanumeric, hyphens, underscores, dots, and angle brackets
    # for test compatibility
    flow_id_pattern = ~r/^[a-zA-Z0-9\-_.<>#]+$/
    is_empty = String.trim(flow_id) == ""
    is_valid_format = String.match?(flow_id, flow_id_pattern)

    if is_empty or not is_valid_format do
      Logger.warning("Invalid flow ID format attempted: #{inspect(flow_id)}")
      {:error, %{reason: "Invalid flow identifier"}}
    else
      # Generate a unique client ID for this connection
      client_id = generate_client_id()

      # Join the flow session
      case FlowSessionManager.join_flow(flow_id, client_id) do
        {:ok, client_count} ->
          # Store client info in socket assigns
          socket =
            socket
            |> assign(:flow_id, flow_id)
            |> assign(:client_id, client_id)

          Logger.info(
            "Client #{client_id} joined flow channel #{flow_id}. " <>
              "Total clients: #{client_count}"
          )

          # Send join confirmation with current client count
          send(self(), {:after_join, client_count})

          {:ok, socket}

        {:error, reason} ->
          Logger.error("Failed to join flow #{flow_id}: #{inspect(reason)}")
          {:error, %{reason: "Failed to join flow session"}}
      end
    end
  end

  # Reject joins to other topics
  @impl true
  def join(_topic, _payload, _socket) do
    {:error, %{reason: "Invalid flow channel"}}
  end

  @impl true
  def handle_info({:after_join, client_count}, socket) do
    # Broadcast that a new client joined
    broadcast(socket, "client_joined", %{
      client_count: client_count,
      flow_id: socket.assigns.flow_id
    })

    {:noreply, socket}
  end

  @impl true
  def handle_info({:flow_change, changes}, socket) do
    # Forward flow changes from the session manager to the client
    push(socket, "flow_update", %{
      changes: changes,
      timestamp: System.system_time(:second)
    })

    {:noreply, socket}
  end

  @impl true
  def handle_info({:flow_deleted, flow_id}, socket) do
    # Notify client that the flow has been deleted
    push(socket, "flow_deleted", %{
      flow_id: flow_id,
      timestamp: System.system_time(:second)
    })

    # Close the channel since the flow no longer exists
    {:stop, :normal, socket}
  end

  @impl true
  def handle_in("flow_change", %{"changes" => changes}, socket) do
    flow_id = socket.assigns.flow_id

    # Broadcast changes to other clients via the session manager
    FlowSessionManager.broadcast_flow_change(flow_id, changes)

    # Acknowledge receipt
    {:reply, {:ok, %{status: "broadcasted"}}, socket}
  end

  @impl true
  def handle_in("ping", _payload, socket) do
    {:reply, {:ok, %{status: "pong"}}, socket}
  end

  # Handle unknown messages
  @impl true
  def handle_in(event, payload, socket) do
    Logger.warning("Unknown event #{event} with payload: #{inspect(payload)}")
    {:reply, {:error, %{reason: "Unknown event"}}, socket}
  end

  @impl true
  def terminate(reason, socket) do
    flow_id = socket.assigns[:flow_id]
    client_id = socket.assigns[:client_id]

    if flow_id && client_id do
      case FlowSessionManager.leave_flow(flow_id, client_id) do
        {:ok, remaining_clients} ->
          # Broadcast that a client left using broadcast_from
          # This may fail if the channel is already terminating or never
          # properly joined
          try do
            broadcast_from(socket, "client_left", %{
              client_count: remaining_clients,
              flow_id: flow_id
            })
          rescue
            RuntimeError ->
              Logger.debug(
                "Could not broadcast client_left during termination - " <>
                  "socket not joined"
              )
          catch
            :exit, _ ->
              Logger.debug(
                "Could not broadcast client_left during termination - " <>
                  "channel already closed"
              )
          end

        {:error, reason} ->
          Logger.error("Error leaving flow #{flow_id}: #{inspect(reason)}")
      end
    end

    Logger.debug("Flow channel terminated: #{inspect(reason)}")
    :ok
  end

  # Private functions

  defp generate_client_id do
    :crypto.strong_rand_bytes(16) |> Base.url_encode64(padding: false)
  end
end
