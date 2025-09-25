defmodule Helix.FlowsTest do
  use ExUnit.Case, async: false

  alias Helix.Flows
  import Helix.FlowTestHelper

  setup do
    # Ensure flow services are available
    ensure_flow_services_available()
    :ok
  end

  describe "join_flow/2" do
    test "allows clients to join a flow" do
      flow_id = "test-flow"
      client_id = "client-1"

      assert {:ok, 1, _id} = Flows.join_flow(flow_id, client_id)
    end

    test "tracks multiple clients in the same flow" do
      flow_id = "multi-client-flow-#{System.unique_integer([:positive])}"

      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id} = Flows.join_flow(flow_id, "client-2")
      assert {:ok, 3, _id} = Flows.join_flow(flow_id, "client-3")
    end

    test "handles empty client IDs by generating anonymous ones" do
      flow_id = "anonymous-flow-#{System.unique_integer([:positive])}"

      assert {:ok, 1, _generated_id1} = Flows.join_flow(flow_id, "")
      assert {:ok, 2, _generated_id2} = Flows.join_flow(flow_id, nil)
    end

    test "handles duplicate client joins idempotently" do
      flow_id = "duplicate-flow"
      client_id = "duplicate-client"

      assert {:ok, 1, _id} = Flows.join_flow(flow_id, client_id)
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, client_id)
    end
  end

  describe "leave_flow/2" do
    test "allows clients to leave a flow" do
      flow_id = "leave-test-flow"
      client_id = "leaving-client"

      # Join first
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, client_id)

      # Then leave
      assert {:ok, 0} = Flows.leave_flow(flow_id, client_id)
    end

    test "tracks remaining client count after leaving" do
      flow_id = "multi-leave-flow"

      # Join multiple clients
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id} = Flows.join_flow(flow_id, "client-2")
      assert {:ok, 3, _id} = Flows.join_flow(flow_id, "client-3")

      # Leave one client
      assert {:ok, 2} = Flows.leave_flow(flow_id, "client-1")

      # Leave another client
      assert {:ok, 1} = Flows.leave_flow(flow_id, "client-2")

      # Leave last client
      assert {:ok, 0} = Flows.leave_flow(flow_id, "client-3")
    end

    test "handles leaving non-existent flow gracefully" do
      assert {:ok, 0} = Flows.leave_flow("non-existent", "client-1")
    end

    test "handles leaving with non-existent client gracefully" do
      flow_id = "exists-flow"

      # Join one client
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "real-client")

      # Try to leave with different client
      assert {:ok, 1} = Flows.leave_flow(flow_id, "fake-client")
    end
  end

  describe "get_flow_status/1" do
    test "returns inactive status for non-existent flows" do
      status = Flows.get_flow_status("non-existent-flow")
      assert %{active: false, client_count: 0} = status
    end

    test "returns active status for flows with clients" do
      flow_id = "status-test-flow-#{System.unique_integer([:positive])}"

      # Join clients
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id} = Flows.join_flow(flow_id, "client-2")

      status = Flows.get_flow_status(flow_id)
      assert %{active: true, client_count: 2, last_activity: last_activity} = status
      assert is_integer(last_activity)
    end
  end

  describe "broadcast_flow_change/2" do
    test "broadcasts to active flow session" do
      flow_id = "broadcast-test-flow-#{System.unique_integer([:positive])}"
      changes = %{nodes: [], edges: []}

      # Join a client first
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")

      # Subscribe to PubSub for this flow
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      # Broadcast changes
      Flows.broadcast_flow_change(flow_id, changes)

      # Should receive the broadcast
      assert_receive {:flow_change, ^changes}, 1000
    end

    test "does not broadcast to inactive flow session" do
      flow_id = "inactive-broadcast-flow"
      changes = %{nodes: [], edges: []}

      # Subscribe to PubSub for this flow
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      # Broadcast without joining - should not crash but no message
      Flows.broadcast_flow_change(flow_id, changes)

      # Should not receive any message
      refute_receive {:flow_change, ^changes}, 100
    end

    test "updates last_activity when broadcasting" do
      flow_id = "activity-test-flow"
      changes = %{test: "data"}

      # Join client and get initial status
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")
      initial_status = Flows.get_flow_status(flow_id)

      # Wait a moment then broadcast
      :timer.sleep(10)
      Flows.broadcast_flow_change(flow_id, changes)

      # Status should show updated activity
      updated_status = Flows.get_flow_status(flow_id)
      assert updated_status.last_activity >= initial_status.last_activity
    end
  end

  describe "get_active_sessions/0" do
    test "returns empty map when no sessions" do
      assert %{} = Flows.get_active_sessions()
    end

    test "returns session information for active flows" do
      flow_id = "active-session-flow"

      # Join clients
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id} = Flows.join_flow(flow_id, "client-2")

      sessions = Flows.get_active_sessions()
      assert %{^flow_id => session_info} = sessions
      assert %{client_count: 2, last_activity: _} = session_info
    end
  end

  describe "force_close_flow_session/1" do
    test "closes session and returns client count" do
      flow_id = "force-close-flow"

      # Join clients
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id} = Flows.join_flow(flow_id, "client-2")

      # Force close
      assert {:ok, 2} = Flows.force_close_flow_session(flow_id)

      # Wait for termination to complete
      :timer.sleep(50)

      # Session should be inactive now
      status = Flows.get_flow_status(flow_id)
      assert %{active: false, client_count: 0} = status
    end

    test "handles closing non-existent session" do
      assert {:ok, 0} = Flows.force_close_flow_session("non-existent")
    end

    test "broadcasts flow_deleted message" do
      flow_id = "delete-broadcast-flow"

      # Join client and subscribe to PubSub
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      # Force close
      assert {:ok, 1} = Flows.force_close_flow_session(flow_id)

      # Should receive deletion broadcast
      assert_receive {:flow_deleted, ^flow_id}, 1000
    end
  end

  describe "client ID handling edge cases" do
    test "handles whitespace-only client IDs" do
      flow_id = "whitespace-client-flow"

      # Client ID with only spaces should generate anonymous ID
      assert {:ok, 1, _generated_id1} = Flows.join_flow(flow_id, "   ")
      assert {:ok, 2, _generated_id2} = Flows.join_flow(flow_id, "\t\n")

      # Should have 2 different anonymous clients
      status = Flows.get_flow_status(flow_id)
      assert %{active: true, client_count: 2} = status
    end

    test "handles non-string client IDs" do
      flow_id = "non-string-client-flow"

      # Various non-string client IDs should generate anonymous IDs
      assert {:ok, 1, _generated_id1} = Flows.join_flow(flow_id, 123)
      assert {:ok, 2, _generated_id2} = Flows.join_flow(flow_id, :atom)
      assert {:ok, 3, _generated_id3} = Flows.join_flow(flow_id, [])
      assert {:ok, 4, _generated_id4} = Flows.join_flow(flow_id, %{})

      status = Flows.get_flow_status(flow_id)
      assert %{active: true, client_count: 4} = status
    end

    test "trims valid string client IDs with whitespace" do
      flow_id = "whitespace-preserved-flow"
      client_id = "  valid-client  "

      # Should trim whitespace from client ID
      assert {:ok, 1, "valid-client"} = Flows.join_flow(flow_id, client_id)
      # Same client should have the same trimmed ID
      assert {:ok, 1, "valid-client"} = Flows.join_flow(flow_id, client_id)

      status = Flows.get_flow_status(flow_id)
      assert %{active: true, client_count: 1} = status
    end
  end

  describe "session cleanup behavior" do
    test "sessions auto-terminate when no clients remain" do
      flow_id = "cleanup-test-flow-#{System.unique_integer([:positive])}"

      # Join a client
      assert {:ok, 1, _id} = Flows.join_flow(flow_id, "client-1")

      # Verify session exists
      assert %{active: true, client_count: 1} = Flows.get_flow_status(flow_id)

      # Leave the client - session should terminate
      assert {:ok, 0} = Flows.leave_flow(flow_id, "client-1")

      # Wait for termination to complete
      :timer.sleep(50)

      # Session should be inactive now
      assert %{active: false, client_count: 0} = Flows.get_flow_status(flow_id)
    end
  end
end
