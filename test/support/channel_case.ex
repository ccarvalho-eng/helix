defmodule HelixWeb.ChannelCase do
  @moduledoc """
  This module defines the test case to be used by
  channel tests.

  Such tests rely on `Phoenix.ChannelTest` and also
  import other functionality to make it easier
  to build common data structures and query the data layer.

  Finally, if the test case interacts with the database,
  we enable the SQL sandbox, so changes done to the database
  are reverted at the end of every test. If you are using
  PostgreSQL, you can even run database tests asynchronously
  by setting `use HelixWeb.ChannelCase, async: true`, although
  this option is not recommended for other databases.
  """

  use ExUnit.CaseTemplate

  import Phoenix.ChannelTest

  alias Helix.Accounts.Guardian
  alias Helix.AccountsFixtures
  alias HelixWeb.UserSocket

  @endpoint HelixWeb.Endpoint

  using do
    quote do
      # Import conveniences for testing with channels
      import Phoenix.ChannelTest
      import HelixWeb.ChannelCase

      # The default endpoint for testing
      @endpoint HelixWeb.Endpoint
    end
  end

  setup tags do
    Helix.DataCase.setup_sandbox(tags)

    if tags[:authenticated_socket] do
      user = AccountsFixtures.user_fixture()
      {:ok, token, _claims} = Guardian.encode_and_sign(user)
      {:ok, socket} = connect(UserSocket, %{"token" => token}, connect_info: %{})
      {:ok, socket: socket, user: user, token: token}
    else
      :ok
    end
  end

  @doc """
  Helper function to create an authenticated socket for tests that need multiple sockets
  """
  def create_authenticated_socket do
    user = AccountsFixtures.user_fixture()
    {:ok, token, _claims} = Guardian.encode_and_sign(user)
    {:ok, socket} = connect(UserSocket, %{"token" => token}, connect_info: %{})
    socket
  end
end
