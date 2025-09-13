defmodule HelixWeb.Schema.AccountsQueries do
  @moduledoc """
  GraphQL queries for Accounts context.
  """

  use Absinthe.Schema.Notation

  alias HelixWeb.Resolvers.Accounts

  object :accounts_queries do
    @desc "Get the current authenticated user"
    field :me, :user do
      resolve(&Accounts.me/3)
    end

    @desc "Get a user by ID (admin only)"
    field :user, :user do
      arg(:id, non_null(:id))
      resolve(&Accounts.get_user/3)
    end

    @desc "List all users (admin only)"
    field :users, list_of(:user) do
      resolve(&Accounts.list_users/3)
    end
  end
end
