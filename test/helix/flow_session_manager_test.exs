defmodule Helix.FlowSessionManagerTest do
  use ExUnit.Case, async: false

  alias Helix.FlowSessionManager

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

    :ok
  end

  # Use unique flow IDs with test process PID to avoid conflicts
  defp test_flow_id(base_id) do
    "#{base_id}-#{inspect(self())}-#{:erlang.unique_integer([:positive])}"
  end

  defp test_client_id(base_id) do
    "#{base_id}-#{inspect(self())}-#{:erlang.unique_integer([:positive])}"
  end

  describe "join_flow/2" do
    test "successfully joins a new flow" do
      flow_id = test_flow_id("flow-123")
      client_id = test_client_id("client-abc")

      assert {:ok, 1} = FlowSessionManager.join_flow(flow_id, client_id)
    end

    test "increments client count when multiple clients join" do
      flow_id = test_flow_id("flow-123")

      assert {:ok, 1} = FlowSessionManager.join_flow(flow_id, test_client_id("client-1"))
      assert {:ok, 2} = FlowSessionManager.join_flow(flow_id, test_client_id("client-2"))
      assert {:ok, 3} = FlowSessionManager.join_flow(flow_id, test_client_id("client-3"))
    end

    test "allows same client to join multiple flows" do
      client_id = test_client_id("client")
      flow_id_1 = test_flow_id("flow-1")
      flow_id_2 = test_flow_id("flow-2")

      assert {:ok, 1} = FlowSessionManager.join_flow(flow_id_1, client_id)
      assert {:ok, 1} = FlowSessionManager.join_flow(flow_id_2, client_id)
    end

    test "joining the same flow twice with same client increments count only once" do
      flow_id = test_flow_id("flow-123")
      client_id = test_client_id("client-abc")

      assert {:ok, 1} = FlowSessionManager.join_flow(flow_id, client_id)
      assert {:ok, 1} = FlowSessionManager.join_flow(flow_id, client_id)
    end
  end

  describe "leave_flow/2" do
    test "successfully leaves a flow" do
      flow_id = test_flow_id("flow-123")
      client_id = test_client_id("client-abc")

      FlowSessionManager.join_flow(flow_id, client_id)
      assert {:ok, 0} = FlowSessionManager.leave_flow(flow_id, client_id)
    end

    test "decrements client count correctly" do
      flow_id = test_flow_id("flow-123")
      client_1 = test_client_id("client-1")
      client_2 = test_client_id("client-2")
      client_3 = test_client_id("client-3")

      FlowSessionManager.join_flow(flow_id, client_1)
      FlowSessionManager.join_flow(flow_id, client_2)
      FlowSessionManager.join_flow(flow_id, client_3)

      assert {:ok, 2} = FlowSessionManager.leave_flow(flow_id, client_1)
      assert {:ok, 1} = FlowSessionManager.leave_flow(flow_id, client_2)
      assert {:ok, 0} = FlowSessionManager.leave_flow(flow_id, client_3)
    end

    test "returns 0 when leaving non-existent flow" do
      assert {:ok, 0} = FlowSessionManager.leave_flow("non-existent", "client-123")
    end

    test "returns correct count when leaving with non-existent client" do
      flow_id = test_flow_id("flow-123")

      FlowSessionManager.join_flow(flow_id, "client-1")
      assert {:ok, 1} = FlowSessionManager.leave_flow(flow_id, "non-existent-client")
    end

    test "removes empty sessions" do
      flow_id = test_flow_id("flow-123")
      client_id = test_client_id("client-abc")

      FlowSessionManager.join_flow(flow_id, client_id)
      FlowSessionManager.leave_flow(flow_id, client_id)

      # Flow should no longer appear in active sessions
      assert %{} = FlowSessionManager.get_active_sessions()
    end
  end

  describe "get_flow_status/1" do
    test "returns inactive status for non-existent flow" do
      assert %{active: false, client_count: 0} =
               FlowSessionManager.get_flow_status("non-existent")
    end

    test "returns active status for existing flow" do
      flow_id = test_flow_id("flow-123")
      client_id = test_client_id("client-abc")

      FlowSessionManager.join_flow(flow_id, client_id)

      status = FlowSessionManager.get_flow_status(flow_id)
      assert %{active: true, client_count: 1, last_activity: _} = status
      assert is_integer(status.last_activity)
    end

    test "updates client count correctly" do
      flow_id = test_flow_id("flow-123")

      FlowSessionManager.join_flow(flow_id, "client-1")
      FlowSessionManager.join_flow(flow_id, "client-2")

      assert %{active: true, client_count: 2} =
               FlowSessionManager.get_flow_status(flow_id)

      FlowSessionManager.leave_flow(flow_id, "client-1")

      assert %{active: true, client_count: 1} =
               FlowSessionManager.get_flow_status(flow_id)
    end
  end

  describe "broadcast_flow_change/2" do
    test "broadcasts to active flow session" do
      flow_id = test_flow_id("flow-123")
      client_id = test_client_id("client-abc")
      changes = %{nodes: [%{id: "node-1"}], edges: []}

      # Subscribe to the flow topic to receive broadcasts
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      FlowSessionManager.join_flow(flow_id, client_id)
      FlowSessionManager.broadcast_flow_change(flow_id, changes)

      # Verify broadcast was sent
      assert_receive {:flow_change, ^changes}, 1000
    end

    test "does not broadcast to inactive flow session" do
      flow_id = test_flow_id("flow-123")
      changes = %{nodes: [], edges: []}

      # Subscribe but don't join the flow
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      FlowSessionManager.broadcast_flow_change(flow_id, changes)

      # Should not receive broadcast
      refute_receive {:flow_change, _}, 100
    end

    test "updates last_activity when broadcasting" do
      flow_id = test_flow_id("flow-123")
      client_id = test_client_id("client-abc")
      changes = %{nodes: [], edges: []}

      FlowSessionManager.join_flow(flow_id, client_id)

      # Get initial status
      initial_status = FlowSessionManager.get_flow_status(flow_id)

      # Wait a bit to ensure timestamp difference
      :timer.sleep(1001)

      FlowSessionManager.broadcast_flow_change(flow_id, changes)

      # Get updated status
      updated_status = FlowSessionManager.get_flow_status(flow_id)

      assert updated_status.last_activity > initial_status.last_activity
    end
  end

  describe "get_active_sessions/0" do
    test "returns empty map when no sessions" do
      assert %{} = FlowSessionManager.get_active_sessions()
    end

    test "returns active sessions with correct metadata" do
      flow_id_1 = "flow-1"
      flow_id_2 = "flow-2"

      FlowSessionManager.join_flow(flow_id_1, "client-1")
      FlowSessionManager.join_flow(flow_id_1, "client-2")
      FlowSessionManager.join_flow(flow_id_2, "client-3")

      sessions = FlowSessionManager.get_active_sessions()

      assert %{
               ^flow_id_1 => %{client_count: 2, last_activity: _},
               ^flow_id_2 => %{client_count: 1, last_activity: _}
             } = sessions

      assert is_integer(sessions[flow_id_1].last_activity)
      assert is_integer(sessions[flow_id_2].last_activity)
    end

    test "reflects changes as clients join and leave" do
      flow_id = test_flow_id("flow-123")

      # Initially empty
      assert %{} = FlowSessionManager.get_active_sessions()

      # Add clients
      FlowSessionManager.join_flow(flow_id, "client-1")
      assert %{^flow_id => %{client_count: 1}} = FlowSessionManager.get_active_sessions()

      FlowSessionManager.join_flow(flow_id, "client-2")
      assert %{^flow_id => %{client_count: 2}} = FlowSessionManager.get_active_sessions()

      # Remove all clients
      FlowSessionManager.leave_flow(flow_id, "client-1")
      FlowSessionManager.leave_flow(flow_id, "client-2")

      # Should be empty again
      assert %{} = FlowSessionManager.get_active_sessions()
    end
  end

  describe "session cleanup" do
    test "inactive sessions are tracked with last_activity" do
      flow_id = test_flow_id("flow-123")
      client_id = test_client_id("client-abc")

      FlowSessionManager.join_flow(flow_id, client_id)

      status = FlowSessionManager.get_flow_status(flow_id)
      assert is_integer(status.last_activity)
      assert status.last_activity > 0
    end

    test "last_activity is updated on join" do
      flow_id = test_flow_id("flow-123")

      FlowSessionManager.join_flow(flow_id, "client-1")
      initial_time = FlowSessionManager.get_flow_status(flow_id).last_activity

      :timer.sleep(1001)

      FlowSessionManager.join_flow(flow_id, test_client_id("client-2"))
      updated_time = FlowSessionManager.get_flow_status(flow_id).last_activity

      assert updated_time > initial_time
    end

    test "last_activity is updated on leave" do
      flow_id = test_flow_id("flow-123")

      FlowSessionManager.join_flow(flow_id, "client-1")
      FlowSessionManager.join_flow(flow_id, "client-2")

      initial_time = FlowSessionManager.get_flow_status(flow_id).last_activity

      :timer.sleep(1001)

      FlowSessionManager.leave_flow(flow_id, test_client_id("client-1"))
      updated_time = FlowSessionManager.get_flow_status(flow_id).last_activity

      assert updated_time > initial_time
    end
  end

  describe "error handling" do
    test "handles malformed flow_id gracefully" do
      assert {:ok, 1} = FlowSessionManager.join_flow("", "client-123")
      assert {:ok, 0} = FlowSessionManager.leave_flow("", "client-123")
    end

    test "handles malformed client_id gracefully" do
      flow_id = test_flow_id("flow-123")
      # Empty string gets replaced with anonymous ID
      assert {:ok, 1} = FlowSessionManager.join_flow(flow_id, "")
      # Leave with empty string won't match the anonymous ID, so count stays 1
      assert {:ok, 1} = FlowSessionManager.leave_flow(flow_id, "")
    end

    test "handles nil values gracefully" do
      # nil gets replaced with anonymous ID
      assert {:ok, 1} = FlowSessionManager.join_flow("flow", nil)
      # Leave with nil won't match the anonymous ID, so count stays 1
      assert {:ok, 1} = FlowSessionManager.leave_flow("flow", nil)
    end
  end

  describe "force_close_flow_session/1" do
    test "force closes flow session with multiple clients" do
      flow_id = test_flow_id("force-close-flow")
      client_1 = test_client_id("client-1")
      client_2 = test_client_id("client-2")
      client_3 = test_client_id("client-3")

      # Set up a flow with multiple clients
      FlowSessionManager.join_flow(flow_id, client_1)
      FlowSessionManager.join_flow(flow_id, client_2)
      FlowSessionManager.join_flow(flow_id, client_3)

      # Verify the flow is active with 3 clients
      assert %{active: true, client_count: 3} = FlowSessionManager.get_flow_status(flow_id)

      # Force close the session
      assert {:ok, 3} = FlowSessionManager.force_close_flow_session(flow_id)

      # Verify the flow is now inactive
      assert %{active: false, client_count: 0} = FlowSessionManager.get_flow_status(flow_id)

      # Verify the flow is no longer in active sessions
      refute Map.has_key?(FlowSessionManager.get_active_sessions(), flow_id)
    end

    test "force closes flow session with single client" do
      flow_id = test_flow_id("force-close-single")
      client_id = test_client_id("client-single")

      FlowSessionManager.join_flow(flow_id, client_id)
      assert %{active: true, client_count: 1} = FlowSessionManager.get_flow_status(flow_id)

      assert {:ok, 1} = FlowSessionManager.force_close_flow_session(flow_id)
      assert %{active: false, client_count: 0} = FlowSessionManager.get_flow_status(flow_id)
    end

    test "force closes non-existent flow session returns 0 clients" do
      flow_id = "non-existent-flow"

      assert {:ok, 0} = FlowSessionManager.force_close_flow_session(flow_id)
      assert %{active: false, client_count: 0} = FlowSessionManager.get_flow_status(flow_id)
    end

    test "force close broadcasts flow_deleted message to subscribed clients" do
      flow_id = test_flow_id("broadcast-delete-flow")
      client_id = test_client_id("client-broadcast")

      # Subscribe to the flow topic to receive broadcasts
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      # Set up a flow session
      FlowSessionManager.join_flow(flow_id, client_id)

      # Force close the session
      assert {:ok, 1} = FlowSessionManager.force_close_flow_session(flow_id)

      # Verify the flow_deleted broadcast was sent
      assert_receive {:flow_deleted, ^flow_id}, 1000
    end

    test "force close removes all client_flows mappings for the flow" do
      flow_id = test_flow_id("mappings-flow")
      client_1 = test_client_id("client-1")
      client_2 = test_client_id("client-2")

      # Set up multiple clients in the flow
      FlowSessionManager.join_flow(flow_id, client_1)
      FlowSessionManager.join_flow(flow_id, client_2)

      # Force close the flow
      assert {:ok, 2} = FlowSessionManager.force_close_flow_session(flow_id)

      # The flow should be completely removed
      assert %{active: false, client_count: 0} = FlowSessionManager.get_flow_status(flow_id)
      assert %{} = FlowSessionManager.get_active_sessions()
    end

    test "force close does not affect other flow sessions" do
      flow_id_1 = test_flow_id("flow-1")
      flow_id_2 = test_flow_id("flow-2")
      client_1 = test_client_id("client-1")
      client_2 = test_client_id("client-2")

      # Set up two separate flows
      FlowSessionManager.join_flow(flow_id_1, client_1)
      FlowSessionManager.join_flow(flow_id_2, client_2)

      # Verify both flows are active
      assert %{active: true, client_count: 1} = FlowSessionManager.get_flow_status(flow_id_1)
      assert %{active: true, client_count: 1} = FlowSessionManager.get_flow_status(flow_id_2)

      # Force close only the first flow
      assert {:ok, 1} = FlowSessionManager.force_close_flow_session(flow_id_1)

      # Verify first flow is closed, second flow is still active
      assert %{active: false, client_count: 0} = FlowSessionManager.get_flow_status(flow_id_1)
      assert %{active: true, client_count: 1} = FlowSessionManager.get_flow_status(flow_id_2)

      # Active sessions should only contain the second flow
      active_sessions = FlowSessionManager.get_active_sessions()
      refute Map.has_key?(active_sessions, flow_id_1)
      assert Map.has_key?(active_sessions, flow_id_2)
    end

    test "force close handles empty flow_id gracefully" do
      assert {:ok, 0} = FlowSessionManager.force_close_flow_session("")
    end

    test "force close handles nil flow_id gracefully" do
      assert {:ok, 0} = FlowSessionManager.force_close_flow_session(nil)
    end

    test "force close can be called multiple times on same flow" do
      flow_id = test_flow_id("multiple-force-close")
      client_id = test_client_id("client")

      FlowSessionManager.join_flow(flow_id, client_id)

      # First force close
      assert {:ok, 1} = FlowSessionManager.force_close_flow_session(flow_id)

      # Second force close on already closed flow
      assert {:ok, 0} = FlowSessionManager.force_close_flow_session(flow_id)

      # Third force close
      assert {:ok, 0} = FlowSessionManager.force_close_flow_session(flow_id)
    end

    test "force close after normal client leave operations" do
      flow_id = test_flow_id("mixed-operations-flow")
      client_1 = test_client_id("client-1")
      client_2 = test_client_id("client-2")
      client_3 = test_client_id("client-3")

      # Set up flow with 3 clients
      FlowSessionManager.join_flow(flow_id, client_1)
      FlowSessionManager.join_flow(flow_id, client_2)
      FlowSessionManager.join_flow(flow_id, client_3)

      # One client leaves normally
      assert {:ok, 2} = FlowSessionManager.leave_flow(flow_id, client_1)

      # Force close the remaining session
      assert {:ok, 2} = FlowSessionManager.force_close_flow_session(flow_id)

      # Flow should be completely closed
      assert %{active: false, client_count: 0} = FlowSessionManager.get_flow_status(flow_id)
    end

    test "force close concurrent with normal operations" do
      flow_id = test_flow_id("concurrent-operations")

      # Start with some clients
      FlowSessionManager.join_flow(flow_id, "client-1")
      FlowSessionManager.join_flow(flow_id, "client-2")

      # Run force close and normal join concurrently
      force_close_task =
        Task.async(fn ->
          FlowSessionManager.force_close_flow_session(flow_id)
        end)

      join_task =
        Task.async(fn ->
          FlowSessionManager.join_flow(flow_id, "client-3")
        end)

      force_result = Task.await(force_close_task)
      join_result = Task.await(join_task)

      # Force close should have closed the existing session
      assert {:ok, client_count} = force_result
      assert client_count >= 0

      # Join might succeed (creating new session) or return 1 if it happened after force close
      assert {:ok, _} = join_result

      # Final state should be consistent
      status = FlowSessionManager.get_flow_status(flow_id)
      assert status.client_count >= 0
    end
  end

  describe "concurrency" do
    test "handles concurrent joins to same flow" do
      flow_id = test_flow_id("flow-123")

      # Simulate multiple clients joining concurrently
      tasks =
        Enum.map(1..10, fn i ->
          Task.async(fn ->
            FlowSessionManager.join_flow(flow_id, "client-#{i}")
          end)
        end)

      results = Enum.map(tasks, &Task.await/1)

      # All joins should succeed
      assert Enum.all?(results, fn result -> match?({:ok, _}, result) end)

      # Final count should be 10
      assert %{client_count: 10} = FlowSessionManager.get_flow_status(flow_id)
    end

    test "handles concurrent leaves from same flow" do
      flow_id = test_flow_id("flow-123")
      client_ids = Enum.map(1..10, &"client-#{&1}")

      # Join all clients first
      Enum.each(client_ids, &FlowSessionManager.join_flow(flow_id, &1))

      # Now have them all leave concurrently
      tasks =
        Enum.map(client_ids, fn client_id ->
          Task.async(fn ->
            FlowSessionManager.leave_flow(flow_id, client_id)
          end)
        end)

      results = Enum.map(tasks, &Task.await/1)

      # All leaves should succeed
      assert Enum.all?(results, fn result -> match?({:ok, _}, result) end)

      # Flow should be inactive
      assert %{active: false, client_count: 0} = FlowSessionManager.get_flow_status(flow_id)
    end
  end
end
