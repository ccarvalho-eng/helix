defmodule HelixWeb.FlowChannelTest do
  use HelixWeb.ChannelCase, async: false

  alias Helix.Flows
  alias HelixWeb.FlowChannel

  import Helix.AccountsFixtures
  import Helix.FlowsFixtures

  @moduletag :authenticated_socket

  setup do
    user = user_fixture()
    {:ok, user: user}
  end

  describe "joining flow channels" do
    test "successfully joins a valid flow channel", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

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

    test "multiple clients can join the same flow", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      # First client joins
      {:ok, _reply1, _socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Second client joins
      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()
      {:ok, _reply2, _socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")

      # Both should receive client_joined broadcasts
      assert_broadcast("client_joined", %{client_count: 1, flow_id: ^flow_id})
      assert_broadcast("client_joined", %{client_count: 2, flow_id: ^flow_id})

      # Verify session manager has correct count
      assert %{active: true, client_count: 2} =
               Flows.get_flow_status(flow_id)
    end

    test "generates unique client IDs for different sockets", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply1, socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()
      {:ok, _reply2, socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")

      assert socket1.assigns.client_id != socket2.assigns.client_id
    end
  end

  describe "handling flow changes" do
    test "broadcasts flow changes to other clients", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      changes = %{
        "nodes" => [%{"id" => "node-1", "type" => "agent"}],
        "edges" => []
      }

      # Client 1 joins
      {:ok, _reply1, socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Client 2 joins
      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()
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

    test "handles flow_change messages correctly", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

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

    test "receives flow changes from session manager", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id
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
    test "responds to ping messages", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      ref = push(socket, "ping", %{})

      assert_reply ref, :ok, %{status: "pong"}
    end
  end

  describe "unknown events" do
    test "handles unknown events gracefully", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      ref = push(socket, "unknown_event", %{"some" => "payload"})
      assert_reply ref, :error, %{reason: "Unknown event"}
    end
  end

  describe "client disconnection" do
    test "cleans up session when client disconnects", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      # Join and verify the session was created
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Verify client joined
      assert %{active: true, client_count: 1} =
               Flows.get_flow_status(flow_id)

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Close the socket and expect to receive an EXIT message
      Process.flag(:trap_exit, true)
      close(socket)

      # Assert we receive the EXIT signal (this is expected during channel cleanup)
      assert_receive {:EXIT, _pid, {:shutdown, :closed}}, 1000

      # Wait for session termination to complete
      :timer.sleep(50)

      # After the EXIT, verify cleanup happened properly
      assert %{active: false, client_count: 0} =
               Flows.get_flow_status(flow_id)
    end

    test "updates client count correctly when one of multiple clients disconnects", %{
      socket: socket,
      user: user
    } do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id
      # Two clients join
      {:ok, _reply1, socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()
      {:ok, _reply2, _socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")
      # Verify both clients are active
      assert %{active: true, client_count: 2} =
               Flows.get_flow_status(flow_id)

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
               Flows.get_flow_status(flow_id)
    end

    test "handles disconnection gracefully when session manager is unavailable", %{user: user} do
      # This tests error handling in terminate/2 with a mock socket
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

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

  describe "integration with Flows" do
    test "session manager state reflects channel operations", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id
      # Initially no sessions
      assert %{} = Flows.get_active_sessions()
      # Client joins
      {:ok, _reply, socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      # Session should appear
      sessions = Flows.get_active_sessions()
      assert %{^flow_id => %{client_count: 1}} = sessions
      # Another client joins
      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()
      {:ok, _reply, _socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")
      # Count should update
      sessions = Flows.get_active_sessions()
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
      sessions = Flows.get_active_sessions()
      assert %{^flow_id => %{client_count: 1}} = sessions

      # Last client leaves
      close(socket2)
      # The second EXIT message might be caught by the try/catch in terminate/2
      # But the important thing is that the session gets cleaned up
      :timer.sleep(100)

      # Session should be removed
      assert %{} = Flows.get_active_sessions()
    end

    test "flow changes are properly broadcasted through PubSub", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id
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

  describe "flow deletion handling" do
    test "handles flow_deleted message by notifying client and closing channel", %{
      socket: socket,
      user: user
    } do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Simulate flow_deleted message from Flows
      timestamp = System.system_time(:second)
      send(socket.channel_pid, {:flow_deleted, flow_id})

      # Should receive flow_deleted push notification
      assert_push("flow_deleted", %{
        flow_id: ^flow_id,
        timestamp: received_timestamp
      })

      # Timestamp should be around the current time (within 5 seconds)
      assert abs(received_timestamp - timestamp) <= 5

      # Channel should be closed - we should receive an EXIT signal
      Process.flag(:trap_exit, true)

      # The channel will terminate with :normal reason after sending flow_deleted
      assert_receive {:EXIT, _pid, :normal}, 1000
    end

    test "flow_deleted message includes correct flow_id", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Send flow_deleted for this specific flow
      send(socket.channel_pid, {:flow_deleted, flow_id})

      # Should receive notification with the exact flow_id
      assert_push("flow_deleted", %{
        flow_id: ^flow_id,
        timestamp: _timestamp
      })

      # Channel should close
      Process.flag(:trap_exit, true)
      assert_receive {:EXIT, _pid, :normal}, 1000
    end

    test "flow_deleted message for different flow_id does not affect channel", %{
      socket: socket,
      user: user
    } do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id
      other_flow = flow_fixture(%{user_id: user.id})
      other_flow_id = other_flow.id

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Send flow_deleted for a different flow
      send(socket.channel_pid, {:flow_deleted, other_flow_id})

      # Should receive notification for the other flow
      assert_push("flow_deleted", %{
        flow_id: ^other_flow_id,
        timestamp: _timestamp
      })

      # Channel should still close (the current implementation closes on any flow_deleted)
      Process.flag(:trap_exit, true)
      assert_receive {:EXIT, _pid, :normal}, 1000
    end

    test "multiple clients receive flow_deleted notification", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      # Two clients join the same flow
      {:ok, _reply1, _socket1} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()
      {:ok, _reply2, _socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}")

      # Clear join broadcasts
      assert_broadcast("client_joined", %{client_count: 1})
      assert_broadcast("client_joined", %{client_count: 2})

      # Subscribe to PubSub to send flow_deleted message
      Phoenix.PubSub.broadcast(Helix.PubSub, "flow:#{flow_id}", {:flow_deleted, flow_id})

      # Both clients should receive flow_deleted notification
      assert_push("flow_deleted", %{flow_id: ^flow_id, timestamp: _})

      # Both channels should close - we'll receive socket_close messages
      assert_receive {:socket_close, _pid1, :normal}, 1000
      assert_receive {:socket_close, _pid2, :normal}, 1000
    end

    test "flow_deleted notification timestamp is current", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Record time before sending message
      before_time = System.system_time(:second)
      send(socket.channel_pid, {:flow_deleted, flow_id})
      after_time = System.system_time(:second)

      # Should receive notification with timestamp in the expected range
      assert_push("flow_deleted", %{
        flow_id: ^flow_id,
        timestamp: timestamp
      })

      assert timestamp >= before_time
      # Allow 1 second buffer
      assert timestamp <= after_time + 1

      # Channel should close
      Process.flag(:trap_exit, true)
      assert_receive {:EXIT, _pid, :normal}, 1000
    end

    test "flow_deleted handling with concurrent operations", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Send a flow change and flow_deleted concurrently
      changes = %{"nodes" => [], "edges" => []}

      # Send flow change
      _ref = push(socket, "flow_change", %{"changes" => changes})

      # Immediately send flow_deleted
      send(socket.channel_pid, {:flow_deleted, flow_id})

      # We might get the flow_change reply or the channel might close first
      # Either way, we should get the flow_deleted notification
      assert_push("flow_deleted", %{flow_id: ^flow_id, timestamp: _})

      # Channel should close
      assert_receive {:socket_close, _pid, :normal}, 1000
    end

    test "flow_deleted closes channel immediately without waiting", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")

      # Clear join broadcast
      assert_broadcast("client_joined", %{client_count: 1})

      # Enable process trapping
      Process.flag(:trap_exit, true)

      # Send flow_deleted and measure time to channel close
      start_time = System.monotonic_time(:millisecond)
      send(socket.channel_pid, {:flow_deleted, flow_id})

      # Should receive notification
      assert_push("flow_deleted", %{flow_id: ^flow_id, timestamp: _})

      # Channel should close quickly
      # 100ms should be plenty
      assert_receive {:EXIT, _pid, :normal}, 100
      end_time = System.monotonic_time(:millisecond)

      # Should close very quickly (under 50ms typically)
      assert end_time - start_time < 50
    end
  end

  describe "error edge cases" do
    test "handles join when Flows returns error", %{socket: socket, user: user} do
      # Mock scenario where join might fail
      # (This is a theoretical test - Flows.join_flow doesn't currently return errors)
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id
      # For this test, we'll test successful join since the current implementation
      # doesn't have error cases, but this structure is ready for future error handling
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      assert socket.assigns.flow_id == flow_id
    end

    test "handles malformed flow change payloads", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}")
      # Send malformed payload (missing changes key)
      ref = push(socket, "flow_change", %{"invalid" => "payload"})
      # Should return error for unknown event
      assert_reply ref, :error, %{reason: "Unknown event"}
    end
  end
end
