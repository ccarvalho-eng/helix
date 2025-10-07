defmodule HelixWeb.Schema.FlowsTypes do
  @moduledoc """
  GraphQL types for Flows context.
  """

  use Absinthe.Schema.Notation

  @desc "A node (block) within a flow diagram"
  object :flow_node do
    field :id, :id, description: "The unique identifier for the node"
    field :node_id, :string, description: "The client-side node identifier"
    field :type, :string, description: "The type of node (e.g., agent, tool, model)"
    field :position_x, :float, description: "X coordinate position"
    field :position_y, :float, description: "Y coordinate position"
    field :width, :float, description: "Width of the node"
    field :height, :float, description: "Height of the node"
    field :data, :json, description: "Arbitrary JSON data for node configuration"
    field :inserted_at, :datetime, description: "When the node was created"
    field :updated_at, :datetime, description: "When the node was last updated"
  end

  @desc "An edge (connection) between nodes in a flow diagram"
  object :flow_edge do
    field :id, :id, description: "The unique identifier for the edge"
    field :edge_id, :string, description: "The client-side edge identifier"
    field :source_node_id, :string, description: "The source node identifier"
    field :target_node_id, :string, description: "The target node identifier"
    field :source_handle, :string, description: "The source connection handle"
    field :target_handle, :string, description: "The target connection handle"
    field :edge_type, :string, description: "The type of edge connection"
    field :animated, :boolean, description: "Whether the edge is animated"
    field :data, :json, description: "Arbitrary JSON data for edge configuration"
    field :inserted_at, :datetime, description: "When the edge was created"
    field :updated_at, :datetime, description: "When the edge was last updated"
  end

  @desc "A flow diagram with nodes and edges"
  object :flow do
    field :id, :id, description: "The unique identifier for the flow"
    field :user_id, :id, description: "The owner of the flow"
    field :title, :string, description: "The flow's title"
    field :description, :string, description: "The flow's description"
    field :viewport_x, :float, description: "Viewport X offset"
    field :viewport_y, :float, description: "Viewport Y offset"
    field :viewport_zoom, :float, description: "Viewport zoom level"
    field :version, :integer, description: "Version number for optimistic locking"
    field :is_template, :boolean, description: "Whether this flow is a template"
    field :template_category, :string, description: "Category for template flows"
    field :nodes, list_of(:flow_node), description: "Nodes in this flow"
    field :edges, list_of(:flow_edge), description: "Edges in this flow"
    field :inserted_at, :datetime, description: "When the flow was created"
    field :updated_at, :datetime, description: "When the flow was last updated"
  end

  # Input types for mutations

  @desc "Input for creating a new flow"
  input_object :create_flow_input do
    field :title, non_null(:string), description: "Flow title"
    field :description, :string, description: "Flow description"
    field :viewport_x, :float, description: "Viewport X offset (default: 0.0)"
    field :viewport_y, :float, description: "Viewport Y offset (default: 0.0)"
    field :viewport_zoom, :float, description: "Viewport zoom level (default: 1.0)"
  end

  @desc "Input for updating flow metadata"
  input_object :update_flow_input do
    field :title, :string, description: "Flow title"
    field :description, :string, description: "Flow description"
    field :viewport_x, :float, description: "Viewport X offset"
    field :viewport_y, :float, description: "Viewport Y offset"
    field :viewport_zoom, :float, description: "Viewport zoom level"
  end

  @desc "Input for a flow node"
  input_object :node_input do
    field :node_id, non_null(:string), description: "Client-side node identifier"
    field :type, non_null(:string), description: "Node type"
    field :position_x, non_null(:float), description: "X coordinate"
    field :position_y, non_null(:float), description: "Y coordinate"
    field :width, :float, description: "Node width"
    field :height, :float, description: "Node height"
    field :data, :json, description: "Node configuration data"
  end

  @desc "Input for a flow edge"
  input_object :edge_input do
    field :edge_id, non_null(:string), description: "Client-side edge identifier"
    field :source_node_id, non_null(:string), description: "Source node identifier"
    field :target_node_id, non_null(:string), description: "Target node identifier"
    field :source_handle, :string, description: "Source connection handle"
    field :target_handle, :string, description: "Target connection handle"
    field :edge_type, :string, description: "Edge type"
    field :animated, :boolean, description: "Whether edge is animated"
    field :data, :json, description: "Edge configuration data"
  end

  @desc "Input for updating flow data (nodes and edges)"
  input_object :update_flow_data_input do
    field :nodes, non_null(list_of(non_null(:node_input))), description: "List of nodes"
    field :edges, non_null(list_of(non_null(:edge_input))), description: "List of edges"
    field :version, non_null(:integer), description: "Expected version for optimistic locking"
  end
end
