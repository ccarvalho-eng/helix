defmodule HelixWeb.Schema.AccountsTypes do
  @moduledoc """
  GraphQL types for Accounts context.
  """

  use Absinthe.Schema.Notation

  @desc "A user of the application"
  object :user do
    field :id, :id, description: "The unique identifier for the user"
    field :email, :string, description: "The user's email address"
    field :first_name, :string, description: "The user's first name"
    field :last_name, :string, description: "The user's last name"
    field :inserted_at, :naive_datetime, description: "When the user was created"
    field :updated_at, :naive_datetime, description: "When the user was last updated"
  end

  @desc "Authentication payload containing user and token"
  object :auth_payload do
    field :user, :user, description: "The authenticated user"
    field :token, :string, description: "JWT token for authentication"
  end

  @desc "Input for user registration"
  input_object :register_input do
    field :email, non_null(:string), description: "Email address"
    field :password, non_null(:string), description: "Password (minimum 8 characters)"
    field :first_name, non_null(:string), description: "First name"
    field :last_name, non_null(:string), description: "Last name"
  end

  @desc "Input for user login"
  input_object :login_input do
    field :email, non_null(:string), description: "Email address"
    field :password, non_null(:string), description: "Password"
  end

  @desc "Input for updating user profile"
  input_object :update_user_input do
    field :email, :string, description: "Email address"
    field :first_name, :string, description: "First name"
    field :last_name, :string, description: "Last name"
  end

  @desc "Input for changing password"
  input_object :change_password_input do
    field :password, non_null(:string), description: "New password (minimum 8 characters)"
  end
end
