defmodule Helix.Flows.Flow do
  @moduledoc """
  Flow schema and changesets for flow management.

  A Flow represents a visual workflow diagram created by a user, containing
  nodes (blocks) and edges (connections between blocks).
  """

  use Ecto.Schema
  import Ecto.Changeset

  alias Helix.Accounts.User
  alias Helix.Flows.{FlowEdge, FlowNode}

  @type t :: %__MODULE__{}

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "flows" do
    field :title, :string
    field :description, :string
    field :viewport_x, :float, default: 0.0
    field :viewport_y, :float, default: 0.0
    field :viewport_zoom, :float, default: 1.0
    field :version, :integer, default: 1
    field :is_template, :boolean, default: false
    field :is_public, :boolean, default: false
    field :template_category, :string
    field :deleted_at, :utc_datetime

    belongs_to :user, User
    has_many :nodes, FlowNode, foreign_key: :flow_id, on_delete: :delete_all
    has_many :edges, FlowEdge, foreign_key: :flow_id, on_delete: :delete_all

    timestamps(type: :utc_datetime)
  end

  @doc """
  Creates a changeset for creating a new flow.

  ## Parameters
    - flow: The Flow struct
    - attrs: Map of attributes including title, description, user_id

  ## Returns
    - Ecto.Changeset.t() with validation results
  """
  @spec create_changeset(t(), map()) :: Ecto.Changeset.t()
  def create_changeset(flow, attrs) do
    flow
    |> cast(attrs, [
      :title,
      :description,
      :user_id,
      :viewport_x,
      :viewport_y,
      :viewport_zoom,
      :is_template,
      :template_category
    ])
    |> validate_required([:title, :user_id])
    |> validate_length(:title, min: 1, max: 255)
    |> validate_length(:description, max: 5000)
    |> validate_viewport()
    |> foreign_key_constraint(:user_id)
  end

  @doc """
  Creates a changeset for updating flow metadata (title, description, viewport).

  ## Parameters
    - flow: The existing Flow struct
    - attrs: Map of attributes to update

  ## Returns
    - Ecto.Changeset.t() with validation results
  """
  @spec update_changeset(t(), map()) :: Ecto.Changeset.t()
  def update_changeset(flow, attrs) do
    flow
    |> cast(attrs, [
      :title,
      :description,
      :viewport_x,
      :viewport_y,
      :viewport_zoom,
      :template_category,
      :is_public
    ])
    |> validate_required([:title])
    |> validate_length(:title, min: 1, max: 255)
    |> validate_length(:description, max: 5000)
    |> validate_viewport()
  end

  @doc """
  Creates a changeset for updating flow version (optimistic locking).

  Used to increment version when flow data (nodes/edges) changes.

  ## Parameters
    - flow: The existing Flow struct

  ## Returns
    - Ecto.Changeset.t() that increments version
  """
  @spec increment_version_changeset(t()) :: Ecto.Changeset.t()
  def increment_version_changeset(flow) do
    flow
    |> change()
    |> put_change(:version, flow.version + 1)
  end

  @doc """
  Creates a changeset for soft deleting a flow.

  ## Parameters
    - flow: The existing Flow struct

  ## Returns
    - Ecto.Changeset.t() that sets deleted_at timestamp
  """
  @spec soft_delete_changeset(t()) :: Ecto.Changeset.t()
  def soft_delete_changeset(flow) do
    flow
    |> change()
    |> put_change(:deleted_at, DateTime.utc_now() |> DateTime.truncate(:second))
  end

  # Private functions

  defp validate_viewport(changeset) do
    changeset
    |> validate_number(:viewport_zoom, greater_than: 0, less_than_or_equal_to: 10)
  end
end
