defmodule Helix.Accounts.Guardian do
  @moduledoc """
  Guardian implementation for JWT authentication.
  """

  use Guardian, otp_app: :helix

  alias Helix.Accounts
  alias Helix.Accounts.User

  @doc """
  Extracts the subject (user ID) from a User struct for JWT token generation.

  ## Parameters
    - user: The User struct
    - claims: JWT claims (unused)

  ## Returns
    - `{:ok, String.t()}` with the user ID
    - `{:error, :reason_for_error}` for invalid input
  """
  @spec subject_for_token(User.t(), any()) ::
          {:ok, String.t()} | {:error, atom()}
  def subject_for_token(%User{id: id}, _claims) do
    {:ok, to_string(id)}
  end

  def subject_for_token(_, _) do
    {:error, :reason_for_error}
  end

  @doc """
  Retrieves a User from JWT token claims.

  Extracts the user ID from the 'sub' claim and fetches the user from the
  database.

  ## Parameters
    - claims: JWT claims map containing 'sub' key

  ## Returns
    - `{:ok, User.t()}` when user is found
    - `{:error, :resource_not_found}` when user doesn't exist
    - `{:error, :reason_for_error}` for invalid claims
  """
  @spec resource_from_claims(map()) :: {:ok, User.t()} | {:error, atom()}
  def resource_from_claims(%{"sub" => id}) do
    case Accounts.get_user(id) do
      %User{} = user -> {:ok, user}
      nil -> {:error, :resource_not_found}
    end
  end

  def resource_from_claims(_claims) do
    {:error, :reason_for_error}
  end

  @doc """
  Authenticates a user with email and password, returning user and JWT token.

  Combines user authentication with token generation in a single operation.

  ## Parameters
    - email: User's email address
    - password: User's password

  ## Returns
    - `{:ok, User.t(), String.t()}` with user and JWT token on success
    - `{:error, :invalid_credentials}` on authentication failure
    - `{:error, atom()}` on token generation failure
  """
  @spec authenticate(String.t(), String.t()) ::
          {:ok, User.t(), String.t()} | {:error, atom()}
  def authenticate(email, password) do
    case Accounts.authenticate_user(email, password) do
      {:ok, user} ->
        case encode_and_sign(user) do
          {:ok, token, _claims} -> {:ok, user, token}
          {:error, reason} -> {:error, reason}
        end

      {:error, reason} ->
        {:error, reason}
    end
  end
end
