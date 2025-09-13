defmodule HelixWeb.Schema do
  @moduledoc """
  Main GraphQL schema for Helix.
  """

  use Absinthe.Schema
  import_types(Absinthe.Type.Custom)

  alias HelixWeb.Schema.{AccountsMutations, AccountsQueries, AccountsTypes}

  import_types(AccountsTypes)
  import_types(AccountsMutations)
  import_types(AccountsQueries)

  query do
    import_fields(:accounts_queries)
  end

  mutation do
    import_fields(:accounts_mutations)
  end
end
