defmodule Helix.Repo.Migrations.CreateFlowsTables do
  use Ecto.Migration

  def change do
    # Create flows table
    create table(:flows, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :user_id, references(:users, type: :binary_id, on_delete: :delete_all), null: false
      add :title, :string, size: 255, null: false
      add :description, :text
      add :viewport_x, :float, default: 0.0, null: false
      add :viewport_y, :float, default: 0.0, null: false
      add :viewport_zoom, :float, default: 1.0, null: false
      add :version, :integer, default: 1, null: false
      add :is_template, :boolean, default: false, null: false
      add :template_category, :string
      add :deleted_at, :utc_datetime

      timestamps(type: :utc_datetime, null: false)
    end

    # Indexes for flows
    create index(:flows, [:user_id])
    create index(:flows, [:user_id, :updated_at])
    create index(:flows, [:is_template], where: "is_template = true")
    create index(:flows, [:deleted_at], where: "deleted_at IS NULL")

    # Check constraints for flows
    create constraint(:flows, :viewport_zoom_positive,
             check: "viewport_zoom > 0 AND viewport_zoom <= 10"
           )

    create constraint(:flows, :title_not_empty, check: "char_length(title) >= 1")

    # Create flow_nodes table
    create table(:flow_nodes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :flow_id, references(:flows, type: :binary_id, on_delete: :delete_all), null: false
      add :node_id, :string, size: 255, null: false
      add :type, :string, size: 100, null: false
      add :position_x, :float, null: false
      add :position_y, :float, null: false
      add :width, :float
      add :height, :float
      add :data, :map, default: %{}, null: false

      timestamps(type: :utc_datetime, null: false)
    end

    # Indexes for flow_nodes
    create index(:flow_nodes, [:flow_id])
    create index(:flow_nodes, [:flow_id, :type])
    create unique_index(:flow_nodes, [:flow_id, :node_id])

    # Check constraints for flow_nodes
    create constraint(:flow_nodes, :type_not_empty, check: "char_length(type) >= 1")

    # Create flow_edges table
    create table(:flow_edges, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :flow_id, references(:flows, type: :binary_id, on_delete: :delete_all), null: false
      add :edge_id, :string, size: 255, null: false
      add :source_node_id, :string, size: 255, null: false
      add :target_node_id, :string, size: 255, null: false
      add :source_handle, :string, size: 100
      add :target_handle, :string, size: 100
      add :edge_type, :string, size: 100
      add :animated, :boolean, default: false, null: false
      add :data, :map, default: %{}

      timestamps(type: :utc_datetime, null: false)
    end

    # Indexes for flow_edges
    create index(:flow_edges, [:flow_id])
    create index(:flow_edges, [:flow_id, :source_node_id])
    create index(:flow_edges, [:flow_id, :target_node_id])
    create unique_index(:flow_edges, [:flow_id, :edge_id])
  end
end
