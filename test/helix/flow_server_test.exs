defmodule Helix.FlowServerTest do
  use ExUnit.Case, async: false
  alias Helix.{FlowServer, FlowRegistry}

  setup do
    # Ensure clean state
    FlowRegistry.shutdown_all_flows()
    flow_id = "test_flow_#{:rand.uniform(1000)}"

    on_exit(fn ->
      FlowRegistry.stop_flow(flow_id)
    end)

    {:ok, flow_id: flow_id}
  end

  describe "start_link/1" do
    test "starts a FlowServer process", %{flow_id: flow_id} do
      {:ok, pid} = FlowServer.start_link(flow_id)
      assert Process.alive?(pid)
    end

    test "registers process with via tuple", %{flow_id: flow_id} do
      {:ok, _pid} = FlowServer.start_link(flow_id)
      assert GenServer.whereis(FlowServer.via_tuple(flow_id)) != nil
    end
  end

  describe "create_flow/2" do
    test "creates a flow with default attributes", %{flow_id: flow_id} do
      {:ok, flow_state} = FlowServer.create_flow(flow_id)

      assert flow_state.id == flow_id
      assert flow_state.name == "Untitled Flow"
      assert flow_state.description == ""
      assert flow_state.nodes == []
      assert flow_state.edges == []
      assert flow_state.viewport == %{x: 0, y: 0, zoom: 1}
      assert is_struct(flow_state.created_at, DateTime)
      assert is_struct(flow_state.updated_at, DateTime)
      assert flow_state.connected_users == []
    end

    test "creates a flow with custom attributes", %{flow_id: flow_id} do
      attrs = %{
        name: "Test Flow",
        description: "A test flow",
        nodes: [%{id: "node1", type: "custom"}],
        edges: [%{id: "edge1", source: "node1", target: "node2"}],
        viewport: %{x: 100, y: 50, zoom: 1.5}
      }

      {:ok, flow_state} = FlowServer.create_flow(flow_id, attrs)

      assert flow_state.name == "Test Flow"
      assert flow_state.description == "A test flow"
      assert length(flow_state.nodes) == 1
      assert length(flow_state.edges) == 1
      assert flow_state.viewport == %{x: 100, y: 50, zoom: 1.5}
    end
  end

  describe "get_flow/1" do
    test "returns flow state for existing flow", %{flow_id: flow_id} do
      {:ok, _} = FlowServer.create_flow(flow_id)
      {:ok, flow_state} = FlowServer.get_flow(flow_id)

      assert flow_state.id == flow_id
    end

    test "returns error for non-existing flow" do
      assert {:error, :not_found} = FlowServer.get_flow("non_existing_flow")
    end
  end

  describe "update_flow_metadata/2" do
    test "updates flow name and description", %{flow_id: flow_id} do
      {:ok, _} = FlowServer.create_flow(flow_id)

      attrs = %{name: "Updated Flow", description: "Updated description"}
      {:ok, flow_state} = FlowServer.update_flow_metadata(flow_id, attrs)

      assert flow_state.name == "Updated Flow"
      assert flow_state.description == "Updated description"
    end

    test "updates only provided fields", %{flow_id: flow_id} do
      {:ok, original} =
        FlowServer.create_flow(flow_id, %{name: "Original", description: "Original desc"})

      {:ok, flow_state} = FlowServer.update_flow_metadata(flow_id, %{name: "New Name"})

      assert flow_state.name == "New Name"
      assert flow_state.description == "Original desc"
      refute flow_state.updated_at == original.updated_at
    end
  end

  describe "update_nodes/2" do
    test "updates flow nodes", %{flow_id: flow_id} do
      {:ok, _} = FlowServer.create_flow(flow_id)

      new_nodes = [
        %{id: "node1", type: "input", position: %{x: 0, y: 0}},
        %{id: "node2", type: "output", position: %{x: 100, y: 100}}
      ]

      {:ok, flow_state} = FlowServer.update_nodes(flow_id, new_nodes)

      assert length(flow_state.nodes) == 2
      assert Enum.any?(flow_state.nodes, &(&1.id == "node1"))
      assert Enum.any?(flow_state.nodes, &(&1.id == "node2"))
    end
  end

  describe "update_edges/2" do
    test "updates flow edges", %{flow_id: flow_id} do
      {:ok, _} = FlowServer.create_flow(flow_id)

      new_edges = [
        %{id: "edge1", source: "node1", target: "node2", type: "default"}
      ]

      {:ok, flow_state} = FlowServer.update_edges(flow_id, new_edges)

      assert length(flow_state.edges) == 1
      assert List.first(flow_state.edges).id == "edge1"
    end
  end

  describe "update_viewport/2" do
    test "updates flow viewport", %{flow_id: flow_id} do
      {:ok, _} = FlowServer.create_flow(flow_id)

      new_viewport = %{x: 200, y: 150, zoom: 2.0}
      {:ok, flow_state} = FlowServer.update_viewport(flow_id, new_viewport)

      assert flow_state.viewport == new_viewport
    end
  end

  describe "user management" do
    test "adds and removes users", %{flow_id: flow_id} do
      {:ok, _} = FlowServer.create_flow(flow_id)

      # Add users
      :ok = FlowServer.user_joined(flow_id, "user1")
      :ok = FlowServer.user_joined(flow_id, "user2")

      {:ok, flow_state} = FlowServer.get_flow(flow_id)
      assert length(flow_state.connected_users) == 2
      assert "user1" in flow_state.connected_users
      assert "user2" in flow_state.connected_users

      # Remove user
      :ok = FlowServer.user_left(flow_id, "user1")

      {:ok, updated_flow_state} = FlowServer.get_flow(flow_id)
      assert length(updated_flow_state.connected_users) == 1
      assert "user2" in updated_flow_state.connected_users
      refute "user1" in updated_flow_state.connected_users
    end
  end

  describe "load_flow/2" do
    test "loads flow data from external source", %{flow_id: flow_id} do
      flow_data = %{
        "name" => "Loaded Flow",
        "description" => "Loaded from external source",
        "nodes" => [%{"id" => "loaded_node", "type" => "custom"}],
        "edges" => [%{"id" => "loaded_edge", "source" => "n1", "target" => "n2"}],
        "viewport" => %{"x" => 300, "y" => 200, "zoom" => 1.2}
      }

      {:ok, flow_state} = FlowServer.load_flow(flow_id, flow_data)

      assert flow_state.name == "Loaded Flow"
      assert flow_state.description == "Loaded from external source"
      assert length(flow_state.nodes) == 1
      assert length(flow_state.edges) == 1
      assert flow_state.viewport == %{"x" => 300, "y" => 200, "zoom" => 1.2}
    end
  end

  describe "via_tuple/1" do
    test "returns correct registry tuple" do
      flow_id = "test_flow"
      via_tuple = FlowServer.via_tuple(flow_id)

      assert via_tuple == {:via, Registry, {Helix.FlowProcessRegistry, flow_id}}
    end
  end
end
