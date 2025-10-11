defmodule HelixWeb.Schema do
  @moduledoc """
  Main GraphQL schema for Helix.
  """

  use Absinthe.Schema
  import_types(Absinthe.Type.Custom)

  alias HelixWeb.Schema.{AccountsMutations, AccountsQueries, AccountsTypes}
  alias HelixWeb.Schema.{CustomTypes, FlowsMutations, FlowsQueries, FlowsTypes}

  import_types(CustomTypes)
  import_types(AccountsTypes)
  import_types(AccountsMutations)
  import_types(AccountsQueries)
  import_types(FlowsTypes)
  import_types(FlowsQueries)
  import_types(FlowsMutations)

  query do
    import_fields(:accounts_queries)
    import_fields(:flows_queries)
  end

  mutation do
    import_fields(:accounts_mutations)
    import_fields(:flows_mutations)
  end
end
