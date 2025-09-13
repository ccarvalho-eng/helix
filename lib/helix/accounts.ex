defmodule Helix.Accounts do
  @moduledoc """
  The Accounts context.
  """

  import Ecto.Query, warn: false
  alias Helix.Accounts.User
  alias Helix.Repo

  @type user_attrs :: %{
          email: String.t(),
          password: String.t(),
          first_name: String.t(),
          last_name: String.t()
        }

  @doc """
  Returns the list of users.

  ## Returns
    - `[User.t()]` list of all users
  """
  @spec list_users() :: [User.t()]
  def list_users do
    Repo.all(User)
  end

  @doc """
  Gets a single user by ID.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Parameters
    - id: The user's UUID

  ## Returns
    - `User.t()` the user struct
  """
  @spec get_user!(binary()) :: User.t()
  def get_user!(id), do: Repo.get!(User, id)

  @doc """
  Gets a single user by ID.

  ## Parameters
    - id: The user's UUID

  ## Returns
    - `User.t()` if found
    - `nil` if not found
  """
  @spec get_user(binary()) :: User.t() | nil
  def get_user(id), do: Repo.get(User, id)

  @doc """
  Gets a user by email address.

  ## Parameters
    - email: The user's email address

  ## Returns
    - `User.t()` if found
    - `nil` if not found
  """
  @spec get_user_by_email(String.t()) :: User.t() | nil
  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  @doc """
  Creates a user with the given attributes.

  ## Parameters
    - attrs: Map of user attributes (email, password, first_name, last_name)

  ## Returns
    - `{:ok, User.t()}` on successful creation
    - `{:error, Ecto.Changeset.t()}` on validation failure
  """
  @spec create_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def create_user(attrs \\ %{}) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user with the given attributes.

  ## Parameters
    - user: The User struct to update
    - attrs: Map of attributes to change

  ## Returns
    - `{:ok, User.t()}` on successful update
    - `{:error, Ecto.Changeset.t()}` on validation failure
  """
  @spec update_user(User.t(), map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Updates a user's password with the given attributes.

  ## Parameters
    - user: The User struct to update
    - attrs: Map containing the new password

  ## Returns
    - `{:ok, User.t()}` on successful update
    - `{:error, Ecto.Changeset.t()}` on validation failure
  """
  @spec update_user_password(User.t(), map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def update_user_password(%User{} = user, attrs) do
    user
    |> User.password_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a User.

  ## Parameters
    - user: The User struct to delete

  ## Returns
    - `{:ok, User.t()}` on successful deletion
    - `{:error, Ecto.Changeset.t()}` on failure
  """
  @spec delete_user(User.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Parameters
    - user: The User struct
    - attrs: Map of attributes (optional)

  ## Returns
    - `Ecto.Changeset.t()` for the user
  """
  @spec change_user(User.t(), map()) :: Ecto.Changeset.t()
  def change_user(%User{} = user, attrs \\ %{}) do
    User.changeset(user, attrs)
  end

  @doc """
  Authenticates a user with email and password.

  ## Parameters
    - email: User's email address
    - password: User's plain text password

  ## Returns
    - `{:ok, User.t()}` on successful authentication
    - `{:error, :invalid_credentials}` on authentication failure
  """
  @spec authenticate_user(String.t(), String.t()) ::
          {:ok, User.t()} | {:error, :invalid_credentials}
  def authenticate_user(email, password) when is_binary(email) and is_binary(password) do
    case get_user_by_email(email) do
      %User{} = user ->
        if User.verify_password(password, user.password_hash) do
          {:ok, user}
        else
          {:error, :invalid_credentials}
        end

      nil ->
        Argon2.no_user_verify()
        {:error, :invalid_credentials}
    end
  end
end
