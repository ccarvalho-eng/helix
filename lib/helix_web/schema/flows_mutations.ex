defmodule HelixWeb.Schema.FlowsMutations do
  @moduledoc """
  GraphQL mutations for Flows context.
  """

  use Absinthe.Schema.Notation

  alias HelixWeb.Resolvers.Flows

  object :flows_mutations do
    @desc "Create a new flow"
    field :create_flow, :flow do
      arg(:input, non_null(:create_flow_input))
      resolve(&Flows.create_flow/3)
    end

    @desc "Update flow metadata (title, description, viewport)"
    field :update_flow, :flow do
      arg(:id, non_null(:id))
      arg(:input, non_null(:update_flow_input))
      resolve(&Flows.update_flow/3)
    end

    @desc "Update flow data (nodes and edges) with optimistic locking"
    field :update_flow_data, :flow do
      arg(:id, non_null(:id))
      arg(:input, non_null(:update_flow_data_input))
      resolve(&Flows.update_flow_data/3)
    end

    @desc "Delete a flow (soft delete)"
    field :delete_flow, :flow do
      arg(:id, non_null(:id))
      resolve(&Flows.delete_flow/3)
    end

    @desc "Duplicate a flow"
    field :duplicate_flow, :flow do
      arg(:id, non_null(:id))
      arg(:title, :string)
      resolve(&Flows.duplicate_flow/3)
    end
  end
end
