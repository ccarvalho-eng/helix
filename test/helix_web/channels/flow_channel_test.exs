defmodule HelixWeb.FlowChannelTest do
  use HelixWeb.ChannelCase, async: false
  alias Helix.{FlowRegistry, FlowServer}
  alias HelixWeb.{UserSocket, FlowChannel}

  setup do
    # Clean up any existing flows
    FlowRegistry.shutdown_all_flows()
    
    flow_id = "test_flow_#{:rand.uniform(10000)}"
    user_id = "test_user_#{:rand.uniform(1000)}"
    
    # Start flow process
    {:ok, _} = FlowRegistry.start_flow(flow_id)
    {:ok, _} = FlowServer.create_flow(flow_id, %{name: "Test Flow"})
    
    on_exit(fn ->
      FlowRegistry.stop_flow(flow_id)
    end)
    
    {:ok, flow_id: flow_id, user_id: user_id}
  end

  describe "join flow:* topic" do
    test "joins flow channel successfully", %{flow_id: flow_id, user_id: user_id} do
      {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
      
      {:ok, reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
      
      # Should receive initial flow state
      assert reply["id"] == flow_id
      assert reply["name"] == "Test Flow"
      assert is_list(reply["nodes"])
      assert is_list(reply["edges"])
      assert is_list(reply["connected_users"])
      
      # User should be added to connected users
      assert user_id in reply["connected_users"]
      
      leave(socket)
    end

    test "receives presence update when user joins", %{flow_id: flow_id, user_id: user_id} do
      # First user joins
      {:ok, socket1} = connect(UserSocket, %{"user_id" => user_id})
      {:ok, _reply, socket1} = subscribe_and_join(socket1, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
      
      # Second user joins
      user_id_2 = "test_user_2_#{:rand.uniform(1000)}"
      {:ok, socket2} = connect(UserSocket, %{"user_id" => user_id_2})
      {:ok, _reply, socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id_2})
      
      # First user should receive presence update
      assert_push "presence_updated", %{"connected_users" => connected_users}
      assert user_id in connected_users
      assert user_id_2 in connected_users
      
      leave(socket1)
      leave(socket2)
    end

    test "rejects join for non-existent flow" do
      user_id = "test_user_#{:rand.uniform(1000)}"
      {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
      
      assert {:error, %{reason: "Flow not found"}} = 
        subscribe_and_join(socket, FlowChannel, "flow:nonexistent_flow", %{"user_id" => user_id})
    end

    test "handles multiple users in same flow", %{flow_id: flow_id} do
      users = for i <- 1..3, do: "user_#{i}"
      
      # All users join
      sockets = for user_id <- users do
        {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
        {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
        socket
      end
      
      # Check that all users are connected
      {:ok, flow_state} = FlowServer.get_flow(flow_id)
      for user_id <- users do
        assert user_id in flow_state.connected_users
      end
      
      # Clean up
      for socket <- sockets, do: leave(socket)
    end
  end

  describe "flow operations" do
    setup %{flow_id: flow_id, user_id: user_id} do
      {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
      
      {:ok, socket: socket}
    end

    test "create_flow updates flow state", %{socket: socket, flow_id: flow_id} do
      attrs = %{name: "Channel Created Flow", description: "Created via channel"}
      
      ref = push(socket, "create_flow", attrs)
      assert_reply ref, :ok, reply
      
      assert reply["name"] == "Channel Created Flow"
      assert reply["description"] == "Created via channel"
      
      # Verify in FlowServer
      {:ok, flow_state} = FlowServer.get_flow(flow_id)
      assert flow_state.name == "Channel Created Flow"
    end

    test "get_flow returns current state", %{socket: socket, flow_id: flow_id} do
      ref = push(socket, "get_flow", %{})
      assert_reply ref, :ok, reply
      
      assert reply["id"] == flow_id
      assert reply["name"] == "Test Flow"
    end

    test "update_metadata broadcasts to all users", %{flow_id: flow_id, user_id: user_id} do
      # Setup two users
      {:ok, socket1} = connect(UserSocket, %{"user_id" => user_id})
      {:ok, _reply, socket1} = subscribe_and_join(socket1, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
      
      user_id_2 = "user_2"
      {:ok, socket2} = connect(UserSocket, %{"user_id" => user_id_2})
      {:ok, _reply, socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id_2})
      
      # Update metadata from first user
      attrs = %{name: "Updated Flow", description: "Updated description"}
      ref = push(socket1, "update_metadata", attrs)
      assert_reply ref, :ok, reply
      
      assert reply["name"] == "Updated Flow"
      
      # Second user should receive broadcast
      assert_push "flow_updated", broadcast_data
      assert broadcast_data["name"] == "Updated Flow"
      assert broadcast_data["description"] == "Updated description"
      
      leave(socket1)
      leave(socket2)
    end

    test "update_nodes broadcasts nodes_updated event", %{socket: socket} do
      nodes = [
        %{"id" => "node1", "type" => "input", "position" => %{"x" => 0, "y" => 0}},
        %{"id" => "node2", "type" => "output", "position" => %{"x" => 100, "y" => 100}}
      ]
      
      ref = push(socket, "update_nodes", %{"nodes" => nodes})
      assert_reply ref, :ok, reply
      
      assert length(reply["nodes"]) == 2
      
      # Should receive nodes_updated broadcast
      assert_push "nodes_updated", broadcast_data
      assert length(broadcast_data["nodes"]) == 2
    end

    test "update_edges broadcasts edges_updated event", %{socket: socket} do
      edges = [%{"id" => "edge1", "source" => "node1", "target" => "node2"}]
      
      ref = push(socket, "update_edges", %{"edges" => edges})
      assert_reply ref, :ok, reply
      
      assert length(reply["edges"]) == 1
      
      # Should receive edges_updated broadcast
      assert_push "edges_updated", broadcast_data
      assert length(broadcast_data["edges"]) == 1
    end

    test "update_viewport does not broadcast (local only)", %{socket: socket} do
      viewport = %{"x" => 200, "y" => 150, "zoom" => 2.0}
      
      ref = push(socket, "update_viewport", %{"viewport" => viewport})
      assert_reply ref, :ok, reply
      
      assert reply["viewport"] == viewport
      
      # Should NOT receive any broadcast for viewport changes
      refute_push "viewport_updated", _
      refute_push "flow_updated", _
    end

    test "save_flow triggers save_requested broadcast", %{socket: socket} do
      ref = push(socket, "save_flow", %{})
      assert_reply ref, :ok, _reply
      
      # Should receive save_requested broadcast
      assert_push "save_requested", broadcast_data
      assert is_map(broadcast_data)
      assert is_binary(broadcast_data["id"])
    end

    test "load_flow updates state and broadcasts", %{socket: socket} do
      flow_data = %{
        "name" => "Loaded Flow",
        "description" => "Loaded from external source",
        "nodes" => [%{"id" => "loaded_node", "type" => "custom"}],
        "edges" => [],
        "viewport" => %{"x" => 50, "y" => 50, "zoom" => 1.0}
      }
      
      ref = push(socket, "load_flow", %{"flow_data" => flow_data})
      assert_reply ref, :ok, reply
      
      assert reply["name"] == "Loaded Flow"
      assert length(reply["nodes"]) == 1
      
      # Should receive flow_updated broadcast
      assert_push "flow_updated", broadcast_data
      assert broadcast_data["name"] == "Loaded Flow"
    end
  end

  describe "error handling" do
    test "handles invalid flow operations gracefully", %{flow_id: flow_id, user_id: user_id} do
      {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
      
      # Send invalid event
      ref = push(socket, "invalid_event", %{})
      assert_reply ref, :error, %{"reason" => _}
      
      leave(socket)
    end

    test "handles malformed payloads", %{flow_id: flow_id, user_id: user_id} do
      {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
      
      # Send malformed data
      ref = push(socket, "update_nodes", "not_a_map")
      assert_reply ref, :error, %{"reason" => _}
      
      leave(socket)
    end
  end

  describe "presence management" do
    test "removes user from presence when they leave", %{flow_id: flow_id, user_id: user_id} do
      {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
      
      # Verify user is connected
      {:ok, flow_state} = FlowServer.get_flow(flow_id)
      assert user_id in flow_state.connected_users
      
      # Leave channel
      leave(socket)
      
      # Give time for cleanup
      :timer.sleep(100)
      
      # Verify user is removed
      {:ok, updated_flow_state} = FlowServer.get_flow(flow_id)
      refute user_id in updated_flow_state.connected_users
    end

    test "broadcasts presence changes to remaining users", %{flow_id: flow_id} do
      # Two users join
      user_id_1 = "user_1"
      {:ok, socket1} = connect(UserSocket, %{"user_id" => user_id_1})
      {:ok, _reply, socket1} = subscribe_and_join(socket1, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id_1})
      
      user_id_2 = "user_2"
      {:ok, socket2} = connect(UserSocket, %{"user_id" => user_id_2})
      {:ok, _reply, socket2} = subscribe_and_join(socket2, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id_2})
      
      # First user leaves
      leave(socket1)
      
      # Second user should receive presence update
      assert_push "presence_updated", %{"connected_users" => connected_users}
      assert user_id_2 in connected_users
      refute user_id_1 in connected_users
      
      leave(socket2)
    end
  end

  describe "concurrent operations" do
    test "handles concurrent updates safely", %{flow_id: flow_id} do
      # Create multiple connections
      tasks = for i <- 1..5 do
        Task.async(fn ->
          user_id = "concurrent_user_#{i}"
          {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
          {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
          
          # Perform concurrent updates
          ref = push(socket, "update_metadata", %{"name" => "Concurrent #{i}"})
          assert_reply ref, :ok, _reply
          
          leave(socket)
          :ok
        end)
      end
      
      results = Task.await_many(tasks, 5000)
      assert Enum.all?(results, fn result -> result == :ok end)
      
      # Flow should still be in valid state
      {:ok, flow_state} = FlowServer.get_flow(flow_id)
      assert is_binary(flow_state.name)
      assert String.contains?(flow_state.name, "Concurrent")
    end
  end

  describe "integration with FlowServer" do
    test "channel operations are reflected in FlowServer state", %{flow_id: flow_id, user_id: user_id} do
      {:ok, socket} = connect(UserSocket, %{"user_id" => user_id})
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowChannel, "flow:#{flow_id}", %{"user_id" => user_id})
      
      # Update via channel
      ref = push(socket, "update_metadata", %{"name" => "Integration Test"})
      assert_reply ref, :ok, _reply
      
      # Verify in FlowServer
      {:ok, flow_state} = FlowServer.get_flow(flow_id)
      assert flow_state.name == "Integration Test"
      
      leave(socket)
    end
  end
end