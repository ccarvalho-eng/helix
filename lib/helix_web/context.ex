defmodule HelixWeb.Context do
  @moduledoc """
  Builds context for GraphQL operations, including authentication.
  """

  @behaviour Plug

  import Plug.Conn

  alias Helix.Accounts.Guardian

  @doc """
  Initializes the plug with the given options.

  ## Parameters
    - opts: Plug options

  ## Returns
    - The unchanged options
  """
  def init(opts), do: opts

  @doc """
  Calls the plug to add authentication context to the connection.

  ## Parameters
    - conn: The Plug connection
    - _: Unused plug options

  ## Returns
    - `Plug.Conn.t()` with authentication context added
  """
  def call(conn, _) do
    context = build_context(conn)
    Absinthe.Plug.put_options(conn, context: context)
  end

  @doc """
  Builds authentication context from the connection.

  Extracts JWT token from Authorization header and validates it to build
  the GraphQL context with current user information.

  ## Parameters
    - conn: The Plug connection

  ## Returns
    - `%{current_user: User.t(), token: String.t()}` when authenticated
    - `%{}` when not authenticated
  """
  @spec build_context(Plug.Conn.t()) :: map()
  def build_context(conn) do
    with ["Bearer " <> token] <- get_req_header(conn, "authorization"),
         {:ok, current_user} <- authorize(token) do
      %{current_user: current_user, token: token}
    else
      _ -> %{}
    end
  end

  defp authorize(token) do
    case Guardian.decode_and_verify(token) do
      {:ok, claims} ->
        case Guardian.resource_from_claims(claims) do
          {:ok, user} -> {:ok, user}
          {:error, _reason} -> {:error, "Invalid authorization token"}
        end

      {:error, _reason} ->
        {:error, "Invalid authorization token"}
    end
  end
end
