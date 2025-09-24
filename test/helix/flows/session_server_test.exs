defmodule Helix.Flows.SessionServerTest do
  use ExUnit.Case, async: false

  alias Helix.Flows.SessionServer

  setup do
    # Start Flows context which includes SessionServer
    case start_supervised({Helix.Flows, []}) do
      {:ok, _pid} -> :ok
      {:error, {:already_started, _pid}} -> :ok
    end

    # Wait a moment for the system to be ready
    :timer.sleep(10)

    # Get the SessionServer PID for tests that need it
    server_pid = Process.whereis(SessionServer)
    %{server_pid: server_pid}
  end

  describe "SessionServer initialization" do
    test "server is running and has initial empty state" do
      # SessionServer should be running as part of Flows supervision tree
      server_pid = Process.whereis(SessionServer)
      assert server_pid != nil
      assert Process.alive?(server_pid)

      # Initial state should have no sessions
      assert %{} = SessionServer.get_active_sessions()
    end
  end

  describe "join_flow/2" do
    test "joins a new client to a new flow" do
      assert {:ok, 1} = SessionServer.join_flow("test-flow", "client-1")
    end

    test "joins multiple clients to the same flow" do
      flow_id = "multi-client-flow-#{System.unique_integer([:positive])}"

      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, "client-2")
      assert {:ok, 3} = SessionServer.join_flow(flow_id, "client-3")
    end

    test "handles duplicate client joins idempotently" do
      flow_id = "duplicate-flow"
      client_id = "duplicate-client"

      assert {:ok, 1} = SessionServer.join_flow(flow_id, client_id)
      assert {:ok, 1} = SessionServer.join_flow(flow_id, client_id)
    end

    test "generates anonymous IDs for empty client IDs" do
      flow_id = "anonymous-flow"

      assert {:ok, 1} = SessionServer.join_flow(flow_id, "")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, nil)

      # Should have 2 different clients
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 2} = status
    end

    test "generates anonymous IDs for whitespace-only client IDs" do
      flow_id = "whitespace-flow"

      assert {:ok, 1} = SessionServer.join_flow(flow_id, "   ")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, "\t\n  ")

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 2} = status
    end

    test "generates anonymous IDs for non-string client IDs" do
      flow_id = "non-string-flow"

      assert {:ok, 1} = SessionServer.join_flow(flow_id, 123)
      assert {:ok, 2} = SessionServer.join_flow(flow_id, :atom)
      assert {:ok, 3} = SessionServer.join_flow(flow_id, [])
      assert {:ok, 4} = SessionServer.join_flow(flow_id, %{})

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 4} = status
    end

    test "preserves valid client IDs with surrounding whitespace" do
      flow_id = "preserved-whitespace-flow"
      client_id = "  valid-client  "

      assert {:ok, 1} = SessionServer.join_flow(flow_id, client_id)
      # Same client
      assert {:ok, 1} = SessionServer.join_flow(flow_id, client_id)

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 1} = status
    end

    test "updates last_activity timestamp when joining" do
      flow_id = "timestamp-join-flow"

      before_join = System.system_time(:second)
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")

      status = SessionServer.get_flow_status(flow_id)
      assert status.last_activity >= before_join
    end
  end

  describe "leave_flow/2" do
    test "allows clients to leave a flow" do
      flow_id = "leave-test-flow"
      client_id = "leaving-client"

      # Join first
      assert {:ok, 1} = SessionServer.join_flow(flow_id, client_id)

      # Then leave
      assert {:ok, 0} = SessionServer.leave_flow(flow_id, client_id)
    end

    test "tracks remaining client count after leaving" do
      flow_id = "multi-leave-flow"

      # Join multiple clients
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, "client-2")
      assert {:ok, 3} = SessionServer.join_flow(flow_id, "client-3")

      # Leave clients one by one
      assert {:ok, 2} = SessionServer.leave_flow(flow_id, "client-1")
      assert {:ok, 1} = SessionServer.leave_flow(flow_id, "client-2")
      assert {:ok, 0} = SessionServer.leave_flow(flow_id, "client-3")
    end

    test "handles leaving non-existent flow gracefully" do
      assert {:ok, 0} = SessionServer.leave_flow("non-existent", "client-1")
    end

    test "handles leaving with non-existent client gracefully" do
      flow_id = "exists-flow"

      # Join one client
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "real-client")

      # Try to leave with different client
      assert {:ok, 1} = SessionServer.leave_flow(flow_id, "fake-client")
    end

    test "removes session when last client leaves" do
      flow_id = "remove-session-flow"
      client_id = "only-client"

      # Join and verify session exists
      assert {:ok, 1} = SessionServer.join_flow(flow_id, client_id)
      assert %{active: true} = SessionServer.get_flow_status(flow_id)

      # Leave and verify session is removed
      assert {:ok, 0} = SessionServer.leave_flow(flow_id, client_id)
      assert %{active: false} = SessionServer.get_flow_status(flow_id)
    end

    test "updates last_activity timestamp when leaving" do
      flow_id = "timestamp-leave-flow"

      # Join clients
      SessionServer.join_flow(flow_id, "client-1")
      SessionServer.join_flow(flow_id, "client-2")

      initial_status = SessionServer.get_flow_status(flow_id)

      # Wait a moment then leave
      :timer.sleep(100)
      before_leave = System.system_time(:second)
      assert {:ok, 1} = SessionServer.leave_flow(flow_id, "client-1")

      updated_status = SessionServer.get_flow_status(flow_id)
      assert updated_status.last_activity >= before_leave
      assert updated_status.last_activity >= initial_status.last_activity
    end
  end

  describe "get_flow_status/1" do
    test "returns inactive status for non-existent flows" do
      status = SessionServer.get_flow_status("non-existent-flow")
      assert %{active: false, client_count: 0} = status
    end

    test "returns active status for flows with clients" do
      flow_id = "status-test-flow"

      # Join clients
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, "client-2")

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 2, last_activity: last_activity} = status
      assert is_integer(last_activity)
    end

    test "reflects real-time client count changes" do
      flow_id = "realtime-status-flow"

      # Initially inactive
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)

      # Join clients and verify count increases
      SessionServer.join_flow(flow_id, "client-1")
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)

      SessionServer.join_flow(flow_id, "client-2")
      assert %{active: true, client_count: 2} = SessionServer.get_flow_status(flow_id)

      # Leave clients and verify count decreases
      SessionServer.leave_flow(flow_id, "client-1")
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)

      SessionServer.leave_flow(flow_id, "client-2")
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)
    end
  end

  describe "broadcast_flow_change/2" do
    test "broadcasts to active flow session" do
      flow_id = "broadcast-test-flow-#{System.unique_integer([:positive])}"
      changes = %{nodes: [], edges: []}

      # Join a client first
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")

      # Subscribe to PubSub for this flow
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      # Broadcast changes
      SessionServer.broadcast_flow_change(flow_id, changes)

      # Should receive the broadcast
      assert_receive {:flow_change, ^changes}, 1000
    end

    test "does not broadcast to inactive flow session" do
      flow_id = "inactive-broadcast-flow"
      changes = %{nodes: [], edges: []}

      # Subscribe to PubSub for this flow
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      # Broadcast without joining - should not crash but no message
      SessionServer.broadcast_flow_change(flow_id, changes)

      # Should not receive any message
      refute_receive {:flow_change, ^changes}, 100
    end

    test "updates last_activity when broadcasting" do
      flow_id = "activity-broadcast-flow"
      changes = %{test: "data"}

      # Join client and get initial status
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      initial_status = SessionServer.get_flow_status(flow_id)

      # Wait a moment then broadcast
      :timer.sleep(100)
      before_broadcast = System.system_time(:second)
      SessionServer.broadcast_flow_change(flow_id, changes)

      # Status should show updated activity
      updated_status = SessionServer.get_flow_status(flow_id)
      assert updated_status.last_activity >= before_broadcast
      assert updated_status.last_activity >= initial_status.last_activity
    end

    test "handles complex change payloads" do
      flow_id = "complex-changes-flow"

      complex_changes = %{
        nodes: [
          %{id: "node-1", type: "agent", position: %{x: 100, y: 200}},
          %{id: "node-2", type: "sensor", data: %{config: %{timeout: 5000}}}
        ],
        edges: [%{id: "edge-1", source: "node-1", target: "node-2"}],
        viewport: %{x: 0, y: 0, zoom: 1.5}
      }

      # Join client and subscribe
      SessionServer.join_flow(flow_id, "client-1")
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      # Broadcast complex changes
      SessionServer.broadcast_flow_change(flow_id, complex_changes)

      # Should receive exact same payload
      assert_receive {:flow_change, ^complex_changes}, 1000
    end
  end

  describe "get_active_sessions/0" do
    test "returns empty map when no sessions" do
      assert %{} = SessionServer.get_active_sessions()
    end

    test "returns session information for active flows" do
      flow_id = "active-sessions-flow"

      # Join clients
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, "client-2")

      sessions = SessionServer.get_active_sessions()
      assert %{^flow_id => session_info} = sessions
      assert %{client_count: 2, last_activity: _} = session_info
    end

    test "includes multiple active flows" do
      flow_id_1 = "multi-active-flow-1"
      flow_id_2 = "multi-active-flow-2"

      # Set up different flows
      SessionServer.join_flow(flow_id_1, "client-1")
      SessionServer.join_flow(flow_id_2, "client-2a")
      SessionServer.join_flow(flow_id_2, "client-2b")

      sessions = SessionServer.get_active_sessions()

      assert %{^flow_id_1 => info1, ^flow_id_2 => info2} = sessions
      assert %{client_count: 1} = info1
      assert %{client_count: 2} = info2
    end

    test "excludes inactive flows" do
      flow_id = "temporary-active-flow"

      # Join then leave
      SessionServer.join_flow(flow_id, "temp-client")
      SessionServer.leave_flow(flow_id, "temp-client")

      sessions = SessionServer.get_active_sessions()
      refute Map.has_key?(sessions, flow_id)
    end
  end

  describe "force_close_flow_session/1" do
    test "closes session and returns client count" do
      flow_id = "force-close-flow"

      # Join clients
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, "client-2")

      # Force close
      assert {:ok, 2} = SessionServer.force_close_flow_session(flow_id)

      # Session should be inactive now
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: false, client_count: 0} = status
    end

    test "handles closing non-existent session" do
      assert {:ok, 0} = SessionServer.force_close_flow_session("non-existent")
    end

    test "broadcasts flow_deleted message" do
      flow_id = "delete-broadcast-flow"

      # Join client and subscribe to PubSub
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      # Force close
      assert {:ok, 1} = SessionServer.force_close_flow_session(flow_id)

      # Should receive deletion broadcast
      assert_receive {:flow_deleted, ^flow_id}, 1000
    end

    test "cleans up client_flows mappings" do
      flow_id = "cleanup-mappings-flow"

      # Join multiple clients
      SessionServer.join_flow(flow_id, "client-1")
      SessionServer.join_flow(flow_id, "client-2")

      # Verify session is active
      assert %{active: true, client_count: 2} = SessionServer.get_flow_status(flow_id)

      # Force close
      assert {:ok, 2} = SessionServer.force_close_flow_session(flow_id)

      # Try to join again - should work as if starting fresh
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)
    end
  end

  describe "cleanup_inactive_sessions message handling" do
    test "handles cleanup message without crashing", %{server_pid: server_pid} do
      flow_id = "cleanup-test-flow"

      # Join a client
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")

      # Send cleanup message directly
      send(server_pid, :cleanup_inactive_sessions)

      # Wait for message to be processed
      :timer.sleep(50)

      # Server should still be alive and session should still exist (recent activity)
      assert Process.alive?(server_pid)
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)
    end

    test "cleanup preserves recent sessions" do
      flow_id = "recent-session-flow"

      # Create a recent session
      SessionServer.join_flow(flow_id, "recent-client")

      # Get server PID and send cleanup message
      server_pid = Process.whereis(SessionServer)
      send(server_pid, :cleanup_inactive_sessions)

      # Give time for cleanup to process
      :timer.sleep(100)

      # Recent session should still be active
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)
    end
  end

  describe "concurrent operations" do
    test "handles concurrent joins to same flow" do
      flow_id = "concurrent-joins-flow"

      # Spawn multiple processes joining the same flow
      tasks =
        Enum.map(1..10, fn i ->
          Task.async(fn ->
            SessionServer.join_flow(flow_id, "client-#{i}")
          end)
        end)

      results = Enum.map(tasks, &Task.await/1)

      # All joins should succeed
      assert Enum.all?(results, fn {status, _count} -> status == :ok end)

      # Final count should be 10
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 10} = status
    end

    test "handles concurrent joins and leaves" do
      flow_id = "concurrent-mixed-flow"

      # Join some initial clients
      Enum.each(1..5, fn i ->
        SessionServer.join_flow(flow_id, "initial-client-#{i}")
      end)

      # Spawn concurrent join and leave operations
      join_tasks =
        Enum.map(6..10, fn i ->
          Task.async(fn ->
            SessionServer.join_flow(flow_id, "join-client-#{i}")
          end)
        end)

      leave_tasks =
        Enum.map(1..3, fn i ->
          Task.async(fn ->
            SessionServer.leave_flow(flow_id, "initial-client-#{i}")
          end)
        end)

      # Wait for all operations
      Enum.each(join_tasks ++ leave_tasks, &Task.await/1)

      # Should have 7 clients (5 initial - 3 left + 5 joined)
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 7} = status
    end

    test "handles concurrent force closes" do
      flow_id = "concurrent-close-flow"

      # Join clients
      SessionServer.join_flow(flow_id, "client-1")
      SessionServer.join_flow(flow_id, "client-2")

      # Spawn multiple force close operations
      tasks =
        Enum.map(1..3, fn _i ->
          Task.async(fn ->
            SessionServer.force_close_flow_session(flow_id)
          end)
        end)

      results = Enum.map(tasks, &Task.await/1)

      # One should succeed with client count, others should return 0
      success_counts = Enum.map(results, fn {:ok, count} -> count end)
      total_closed = Enum.sum(success_counts)
      # Total clients that were closed
      assert total_closed == 2

      # Session should be inactive
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)
    end
  end

  describe "error handling and edge cases" do
    test "handles invalid flow_ids gracefully" do
      # Test with various invalid flow IDs
      assert {:ok, 1} = SessionServer.join_flow("", "client-1")
      assert {:ok, 1} = SessionServer.join_flow("   ", "client-2")
      assert {:ok, 0} = SessionServer.leave_flow("", "client-1")

      # Status should work with any flow ID
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status("")
      assert {:ok, 0} = SessionServer.force_close_flow_session("")
    end

    test "handles extremely long flow and client IDs" do
      long_flow_id = String.duplicate("a", 1000)
      long_client_id = String.duplicate("b", 1000)

      assert {:ok, 1} = SessionServer.join_flow(long_flow_id, long_client_id)
      assert {:ok, 0} = SessionServer.leave_flow(long_flow_id, long_client_id)
    end

    test "handles unicode flow and client IDs" do
      unicode_flow = "flow-测试-🚀-τεστ"
      unicode_client = "client-مرحبا-🎉-тест"

      assert {:ok, 1} = SessionServer.join_flow(unicode_flow, unicode_client)
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(unicode_flow)
      assert {:ok, 0} = SessionServer.leave_flow(unicode_flow, unicode_client)
    end

    test "generates unique anonymous IDs" do
      flow_id = "unique-anon-flow"

      # Generate many anonymous clients
      results =
        Enum.map(1..20, fn _i ->
          SessionServer.join_flow(flow_id, nil)
        end)

      # All should succeed and increment count
      expected_counts = Enum.map(1..20, fn i -> {:ok, i} end)
      assert results == expected_counts

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 20} = status
    end
  end
end
