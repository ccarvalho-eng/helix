defmodule HelixWeb.GraphQLCase do
  @moduledoc """
  This module defines the test case to be used by GraphQL tests.
  """

  use ExUnit.CaseTemplate

  import Phoenix.ConnTest
  import Plug.Conn

  using do
    quote do
      import Plug.Conn
      import Phoenix.ConnTest
      import HelixWeb.GraphQLCase

      alias HelixWeb.Router.Helpers, as: Routes

      # The default endpoint for testing
      @endpoint HelixWeb.Endpoint
    end
  end

  setup tags do
    Helix.DataCase.setup_sandbox(tags)
    {:ok, conn: Phoenix.ConnTest.build_conn()}
  end

  @endpoint HelixWeb.Endpoint

  @spec graphql_query(Plug.Conn.t(), String.t(), map(), String.t() | nil) :: map()
  def graphql_query(conn, query, variables \\ %{}, token \\ nil) do
    conn =
      if token do
        put_req_header(conn, "authorization", "Bearer #{token}")
      else
        conn
      end

    conn
    |> put_req_header("content-type", "application/json")
    |> post("/api/graphql", %{query: query, variables: variables})
    |> json_response(200)
  end

  @spec create_user_and_token :: {Helix.Accounts.User.t(), String.t()}
  def create_user_and_token do
    user = Helix.AccountsFixtures.user_fixture()
    {:ok, token, _claims} = Helix.Accounts.Guardian.encode_and_sign(user)
    {user, token}
  end
end
