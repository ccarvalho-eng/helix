defmodule HelixWeb.Context do
  @moduledoc """
  Builds context for GraphQL operations, including authentication.
  """

  @behaviour Plug

  import Plug.Conn

  alias Helix.Accounts.Guardian

  @doc """
  Initializes the plug with the given options.

  ## Examples

      iex> HelixWeb.Context.init([])
      []

      iex> HelixWeb.Context.init(some: :option)
      [some: :option]

  """
  def init(opts), do: opts

  @doc """
  Calls the plug to add authentication context to the connection.

  ## Examples

      iex> conn = %Plug.Conn{}
      iex> result = HelixWeb.Context.call(conn, [])
      iex> is_struct(result, Plug.Conn)
      true

  """
  def call(conn, _) do
    context = build_context(conn)
    Absinthe.Plug.put_options(conn, context: context)
  end

  @doc """
  Builds authentication context from the connection.

  Extracts JWT token from Authorization header and validates it to build
  the GraphQL context with current user information.

  ## Examples

      iex> conn = %Plug.Conn{req_headers: []}
      iex> HelixWeb.Context.build_context(conn)
      %{}

      iex> conn = %Plug.Conn{req_headers: [{"authorization", "invalid"}]}
      iex> HelixWeb.Context.build_context(conn)
      %{}

  """
  @spec build_context(Plug.Conn.t()) :: map()
  def build_context(conn) do
    with [auth_header] <- get_req_header(conn, "authorization"),
         "Bearer " <> token <- String.trim(auth_header),
         true <- String.length(token) > 0,
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
