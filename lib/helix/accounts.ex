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

  ## Examples

      iex> Helix.Accounts.list_users()
      [%User{}]

  """
  @spec list_users() :: [User.t()]
  def list_users do
    Repo.all(User)
  end

  @doc """
  Gets a single user by ID.

  Raises `Ecto.NoResultsError` if the User does not exist.

  ## Examples

      iex> user = %Helix.Accounts.User{id: "123"}
      iex> Helix.Repo.insert!(user)
      iex> Helix.Accounts.get_user!("123")
      %Helix.Accounts.User{id: "123"}

      iex> Helix.Accounts.get_user!("nonexistent")
      ** (Ecto.NoResultsError) expected at least one result but got none

  """
  @spec get_user!(binary()) :: User.t()
  def get_user!(id), do: Repo.get!(User, id)

  @doc """
  Gets a single user by ID.

  ## Examples

      iex> Helix.Accounts.get_user("nonexistent")
      nil

  """
  @spec get_user(binary()) :: User.t() | nil
  def get_user(id), do: Repo.get(User, id)

  @doc """
  Gets a user by email address.

  ## Examples

      iex> Helix.Accounts.get_user_by_email("nonexistent@example.com")
      nil

  """
  @spec get_user_by_email(String.t()) :: User.t() | nil
  def get_user_by_email(email) when is_binary(email) do
    Repo.get_by(User, email: email)
  end

  @doc """
  Creates a user with the given attributes.

  ## Examples

      iex> attrs = %{email: "test@example.com", password: "ValidPass123", first_name: "Test", last_name: "User"}
      iex> {:ok, %Helix.Accounts.User{}} = Helix.Accounts.create_user(attrs)

      iex> Helix.Accounts.create_user(%{})
      {:error, %Ecto.Changeset{}}

  """
  @spec create_user(map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def create_user(attrs \\ %{}) do
    %User{}
    |> User.registration_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a user with the given attributes.

  ## Examples

      iex> user = %Helix.Accounts.User{first_name: "Old"}
      iex> {:ok, %Helix.Accounts.User{first_name: "New"}} = Helix.Accounts.update_user(user, %{first_name: "New"})

      iex> user = %Helix.Accounts.User{}
      iex> Helix.Accounts.update_user(user, %{email: "invalid"})
      {:error, %Ecto.Changeset{}}

  """
  @spec update_user(User.t(), map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def update_user(%User{} = user, attrs) do
    user
    |> User.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Updates a user's password with the given attributes.

  ## Examples

      iex> user = %Helix.Accounts.User{}
      iex> {:ok, %Helix.Accounts.User{}} = Helix.Accounts.update_user_password(user, %{password: "NewValidPass123"})

      iex> user = %Helix.Accounts.User{}
      iex> Helix.Accounts.update_user_password(user, %{password: "weak"})
      {:error, %Ecto.Changeset{}}

  """
  @spec update_user_password(User.t(), map()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def update_user_password(%User{} = user, attrs) do
    user
    |> User.password_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a User.

  ## Examples

      iex> user = %Helix.Accounts.User{}
      iex> {:ok, %Helix.Accounts.User{}} = Helix.Accounts.delete_user(user)

  """
  @spec delete_user(User.t()) :: {:ok, User.t()} | {:error, Ecto.Changeset.t()}
  def delete_user(%User{} = user) do
    Repo.delete(user)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking user changes.

  ## Examples

      iex> user = %Helix.Accounts.User{}
      iex> %Ecto.Changeset{} = Helix.Accounts.change_user(user)

      iex> user = %Helix.Accounts.User{}
      iex> %Ecto.Changeset{} = Helix.Accounts.change_user(user, %{first_name: "New"})

  """
  @spec change_user(User.t(), map()) :: Ecto.Changeset.t()
  def change_user(%User{} = user, attrs \\ %{}) do
    User.changeset(user, attrs)
  end

  @doc """
  Authenticates a user with email and password.

  ## Examples

      iex> Helix.Accounts.authenticate_user("nonexistent@example.com", "password")
      {:error, :invalid_credentials}

      iex> Helix.Accounts.authenticate_user("user@example.com", "wrong_password")
      {:error, :invalid_credentials}

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
