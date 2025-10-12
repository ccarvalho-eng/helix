defmodule Helix.Repo.Migrations.AddIsPublicToFlows do
  use Ecto.Migration

  def change do
    alter table(:flows) do
      add :is_public, :boolean, default: false, null: false
    end

    create index(:flows, [:is_public])
  end
end
