defmodule HelixWeb.UserSocketTest do
  use HelixWeb.ChannelCase, async: false

  import Helix.FlowsFixtures

  alias Helix.Accounts.Guardian
  alias HelixWeb.UserSocket

  describe "socket connection" do
    test "successfully connects with valid token" do
      user = Helix.AccountsFixtures.user_fixture()
      {:ok, token, _claims} = Guardian.encode_and_sign(user)

      assert {:ok, socket} = connect(UserSocket, %{"token" => token})
      assert socket.transport_pid != nil
      assert socket.assigns.user_id == user.id
    end

    test "rejects connection with empty params" do
      assert connect(UserSocket, %{}) == :error
    end

    test "rejects connection with invalid token" do
      params = %{"token" => "invalid_token"}
      assert connect(UserSocket, params) == :error
    end

    test "connects with connect_info and valid token" do
      user = Helix.AccountsFixtures.user_fixture()
      {:ok, token, _claims} = Guardian.encode_and_sign(user)
      connect_info = %{peer_data: %{address: {127, 0, 0, 1}, port: 12_345}}

      assert {:ok, socket} = connect(UserSocket, %{"token" => token}, connect_info: connect_info)
      assert socket.transport_pid != nil
    end
  end

  describe "channel routing" do
    @describetag :authenticated_socket

    setup do
      user = Helix.AccountsFixtures.user_fixture()
      {:ok, user: user}
    end

    test "routes flow channels correctly", %{socket: socket, user: user} do
      # Test that flow channels can be joined through the socket
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      # The actual channel join is tested in FlowChannelTest,
      # here we just verify the routing is set up
      assert {:ok, _reply, _socket} =
               subscribe_and_join(socket, HelixWeb.FlowChannel, "flow:#{flow_id}")
    end

    test "routes flow_management channel correctly", %{socket: socket, user: _user} do
      # Test that flow_management channel can be joined through the socket
      assert {:ok, _reply, _socket} =
               subscribe_and_join(socket, HelixWeb.FlowManagementChannel, "flow_management")
    end

    test "rejects invalid channel topics", %{socket: socket, user: _user} do
      # Test that invalid topics are rejected
      assert {:error, %{reason: _}} =
               subscribe_and_join(socket, HelixWeb.FlowChannel, "invalid:topic")

      assert {:error, %{reason: _}} =
               subscribe_and_join(socket, HelixWeb.FlowManagementChannel, "invalid_topic")
    end

    test "handles non-existent channels gracefully", %{socket: socket, user: _user} do
      # Try to join a channel that doesn't exist in routing
      # This should fail because the module doesn't exist
      assert_raise UndefinedFunctionError, fn ->
        subscribe_and_join(socket, NonExistentChannel, "some:topic")
      end
    end
  end

  describe "socket configuration" do
    @describetag :authenticated_socket

    test "socket has correct transport configuration", %{socket: socket} do
      # Verify basic socket structure (transport is a tuple in test mode)
      assert is_tuple(socket.transport)
      assert is_pid(socket.transport_pid)
      assert socket.serializer != nil
    end

    test "socket allows multiple channel subscriptions", %{socket: socket} do
      user = Helix.AccountsFixtures.user_fixture()
      flow_1 = flow_fixture(%{user_id: user.id})
      flow_id_1 = flow_1.id
      flow_2 = flow_fixture(%{user_id: user.id})
      flow_id_2 = flow_2.id

      # Join multiple flow channels
      assert {:ok, _reply1, _socket1} =
               subscribe_and_join(socket, HelixWeb.FlowChannel, "flow:#{flow_id_1}")

      # Create a new socket connection for the second channel
      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()

      assert {:ok, _reply2, _socket2} =
               subscribe_and_join(socket2, HelixWeb.FlowChannel, "flow:#{flow_id_2}")

      # Also join flow_management channel
      socket3 = HelixWeb.ChannelCase.create_authenticated_socket()

      assert {:ok, _reply3, _socket3} =
               subscribe_and_join(socket3, HelixWeb.FlowManagementChannel, "flow_management")
    end
  end

  describe "socket authentication" do
    @describetag :authenticated_socket

    test "socket connects with authentication and sets user data", %{socket: socket, user: user} do
      # UserSocket requires authentication and sets user assigns
      assert socket.assigns.user_id == user.id
      assert socket.assigns.user == user
    end

    test "socket connects with valid token and custom params" do
      user = Helix.AccountsFixtures.user_fixture()
      {:ok, token, _claims} = Guardian.encode_and_sign(user)
      params = %{"token" => token, "custom_param" => "test_value"}

      assert {:ok, socket} = connect(UserSocket, params)
      assert socket.assigns.user_id == user.id
    end
  end

  describe "error handling" do
    test "rejects connection with malformed token parameters" do
      # Test with invalid token format
      assert connect(UserSocket, %{"token" => 123}) == :error
      assert connect(UserSocket, %{"token" => nil}) == :error
    end

    test "handles connection with invalid connect_info and valid token" do
      user = Helix.AccountsFixtures.user_fixture()
      {:ok, token, _claims} = Guardian.encode_and_sign(user)
      invalid_connect_info = %{invalid: "data"}

      assert {:ok, _socket} =
               connect(UserSocket, %{"token" => token}, connect_info: invalid_connect_info)
    end
  end

  describe "integration tests" do
    @describetag :authenticated_socket

    test "full flow: connect socket, join channels, communicate", %{socket: socket, user: user} do
      # Join flow channel
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, flow_socket} =
        subscribe_and_join(socket, HelixWeb.FlowChannel, "flow:#{flow_id}")

      # Join management channel
      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()

      {:ok, _reply, mgmt_socket} =
        subscribe_and_join(socket2, HelixWeb.FlowManagementChannel, "flow_management")

      # Test communication through flow channel
      ref = push(flow_socket, "ping", %{})
      assert_reply ref, :ok, %{status: "pong"}

      # Test communication through management channel
      ref = push(mgmt_socket, "flow_deleted", %{"flow_id" => flow_id})
      assert_reply ref, :ok, %{status: "session_closed", clients_affected: _}
    end

    test "socket handles channel disconnections gracefully", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, flow_socket} =
        subscribe_and_join(socket, HelixWeb.FlowChannel, "flow:#{flow_id}")

      # Enable process trapping to handle the EXIT message
      Process.flag(:trap_exit, true)

      # Close the channel
      leave(flow_socket)

      # Handle the expected EXIT message
      assert_receive {:EXIT, _pid, {:shutdown, :left}}, 1000

      # Socket should still be functional for new channel joins
      {:ok, _reply, _mgmt_socket} =
        subscribe_and_join(socket, HelixWeb.FlowManagementChannel, "flow_management")
    end
  end

  describe "channel topic patterns" do
    @describetag :authenticated_socket

    test "flow channel accepts various flow ID formats" do
      # Test only valid flow ID formats based on the FlowChannel validation
      user = Helix.AccountsFixtures.user_fixture()

      # Create flows with real IDs
      flow_1 = flow_fixture(%{user_id: user.id})
      flow_2 = flow_fixture(%{user_id: user.id})
      flow_3 = flow_fixture(%{user_id: user.id})

      valid_flow_ids = [
        flow_1.id,
        flow_2.id,
        flow_3.id
      ]

      for flow_id <- valid_flow_ids do
        socket_new = HelixWeb.ChannelCase.create_authenticated_socket()

        assert {:ok, _reply, _socket} =
                 subscribe_and_join(socket_new, HelixWeb.FlowChannel, "flow:#{flow_id}")
      end
    end

    test "flow_management channel only accepts exact topic match", %{socket: socket, user: _user} do
      # Should accept exact match
      assert {:ok, _reply, _socket} =
               subscribe_and_join(socket, HelixWeb.FlowManagementChannel, "flow_management")

      # Should reject variations
      invalid_topics = [
        "flow_management:extra",
        "flow_management_admin",
        "flowmanagement",
        "flow_mgmt"
      ]

      for invalid_topic <- invalid_topics do
        socket_new = HelixWeb.ChannelCase.create_authenticated_socket()

        assert {:error, %{reason: _}} =
                 subscribe_and_join(socket_new, HelixWeb.FlowManagementChannel, invalid_topic)
      end
    end
  end
end
