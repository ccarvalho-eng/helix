defmodule Helix.Flows.FlowNode do
  @moduledoc """
  FlowNode schema representing a node (block) within a flow diagram.

  Each node has a position, type, and arbitrary JSON data for configuration.
  """

  use Ecto.Schema
  import Ecto.Changeset

  alias Helix.Flows.Flow

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "flow_nodes" do
    field :node_id, :string
    field :type, :string
    field :position_x, :float
    field :position_y, :float
    field :width, :float
    field :height, :float
    field :data, :map, default: %{}

    belongs_to :flow, Flow

    timestamps(type: :utc_datetime)
  end

  @doc """
  Creates a changeset for creating or updating a flow node.

  ## Parameters
    - flow_node: The FlowNode struct
    - attrs: Map of attributes including node_id, type, position, data

  ## Returns
    - Ecto.Changeset.t() with validation results
  """
  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(flow_node, attrs) do
    flow_node
    |> cast(attrs, [
      :flow_id,
      :node_id,
      :type,
      :position_x,
      :position_y,
      :width,
      :height,
      :data
    ])
    |> validate_required([:flow_id, :node_id, :type, :position_x, :position_y])
    |> validate_length(:node_id, min: 1, max: 255)
    |> validate_length(:type, min: 1, max: 100)
    |> validate_number(:width, greater_than: 0)
    |> validate_number(:height, greater_than: 0)
    |> validate_data()
    |> foreign_key_constraint(:flow_id)
    |> unique_constraint([:flow_id, :node_id],
      name: :flow_nodes_flow_id_node_id_index,
      message: "node_id must be unique within a flow"
    )
  end

  @doc """
  Validates and normalizes position data.

  Ensures positions are valid numbers and data is a proper map.
  """
  @spec validate_position(Ecto.Changeset.t()) :: Ecto.Changeset.t()
  def validate_position(changeset) do
    changeset
    |> validate_number(:position_x, greater_than_or_equal_to: -100_000, less_than: 100_000)
    |> validate_number(:position_y, greater_than_or_equal_to: -100_000, less_than: 100_000)
  end

  # Private functions

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
