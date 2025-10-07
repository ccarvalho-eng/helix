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
end
