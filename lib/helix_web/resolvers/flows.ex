defmodule HelixWeb.Resolvers.Flows do
  @moduledoc """
  GraphQL resolvers for Flows context.
  """

  alias Helix.Flows.{SessionServer, Storage}
  alias HelixWeb.Utils

  @doc """
  Lists all flows for the currently authenticated user.

  Requires authentication via JWT token.

  ## Returns
    - `{:ok, [Flow.t()]}` with list of user's flows
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec list_my_flows(any(), any(), Absinthe.Resolution.t()) ::
          {:ok, list()} | {:error, String.t()}
  def list_my_flows(_parent, _args, %{context: %{current_user: user}}) do
    {:ok, Storage.list_user_flows(user.id)}
  end

  def list_my_flows(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Gets a single flow by ID with authorization check.

  Allows access if:
  - User owns the flow, OR
  - Flow is public (is_public = true)

  Preloads nodes and edges.

  ## Parameters
    - id: The flow's UUID

  ## Returns
    - `{:ok, Flow.t()}` with nodes and edges preloaded
    - `{:error, "Flow not found"}` when flow doesn't exist
    - `{:error, "Unauthorized"}` when user doesn't own the flow and it's not public
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec get_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def get_flow(_parent, %{id: flow_id}, %{context: %{current_user: user}}) do
    with {:error, :unauthorized} <- Storage.get_user_flow_with_data(user.id, flow_id),
         {:ok, flow} <- Storage.get_flow_with_data(flow_id),
         true <- flow.is_public do
      {:ok, flow}
    else
      {:ok, flow_with_data} -> {:ok, flow_with_data}
      {:error, :not_found} -> {:error, "Flow not found"}
      false -> {:error, "Unauthorized"}
    end
  end

  def get_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  ## Mutations

  @doc """
  Creates a new flow for the current user.

  Requires authentication.

  ## Parameters
    - input: Map with flow attributes

  ## Returns
    - `{:ok, Flow.t()}` with created flow
    - `{:error, String.t()}` on validation errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec create_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def create_flow(_parent, %{input: input}, %{context: %{current_user: user}}) do
    attrs = Map.put(input, :user_id, user.id)

    case Storage.create_flow(attrs) do
      {:ok, flow} -> {:ok, flow}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def create_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Updates flow metadata (title, description, viewport).

  Requires authentication and ownership.

  ## Parameters
    - id: Flow ID
    - input: Map with flow attributes to update

  ## Returns
    - `{:ok, Flow.t()}` with updated flow
    - `{:error, String.t()}` on validation or authorization errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec update_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def update_flow(_parent, %{id: flow_id, input: input}, %{context: %{current_user: user}}) do
    with {:ok, flow} <- Storage.get_user_flow(user.id, flow_id),
         {:ok, updated_flow} <- Storage.update_flow(flow, input) do
      {:ok, updated_flow}
    else
      {:error, :not_found} -> {:error, "Flow not found"}
      {:error, :unauthorized} -> {:error, "Unauthorized"}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def update_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Updates flow data (nodes and edges) with optimistic locking.

  Allows updates if:
  - User owns the flow, OR
  - Flow is public (is_public = true)

  ## Parameters
    - id: Flow ID
    - input: Map with nodes, edges, and version

  ## Returns
    - `{:ok, Flow.t()}` with updated flow and preloaded data
    - `{:error, "Version conflict"}` when version doesn't match
    - `{:error, String.t()}` on other errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec update_flow_data(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def update_flow_data(
        _parent,
        %{id: flow_id, input: %{nodes: nodes, edges: edges, version: version}},
        %{context: %{current_user: user}}
      ) do
    with {:error, :unauthorized} <- Storage.get_user_flow(user.id, flow_id),
         {:ok, flow} <- Storage.get_flow(flow_id),
         true <- flow.is_public do
      update_flow_data_impl(flow, nodes, edges, version)
    else
      {:ok, flow} -> update_flow_data_impl(flow, nodes, edges, version)
      {:error, :not_found} -> {:error, "Flow not found"}
      false -> {:error, "Unauthorized"}
    end
  end

  def update_flow_data(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  # Helper function to actually perform the update
  defp update_flow_data_impl(flow, nodes, edges, version) do
    case Storage.update_flow_data(flow, nodes, edges, version) do
      {:ok, updated_flow} ->
        # Broadcast the update to all connected clients via SessionServer
        # This ensures real-time collaboration without double-broadcasting
        broadcast_update_to_clients(updated_flow)
        {:ok, updated_flow}

      {:error, :version_conflict} ->
        {:error, "Version conflict"}

      {:error, changeset} ->
        {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  defp broadcast_update_to_clients(flow) do
    # Transform Ecto structs to plain maps for JSON serialization
    # The client expects ReactFlow format, so we need to transform from DB format
    nodes = Enum.map(flow.nodes, &transform_node_for_broadcast/1)
    edges = Enum.map(flow.edges, &transform_edge_for_broadcast/1)

    # Prepare flow data for broadcast in ReactFlow format
    changes = %{
      nodes: nodes,
      edges: edges,
      viewport: %{
        x: flow.viewport_x,
        y: flow.viewport_y,
        zoom: flow.viewport_zoom
      },
      version: flow.version
    }

    # Broadcast to all connected clients via the SessionServer
    SessionServer.broadcast_flow_change(flow.id, changes)
  end

  defp transform_node_for_broadcast(node) do
    %{
      id: node.node_id,
      type: "aiFlowNode",
      position: %{x: node.position_x, y: node.position_y},
      data: %{
        id: node.node_id,
        type: node.type,
        position: %{x: node.position_x, y: node.position_y},
        x: node.position_x,
        y: node.position_y,
        width: node.width,
        height: node.height,
        dimensions: %{width: node.width, height: node.height},
        label: get_in(node.data, ["label"]) || "",
        description: get_in(node.data, ["description"]) || "",
        config: get_in(node.data, ["config"]) || %{},
        color: get_in(node.data, ["color"]) || "#f0f9ff",
        borderColor: get_in(node.data, ["borderColor"]) || "#e5e7eb",
        borderWidth: get_in(node.data, ["borderWidth"]) || 1
      },
      style: %{
        width: node.width,
        height: node.height
      }
    }
  end

  defp transform_edge_for_broadcast(edge) do
    # Convert empty maps to nil for proper JSON serialization
    edge_data = normalize_edge_data(edge.data)

    %{
      id: edge.edge_id,
      source: edge.source_node_id,
      target: edge.target_node_id,
      sourceHandle: edge.source_handle,
      targetHandle: edge.target_handle,
      type: edge.edge_type || "default",
      animated: edge.animated || false,
      markerEnd: %{
        type: "arrowclosed",
        width: 20,
        height: 20,
        color: "#9ca3af"
      },
      style: %{
        stroke: "#9ca3af",
        strokeWidth: 2
      },
      data: edge_data
    }
  end

  defp normalize_edge_data(nil), do: nil
  defp normalize_edge_data(data) when map_size(data) == 0, do: nil
  defp normalize_edge_data(data), do: data

  @doc """
  Deletes a flow (soft delete).

  Requires authentication and ownership.

  ## Parameters
    - id: Flow ID

  ## Returns
    - `{:ok, Flow.t()}` with deleted flow
    - `{:error, String.t()}` on errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec delete_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def delete_flow(_parent, %{id: flow_id}, %{context: %{current_user: user}}) do
    with {:ok, flow} <- Storage.get_user_flow(user.id, flow_id),
         {:ok, deleted_flow} <- Storage.delete_flow(flow) do
      {:ok, deleted_flow}
    else
      {:error, :not_found} -> {:error, "Flow not found"}
      {:error, :unauthorized} -> {:error, "Unauthorized"}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def delete_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Duplicates a flow.

  Requires authentication and ownership of source flow.

  ## Parameters
    - id: Source flow ID
    - title: Optional title for the duplicated flow

  ## Returns
    - `{:ok, Flow.t()}` with new flow
    - `{:error, String.t()}` on errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec duplicate_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def duplicate_flow(_parent, %{id: flow_id} = args, %{context: %{current_user: user}}) do
    title = Map.get(args, :title)

    # Verify ownership of source flow
    with {:ok, _flow} <- Storage.get_user_flow(user.id, flow_id),
         {:ok, new_flow_with_data} <- Storage.duplicate_flow(flow_id, user.id, title) do
      {:ok, new_flow_with_data}
    else
      {:error, :not_found} -> {:error, "Flow not found"}
      {:error, :unauthorized} -> {:error, "Unauthorized"}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def duplicate_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end
end
