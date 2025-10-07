defmodule HelixWeb.Schema.FlowsQueries do
  @moduledoc """
  GraphQL queries for Flows context.
  """

  use Absinthe.Schema.Notation

  alias HelixWeb.Resolvers.Flows

  object :flows_queries do
    @desc "Get all flows for the current user"
    field :my_flows, list_of(:flow) do
      resolve(&Flows.list_my_flows/3)
    end

    @desc "Get a specific flow by ID"
    field :flow, :flow do
      arg(:id, non_null(:id))
      resolve(&Flows.get_flow/3)
    end
  end
end
