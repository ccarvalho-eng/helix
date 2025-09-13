defmodule Helix.Accounts.User do
  @moduledoc """
  User schema and related functions for account management.
  """

  use Ecto.Schema
  import Ecto.Changeset

  @type t :: %__MODULE__{
          id: binary(),
          email: String.t(),
          password_hash: String.t() | nil,
          first_name: String.t(),
          last_name: String.t(),
          password: String.t() | nil,
          inserted_at: DateTime.t(),
          updated_at: DateTime.t()
        }

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "users" do
    field :email, :string
    field :password_hash, :string
    field :first_name, :string
    field :last_name, :string
    field :password, :string, virtual: true

    timestamps(type: :utc_datetime)
  end

  @doc """
  Creates a changeset for basic user updates (excluding password).

  Validates email format, length, and uniqueness along with required fields.

  ## Parameters
    - user: The User struct to update
    - attrs: Map of attributes to change

  ## Returns
    - Ecto.Changeset.t() with validation results
  """
  @spec changeset(t(), map()) :: Ecto.Changeset.t()
  def changeset(user, attrs) do
    user
    |> cast(attrs, [:email, :first_name, :last_name])
    |> validate_required([:email, :first_name, :last_name])
    |> validate_email()
    |> unique_constraint(:email)
  end

  @doc """
  Creates a changeset for user registration with password validation and hashing.

  Includes all basic validations plus password requirements and automatic hashing.

  ## Parameters
    - user: The User struct (typically %User{})
    - attrs: Map containing registration data including password

  ## Returns
    - Ecto.Changeset.t() with password hashed if valid
  """
  @spec registration_changeset(t(), map()) :: Ecto.Changeset.t()
  def registration_changeset(user, attrs) do
    user
    |> changeset(attrs)
    |> cast(attrs, [:password])
    |> validate_required([:password])
    |> validate_password()
    |> hash_password()
  end

  @doc """
  Creates a changeset for password updates only.

  Validates and hashes a new password for an existing user.

  ## Parameters
    - user: The existing User struct
    - attrs: Map containing the new password

  ## Returns
    - Ecto.Changeset.t() with password hashed if valid
  """
  @spec password_changeset(t(), map()) :: Ecto.Changeset.t()
  def password_changeset(user, attrs) do
    user
    |> cast(attrs, [:password])
    |> validate_required([:password])
    |> validate_password()
    |> hash_password()
  end

  @doc """
  Verifies a plain text password against a hashed password.

  Uses Argon2 to safely compare passwords with constant-time verification.

  ## Parameters
    - password: The plain text password to verify
    - hash: The stored Argon2 password hash

  ## Returns
    - `true` if password matches the hash
    - `false` if password doesn't match
  """
  @spec verify_password(String.t(), String.t()) :: boolean()
  def verify_password(password, hash) do
    Argon2.verify_pass(password, hash)
  end

  defp validate_email(changeset) do
    changeset
    |> validate_format(:email, ~r/^[^\s]+@[^\s]+\.[^\s]+$/,
      message: "must have the @ sign and no spaces"
    )
    |> validate_length(:email, max: 160)
    |> unsafe_validate_unique(:email, Helix.Repo)
  end

  defp validate_password(changeset) do
    changeset
    |> validate_length(:password, min: 8, message: "password must be at least 8 characters")
    |> validate_format(:password, ~r/[a-z]/,
      message: "password must contain at least one lowercase letter"
    )
    |> validate_format(:password, ~r/[A-Z]/,
      message: "password must contain at least one uppercase letter"
    )
    |> validate_format(:password, ~r/[0-9]/, message: "password must contain at least one number")
  end

  defp hash_password(changeset) do
    password = get_change(changeset, :password)

    if password && changeset.valid? do
      changeset
      |> put_change(:password_hash, Argon2.hash_pwd_salt(password))
      |> delete_change(:password)
    else
      changeset
    end
  end
end
