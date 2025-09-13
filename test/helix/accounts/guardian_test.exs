defmodule Helix.Accounts.GuardianTest do
  use Helix.DataCase, async: true

  alias Helix.Accounts.Guardian
  import Helix.AccountsFixtures

  describe "subject_for_token/2" do
    test "returns {:ok, user_id} for a user" do
      user = user_fixture()
      assert {:ok, user_id} = Guardian.subject_for_token(user, %{})
      assert user_id == user.id
    end

    test "returns {:error, :reason_for_error} for invalid resource" do
      assert {:error, :reason_for_error} = Guardian.subject_for_token("invalid", %{})
    end
  end

  describe "resource_from_claims/1" do
    test "returns {:ok, user} for valid claims with existing user" do
      user = user_fixture()
      claims = %{"sub" => user.id}

      assert {:ok, returned_user} = Guardian.resource_from_claims(claims)
      assert returned_user.id == user.id
    end

    test "returns {:error, :resource_not_found} for non-existent user" do
      claims = %{"sub" => Ecto.UUID.generate()}

      assert {:error, :resource_not_found} = Guardian.resource_from_claims(claims)
    end

    test "returns {:error, :reason_for_error} for invalid claims" do
      assert {:error, :reason_for_error} = Guardian.resource_from_claims(%{})
    end
  end

  describe "authenticate/2" do
    test "returns {:ok, user, token} for valid credentials" do
      password = "password123A"
      user = user_fixture(password: password)

      assert {:ok, auth_user, token} = Guardian.authenticate(user.email, password)
      assert auth_user.id == user.id
      assert is_binary(token)
    end

    test "returns {:error, :invalid_credentials} for invalid credentials" do
      user = user_fixture()

      assert {:error, :invalid_credentials} = Guardian.authenticate(user.email, "wrongpassword")
    end

    test "returns {:error, :invalid_credentials} for non-existent user" do
      assert {:error, :invalid_credentials} =
               Guardian.authenticate("nonexistent@example.com", "password")
    end
  end

  describe "encode_and_sign/1" do
    test "creates a valid token for a user" do
      user = user_fixture()

      assert {:ok, token, claims} = Guardian.encode_and_sign(user)
      assert is_binary(token)
      assert claims["sub"] == user.id
    end
  end

  describe "decode_and_verify/1" do
    test "returns claims from valid token" do
      user = user_fixture()
      {:ok, token, _claims} = Guardian.encode_and_sign(user)

      assert {:ok, claims} = Guardian.decode_and_verify(token)
      assert claims["sub"] == user.id
    end

    test "returns error for invalid token" do
      assert {:error, _reason} = Guardian.decode_and_verify("invalid_token")
    end
  end
end
