defmodule Helix.AccountsTest do
  use Helix.DataCase, async: true

  alias Helix.Accounts
  alias Helix.Accounts.User

  import Helix.AccountsFixtures

  describe "users" do
    test "list_users/0 returns all users" do
      user = user_fixture()
      assert Accounts.list_users() == [user]
    end

    test "get_user!/1 returns the user with given id" do
      user = user_fixture()
      assert Accounts.get_user!(user.id) == user
    end

    test "get_user/1 returns the user with given id" do
      user = user_fixture()
      assert Accounts.get_user(user.id) == user
    end

    test "get_user/1 returns nil for non-existent user" do
      assert Accounts.get_user(Ecto.UUID.generate()) == nil
    end

    test "get_user_by_email/1 returns the user with given email" do
      user = user_fixture()
      assert Accounts.get_user_by_email(user.email) == user
    end

    test "get_user_by_email/1 returns nil for non-existent email" do
      assert Accounts.get_user_by_email("nonexistent@example.com") == nil
    end

    test "create_user/1 with valid data creates a user" do
      valid_attrs = valid_user_attributes()

      assert {:ok, %User{} = user} = Accounts.create_user(valid_attrs)
      assert user.email == valid_attrs.email
      assert user.first_name == valid_attrs.first_name
      assert user.last_name == valid_attrs.last_name
      assert user.password_hash
      assert User.verify_password(valid_attrs.password, user.password_hash)
    end

    test "create_user/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Accounts.create_user(%{})
    end

    test "create_user/1 with duplicate email returns error changeset" do
      user_fixture(email: "duplicate@example.com")

      assert {:error, changeset} =
               Accounts.create_user(valid_user_attributes(email: "duplicate@example.com"))

      assert %{email: ["has already been taken"]} = errors_on(changeset)
    end

    test "update_user/2 with valid data updates the user" do
      user = user_fixture()
      update_attrs = %{email: "updated@example.com", first_name: "Updated"}

      assert {:ok, %User{} = user} = Accounts.update_user(user, update_attrs)
      assert user.email == "updated@example.com"
      assert user.first_name == "Updated"
    end

    test "update_user/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_user(user, %{email: ""})
      assert user == Accounts.get_user!(user.id)
    end

    test "update_user_password/2 with valid data updates the user password" do
      user = user_fixture()
      new_password = "newpassword123A"
      update_attrs = %{password: new_password}

      assert {:ok, %User{} = updated_user} = Accounts.update_user_password(user, update_attrs)
      assert User.verify_password(new_password, updated_user.password_hash)
      refute User.verify_password("password123A", updated_user.password_hash)
    end

    test "update_user_password/2 with invalid data returns error changeset" do
      user = user_fixture()
      assert {:error, %Ecto.Changeset{}} = Accounts.update_user_password(user, %{password: ""})
    end

    test "delete_user/1 deletes the user" do
      user = user_fixture()
      assert {:ok, %User{}} = Accounts.delete_user(user)
      assert_raise Ecto.NoResultsError, fn -> Accounts.get_user!(user.id) end
    end

    test "change_user/1 returns a user changeset" do
      user = user_fixture()
      assert %Ecto.Changeset{} = Accounts.change_user(user)
    end
  end

  describe "authenticate_user/2" do
    test "returns {:ok, user} when credentials are valid" do
      password = "password123A"
      user = user_fixture(password: password)

      assert {:ok, auth_user} = Accounts.authenticate_user(user.email, password)
      assert auth_user.id == user.id
    end

    test "returns {:error, :invalid_credentials} when email doesn't exist" do
      assert {:error, :invalid_credentials} =
               Accounts.authenticate_user("nonexistent@example.com", "password")
    end

    test "returns {:error, :invalid_credentials} when password is wrong" do
      user = user_fixture()

      assert {:error, :invalid_credentials} =
               Accounts.authenticate_user(user.email, "wrongpassword")
    end
  end
end
