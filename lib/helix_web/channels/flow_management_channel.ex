defmodule HelixWeb.FlowManagementChannel do
  @moduledoc """
  Phoenix Channel for flow management operations.

  Handles:
  - Flow deletion notifications
  - Administrative flow operations
  """

  use HelixWeb, :channel

  alias Helix.Flows
  require Logger

  @impl true
  def join("flow_management", _payload, socket) do
    Logger.debug("Client joined flow management channel")
    {:ok, socket}
  end

  # Reject joins to other topics
  @impl true
  def join(_topic, _payload, _socket) do
    {:error, %{reason: "Invalid management channel"}}
  end

  @impl true
  def handle_in("flow_deleted", %{"flow_id" => flow_id}, socket)
      when is_binary(flow_id) do
    Logger.info("Received flow deletion notification for flow: #{flow_id}")

    # Force close any active sessions for this flow
    {:ok, closed_clients} = Flows.force_close_flow_session(flow_id)
    Logger.info("Closed flow session #{flow_id} with #{closed_clients} active clients")

    reply_payload = %{
      status: "session_closed",
      clients_affected: closed_clients
    }

    {:reply, {:ok, reply_payload}, socket}
  end

  @impl true
  def handle_in("flow_deleted", _invalid_payload, socket) do
    Logger.warning("Invalid flow_deleted payload received")
    {:reply, {:error, %{reason: "Invalid flow_id"}}, socket}
  end

  # Handle unknown messages
  @impl true
  def handle_in(event, payload, socket) do
    Logger.warning("Unknown management event #{event} with payload: #{inspect(payload)}")
    {:reply, {:error, %{reason: "Unknown event"}}, socket}
  end

  @impl true
  def terminate(reason, _socket) do
    Logger.debug("Flow management channel terminated: #{inspect(reason)}")
    :ok
  end
end
