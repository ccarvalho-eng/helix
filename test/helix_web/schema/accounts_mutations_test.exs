defmodule HelixWeb.Schema.AccountsMutationsTest do
  use HelixWeb.GraphQLCase, async: true

  import Helix.AccountsFixtures

  describe "register mutation" do
    @register_mutation """
    mutation Register($input: RegisterInput!) {
      register(input: $input) {
        user {
          id
          email
          firstName
          lastName
        }
        token
      }
    }
    """

    test "registers a new user with valid data", %{conn: conn} do
      input = %{
        email: unique_user_email(),
        password: "password123A",
        first_name: "Test",
        last_name: "User"
      }

      response = graphql_query(conn, @register_mutation, %{input: input})

      assert %{
               "data" => %{
                 "register" => %{
                   "user" => %{
                     "email" => email,
                     "firstName" => "Test",
                     "lastName" => "User"
                   },
                   "token" => token
                 }
               }
             } = response

      assert email == input.email
      assert is_binary(token)
    end

    test "returns error with invalid data", %{conn: conn} do
      input = %{
        email: "invalid-email",
        password: "weak",
        first_name: "",
        last_name: ""
      }

      response = graphql_query(conn, @register_mutation, %{input: input})

      assert %{
               "data" => %{"register" => nil},
               "errors" => [%{"message" => message}]
             } = response

      assert message =~ "email:"
      assert message =~ "password:"
      assert message =~ "first_name:"
      assert message =~ "last_name:"
    end

    test "returns error with duplicate email", %{conn: conn} do
      user = user_fixture()

      input = %{
        email: user.email,
        password: "password123A",
        first_name: "Test",
        last_name: "User"
      }

      response = graphql_query(conn, @register_mutation, %{input: input})

      assert %{
               "data" => %{"register" => nil},
               "errors" => [%{"message" => message}]
             } = response

      assert message =~ "email: has already been taken"
    end
  end

  describe "login mutation" do
    @login_mutation """
    mutation Login($input: LoginInput!) {
      login(input: $input) {
        user {
          id
          email
          firstName
          lastName
        }
        token
      }
    }
    """

    test "logs in user with valid credentials", %{conn: conn} do
      password = "password123A"
      user = user_fixture(password: password)

      input = %{
        email: user.email,
        password: password
      }

      response = graphql_query(conn, @login_mutation, %{input: input})

      assert %{
               "data" => %{
                 "login" => %{
                   "user" => %{
                     "id" => user_id,
                     "email" => email
                   },
                   "token" => token
                 }
               }
             } = response

      assert user_id == user.id
      assert email == user.email
      assert is_binary(token)
    end

    test "returns error with invalid credentials", %{conn: conn} do
      user = user_fixture()

      input = %{
        email: user.email,
        password: "wrongpassword"
      }

      response = graphql_query(conn, @login_mutation, %{input: input})

      assert %{
               "data" => %{"login" => nil},
               "errors" => [%{"message" => "Invalid email or password"}]
             } = response
    end

    test "returns error with non-existent email", %{conn: conn} do
      input = %{
        email: "nonexistent@example.com",
        password: "password123A"
      }

      response = graphql_query(conn, @login_mutation, %{input: input})

      assert %{
               "data" => %{"login" => nil},
               "errors" => [%{"message" => "Invalid email or password"}]
             } = response
    end
  end

  describe "updateProfile mutation" do
    @update_profile_mutation """
    mutation UpdateProfile($input: UpdateUserInput!) {
      updateProfile(input: $input) {
        id
        email
        firstName
        lastName
      }
    }
    """

    test "updates user profile with valid data", %{conn: conn} do
      {user, token} = create_user_and_token()

      input = %{
        email: "updated@example.com",
        first_name: "Updated"
      }

      response = graphql_query(conn, @update_profile_mutation, %{input: input}, token)

      assert %{
               "data" => %{
                 "updateProfile" => %{
                   "id" => user_id,
                   "email" => "updated@example.com",
                   "firstName" => "Updated",
                   "lastName" => last_name
                 }
               }
             } = response

      assert user_id == user.id
      assert last_name == user.last_name
    end

    test "returns error when not authenticated", %{conn: conn} do
      input = %{email: "updated@example.com"}

      response = graphql_query(conn, @update_profile_mutation, %{input: input})

      assert %{
               "data" => %{"updateProfile" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end
  end

  describe "changePassword mutation" do
    @change_password_mutation """
    mutation ChangePassword($input: ChangePasswordInput!) {
      changePassword(input: $input) {
        id
        email
      }
    }
    """

    test "changes password with valid data", %{conn: conn} do
      {user, token} = create_user_and_token()

      input = %{password: "newpassword123A"}

      response = graphql_query(conn, @change_password_mutation, %{input: input}, token)

      assert %{
               "data" => %{
                 "changePassword" => %{
                   "id" => user_id,
                   "email" => email
                 }
               }
             } = response

      assert user_id == user.id
      assert email == user.email
    end

    test "returns error when not authenticated", %{conn: conn} do
      input = %{password: "newpassword123A"}

      response = graphql_query(conn, @change_password_mutation, %{input: input})

      assert %{
               "data" => %{"changePassword" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end

    test "returns error with invalid password", %{conn: conn} do
      {_user, token} = create_user_and_token()

      input = %{password: "weak"}

      response = graphql_query(conn, @change_password_mutation, %{input: input}, token)

      assert %{
               "data" => %{"changePassword" => nil},
               "errors" => [%{"message" => message}]
             } = response

      assert message =~ "password:"
    end
  end
end
