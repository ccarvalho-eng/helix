defmodule Helix.Flows.FlowEdge do
  @moduledoc """
  FlowEdge schema representing a connection between nodes in a flow diagram.

  Each edge connects a source node to a target node, optionally with specific
  handles on each node.
  """

  use Ecto.Schema
  import Ecto.Changeset

  alias Helix.Flows.Flow

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "flow_edges" do
    field :edge_id, :string
    field :source_node_id, :string
    field :target_node_id, :string
    field :source_handle, :string
    field :target_handle, :string
    field :edge_type, :string
    field :animated, :boolean, default: false
    field :data, :map, default: %{}

    belongs_to :flow, Flow

    timestamps(type: :utc_datetime)
  end

  @doc """
  Creates a changeset for creating or updating a flow edge.

  ## Parameters
    - flow_edge: The FlowEdge struct
    - attrs: Map of attributes including edge_id, source/target node ids

  ## Returns
    - Ecto.Changeset.t() with validation results
  """
  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(flow_edge, attrs) do
    flow_edge
    |> cast(attrs, [
      :flow_id,
      :edge_id,
      :source_node_id,
      :target_node_id,
      :source_handle,
      :target_handle,
      :edge_type,
      :animated,
      :data
    ])
    |> validate_required([:flow_id, :edge_id, :source_node_id, :target_node_id])
    |> validate_length(:edge_id, min: 1, max: 255)
    |> validate_length(:source_node_id, min: 1, max: 255)
    |> validate_length(:target_node_id, min: 1, max: 255)
    |> validate_length(:source_handle, max: 100)
    |> validate_length(:target_handle, max: 100)
    |> validate_length(:edge_type, max: 100)
    |> validate_no_self_reference()
    |> validate_data()
    |> foreign_key_constraint(:flow_id)
    |> unique_constraint([:flow_id, :edge_id],
      name: :flow_edges_flow_id_edge_id_index,
      message: "edge_id must be unique within a flow"
    )
  end

  # Private functions

  defp validate_no_self_reference(changeset) do
    source = get_field(changeset, :source_node_id)
    target = get_field(changeset, :target_node_id)

    if source && target && source == target do
      add_error(changeset, :target_node_id, "cannot be the same as source_node_id")
    else
      changeset
    end
  end

  defp validate_data(changeset) do
    case get_change(changeset, :data) do
      nil ->
        changeset

      data when is_map(data) ->
        changeset

      _ ->
        add_error(changeset, :data, "must be a map")
    end
  end
end
