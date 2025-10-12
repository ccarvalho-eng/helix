defmodule Helix.Flows.Operations do
  @moduledoc """
  Delta operations for real-time flow collaboration.

  Instead of sending full flow state on every change, we send small delta operations
  that describe what changed. This drastically reduces bandwidth and enables
  better conflict resolution.

  ## Operation Types

  - `node_added` - A new node was added
  - `node_moved` - A node's position changed
  - `node_updated` - A node's properties changed (label, config, etc.)
  - `node_removed` - A node was deleted
  - `edge_added` - A new edge was added
  - `edge_updated` - An edge's properties changed
  - `edge_removed` - An edge was deleted
  - `viewport_changed` - The viewport position/zoom changed
  - `bulk_update` - Multiple operations at once (for initial load or major changes)
  """

  @type operation_type ::
          :node_added
          | :node_moved
          | :node_updated
          | :node_removed
          | :edge_added
          | :edge_updated
          | :edge_removed
          | :viewport_changed
          | :bulk_update

  @type operation :: %{
          required(:type) => operation_type(),
          required(:timestamp) => integer(),
          optional(:node_id) => binary(),
          optional(:edge_id) => binary(),
          optional(:node) => map(),
          optional(:edge) => map(),
          optional(:position) => map(),
          optional(:properties) => map(),
          optional(:viewport) => map(),
          optional(:operations) => list(operation()),
          optional(:user_id) => binary()
        }

  @doc """
  Creates a node_added operation.
  """
  def node_added(node, user_id \\ nil) do
    %{
      type: :node_added,
      node_id: node.node_id || node[:node_id],
      node: node,
      timestamp: System.system_time(:millisecond),
      user_id: user_id
    }
  end

  @doc """
  Creates a node_moved operation.
  """
  def node_moved(node_id, x, y, user_id \\ nil) do
    %{
      type: :node_moved,
      node_id: node_id,
      position: %{x: x, y: y},
      timestamp: System.system_time(:millisecond),
      user_id: user_id
    }
  end

  @doc """
  Creates a node_updated operation.
  """
  def node_updated(node_id, properties, user_id \\ nil) do
    %{
      type: :node_updated,
      node_id: node_id,
      properties: properties,
      timestamp: System.system_time(:millisecond),
      user_id: user_id
    }
  end

  @doc """
  Creates a node_removed operation.
  """
  def node_removed(node_id, user_id \\ nil) do
    %{
      type: :node_removed,
      node_id: node_id,
      timestamp: System.system_time(:millisecond),
      user_id: user_id
    }
  end

  @doc """
  Creates an edge_added operation.
  """
  def edge_added(edge, user_id \\ nil) do
    %{
      type: :edge_added,
      edge_id: edge.edge_id || edge[:edge_id],
      edge: edge,
      timestamp: System.system_time(:millisecond),
      user_id: user_id
    }
  end

  @doc """
  Creates an edge_removed operation.
  """
  def edge_removed(edge_id, user_id \\ nil) do
    %{
      type: :edge_removed,
      edge_id: edge_id,
      timestamp: System.system_time(:millisecond),
      user_id: user_id
    }
  end

  @doc """
  Creates a viewport_changed operation.
  """
  def viewport_changed(x, y, zoom, user_id \\ nil) do
    %{
      type: :viewport_changed,
      viewport: %{x: x, y: y, zoom: zoom},
      timestamp: System.system_time(:millisecond),
      user_id: user_id
    }
  end

  @doc """
  Creates a bulk_update operation containing multiple operations.

  Used for initial load or when applying multiple changes at once.
  """
  def bulk_update(operations, user_id \\ nil) do
    %{
      type: :bulk_update,
      operations: operations,
      timestamp: System.system_time(:millisecond),
      user_id: user_id
    }
  end

  @doc """
  Apply an operation to the current flow state.

  Returns the updated flow state.
  """
  def apply_operation(flow_data, operation) do
    case operation.type do
      :node_added ->
        apply_node_added(flow_data, operation)

      :node_moved ->
        apply_node_moved(flow_data, operation)

      :node_updated ->
        apply_node_updated(flow_data, operation)

      :node_removed ->
        apply_node_removed(flow_data, operation)

      :edge_added ->
        apply_edge_added(flow_data, operation)

      :edge_removed ->
        apply_edge_removed(flow_data, operation)

      :viewport_changed ->
        apply_viewport_changed(flow_data, operation)

      :bulk_update ->
        apply_bulk_update(flow_data, operation)

      _ ->
        # Unknown operation type, ignore
        flow_data
    end
  end

  # Private functions for applying operations

  defp apply_node_added(flow_data, operation) do
    nodes = Map.get(flow_data, :nodes, [])
    # Check if node already exists (idempotency)
    node_exists? = Enum.any?(nodes, fn n -> n.node_id == operation.node_id end)

    if node_exists? do
      flow_data
    else
      Map.put(flow_data, :nodes, nodes ++ [operation.node])
    end
  end

  defp apply_node_moved(flow_data, operation) do
    nodes = Map.get(flow_data, :nodes, [])

    updated_nodes =
      Enum.map(nodes, fn node ->
        if node.node_id == operation.node_id do
          node
          |> Map.put(:position_x, operation.position.x)
          |> Map.put(:position_y, operation.position.y)
        else
          node
        end
      end)

    Map.put(flow_data, :nodes, updated_nodes)
  end

  defp apply_node_updated(flow_data, operation) do
    nodes = Map.get(flow_data, :nodes, [])

    updated_nodes =
      Enum.map(nodes, fn node ->
        if node.node_id == operation.node_id do
          # Merge properties into node
          Enum.reduce(operation.properties, node, fn {key, value}, acc ->
            Map.put(acc, key, value)
          end)
        else
          node
        end
      end)

    Map.put(flow_data, :nodes, updated_nodes)
  end

  defp apply_node_removed(flow_data, operation) do
    nodes = Map.get(flow_data, :nodes, [])
    edges = Map.get(flow_data, :edges, [])

    # Remove node
    updated_nodes = Enum.reject(nodes, fn n -> n.node_id == operation.node_id end)

    # Remove edges connected to this node
    updated_edges =
      Enum.reject(edges, fn e ->
        e.source_node_id == operation.node_id or e.target_node_id == operation.node_id
      end)

    flow_data
    |> Map.put(:nodes, updated_nodes)
    |> Map.put(:edges, updated_edges)
  end

  defp apply_edge_added(flow_data, operation) do
    edges = Map.get(flow_data, :edges, [])
    # Check if edge already exists (idempotency)
    edge_exists? = Enum.any?(edges, fn e -> e.edge_id == operation.edge_id end)

    if edge_exists? do
      flow_data
    else
      Map.put(flow_data, :edges, edges ++ [operation.edge])
    end
  end

  defp apply_edge_removed(flow_data, operation) do
    edges = Map.get(flow_data, :edges, [])
    updated_edges = Enum.reject(edges, fn e -> e.edge_id == operation.edge_id end)
    Map.put(flow_data, :edges, updated_edges)
  end

  defp apply_viewport_changed(flow_data, operation) do
    Map.put(flow_data, :viewport, operation.viewport)
  end

  defp apply_bulk_update(flow_data, operation) do
    Enum.reduce(operation.operations, flow_data, fn op, acc ->
      apply_operation(acc, op)
    end)
  end
end
