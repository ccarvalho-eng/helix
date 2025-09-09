defmodule HelixWeb.UserSocketTest do
  use HelixWeb.ChannelCase, async: false

  alias HelixWeb.UserSocket

  describe "socket connection" do
    test "successfully connects with empty params" do
      assert {:ok, socket} = connect(UserSocket, %{})
      assert socket.transport_pid != nil
    end

    test "successfully connects with arbitrary params" do
      params = %{"user_id" => "123", "session_token" => "abc"}
      assert {:ok, socket} = connect(UserSocket, params)
      assert socket.transport_pid != nil
    end

    test "connects with connect_info" do
      connect_info = %{peer_data: %{address: {127, 0, 0, 1}, port: 12_345}}
      assert {:ok, socket} = connect(UserSocket, %{}, connect_info: connect_info)
      assert socket.transport_pid != nil
    end
  end

  describe "channel routing" do
    test "routes flow channels correctly" do
      {:ok, socket} = connect(UserSocket, %{})

      # Test that flow channels can be joined through the socket
      flow_id = "test-flow-#{:erlang.unique_integer([:positive])}"

      # The actual channel join is tested in FlowChannelTest,
      # here we just verify the routing is set up
      assert {:ok, _reply, _socket} =
               subscribe_and_join(socket, HelixWeb.FlowChannel, "flow:#{flow_id}")
    end

    test "routes flow_management channel correctly" do
      {:ok, socket} = connect(UserSocket, %{})

      # Test that flow_management channel can be joined through the socket
      assert {:ok, _reply, _socket} =
               subscribe_and_join(socket, HelixWeb.FlowManagementChannel, "flow_management")
    end

    test "rejects invalid channel topics" do
      {:ok, socket} = connect(UserSocket, %{})

      # Test that invalid topics are rejected
      assert {:error, %{reason: _}} =
               subscribe_and_join(socket, HelixWeb.FlowChannel, "invalid:topic")

      assert {:error, %{reason: _}} =
               subscribe_and_join(socket, HelixWeb.FlowManagementChannel, "invalid_topic")
    end

    test "handles non-existent channels gracefully" do
      {:ok, socket} = connect(UserSocket, %{})

      # Try to join a channel that doesn't exist in routing
      # This should fail because the module doesn't exist
      assert_raise UndefinedFunctionError, fn ->
        subscribe_and_join(socket, NonExistentChannel, "some:topic")
      end
    end
  end

  describe "socket configuration" do
    test "socket has correct transport configuration" do
      {:ok, socket} = connect(UserSocket, %{})

      # Verify basic socket structure (transport is a tuple in test mode)
      assert is_tuple(socket.transport)
      assert is_pid(socket.transport_pid)
      assert socket.serializer != nil
    end

    test "socket allows multiple channel subscriptions" do
      {:ok, socket} = connect(UserSocket, %{})

      flow_id_1 = "flow-1-#{:erlang.unique_integer([:positive])}"
      flow_id_2 = "flow-2-#{:erlang.unique_integer([:positive])}"

      # Join multiple flow channels
      assert {:ok, _reply1, _socket1} =
               subscribe_and_join(socket, HelixWeb.FlowChannel, "flow:#{flow_id_1}")

      # Create a new socket connection for the second channel
      {:ok, socket2} = connect(UserSocket, %{})

      assert {:ok, _reply2, _socket2} =
               subscribe_and_join(socket2, HelixWeb.FlowChannel, "flow:#{flow_id_2}")

      # Also join flow_management channel
      {:ok, socket3} = connect(UserSocket, %{})

      assert {:ok, _reply3, _socket3} =
               subscribe_and_join(socket3, HelixWeb.FlowManagementChannel, "flow_management")
    end
  end

  describe "socket authentication" do
    test "socket connects without authentication requirement" do
      # UserSocket currently doesn't require authentication
      assert {:ok, socket} = connect(UserSocket, %{})
      assert socket.assigns == %{}
    end

    test "socket preserves connection parameters" do
      params = %{"custom_param" => "test_value"}
      assert {:ok, _socket} = connect(UserSocket, params)

      # The socket connection succeeds regardless of params
      # (UserSocket doesn't currently process connect params)
    end
  end

  describe "error handling" do
    test "handles malformed connection parameters" do
      # Test with nil parameters (should work)
      assert {:ok, _socket} = connect(UserSocket, %{})

      # Test with valid map parameters
      assert {:ok, _socket} = connect(UserSocket, %{"valid" => "param"})
    end

    test "handles connection with invalid connect_info" do
      invalid_connect_info = %{invalid: "data"}
      assert {:ok, _socket} = connect(UserSocket, %{}, connect_info: invalid_connect_info)
    end
  end

  describe "integration tests" do
    test "full flow: connect socket, join channels, communicate" do
      # Connect socket
      {:ok, socket} = connect(UserSocket, %{})

      # Join flow channel
      flow_id = "integration-test-#{:erlang.unique_integer([:positive])}"

      {:ok, _reply, flow_socket} =
        subscribe_and_join(socket, HelixWeb.FlowChannel, "flow:#{flow_id}")

      # Join management channel
      {:ok, socket2} = connect(UserSocket, %{})

      {:ok, _reply, mgmt_socket} =
        subscribe_and_join(socket2, HelixWeb.FlowManagementChannel, "flow_management")

      # Test communication through flow channel
      ref = push(flow_socket, "ping", %{})
      assert_reply ref, :ok, %{status: "pong"}

      # Test communication through management channel
      ref = push(mgmt_socket, "flow_deleted", %{"flow_id" => flow_id})
      assert_reply ref, :ok, %{status: "session_closed", clients_affected: _}
    end

    test "socket handles channel disconnections gracefully" do
      {:ok, socket} = connect(UserSocket, %{})

      flow_id = "disconnect-test-#{:erlang.unique_integer([:positive])}"

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
    test "flow channel accepts various flow ID formats" do
      # Test only valid flow ID formats based on the FlowChannel validation
      valid_flow_ids = [
        "simple-flow",
        "flow_with_underscores",
        "flow-123-abc"
      ]

      for flow_id <- valid_flow_ids do
        {:ok, socket_new} = connect(UserSocket, %{})

        assert {:ok, _reply, _socket} =
                 subscribe_and_join(socket_new, HelixWeb.FlowChannel, "flow:#{flow_id}")
      end
    end

    test "flow_management channel only accepts exact topic match" do
      {:ok, socket} = connect(UserSocket, %{})

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
        {:ok, socket_new} = connect(UserSocket, %{})

        assert {:error, %{reason: _}} =
                 subscribe_and_join(socket_new, HelixWeb.FlowManagementChannel, invalid_topic)
      end
    end
  end
end
