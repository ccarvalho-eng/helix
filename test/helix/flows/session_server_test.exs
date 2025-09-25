defmodule Helix.Flows.SessionServerTest do
  use ExUnit.Case, async: false

  alias Helix.Flows.SessionServer
  import Helix.FlowTestHelper

  setup do
    # Ensure flow services are available
    ensure_flow_services_available()
    :ok
  end

  defp retry_get_active_sessions(retries \\ 5) do
    SessionServer.get_active_sessions()
  rescue
    ArgumentError ->
      if retries > 0 do
        :timer.sleep(50)
        ensure_flow_services_available()
        retry_get_active_sessions(retries - 1)
      else
        %{}
      end
  end

  describe "SessionServer initialization" do
    test "system has no active sessions initially" do
      # Initial state should have no sessions
      assert %{} = SessionServer.get_active_sessions()
    end
  end

  describe "join_flow/2" do
    test "joins a new client to a new flow" do
      assert {:ok, 1, "client-1"} = SessionServer.join_flow("test-flow", "client-1")
    end

    test "joins multiple clients to the same flow" do
      flow_id = "multi-client-flow-#{System.unique_integer([:positive])}"

      assert {:ok, 1, "client-1"} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2, "client-2"} = SessionServer.join_flow(flow_id, "client-2")
      assert {:ok, 3, "client-3"} = SessionServer.join_flow(flow_id, "client-3")
    end

    test "handles duplicate client joins idempotently" do
      flow_id = "duplicate-flow"
      client_id = "duplicate-client"

      assert {:ok, 1, ^client_id} = SessionServer.join_flow(flow_id, client_id)
      assert {:ok, 1, ^client_id} = SessionServer.join_flow(flow_id, client_id)
    end

    test "generates anonymous IDs for empty client IDs" do
      flow_id = "anonymous-flow"

      assert {:ok, 1, _anon_id1} = SessionServer.join_flow(flow_id, "")
      assert {:ok, 2, _anon_id2} = SessionServer.join_flow(flow_id, nil)

      # Should have 2 different clients
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 2} = status
    end

    test "generates anonymous IDs for whitespace-only client IDs" do
      flow_id = "whitespace-flow"

      assert {:ok, 1, _anon_id1} = SessionServer.join_flow(flow_id, "   ")
      assert {:ok, 2, _anon_id2} = SessionServer.join_flow(flow_id, "\t\n  ")

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 2} = status
    end

    test "generates anonymous IDs for non-string client IDs" do
      flow_id = "non-string-flow"

      assert {:ok, 1, _anon_id1} = SessionServer.join_flow(flow_id, 123)
      assert {:ok, 2, _anon_id2} = SessionServer.join_flow(flow_id, :atom)
      assert {:ok, 3, _anon_id3} = SessionServer.join_flow(flow_id, [])
      assert {:ok, 4, _anon_id4} = SessionServer.join_flow(flow_id, %{})

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 4} = status
    end

    test "preserves valid client IDs with surrounding whitespace" do
      flow_id = "preserved-whitespace-flow"
      client_id = "  valid-client  "

      assert {:ok, 1, trimmed_client_id} = SessionServer.join_flow(flow_id, client_id)
      # Same client
      assert {:ok, 1, ^trimmed_client_id} = SessionServer.join_flow(flow_id, client_id)

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 1} = status
    end

    test "updates last_activity timestamp when joining" do
      flow_id = "timestamp-join-flow"

      before_join = System.system_time(:second)
      assert {:ok, 1, "client-1"} = SessionServer.join_flow(flow_id, "client-1")

      status = SessionServer.get_flow_status(flow_id)
      assert status.last_activity >= before_join
    end
  end

  describe "leave_flow/2" do
    test "allows clients to leave a flow" do
      flow_id = "leave-test-flow"
      client_id = "leaving-client"

      # Join first
      assert {:ok, 1, _id} = SessionServer.join_flow(flow_id, client_id)

      # Then leave
      assert {:ok, 0} = SessionServer.leave_flow(flow_id, client_id)
    end

    test "tracks remaining client count after leaving" do
      flow_id = "multi-leave-flow"

      # Join multiple clients
      assert {:ok, 1, _id1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id2} = SessionServer.join_flow(flow_id, "client-2")
      assert {:ok, 3, _id3} = SessionServer.join_flow(flow_id, "client-3")

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
      assert {:ok, 1, _id} = SessionServer.join_flow(flow_id, "real-client")

      # Try to leave with different client
      assert {:ok, 1} = SessionServer.leave_flow(flow_id, "fake-client")
    end

    test "removes session when last client leaves" do
      flow_id = "remove-session-flow"
      client_id = "only-client"

      # Join and verify session exists
      assert {:ok, 1, _id} = SessionServer.join_flow(flow_id, client_id)
      assert %{active: true} = SessionServer.get_flow_status(flow_id)

      # Leave and verify session is removed
      assert {:ok, 0} = SessionServer.leave_flow(flow_id, client_id)
      # Wait for termination to complete
      :timer.sleep(100)
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
      assert {:ok, 1, _id1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id2} = SessionServer.join_flow(flow_id, "client-2")

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
      # Wait for termination
      :timer.sleep(50)
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)
    end
  end

  describe "broadcast_flow_change/2" do
    test "broadcasts to active flow session" do
      flow_id = "broadcast-test-flow-#{System.unique_integer([:positive])}"
      changes = %{nodes: [], edges: []}

      # Join a client first
      assert {:ok, 1, _id} = SessionServer.join_flow(flow_id, "client-1")

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
      assert {:ok, 1, _id} = SessionServer.join_flow(flow_id, "client-1")
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
      assert {:ok, 1, _id1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id2} = SessionServer.join_flow(flow_id, "client-2")

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

      # Wait for termination to complete
      :timer.sleep(100)

      # Retry get_active_sessions in case of timing issues
      sessions = retry_get_active_sessions()
      refute Map.has_key?(sessions, flow_id)
    end
  end

  describe "force_close_flow_session/1" do
    test "closes session and returns client count" do
      flow_id = "force-close-flow"

      # Join clients
      assert {:ok, 1, _id1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2, _id2} = SessionServer.join_flow(flow_id, "client-2")

      # Force close
      assert {:ok, 2} = SessionServer.force_close_flow_session(flow_id)

      # Wait for termination
      :timer.sleep(50)

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
      assert {:ok, 1, _id} = SessionServer.join_flow(flow_id, "client-1")
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

      # Wait for termination
      :timer.sleep(50)

      # Try to join again - should work as if starting fresh
      assert {:ok, 1, _id} = SessionServer.join_flow(flow_id, "client-1")
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)
    end
  end

  describe "session cleanup behavior" do
    test "sessions auto-terminate when inactive" do
      flow_id = "auto-terminate-flow"

      # Join a client
      assert {:ok, 1, _id} = SessionServer.join_flow(flow_id, "client-1")
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)

      # Leave the client - session should terminate automatically
      assert {:ok, 0} = SessionServer.leave_flow(flow_id, "client-1")

      # Wait for termination to complete
      :timer.sleep(100)

      # Session should be inactive now
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)
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
      assert Enum.all?(results, fn {status, _count, _id} -> status == :ok end)

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

      # All calls should succeed (some might return 0 if session already terminated)
      Enum.each(results, fn result ->
        assert {:ok, _count} = result
      end)

      # Session should be inactive
      :timer.sleep(50)
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)
    end

    test "concurrent get_or_start_session/1 calls create no duplicate sessions" do
      flow_id = "concurrent-start-flow"

      # Spawn multiple processes trying to get or start the same session
      tasks =
        Enum.map(1..20, fn _i ->
          Task.async(fn ->
            case Helix.Flows.FlowSessionManager.get_or_start_session(flow_id) do
              {:ok, pid} when is_pid(pid) -> {:ok, pid}
              error -> error
            end
          end)
        end)

      results = Enum.map(tasks, &Task.await/1)

      # All should succeed and return a pid
      assert Enum.all?(results, fn {status, pid} -> status == :ok and is_pid(pid) end)

      # Extract all PIDs - they should all be the same (no duplicates)
      pids = Enum.map(results, fn {:ok, pid} -> pid end)
      unique_pids = Enum.uniq(pids)
      assert length(unique_pids) == 1, "Expected 1 unique PID, got #{length(unique_pids)}"

      # Verify only one session is registered for our specific flow_id
      # (other tests may have left sessions running)
      session_pids_for_flow = Registry.lookup(Helix.Flows.Registry, flow_id)
      assert length(session_pids_for_flow) == 1
    end

    test "session process crashes and recreates properly with transient restart" do
      flow_id = "crash-recreate-flow"

      # Start a session by joining
      assert {:ok, 1, "client-1"} = SessionServer.join_flow(flow_id, "client-1")

      # Get the original PID
      [{original_pid, _}] = Registry.lookup(Helix.Flows.Registry, flow_id)
      assert is_pid(original_pid)
      assert Process.alive?(original_pid)

      # Verify session is active
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)

      # Kill the session process abnormally (simulating a crash)
      Process.exit(original_pid, :some_error)

      # Wait for process to die and restart (if it would restart)
      :timer.sleep(200)
      assert not Process.alive?(original_pid)

      # With :transient restart policy, the process should be restarted since it died abnormally
      # But the new process should start with fresh state (no clients)
      case Registry.lookup(Helix.Flows.Registry, flow_id) do
        [] ->
          # Process was not restarted (expected for this test case)
          assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)

        [{restarted_pid, _}] ->
          # Process was restarted but should have clean state
          assert restarted_pid != original_pid
          assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)
      end

      # New join should create a fresh session
      assert {:ok, 1, "client-2"} = SessionServer.join_flow(flow_id, "client-2")

      # Get the new PID
      [{new_pid, _}] = Registry.lookup(Helix.Flows.Registry, flow_id)
      assert is_pid(new_pid)
      assert new_pid != original_pid

      # Session should be active with fresh state
      assert %{active: true, client_count: 1} = SessionServer.get_flow_status(flow_id)
    end
  end

  describe "error handling and edge cases" do
    test "handles invalid flow_ids gracefully" do
      # Test with various invalid flow IDs - they should now return errors
      assert {:error, :invalid_flow_id} = SessionServer.join_flow("", "client-1")
      assert {:error, :invalid_flow_id} = SessionServer.join_flow("   ", "client-2")
      assert {:error, :invalid_flow_id} = SessionServer.leave_flow("", "client-1")
      assert {:error, :invalid_flow_id} = SessionServer.force_close_flow_session("")

      # Status should work with any flow ID (no validation needed for status check)
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status("")
    end

    test "handles extremely long flow and client IDs" do
      long_flow_id = String.duplicate("a", 1000)
      long_client_id = String.duplicate("b", 1000)

      assert {:ok, 1, _id} = SessionServer.join_flow(long_flow_id, long_client_id)
      assert {:ok, 0} = SessionServer.leave_flow(long_flow_id, long_client_id)
    end

    test "handles unicode flow and client IDs" do
      unicode_flow = "flow-测试-🚀-τεστ"
      unicode_client = "client-مرحبا-🎉-тест"

      assert {:ok, 1, _id} = SessionServer.join_flow(unicode_flow, unicode_client)
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

      # All should succeed and increment count - extract counts from 3-tuple results
      actual_counts = Enum.map(results, fn {:ok, count, _id} -> count end)
      expected_counts = Enum.to_list(1..20)
      assert actual_counts == expected_counts

      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 20} = status
    end
  end
end
