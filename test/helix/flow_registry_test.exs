defmodule Helix.FlowRegistryTest do
  use ExUnit.Case, async: false
  alias Helix.{FlowRegistry, FlowServer}

  setup do
    # Clean up any existing flows
    FlowRegistry.shutdown_all_flows()
    
    # Generate unique flow IDs for tests
    flow_id_1 = "test_flow_1_#{:rand.uniform(10000)}"
    flow_id_2 = "test_flow_2_#{:rand.uniform(10000)}"
    
    on_exit(fn ->
      FlowRegistry.stop_flow(flow_id_1)
      FlowRegistry.stop_flow(flow_id_2)
    end)
    
    {:ok, flow_id_1: flow_id_1, flow_id_2: flow_id_2}
  end

  describe "start_flow/1" do
    test "starts a new flow process", %{flow_id_1: flow_id} do
      {:ok, pid} = FlowRegistry.start_flow(flow_id)
      
      assert Process.alive?(pid)
      assert GenServer.whereis(FlowServer.via_tuple(flow_id)) == pid
    end

    test "returns existing pid if flow already exists", %{flow_id_1: flow_id} do
      {:ok, pid1} = FlowRegistry.start_flow(flow_id)
      {:ok, pid2} = FlowRegistry.start_flow(flow_id)
      
      assert pid1 == pid2
      assert Process.alive?(pid1)
    end

    test "handles multiple different flows", %{flow_id_1: flow_id_1, flow_id_2: flow_id_2} do
      {:ok, pid1} = FlowRegistry.start_flow(flow_id_1)
      {:ok, pid2} = FlowRegistry.start_flow(flow_id_2)
      
      assert pid1 != pid2
      assert Process.alive?(pid1)
      assert Process.alive?(pid2)
    end
  end

  describe "stop_flow/1" do
    test "stops an existing flow", %{flow_id_1: flow_id} do
      {:ok, pid} = FlowRegistry.start_flow(flow_id)
      assert Process.alive?(pid)
      
      :ok = FlowRegistry.stop_flow(flow_id)
      
      # Wait for process to terminate
      :timer.sleep(50)
      refute Process.alive?(pid)
      assert GenServer.whereis(FlowServer.via_tuple(flow_id)) == nil
    end

    test "returns not_found for non-existing flow" do
      assert {:error, :not_found} = FlowRegistry.stop_flow("non_existing_flow")
    end

    test "gracefully handles already stopped flow", %{flow_id_1: flow_id} do
      {:ok, _pid} = FlowRegistry.start_flow(flow_id)
      
      :ok = FlowRegistry.stop_flow(flow_id)
      # Try to stop again
      assert {:error, :not_found} = FlowRegistry.stop_flow(flow_id)
    end
  end

  describe "list_active_flows/0" do
    test "returns empty list when no flows are active" do
      FlowRegistry.shutdown_all_flows()
      assert FlowRegistry.list_active_flows() == []
    end

    test "returns list of active flow IDs", %{flow_id_1: flow_id_1, flow_id_2: flow_id_2} do
      {:ok, _} = FlowRegistry.start_flow(flow_id_1)
      {:ok, _} = FlowRegistry.start_flow(flow_id_2)
      
      active_flows = FlowRegistry.list_active_flows()
      
      assert length(active_flows) >= 2
      assert flow_id_1 in active_flows
      assert flow_id_2 in active_flows
    end

    test "removes flows from list when stopped", %{flow_id_1: flow_id} do
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      assert flow_id in FlowRegistry.list_active_flows()
      
      :ok = FlowRegistry.stop_flow(flow_id)
      :timer.sleep(50) # Allow time for cleanup
      
      refute flow_id in FlowRegistry.list_active_flows()
    end
  end

  describe "flow_info/0" do
    test "returns empty list when no flows are active" do
      FlowRegistry.shutdown_all_flows()
      assert FlowRegistry.flow_info() == []
    end

    test "returns flow information for active flows", %{flow_id_1: flow_id} do
      {:ok, pid} = FlowRegistry.start_flow(flow_id)
      
      flow_info = FlowRegistry.flow_info()
      
      assert length(flow_info) >= 1
      flow_entry = Enum.find(flow_info, fn info -> info.flow_id == flow_id end)
      
      assert flow_entry != nil
      assert flow_entry.flow_id == flow_id
      assert flow_entry.pid == pid
      assert flow_entry.alive == true
    end

    test "provides accurate metadata for multiple flows", %{flow_id_1: flow_id_1, flow_id_2: flow_id_2} do
      {:ok, pid1} = FlowRegistry.start_flow(flow_id_1)
      {:ok, pid2} = FlowRegistry.start_flow(flow_id_2)
      
      flow_info = FlowRegistry.flow_info()
      
      # Find our specific flows
      flow1_info = Enum.find(flow_info, fn info -> info.flow_id == flow_id_1 end)
      flow2_info = Enum.find(flow_info, fn info -> info.flow_id == flow_id_2 end)
      
      assert flow1_info.flow_id == flow_id_1
      assert flow1_info.pid == pid1
      assert flow1_info.alive == true
      assert flow2_info.flow_id == flow_id_2
      assert flow2_info.pid == pid2
      assert flow2_info.alive == true
      
      # Ensure pids are different (different processes)
      refute flow1_info.pid == flow2_info.pid
    end
  end

  describe "shutdown_all_flows/0" do
    test "stops all active flows", %{flow_id_1: flow_id_1, flow_id_2: flow_id_2} do
      {:ok, pid1} = FlowRegistry.start_flow(flow_id_1)
      {:ok, pid2} = FlowRegistry.start_flow(flow_id_2)
      
      assert Process.alive?(pid1)
      assert Process.alive?(pid2)
      assert length(FlowRegistry.list_active_flows()) >= 2
      
      :ok = FlowRegistry.shutdown_all_flows()
      
      # Wait for processes to terminate
      :timer.sleep(100)
      
      refute Process.alive?(pid1)
      refute Process.alive?(pid2)
      assert FlowRegistry.list_active_flows() == []
    end

    test "handles empty flow registry gracefully" do
      FlowRegistry.shutdown_all_flows()
      assert FlowRegistry.list_active_flows() == []
      
      # Should not error when called on empty registry
      :ok = FlowRegistry.shutdown_all_flows()
      assert FlowRegistry.list_active_flows() == []
    end
  end

  describe "process monitoring" do
    test "removes flow from registry when process crashes", %{flow_id_1: flow_id} do
      {:ok, pid} = FlowRegistry.start_flow(flow_id)
      assert flow_id in FlowRegistry.list_active_flows()
      
      # Kill the process to simulate a crash
      Process.exit(pid, :kill)
      :timer.sleep(100) # Allow time for cleanup
      
      refute flow_id in FlowRegistry.list_active_flows()
    end

    test "handles process restart correctly", %{flow_id_1: flow_id} do
      {:ok, pid1} = FlowRegistry.start_flow(flow_id)
      
      # Kill the process
      Process.exit(pid1, :kill)
      :timer.sleep(50)
      
      # Start a new process with the same ID
      {:ok, pid2} = FlowRegistry.start_flow(flow_id)
      
      assert pid1 != pid2
      assert Process.alive?(pid2)
      assert flow_id in FlowRegistry.list_active_flows()
    end
  end

  describe "integration with FlowServer" do
    test "started flows can be used with FlowServer functions", %{flow_id_1: flow_id} do
      {:ok, _pid} = FlowRegistry.start_flow(flow_id)
      
      # Test integration with FlowServer
      {:ok, flow_state} = FlowServer.create_flow(flow_id, %{name: "Integration Test"})
      
      assert flow_state.id == flow_id
      assert flow_state.name == "Integration Test"
      
      # Test that we can retrieve the flow
      {:ok, retrieved_flow} = FlowServer.get_flow(flow_id)
      assert retrieved_flow.name == "Integration Test"
    end
  end
end