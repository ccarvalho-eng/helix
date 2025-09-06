defmodule HelixWeb.FlowController do
  use HelixWeb, :controller

  alias Helix.FlowSessionManager

  def index(conn, _params) do
    render(conn, :index, layout: {HelixWeb.Layouts, :flow})
  end

  def show(conn, %{"id" => _id}) do
    # Both new flows and existing flows use the same template
    # The frontend will handle loading the specific flow or creating a new one
    render(conn, :index, layout: {HelixWeb.Layouts, :flow})
  end

  @doc """
  POST /api/flows/:id/sync
  Broadcast flow changes to connected clients
  """
  def sync(conn, %{"id" => flow_id} = params) do
    # Extract flow changes from request body, defaulting to empty map
    changes = Map.get(params, "changes", %{})

    FlowSessionManager.broadcast_flow_change(flow_id, changes)

    conn
    |> put_status(:ok)
    |> json(%{success: true, message: "Flow changes broadcasted"})
  end

  @doc """
  GET /api/flows/:id/status
  Get the current status of a flow session
  """
  def status(conn, %{"id" => flow_id}) do
    flow_status = FlowSessionManager.get_flow_status(flow_id)

    conn
    |> put_status(:ok)
    |> json(flow_status)
  end
end
