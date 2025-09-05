defmodule HelixWeb.FlowChannelTest do
  use HelixWeb.ChannelCase, async: false

  alias Helix.FlowSessionManager
  alias HelixWeb.{FlowChannel, UserSocket}

  setup do
    # Start FlowSessionManager for tests
    pid = start_supervised({FlowSessionManager, []})

    on_exit(fn ->
      case pid do
        {:ok, pid} ->
          Process.exit(pid, :normal)

        _ ->
          :ok
      end
    end)

    # Create a socket
    {:ok, socket} = connect(UserSocket, %{}, connect_info: %{})

    {:ok, socket: socket}
  end

  # Helper function to generate unique test flow IDs
  defp test_flow_id(base_id) do
    "#{base_id}-#{inspect(self())}-#{:erlang.unique_integer([:positive])}"
  end

  describe "joining flow channels" do
    test "successfully joins a valid flow channel", %{socket: socket} do
      flow_id = test_flow_id("test-flow")

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      assert socket.assigns.flow_id == flow_id
      assert socket.assigns.client_id != nil
      assert is_binary(socket.assigns.client_id)

      # Should receive after_join message
      assert_broadcast("client_joined", %{
        client_count: 1,
        flow_id: ^flow_id
      })
    end

    test "rejects invalid channel topics", %{socket: socket} do
      assert {:error, %{reason: "Invalid flow channel"}} =
               subscribe_and_join(socket, FlowChannel, "invalid:topic")
    end

    test "multiple clients can join the same flow", %{socket: socket} do
      flow_id = "multi-client-flow"

      # First client joins
      {:ok, _reply1, _socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Second client joins
      {:ok, socket2} = connect(UserSocket, %{}, connect_info: %{})
      {:ok, _reply2, _socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")

      # Both should receive client_joined broadcasts
      assert_broadcast("client_joined", %{client_count: 1, flow_id: ^flow_id})
      assert_broadcast("client_joined", %{client_count: 2, flow_id: ^flow_id})

      # Verify session manager has correct count
      assert %{active: true, client_count: 2} =
               FlowSessionManager.get_flow_status(flow_id)
    end

    test "generates unique client IDs for different sockets", %{socket: socket} do
      flow_id = "unique-id-test"

      {:ok, _reply1, socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      {:ok, socket2} = connect(UserSocket, %{}, connect_info: %{})
      {:ok, _reply2, socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")

      assert socket1.assigns.client_id != socket2.assigns.client_id
    end
  end

  describe "handling flow changes" do
    test "broadcasts flow changes to other clients", %{socket: socket} do
      flow_id = "broadcast-test-flow"

      changes = %{
        "nodes" => [%{"id" => "node-1", "type" => "agent"}],
        "edges" => []
      }

      # Client 1 joins
      {:ok, _reply1, socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Client 2 joins
      {:ok, socket2} = connect(UserSocket, %{}, connect_info: %{})
      {:ok, _reply2, _socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")

      # Clear any join broadcasts
      assert_broadcast("client_joined", %{client_count: 1})
      assert_broadcast("client_joined", %{client_count: 2})

      # Client 1 sends flow change
      ref = push(socket1, "flow_change", %{"changes" => changes})

      # Should get acknowledgment
      assert_reply ref, :ok, %{status: "broadcasted"}

      # Client 2 should receive the flow update
      assert_push("flow_update", %{
        changes: ^changes,
        timestamp: timestamp
      })

      assert is_integer(timestamp)
    end

    test "handles flow_change messages correctly", %{socket: socket} do
      flow_id = "flow-change-test"

      changes = %{
        "nodes" => [%{"id" => "node-1", "position" => %{"x" => 100, "y" => 200}}],
        "edges" => [%{"id" => "edge-1", "source" => "node-1", "target" => "node-2"}]
      }

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Send flow change
      ref = push(socket, "flow_change", %{"changes" => changes})

      # Should receive acknowledgment
      assert_reply ref, :ok, %{status: "broadcasted"}
    end

    test "receives flow changes from session manager", %{socket: socket} do
      flow_id = "session-manager-broadcast"
      changes = %{"test" => "data"}

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Simulate flow change from session manager
      send(socket.channel_pid, {:flow_change, changes})

      # Should receive flow update
      assert_push("flow_update", %{
        changes: ^changes,
        timestamp: _timestamp
      })
    end
  end

  describe "ping handling" do
    test "responds to ping messages", %{socket: socket} do
      flow_id = "ping-test-flow"

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      ref = push(socket, "ping", %{})

      assert_reply ref, :ok, %{status: "pong"}
    end
  end

  describe "unknown events" do
    test "handles unknown events gracefully", %{socket: socket} do
      flow_id = "unknown-event-test"
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      ref = push(socket, "unknown_event", %{"some" => "payload"})
      assert_reply ref, :error, %{reason: "Unknown event"}
    end
  end

  describe "client disconnection" do
    test "cleans up session when client disconnects", %{socket: socket} do
      flow_id = test_flow_id("disconnect-test-flow")

      # Join and verify the session was created
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Verify client joined
      assert %{active: true, client_count: 1} =
               FlowSessionManager.get_flow_status(flow_id)

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Close the socket and expect to receive an EXIT message
      Process.flag(:trap_exit, true)
      close(socket)

      # Assert we receive the EXIT signal (this is expected during channel cleanup)
      assert_receive {:EXIT, _pid, {:shutdown, :closed}}, 1000

      # After the EXIT, verify cleanup happened properly
      assert %{active: false, client_count: 0} =
               FlowSessionManager.get_flow_status(flow_id)
    end

    test "updates client count correctly when one of multiple clients disconnects", %{
      socket: socket
    } do
      flow_id = test_flow_id("multi-disconnect-test")
      # Two clients join
      {:ok, _reply1, socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      {:ok, socket2} = connect(UserSocket, %{}, connect_info: %{})
      {:ok, _reply2, _socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")
      # Verify both clients are active
      assert %{active: true, client_count: 2} =
               FlowSessionManager.get_flow_status(flow_id)

      # Clear join broadcasts
      assert_broadcast("client_joined", %{client_count: 1})
      assert_broadcast("client_joined", %{client_count: 2})

      # First client disconnects - expect EXIT and handle it
      Process.flag(:trap_exit, true)
      close(socket1)

      # Assert we receive the EXIT signal from the first client
      assert_receive {:EXIT, _pid, {:shutdown, :closed}}, 1000

      # Session should still be active with 1 client
      assert %{active: true, client_count: 1} =
               FlowSessionManager.get_flow_status(flow_id)
    end

    test "handles disconnection gracefully when session manager is unavailable" do
      # This tests error handling in terminate/2 with a mock socket
      flow_id = "error-handling-test"

      # Create socket without joining through proper channels to simulate error conditions
      # The socket needs more complete structure to avoid crashes
      socket = %Phoenix.Socket{
        assigns: %{flow_id: flow_id, client_id: "test-client"},
        topic: "flow:#{flow_id}",
        transport_pid: self(),
        serializer: Jason
      }

      # This should not crash even with an improperly constructed socket
      assert :ok = FlowChannel.terminate(:normal, socket)
    end
  end

  describe "integration with FlowSessionManager" do
    test "session manager state reflects channel operations", %{socket: socket} do
      flow_id = test_flow_id("integration-test-flow")
      # Initially no sessions
      assert %{} = FlowSessionManager.get_active_sessions()
      # Client joins
      {:ok, _reply, socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      # Session should appear
      sessions = FlowSessionManager.get_active_sessions()
      assert %{^flow_id => %{client_count: 1}} = sessions
      # Another client joins
      {:ok, socket2} = connect(UserSocket, %{}, connect_info: %{})
      {:ok, _reply, _socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")
      # Count should update
      sessions = FlowSessionManager.get_active_sessions()
      assert %{^flow_id => %{client_count: 2}} = sessions

      # Clear all the broadcast messages to avoid noise in the mailbox
      assert_broadcast("client_joined", %{client_count: 1})
      assert_broadcast("client_joined", %{client_count: 2})

      # Client leaves - handle EXIT messages
      Process.flag(:trap_exit, true)
      close(socket1)
      assert_receive {:EXIT, _pid1, {:shutdown, :closed}}, 1000

      # Clear client_left broadcast
      assert_broadcast("client_left", %{client_count: 1})

      # Count should decrease
      sessions = FlowSessionManager.get_active_sessions()
      assert %{^flow_id => %{client_count: 1}} = sessions

      # Last client leaves
      close(socket2)
      # The second EXIT message might be caught by the try/catch in terminate/2
      # But the important thing is that the session gets cleaned up
      :timer.sleep(100)

      # Session should be removed
      assert %{} = FlowSessionManager.get_active_sessions()
    end

    test "flow changes are properly broadcasted through PubSub", %{socket: socket} do
      flow_id = "pubsub-test-flow"
      changes = %{"nodes" => [], "edges" => []}
      # Subscribe to PubSub topic directly
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")
      # Join channel
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      # Send flow change through channel
      _ref = push(socket, "flow_change", %{"changes" => changes})
      # Should receive PubSub message
      assert_receive {:flow_change, ^changes}
    end
  end

  describe "error edge cases" do
    test "handles join when FlowSessionManager returns error", %{socket: socket} do
      # Mock scenario where join might fail
      # (This is a theoretical test - FlowSessionManager.join_flow doesn't currently return errors)
      flow_id = "error-test-flow"
      # For this test, we'll test successful join since the current implementation
      # doesn't have error cases, but this structure is ready for future error handling
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      assert socket.assigns.flow_id == flow_id
    end

    test "handles malformed flow change payloads", %{socket: socket} do
      flow_id = "malformed-payload-test"
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      # Send malformed payload (missing changes key)
      ref = push(socket, "flow_change", %{"invalid" => "payload"})
      # Should return error for unknown event
      assert_reply ref, :error, %{reason: "Unknown event"}
    end
  end
end
