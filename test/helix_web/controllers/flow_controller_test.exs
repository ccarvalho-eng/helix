defmodule HelixWeb.FlowControllerTest do
  use HelixWeb.ConnCase, async: false
  alias Helix.{FlowRegistry, FlowServer}

  setup %{conn: conn} do
    # Clean state before each test
    FlowRegistry.shutdown_all_flows()
    
    flow_id = "test_flow_#{:rand.uniform(10000)}"
    
    on_exit(fn ->
      FlowRegistry.stop_flow(flow_id)
    end)
    
    {:ok, conn: put_req_header(conn, "accept", "application/json"), flow_id: flow_id}
  end

  describe "index/2" do
    test "renders flow builder page", %{conn: conn} do
      conn = get(conn, ~p"/flow")
      assert html_response(conn, 200)
    end
  end

  describe "GET /api/flows" do
    test "returns empty list when no flows exist", %{conn: conn} do
      conn = get(conn, ~p"/api/flows")
      response = json_response(conn, 200)
      
      assert response["flows"] == []
    end

    test "returns list of active flows", %{conn: conn, flow_id: flow_id} do
      # Create a flow
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      {:ok, _} = FlowServer.create_flow(flow_id, %{name: "Test Flow"})
      
      conn = get(conn, ~p"/api/flows")
      response = json_response(conn, 200)
      
      assert is_list(response["flows"])
      assert length(response["flows"]) == 1
      
      flow = List.first(response["flows"])
      assert flow["id"] == flow_id
      assert flow["name"] == "Test Flow"
    end

    test "handles flows with invalid state gracefully", %{conn: conn, flow_id: flow_id} do
      # Start flow but don't create state
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      
      conn = get(conn, ~p"/api/flows")
      response = json_response(conn, 200)
      
      assert is_list(response["flows"])
      flow = Enum.find(response["flows"], fn f -> f["id"] == flow_id end)
      
      if flow do
        assert flow["error"] == "failed_to_get_state"
      end
    end
  end

  describe "GET /api/flows/:id" do
    test "returns flow when it exists", %{conn: conn, flow_id: flow_id} do
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      {:ok, _} = FlowServer.create_flow(flow_id, %{
        name: "Test Flow", 
        description: "A test flow"
      })
      
      conn = get(conn, ~p"/api/flows/#{flow_id}")
      response = json_response(conn, 200)
      
      assert response["id"] == flow_id
      assert response["name"] == "Test Flow"
      assert response["description"] == "A test flow"
      assert is_list(response["nodes"])
      assert is_list(response["edges"])
    end

    test "returns 404 when flow does not exist", %{conn: conn} do
      conn = get(conn, ~p"/api/flows/nonexistent_flow")
      response = json_response(conn, 404)
      
      assert response["error"] == "Flow not found"
    end
  end

  describe "POST /api/flows" do
    test "creates a new flow with default values", %{conn: conn} do
      conn = post(conn, ~p"/api/flows", %{})
      response = json_response(conn, 201)
      
      assert is_binary(response["id"])
      assert response["name"] == "Untitled Flow"
      assert response["description"] == ""
      assert response["nodes"] == []
      assert response["edges"] == []
      assert response["connected_users"] == []
    end

    test "creates a flow with custom attributes", %{conn: conn} do
      attrs = %{
        name: "Custom Flow",
        description: "A custom test flow",
        nodes: [%{id: "node1", type: "input"}],
        edges: [%{id: "edge1", source: "node1", target: "node2"}]
      }
      
      conn = post(conn, ~p"/api/flows", attrs)
      response = json_response(conn, 201)
      
      assert response["name"] == "Custom Flow"
      assert response["description"] == "A custom test flow"
      assert length(response["nodes"]) == 1
      assert length(response["edges"]) == 1
    end

    test "creates a flow with specific ID", %{conn: conn, flow_id: flow_id} do
      attrs = %{id: flow_id, name: "Specific ID Flow"}
      
      conn = post(conn, ~p"/api/flows", attrs)
      response = json_response(conn, 201)
      
      assert response["id"] == flow_id
      assert response["name"] == "Specific ID Flow"
    end

    test "handles creation errors gracefully", %{conn: conn, flow_id: flow_id} do
      # Create flow first
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      {:ok, _} = FlowServer.create_flow(flow_id)
      
      # Try to create again with same ID
      attrs = %{id: flow_id, name: "Duplicate Flow"}
      conn = post(conn, ~p"/api/flows", attrs)
      
      # Should either succeed (idempotent) or return appropriate error
      assert conn.status in [200, 201, 400]
    end
  end

  describe "PUT /api/flows/:id" do
    setup %{flow_id: flow_id} do
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      {:ok, _} = FlowServer.create_flow(flow_id, %{name: "Original Flow"})
      :ok
    end

    test "updates flow metadata", %{conn: conn, flow_id: flow_id} do
      attrs = %{name: "Updated Flow", description: "Updated description"}
      
      conn = put(conn, ~p"/api/flows/#{flow_id}", attrs)
      response = json_response(conn, 200)
      
      assert response["name"] == "Updated Flow"
      assert response["description"] == "Updated description"
    end

    test "updates flow nodes", %{conn: conn, flow_id: flow_id} do
      nodes = [
        %{id: "node1", type: "input", position: %{x: 0, y: 0}},
        %{id: "node2", type: "output", position: %{x: 100, y: 100}}
      ]
      
      conn = put(conn, ~p"/api/flows/#{flow_id}", %{nodes: nodes})
      response = json_response(conn, 200)
      
      assert length(response["nodes"]) == 2
    end

    test "updates flow edges", %{conn: conn, flow_id: flow_id} do
      edges = [%{id: "edge1", source: "node1", target: "node2"}]
      
      conn = put(conn, ~p"/api/flows/#{flow_id}", %{edges: edges})
      response = json_response(conn, 200)
      
      assert length(response["edges"]) == 1
    end

    test "updates flow viewport", %{conn: conn, flow_id: flow_id} do
      viewport = %{x: 200, y: 150, zoom: 2.0}
      
      conn = put(conn, ~p"/api/flows/#{flow_id}", %{viewport: viewport})
      response = json_response(conn, 200)
      
      assert response["viewport"] == %{"x" => 200, "y" => 150, "zoom" => 2.0}
    end

    test "updates multiple attributes at once", %{conn: conn, flow_id: flow_id} do
      attrs = %{
        name: "Multi Update",
        description: "Updated multiple things",
        nodes: [%{id: "node1", type: "custom"}],
        edges: [%{id: "edge1", source: "node1", target: "node2"}]
      }
      
      conn = put(conn, ~p"/api/flows/#{flow_id}", attrs)
      response = json_response(conn, 200)
      
      assert response["name"] == "Multi Update"
      assert response["description"] == "Updated multiple things"
      assert length(response["nodes"]) == 1
      assert length(response["edges"]) == 1
    end

    test "returns 404 for non-existing flow", %{conn: conn} do
      conn = put(conn, ~p"/api/flows/nonexistent", %{name: "Won't work"})
      response = json_response(conn, 404)
      
      assert response["error"] == "Flow not found"
    end
  end

  describe "DELETE /api/flows/:id" do
    test "deletes existing flow", %{conn: conn, flow_id: flow_id} do
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      {:ok, _} = FlowServer.create_flow(flow_id)
      
      conn = delete(conn, ~p"/api/flows/#{flow_id}")
      assert response(conn, 204)
      
      # Verify flow is deleted
      refute flow_id in FlowRegistry.list_active_flows()
    end

    test "returns 404 for non-existing flow", %{conn: conn} do
      conn = delete(conn, ~p"/api/flows/nonexistent")
      response = json_response(conn, 404)
      
      assert response["error"] == "Flow not found"
    end
  end

  describe "POST /api/flows/:id/save" do
    test "triggers save for existing flow", %{conn: conn, flow_id: flow_id} do
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      {:ok, _} = FlowServer.create_flow(flow_id)
      
      conn = post(conn, ~p"/api/flows/#{flow_id}/save")
      response = json_response(conn, 200)
      
      assert response["saved"] == true
    end

    test "returns 404 for non-existing flow", %{conn: conn} do
      conn = post(conn, ~p"/api/flows/nonexistent/save")
      response = json_response(conn, 404)
      
      assert response["error"] == "Flow not found"
    end
  end

  describe "GET /api/flows/active" do
    test "returns active flows information", %{conn: conn} do
      conn = get(conn, ~p"/api/flows/active")
      response = json_response(conn, 200)
      
      assert is_list(response["active_flows"])
      assert is_integer(response["count"])
      assert response["count"] == length(response["active_flows"])
    end

    test "includes flow metadata", %{conn: conn, flow_id: flow_id} do
      {:ok, _} = FlowRegistry.start_flow(flow_id)
      
      conn = get(conn, ~p"/api/flows/active")
      response = json_response(conn, 200)
      
      assert response["count"] >= 1
      
      # Find our flow in the active flows
      flow_info = Enum.find(response["active_flows"], fn f -> f["flow_id"] == flow_id end)
      assert flow_info != nil
      assert is_binary(flow_info["started_at"])
    end
  end

  describe "error handling" do
    test "handles malformed JSON gracefully", %{conn: conn} do
      conn = 
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows", "{invalid json}")
      
      # Should return 400 Bad Request for malformed JSON
      assert conn.status == 400
    end

    test "handles missing content-type header", %{conn: conn} do
      conn = 
        conn
        |> delete_req_header("content-type")
        |> post(~p"/api/flows", %{name: "Test"})
      
      # Should still work or return appropriate error
      assert conn.status in [200, 201, 400, 415]
    end
  end

  describe "concurrency and race conditions" do
    test "handles concurrent flow creation safely", %{flow_id: flow_id} do
      # Start multiple tasks trying to create the same flow
      tasks = for i <- 1..5 do
        Task.async(fn ->
          conn = build_conn() |> put_req_header("accept", "application/json")
          post(conn, ~p"/api/flows", %{id: flow_id, name: "Concurrent #{i}"})
        end)
      end
      
      results = Task.await_many(tasks, 5000)
      
      # At least one should succeed
      success_count = Enum.count(results, fn conn -> conn.status in [200, 201] end)
      assert success_count >= 1
      
      # Flow should exist and be accessible
      conn = build_conn() |> put_req_header("accept", "application/json")
      conn = get(conn, ~p"/api/flows/#{flow_id}")
      assert conn.status == 200
    end
  end
end