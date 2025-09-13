defmodule Helix.Accounts.UserTest do
  use Helix.DataCase, async: true

  alias Helix.Accounts.User

  describe "changeset/2" do
    test "valid changeset" do
      attrs = %{
        email: "test@example.com",
        first_name: "Test",
        last_name: "User"
      }

      changeset = User.changeset(%User{}, attrs)
      assert changeset.valid?
    end

    test "requires email, first_name, and last_name" do
      changeset = User.changeset(%User{}, %{})

      assert %{
               email: ["can't be blank"],
               first_name: ["can't be blank"],
               last_name: ["can't be blank"]
             } = errors_on(changeset)
    end

    test "validates email format" do
      changeset =
        User.changeset(%User{}, %{
          email: "invalid_email",
          first_name: "Test",
          last_name: "User"
        })

      assert %{email: ["must have the @ sign and no spaces"]} = errors_on(changeset)
    end

    test "validates email length" do
      long_email = String.duplicate("a", 150) <> "@example.com"

      changeset =
        User.changeset(%User{}, %{
          email: long_email,
          first_name: "Test",
          last_name: "User"
        })

      assert %{email: ["should be at most 160 character(s)"]} = errors_on(changeset)
    end
  end

  describe "registration_changeset/2" do
    test "valid registration changeset" do
      attrs = %{
        email: "test@example.com",
        password: "password123A",
        first_name: "Test",
        last_name: "User"
      }

      changeset = User.registration_changeset(%User{}, attrs)
      assert changeset.valid?
      assert get_change(changeset, :password_hash)
      refute get_change(changeset, :password)
    end

    test "requires password" do
      attrs = %{
        email: "test@example.com",
        first_name: "Test",
        last_name: "User"
      }

      changeset = User.registration_changeset(%User{}, attrs)
      assert %{password: ["can't be blank"]} = errors_on(changeset)
    end

    test "validates password length" do
      attrs = %{
        email: "test@example.com",
        password: "short",
        first_name: "Test",
        last_name: "User"
      }

      changeset = User.registration_changeset(%User{}, attrs)
      errors = errors_on(changeset)
      assert "password must be at least 8 characters" in errors.password
    end

    test "validates password has lowercase letter" do
      attrs = %{
        email: "test@example.com",
        password: "PASSWORD123",
        first_name: "Test",
        last_name: "User"
      }

      changeset = User.registration_changeset(%User{}, attrs)

      assert %{password: ["password must contain at least one lowercase letter"]} =
               errors_on(changeset)
    end

    test "validates password has uppercase letter" do
      attrs = %{
        email: "test@example.com",
        password: "password123",
        first_name: "Test",
        last_name: "User"
      }

      changeset = User.registration_changeset(%User{}, attrs)

      assert %{password: ["password must contain at least one uppercase letter"]} =
               errors_on(changeset)
    end

    test "validates password has number" do
      attrs = %{
        email: "test@example.com",
        password: "passwordABC",
        first_name: "Test",
        last_name: "User"
      }

      changeset = User.registration_changeset(%User{}, attrs)
      assert %{password: ["password must contain at least one number"]} = errors_on(changeset)
    end
  end

  describe "password_changeset/2" do
    test "valid password changeset" do
      user = %User{id: Ecto.UUID.generate()}
      attrs = %{password: "newpassword123A"}

      changeset = User.password_changeset(user, attrs)
      assert changeset.valid?
      assert get_change(changeset, :password_hash)
      refute get_change(changeset, :password)
    end
  end

  describe "verify_password/2" do
    test "returns true for correct password" do
      password = "password123A"
      hash = Argon2.hash_pwd_salt(password)

      assert User.verify_password(password, hash)
    end

    test "returns false for incorrect password" do
      password = "password123A"
      wrong_password = "wrongpassword"
      hash = Argon2.hash_pwd_salt(password)

      refute User.verify_password(wrong_password, hash)
    end
  end
end
