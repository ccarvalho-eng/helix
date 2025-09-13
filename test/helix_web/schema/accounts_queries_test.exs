defmodule HelixWeb.Schema.AccountsQueriesTest do
  use HelixWeb.GraphQLCase, async: true

  import Helix.AccountsFixtures

  describe "me query" do
    @me_query """
    query Me {
      me {
        id
        email
        firstName
        lastName
      }
    }
    """

    test "returns current user when authenticated", %{conn: conn} do
      {user, token} = create_user_and_token()

      response = graphql_query(conn, @me_query, %{}, token)

      assert %{
               "data" => %{
                 "me" => %{
                   "id" => user_id,
                   "email" => email,
                   "firstName" => first_name,
                   "lastName" => last_name
                 }
               }
             } = response

      assert user_id == user.id
      assert email == user.email
      assert first_name == user.first_name
      assert last_name == user.last_name
    end

    test "returns error when not authenticated", %{conn: conn} do
      response = graphql_query(conn, @me_query)

      assert %{
               "data" => %{"me" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end
  end

  describe "user query" do
    @user_query """
    query User($id: ID!) {
      user(id: $id) {
        id
        email
        firstName
        lastName
      }
    }
    """

    test "returns user when authenticated", %{conn: conn} do
      {_current_user, token} = create_user_and_token()
      target_user = user_fixture()

      response = graphql_query(conn, @user_query, %{id: target_user.id}, token)

      assert %{
               "data" => %{
                 "user" => %{
                   "id" => user_id,
                   "email" => email,
                   "firstName" => first_name,
                   "lastName" => last_name
                 }
               }
             } = response

      assert user_id == target_user.id
      assert email == target_user.email
      assert first_name == target_user.first_name
      assert last_name == target_user.last_name
    end

    test "returns error when not authenticated", %{conn: conn} do
      user = user_fixture()

      response = graphql_query(conn, @user_query, %{id: user.id})

      assert %{
               "data" => %{"user" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end

    test "returns error when user not found", %{conn: conn} do
      {_user, token} = create_user_and_token()
      non_existent_id = Ecto.UUID.generate()

      response = graphql_query(conn, @user_query, %{id: non_existent_id}, token)

      assert %{
               "data" => %{"user" => nil},
               "errors" => [%{"message" => "User not found"}]
             } = response
    end
  end

  describe "users query" do
    @users_query """
    query Users {
      users {
        id
        email
        firstName
        lastName
      }
    }
    """

    test "returns all users when authenticated", %{conn: conn} do
      {user1, token} = create_user_and_token()
      user2 = user_fixture()

      response = graphql_query(conn, @users_query, %{}, token)

      assert %{
               "data" => %{
                 "users" => users
               }
             } = response

      assert length(users) == 2

      user_ids = Enum.map(users, & &1["id"])
      assert user1.id in user_ids
      assert user2.id in user_ids
    end

    test "returns error when not authenticated", %{conn: conn} do
      response = graphql_query(conn, @users_query)

      assert %{
               "data" => %{"users" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end
  end
end
