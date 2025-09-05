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
    # Validate flow_id format
    case validate_flow_id(flow_id) do
      {:ok, validated_flow_id} ->
        # Extract and validate flow changes from request body
        changes = Map.get(params, "changes", %{})

        case validate_sync_params(changes) do
          {:ok, validated_changes} ->
            # Broadcast changes to all connected clients
            FlowSessionManager.broadcast_flow_change(validated_flow_id, validated_changes)

            # Return success response
            conn
            |> put_status(:ok)
            |> json(%{success: true, message: "Flow changes broadcasted"})

          {:error, reason} ->
            conn
            |> put_status(:bad_request)
            |> json(%{error: "Invalid changes format: #{reason}"})
        end

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid flow ID: #{reason}"})
    end
  end

  @doc """
  GET /api/flows/:id/status
  Get the current status of a flow session
  """
  def status(conn, %{"id" => flow_id}) do
    case validate_flow_id(flow_id) do
      {:ok, validated_flow_id} ->
        flow_status = FlowSessionManager.get_flow_status(validated_flow_id)

        conn
        |> put_status(:ok)
        |> json(flow_status)

      {:error, reason} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "Invalid flow ID: #{reason}"})
    end
  end

  # Private validation functions

  defp validate_flow_id(flow_id) when is_binary(flow_id) do
    trimmed_id = String.trim(flow_id)

    cond do
      String.length(trimmed_id) == 0 ->
        {:error, "flow ID cannot be empty"}

      String.length(trimmed_id) > 255 ->
        {:error, "flow ID too long"}

      not String.match?(trimmed_id, ~r/^[a-zA-Z0-9\-_.<>#%\s]+$/) ->
        {:error, "flow ID contains invalid characters"}

      true ->
        {:ok, trimmed_id}
    end
  end

  defp validate_flow_id(_), do: {:error, "flow ID must be a string"}

  defp validate_sync_params(changes) when is_map(changes) do
    # Basic size check to prevent abuse
    json_size = changes |> Jason.encode!() |> byte_size()

    # 1MB limit
    if json_size > 1_000_000 do
      {:error, "changes payload too large"}
    else
      {:ok, changes}
    end
  rescue
    Jason.EncodeError ->
      {:error, "changes must be valid JSON"}
  end

  defp validate_sync_params(_), do: {:error, "changes must be an object"}
end
