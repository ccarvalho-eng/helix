defmodule HelixWeb.UtilsTest do
  use ExUnit.Case, async: true
  import Ecto.Changeset
  alias Helix.Accounts.User
  alias HelixWeb.Utils

  describe "format_changeset_errors/1" do
    test "formats single field error" do
      changeset =
        %User{}
        |> cast(%{}, [:email])
        |> validate_required([:email])

      result = Utils.format_changeset_errors(changeset)
      assert result == "Email: Can't be blank"
    end

    test "formats multiple field errors" do
      changeset =
        %User{}
        |> cast(%{}, [:email, :password])
        |> validate_required([:email, :password])

      result = Utils.format_changeset_errors(changeset)
      assert result =~ "Email: Can't be blank"
      assert result =~ "Password: Can't be blank"

      # Check that errors are separated by newlines
      lines = String.split(result, "\n")
      assert length(lines) == 2
    end

    test "formats multiple errors for same field" do
      changeset =
        %User{}
        |> cast(%{email: "invalid", password: "x"}, [:email, :password])
        |> validate_format(:email, ~r/@/, message: "must have the @ sign")
        |> validate_length(:email, min: 10, message: "should be at least 10 character(s)")
        |> validate_length(:password, min: 8, message: "should be at least 8 character(s)")

      result = Utils.format_changeset_errors(changeset)

      # Check that multiple errors for same field are joined with commas
      assert result =~ "Email:"
      assert result =~ "Must have the @ sign"
      assert result =~ "Should be at least 10 character(s)"
      assert result =~ "Password: Should be at least 8 character(s)"
    end

    test "formats known field names correctly" do
      changeset =
        %User{}
        |> cast(%{}, [:email, :password, :first_name, :last_name])
        |> validate_required([:email, :password, :first_name, :last_name])

      result = Utils.format_changeset_errors(changeset)

      assert result =~ "Email: Can't be blank"
      assert result =~ "Password: Can't be blank"
      assert result =~ "First name: Can't be blank"
      assert result =~ "Last name: Can't be blank"
    end

    test "formats unknown field names with capitalization" do
      # Create a changeset with errors on non-standard fields by directly adding errors
      changeset =
        %User{}
        |> cast(%{}, [:email])
        |> add_error(:username, "can't be blank")
        |> add_error(:phone_number, "can't be blank")

      result = Utils.format_changeset_errors(changeset)

      assert result =~ "Username: Can't be blank"
      assert result =~ "Phone_number: Can't be blank"
    end

    test "removes duplicate field name prefixes from error messages" do
      # Simulate error messages that already contain field names
      changeset =
        %User{}
        |> cast(%{password: "weak"}, [:password])
        |> add_error(:password, "password must contain at least one uppercase letter")
        |> add_error(:password, "password must contain at least one number")

      result = Utils.format_changeset_errors(changeset)

      # Should remove "password" prefix and capitalize, order not guaranteed
      assert result =~ "Password:"
      assert result =~ "Must contain at least one uppercase letter"
      assert result =~ "Must contain at least one number"

      # Should not contain duplicate "password" text
      refute result =~ "password password"
    end

    test "handles mixed case field prefixes in error messages" do
      changeset =
        %User{}
        |> cast(%{email: "invalid"}, [:email])
        |> add_error(:email, "Email has already been taken")
        |> add_error(:email, "email must be unique")

      result = Utils.format_changeset_errors(changeset)

      # Current implementation only removes lowercase prefixes
      # So "Email has already been taken" stays as is, "email must be unique" becomes "Must be unique"
      assert result =~ "Email:"
      # Capitalized prefix not removed
      assert result =~ "Email has already been taken"
      # Lowercase prefix removed
      assert result =~ "Must be unique"
    end

    test "preserves error messages without field prefixes" do
      changeset =
        %User{}
        |> cast(%{email: "invalid"}, [:email])
        |> add_error(:email, "has invalid format")
        |> add_error(:email, "is too short")

      result = Utils.format_changeset_errors(changeset)

      # Order of errors is not guaranteed, so check individually
      assert result =~ "Email:"
      assert result =~ "Has invalid format"
      assert result =~ "Is too short"
    end

    test "handles empty changeset errors" do
      changeset =
        %User{}
        |> cast(%{email: "valid@example.com"}, [:email])

      result = Utils.format_changeset_errors(changeset)

      assert result == ""
    end

    test "handles errors with interpolated values" do
      changeset =
        %User{}
        |> cast(%{password: "short"}, [:password])
        |> validate_length(:password, min: 8)

      result = Utils.format_changeset_errors(changeset)

      assert result == "Password: Should be at least 8 character(s)"
    end

    test "maintains order of fields in error output" do
      changeset =
        %User{}
        |> cast(%{}, [:email, :first_name, :last_name, :password])
        |> validate_required([:email, :first_name, :last_name, :password])

      result = Utils.format_changeset_errors(changeset)
      lines = String.split(result, "\n")

      # The order should be consistent (Ecto maintains field order)
      assert length(lines) == 4
      assert Enum.all?(lines, &String.contains?(&1, ": Can't be blank"))
    end

    test "handles complex validation scenario" do
      # Simulate a realistic registration scenario with multiple validation failures
      changeset =
        %User{}
        |> cast(
          %{
            email: "invalid-email",
            password: "weak",
            first_name: "",
            last_name: "A"
          },
          [:email, :password, :first_name, :last_name]
        )
        |> validate_required([:email, :password, :first_name, :last_name])
        |> validate_format(:email, ~r/@/, message: "must have a valid format")
        |> validate_length(:password, min: 8, message: "must be at least 8 characters")
        |> add_error(:password, "password must contain at least one uppercase letter")
        |> validate_length(:last_name, min: 2, message: "must be at least 2 characters")
        |> add_error(:email, "Email has already been taken")

      result = Utils.format_changeset_errors(changeset)

      # Should contain all validation errors properly formatted
      assert result =~ "Email:"
      assert result =~ "Must have a valid format"
      # Capitalized prefix not removed
      assert result =~ "Email has already been taken"
      assert result =~ "Password:"
      assert result =~ "Must be at least 8 characters"
      assert result =~ "Must contain at least one uppercase letter"
      assert result =~ "First name: Can't be blank"
      assert result =~ "Last name: Must be at least 2 characters"

      # Should have 4 lines (one per field)
      lines = String.split(result, "\n")
      assert length(lines) == 4
    end
  end

  describe "get_current_user/1" do
    test "returns user when authenticated" do
      user = %User{id: 1, email: "test@example.com"}
      resolution = %{context: %{current_user: user}}

      assert {:ok, ^user} = Utils.get_current_user(resolution)
    end

    test "returns error when not authenticated" do
      resolution = %{context: %{}}

      assert {:error, "Not authenticated"} = Utils.get_current_user(resolution)
    end

    test "returns error when no context" do
      resolution = %{}

      assert {:error, "Not authenticated"} = Utils.get_current_user(resolution)
    end

    test "returns error when context is nil" do
      resolution = %{context: nil}

      assert {:error, "Not authenticated"} = Utils.get_current_user(resolution)
    end
  end

  describe "require_auth/1 macro" do
    import Utils

    test "returns user when authenticated" do
      user = %User{id: 1, email: "test@example.com"}
      resolution = %{context: %{current_user: user}}

      assert {:ok, ^user} = require_auth(resolution)
    end

    test "returns error when not authenticated" do
      resolution = %{context: %{}}

      assert {:error, "Not authenticated"} = require_auth(resolution)
    end
  end
end
