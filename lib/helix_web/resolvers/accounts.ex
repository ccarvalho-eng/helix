defmodule HelixWeb.Resolvers.Accounts do
  @moduledoc """
  GraphQL resolvers for Accounts context.
  """

  import HelixWeb.Utils

  alias Helix.Accounts
  alias Helix.Accounts.{Guardian, User}
  alias HelixWeb.Utils

  @doc """
  Registers a new user with the provided information.

  Creates a new user account with email, password, first name, and last name.
  Returns the created user and a JWT token for authentication.

  ## Parameters
    - input: Map containing user registration data

  ## Returns
    - `{:ok, %{user: User.t(), token: String.t()}}` on success
    - `{:error, String.t()}` on validation failure
  """
  @spec register(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, %{user: User.t(), token: String.t()}} | {:error, any()}
  def register(_parent, %{input: input}, _resolution) do
    case Accounts.create_user(input) do
      {:ok, user} ->
        case Guardian.encode_and_sign(user) do
          {:ok, token, _claims} ->
            {:ok, %{user: user, token: token}}

          {:error, reason} ->
            {:error, reason}
        end

      {:error, changeset} ->
        {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  @doc """
  Authenticates a user with email and password.

  Validates the provided credentials and returns the user with a JWT token on success.

  ## Parameters
    - input: Map containing email and password

  ## Returns
    - `{:ok, %{user: User.t(), token: String.t()}}` on successful authentication
    - `{:error, "Invalid email or password"}` on authentication failure
  """
  @spec login(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, %{user: User.t(), token: String.t()}} | {:error, any()}
  def login(_parent, %{input: %{email: email, password: password}}, _resolution) do
    case Guardian.authenticate(email, password) do
      {:ok, user, token} ->
        {:ok, %{user: user, token: token}}

      {:error, :invalid_credentials} ->
        {:error, "Invalid email or password"}

      {:error, reason} ->
        {:error, reason}
    end
  end

  @doc """
  Returns the currently authenticated user.

  Requires authentication via JWT token in the request headers.

  ## Returns
    - `{:ok, User.t()}` when authenticated
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec me(any(), any(), Absinthe.Resolution.t()) :: {:ok, User.t()} | {:error, String.t()}
  def me(_parent, _args, resolution) do
    require_auth(resolution)
  end

  @doc """
  Retrieves a user by their ID.

  Requires authentication. Returns the user if found.

  ## Parameters
    - id: The user's UUID

  ## Returns
    - `{:ok, User.t()}` when user is found
    - `{:error, "User not found"}` when user doesn't exist
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec get_user(any(), map(), Absinthe.Resolution.t()) :: {:ok, User.t()} | {:error, String.t()}
  def get_user(_parent, %{id: id}, %{context: %{current_user: _user}}) do
    case Accounts.get_user(id) do
      %User{} = user -> {:ok, user}
      nil -> {:error, "User not found"}
    end
  end

  def get_user(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Returns a list of all users.

  Requires authentication. This endpoint should be restricted to admin users in production.

  ## Returns
    - `{:ok, [User.t()]}` with list of all users
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec list_users(any(), any(), Absinthe.Resolution.t()) ::
          {:ok, [User.t()]} | {:error, String.t()}
  def list_users(_parent, _args, %{context: %{current_user: _user}}) do
    {:ok, Accounts.list_users()}
  end

  def list_users(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Updates the current user's profile information.

  Allows updating email, first name, and last name. Requires authentication.

  ## Parameters
    - input: Map containing updated profile fields

  ## Returns
    - `{:ok, User.t()}` with updated user data
    - `{:error, String.t()}` on validation errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec update_profile(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, User.t()} | {:error, any()}
  def update_profile(_parent, %{input: input}, %{context: %{current_user: user}}) do
    case Accounts.update_user(user, input) do
      {:ok, updated_user} ->
        {:ok, updated_user}

      {:error, changeset} ->
        {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def update_profile(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Changes the current user's password.

  Updates the user's password with proper hashing. Requires authentication.

  ## Parameters
    - input: Map containing the new password

  ## Returns
    - `{:ok, User.t()}` on successful password change
    - `{:error, String.t()}` on validation errors (e.g., weak password)
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec change_password(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, User.t()} | {:error, any()}
  def change_password(_parent, %{input: input}, %{context: %{current_user: user}}) do
    case Accounts.update_user_password(user, input) do
      {:ok, updated_user} ->
        {:ok, updated_user}

      {:error, changeset} ->
        {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def change_password(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

end
