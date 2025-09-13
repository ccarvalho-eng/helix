defmodule HelixWeb.Context do
  @moduledoc """
  Builds context for GraphQL operations, including authentication.
  """

  @behaviour Plug

  import Plug.Conn

  alias Helix.Accounts.Guardian

  def init(opts), do: opts

  def call(conn, _) do
    context = build_context(conn)
    Absinthe.Plug.put_options(conn, context: context)
  end

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
