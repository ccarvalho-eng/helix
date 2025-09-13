defmodule HelixWeb.Schema.AccountsMutations do
  @moduledoc """
  GraphQL mutations for Accounts context.
  """

  use Absinthe.Schema.Notation

  alias HelixWeb.Resolvers.Accounts

  object :accounts_mutations do
    @desc "Register a new user"
    field :register, :auth_payload do
      arg(:input, non_null(:register_input))
      resolve(&Accounts.register/3)
    end

    @desc "Login with email and password"
    field :login, :auth_payload do
      arg(:input, non_null(:login_input))
      resolve(&Accounts.login/3)
    end

    @desc "Update user profile"
    field :update_profile, :user do
      arg(:input, non_null(:update_user_input))
      resolve(&Accounts.update_profile/3)
    end

    @desc "Change user password"
    field :change_password, :user do
      arg(:input, non_null(:change_password_input))
      resolve(&Accounts.change_password/3)
    end
  end
end
