defmodule Helix.Flows.ConcurrencyTest do
  use ExUnit.Case, async: false

  alias Helix.Flows.SessionServer
  import Helix.FlowTestHelper

  setup do
    ensure_flow_services_available()
    :ok
  end

  describe "concurrent session operations" do
    test "concurrent session creation race condition" do
      flow_id = "race-condition-test-#{System.unique_integer([:positive])}"

      # Start 20 concurrent attempts to create same session
      tasks =
        Enum.map(1..20, fn i ->
          Task.async(fn ->
            SessionServer.join_flow(flow_id, "client-#{i}")
          end)
        end)

      results = Enum.map(tasks, &Task.await/1)

      # All should succeed
      assert Enum.all?(results, fn {status, _} -> status == :ok end)

      # Should only have one session process in Registry
      registry_entries = Registry.lookup(Helix.Flows.Registry, flow_id)
      assert length(registry_entries) == 1

      # Final count should be 20 (all unique clients joined the same session)
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 20} = status
    end

    test "concurrent join and leave operations on same flow" do
      flow_id = "concurrent-ops-test-#{System.unique_integer([:positive])}"

      # Start with some clients
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "initial-client-1")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, "initial-client-2")

      # Concurrent mix of join and leave operations
      join_tasks =
        Enum.map(1..10, fn i ->
          Task.async(fn ->
            SessionServer.join_flow(flow_id, "join-client-#{i}")
          end)
        end)

      leave_tasks =
        Enum.map(1..5, fn i ->
          Task.async(fn ->
            # Leave some of the initial clients
            SessionServer.leave_flow(flow_id, "initial-client-#{rem(i, 2) + 1}")
          end)
        end)

      # Wait for all operations
      join_results = Enum.map(join_tasks, &Task.await/1)
      leave_results = Enum.map(leave_tasks, &Task.await/1)

      # All operations should succeed
      assert Enum.all?(join_results, fn {status, _} -> status == :ok end)
      assert Enum.all?(leave_results, fn {status, _} -> status == :ok end)

      # Session should still be active
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true} = status
      assert status.client_count > 0
    end

    test "concurrent operations on multiple flows" do
      flow_ids = Enum.map(1..5, &"multi-flow-#{&1}-#{System.unique_integer([:positive])}")

      # Each flow gets concurrent operations
      all_tasks =
        Enum.flat_map(flow_ids, fn flow_id ->
          Enum.map(1..10, fn i ->
            Task.async(fn ->
              {flow_id, SessionServer.join_flow(flow_id, "client-#{i}")}
            end)
          end)
        end)

      results = Enum.map(all_tasks, &Task.await/1)

      # Group results by flow_id
      results_by_flow = Enum.group_by(results, fn {flow_id, _result} -> flow_id end)

      # Each flow should have successful results
      Enum.each(flow_ids, fn flow_id ->
        flow_results = Map.get(results_by_flow, flow_id, [])
        assert length(flow_results) == 10

        # All operations for this flow should succeed
        assert Enum.all?(flow_results, fn {_flow_id, {status, _}} -> status == :ok end)

        # Flow should be active with 10 clients
        status = SessionServer.get_flow_status(flow_id)
        assert %{active: true, client_count: 10} = status
      end)

      # Should have 5 separate registry entries
      total_registry_entries =
        Enum.map(flow_ids, fn flow_id ->
          Registry.lookup(Helix.Flows.Registry, flow_id)
        end)
        |> List.flatten()

      assert length(total_registry_entries) == 5
    end

    test "concurrent session termination scenarios" do
      flow_id = "termination-test-#{System.unique_integer([:positive])}"

      # Add fewer clients to reduce complexity
      clients = Enum.map(1..5, &"client-#{&1}")

      Enum.each(clients, fn client_id ->
        assert {:ok, _} = SessionServer.join_flow(flow_id, client_id)
      end)

      # Verify all joined
      assert %{active: true, client_count: 5} = SessionServer.get_flow_status(flow_id)

      # Leave all clients to trigger termination
      Enum.each(clients, fn client_id ->
        {:ok, _} = SessionServer.leave_flow(flow_id, client_id)
      end)

      # Wait for termination
      :timer.sleep(150)

      # Session should be inactive
      assert %{active: false, client_count: 0} = SessionServer.get_flow_status(flow_id)
    end

    test "high-frequency status checks don't interfere with operations" do
      flow_id = "status-check-test-#{System.unique_integer([:positive])}"

      # Start status checking tasks
      status_tasks =
        Enum.map(1..20, fn _i ->
          Task.async(fn ->
            Enum.map(1..50, fn _j ->
              SessionServer.get_flow_status(flow_id)
            end)
          end)
        end)

      # Simultaneously perform join/leave operations
      operation_tasks =
        Enum.map(1..10, fn i ->
          Task.async(fn ->
            client_id = "op-client-#{i}"
            {:ok, _} = SessionServer.join_flow(flow_id, client_id)
            :timer.sleep(10)
            {:ok, _} = SessionServer.leave_flow(flow_id, client_id)
          end)
        end)

      # Wait for all operations
      _status_results = Enum.map(status_tasks, &Task.await/1)
      operation_results = Enum.map(operation_tasks, &Task.await/1)

      # All operations should complete successfully (each returns {:ok, count} tuples)
      assert Enum.all?(operation_results, fn {status, _count} -> status == :ok end)

      # Final state should be inactive
      :timer.sleep(100)
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: false, client_count: 0} = status
    end

    test "concurrent broadcast operations don't block session state" do
      flow_id = "broadcast-test-#{System.unique_integer([:positive])}"

      # Join some clients
      assert {:ok, 1} = SessionServer.join_flow(flow_id, "client-1")
      assert {:ok, 2} = SessionServer.join_flow(flow_id, "client-2")

      # Start concurrent broadcast operations
      broadcast_tasks =
        Enum.map(1..20, fn i ->
          Task.async(fn ->
            SessionServer.broadcast_flow_change(flow_id, %{change: i})
          end)
        end)

      # Simultaneously perform session operations
      session_tasks =
        Enum.map(1..5, fn i ->
          Task.async(fn ->
            client_id = "concurrent-client-#{i}"
            {:ok, _} = SessionServer.join_flow(flow_id, client_id)
            status = SessionServer.get_flow_status(flow_id)
            {:ok, _} = SessionServer.leave_flow(flow_id, client_id)
            status
          end)
        end)

      # Wait for all operations
      _broadcast_results = Enum.map(broadcast_tasks, &Task.await/1)
      session_results = Enum.map(session_tasks, &Task.await/1)

      # All session operations should succeed
      assert Enum.all?(session_results, fn %{active: active} -> active == true end)

      # Final state should have original 2 clients
      status = SessionServer.get_flow_status(flow_id)
      assert %{active: true, client_count: 2} = status
    end
  end
end
