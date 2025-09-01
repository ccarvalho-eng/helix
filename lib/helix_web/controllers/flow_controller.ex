defmodule HelixWeb.FlowController do
  use HelixWeb, :controller

  alias Helix.FlowServer
  alias Helix.FlowRegistry

  # HTML routes
  def index(conn, _params) do
    render(conn, :index, layout: {HelixWeb.Layouts, :flow})
  end

  # API routes for flow management

  @doc """
  GET /api/flows - List all active flows
  """
  def list_flows(conn, _params) do
    active_flows = FlowRegistry.list_active_flows()

    flows =
      Enum.map(active_flows, fn flow_id ->
        case FlowServer.get_flow(flow_id) do
          {:ok, flow_state} -> flow_state
          {:error, _} -> %{id: flow_id, error: "failed_to_get_state"}
        end
      end)

    json(conn, %{flows: flows})
  end

  @doc """
  GET /api/flows/:id - Get a specific flow
  """
  def get_flow(conn, %{"id" => flow_id}) do
    case FlowServer.get_flow(flow_id) do
      {:ok, flow_state} ->
        json(conn, flow_state)

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Flow not found"})

      {:error, reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to get flow", reason: inspect(reason)})
    end
  end

  @doc """
  POST /api/flows - Create a new flow
  """
  def create_flow(conn, params) do
    flow_id = params["id"] || generate_flow_id()
    attrs = Map.take(params, ["name", "description", "nodes", "edges", "viewport"])

    case FlowServer.create_flow(flow_id, attrs) do
      {:ok, flow_state} ->
        conn
        |> put_status(:created)
        |> json(flow_state)

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Failed to create flow", reason: inspect(reason)})
    end
  end

  @doc """
  PUT /api/flows/:id - Update a flow
  """
  def update_flow(conn, %{"id" => flow_id} = params) do
    attrs = Map.take(params, ["name", "description", "nodes", "edges", "viewport"])

    case FlowServer.get_flow(flow_id) do
      {:ok, _} ->
        # Update metadata if provided
        result =
          if Map.has_key?(attrs, "name") or Map.has_key?(attrs, "description") do
            FlowServer.update_flow_metadata(flow_id, attrs)
          else
            {:ok, nil}
          end

        # Update nodes if provided
        result =
          if Map.has_key?(attrs, "nodes") do
            FlowServer.update_nodes(flow_id, attrs["nodes"])
          else
            result
          end

        # Update edges if provided
        result =
          if Map.has_key?(attrs, "edges") do
            FlowServer.update_edges(flow_id, attrs["edges"])
          else
            result
          end

        # Update viewport if provided
        result =
          if Map.has_key?(attrs, "viewport") do
            FlowServer.update_viewport(flow_id, attrs["viewport"])
          else
            result
          end

        case result do
          {:ok, flow_state} ->
            json(conn, flow_state)

          {:error, reason} ->
            conn
            |> put_status(:bad_request)
            |> json(%{error: "Failed to update flow", reason: inspect(reason)})
        end

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Flow not found"})
    end
  end

  @doc """
  DELETE /api/flows/:id - Delete a flow (stop the process)
  """
  def delete_flow(conn, %{"id" => flow_id}) do
    case FlowRegistry.stop_flow(flow_id) do
      :ok ->
        conn
        |> put_status(:no_content)
        |> text("")

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Flow not found"})

      {:error, reason} ->
        conn
        |> put_status(:internal_server_error)
        |> json(%{error: "Failed to delete flow", reason: inspect(reason)})
    end
  end

  @doc """
  POST /api/flows/:id/save - Force save a flow
  """
  def save_flow(conn, %{"id" => flow_id}) do
    case FlowServer.get_flow(flow_id) do
      {:ok, _} ->
        FlowServer.save_flow(flow_id)
        json(conn, %{saved: true})

      {:error, :not_found} ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "Flow not found"})
    end
  end

  @doc """
  GET /api/flows/active - Get information about all active flows
  """
  def active_flows(conn, _params) do
    flow_info = FlowRegistry.flow_info()
    json(conn, %{active_flows: flow_info, count: length(flow_info)})
  end

  # Private functions

  defp generate_flow_id do
    :crypto.strong_rand_bytes(16)
    |> Base.encode64(padding: false)
    |> String.replace(["+", "/"], ["_", "-"])
    |> String.slice(0, 16)
  end
end
