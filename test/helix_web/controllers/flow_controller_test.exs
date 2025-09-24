defmodule HelixWeb.FlowControllerTest do
  use HelixWeb.ConnCase, async: true

  alias Helix.Flows

  setup do
    # Ensure Flows is started, but don't fail if already started
    case start_supervised({Flows, []}) do
      {:ok, _pid} -> :ok
      {:error, {:already_started, _pid}} -> :ok
    end

    :ok
  end

  describe "GET /" do
    test "renders the flow builder index page", %{conn: conn} do
      conn = get(conn, ~p"/")
      assert html_response(conn, 200) =~ "data-page=\"flow-builder\""
    end
  end

  describe "GET /flow/:id" do
    test "renders the flow builder for new flow", %{conn: conn} do
      conn = get(conn, ~p"/flow/new-flow-123")
      assert html_response(conn, 200) =~ "data-page=\"flow-builder\""
    end

    test "renders the flow builder for existing flow", %{conn: conn} do
      conn = get(conn, ~p"/flow/existing-flow-456")
      assert html_response(conn, 200) =~ "data-page=\"flow-builder\""
    end

    test "handles special characters in flow ID", %{conn: conn} do
      flow_id = "flow-with-special-chars-123_456"
      conn = get(conn, ~p"/flow/#{flow_id}")
      assert html_response(conn, 200) =~ "data-page=\"flow-builder\""
    end
  end

  describe "POST /api/flows/:id/sync" do
    test "successfully broadcasts flow changes", %{conn: conn} do
      flow_id = "test-flow-123"

      changes = %{
        "nodes" => [
          %{
            "id" => "node-1",
            "type" => "agent",
            "position" => %{"x" => 100, "y" => 200}
          }
        ],
        "edges" => []
      }

      # First, ensure there's an active session by joining a flow
      Flows.join_flow(flow_id, "test-client")

      # Subscribe to PubSub to verify broadcast
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows/#{flow_id}/sync", %{"changes" => changes})

      assert json_response(conn, 200) == %{
               "success" => true,
               "message" => "Flow changes broadcasted"
             }

      # Verify the broadcast was sent
      assert_receive {:flow_change, ^changes}, 1000
    end

    test "handles empty changes", %{conn: conn} do
      flow_id = "empty-changes-flow"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows/#{flow_id}/sync", %{})

      assert json_response(conn, 200) == %{
               "success" => true,
               "message" => "Flow changes broadcasted"
             }
    end

    test "handles malformed changes payload gracefully", %{conn: conn} do
      flow_id = "malformed-flow"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows/#{flow_id}/sync", %{"changes" => "invalid"})

      # Should accept all changes formats
      assert json_response(conn, 200) == %{
               "success" => true,
               "message" => "Flow changes broadcasted"
             }
    end

    test "handles missing changes parameter", %{conn: conn} do
      flow_id = "missing-changes-flow"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows/#{flow_id}/sync", %{"other" => "data"})

      assert json_response(conn, 200) == %{
               "success" => true,
               "message" => "Flow changes broadcasted"
             }
    end

    test "broadcasts complex flow changes", %{conn: conn} do
      flow_id = "complex-flow"

      changes = %{
        "nodes" => [
          %{
            "id" => "agent-1",
            "type" => "agent",
            "position" => %{"x" => 100, "y" => 100},
            "data" => %{
              "label" => "AI Agent",
              "description" => "Main processing agent",
              "config" => %{
                "temperature" => 0.7,
                "max_tokens" => 1000
              }
            }
          },
          %{
            "id" => "sensor-1",
            "type" => "sensor",
            "position" => %{"x" => 300, "y" => 100},
            "data" => %{
              "label" => "Data Sensor",
              "description" => "Input data collector"
            }
          }
        ],
        "edges" => [
          %{
            "id" => "edge-1",
            "source" => "sensor-1",
            "target" => "agent-1",
            "sourceHandle" => "output",
            "targetHandle" => "input"
          }
        ],
        "viewport" => %{
          "x" => 0,
          "y" => 0,
          "zoom" => 1.0
        }
      }

      # First, ensure there's an active session by joining a flow
      Flows.join_flow(flow_id, "test-client")

      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow_id}")

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows/#{flow_id}/sync", %{"changes" => changes})

      assert json_response(conn, 200) == %{
               "success" => true,
               "message" => "Flow changes broadcasted"
             }

      # Verify broadcast was sent
      assert_receive {:flow_change, ^changes}, 1000
    end

    test "handles concurrent sync requests", %{conn: conn} do
      flow_id = "concurrent-flow"

      # Send multiple concurrent requests
      tasks =
        Enum.map(1..5, fn i ->
          Task.async(fn ->
            changes = %{"nodes" => [%{"id" => "node-#{i}"}]}

            conn
            |> put_req_header("content-type", "application/json")
            |> post(~p"/api/flows/#{flow_id}/sync", %{"changes" => changes})
            |> json_response(200)
          end)
        end)

      results = Enum.map(tasks, &Task.await/1)

      # All should succeed
      expected_response = %{
        "success" => true,
        "message" => "Flow changes broadcasted"
      }

      assert Enum.all?(results, &(&1 == expected_response))
    end
  end

  describe "GET /api/flows/:id/status" do
    test "returns inactive status for non-existent flow", %{conn: conn} do
      flow_id = "non-existent-flow"

      conn = get(conn, ~p"/api/flows/#{flow_id}/status")

      assert json_response(conn, 200) == %{
               "active" => false,
               "client_count" => 0
             }
    end

    test "returns active status for flow with clients", %{conn: conn} do
      flow_id = "active-flow"
      client_id = "test-client"

      # Join a client to make the flow active
      {:ok, client_count} = Flows.join_flow(flow_id, client_id)

      conn = get(conn, ~p"/api/flows/#{flow_id}/status")

      response = json_response(conn, 200)
      assert response["active"] == true
      assert response["client_count"] == client_count
      assert is_integer(response["last_activity"])
    end

    test "reflects client count changes", %{conn: conn} do
      flow_id = "count-changes-flow"

      # Initially inactive
      conn1 = get(conn, ~p"/api/flows/#{flow_id}/status")
      assert json_response(conn1, 200)["client_count"] == 0

      # Add clients
      Flows.join_flow(flow_id, "client-1")
      Flows.join_flow(flow_id, "client-2")

      conn2 = get(conn, ~p"/api/flows/#{flow_id}/status")
      assert json_response(conn2, 200)["client_count"] == 2

      # Remove one client
      Flows.leave_flow(flow_id, "client-1")

      conn3 = get(conn, ~p"/api/flows/#{flow_id}/status")
      assert json_response(conn3, 200)["client_count"] == 1

      # Remove last client
      Flows.leave_flow(flow_id, "client-2")

      conn4 = get(conn, ~p"/api/flows/#{flow_id}/status")

      assert json_response(conn4, 200) == %{
               "active" => false,
               "client_count" => 0
             }
    end

    test "handles special characters in flow ID", %{conn: conn} do
      flow_id = "flow-with_special.chars-123"

      conn = get(conn, ~p"/api/flows/#{flow_id}/status")

      assert json_response(conn, 200) == %{
               "active" => false,
               "client_count" => 0
             }
    end

    test "returns consistent last_activity timestamp", %{conn: conn} do
      flow_id = "timestamp-flow"

      Flows.join_flow(flow_id, "client-1")

      conn1 = get(conn, ~p"/api/flows/#{flow_id}/status")
      response1 = json_response(conn1, 200)

      # Wait a moment
      :timer.sleep(50)

      conn2 = get(conn, ~p"/api/flows/#{flow_id}/status")
      response2 = json_response(conn2, 200)

      # Timestamp should be the same (no activity between calls)
      assert response1["last_activity"] == response2["last_activity"]

      # Wait to ensure timestamp will be different, then broadcast activity
      :timer.sleep(1001)
      Flows.broadcast_flow_change(flow_id, %{})

      conn3 = get(conn, ~p"/api/flows/#{flow_id}/status")
      response3 = json_response(conn3, 200)

      # Should be newer
      assert response3["last_activity"] > response1["last_activity"]
    end
  end

  describe "error handling" do
    test "sync handles URL decoding correctly", %{conn: conn} do
      # Test flow ID with encoded characters
      encoded_flow_id = "flow%20with%20spaces"

      conn =
        conn
        |> put_req_header("content-type", "application/json")
        |> post("/api/flows/#{encoded_flow_id}/sync", %{"changes" => %{}})

      assert json_response(conn, 200) == %{
               "success" => true,
               "message" => "Flow changes broadcasted"
             }
    end

    test "status handles URL decoding correctly", %{conn: conn} do
      encoded_flow_id = "flow%20with%20spaces"

      conn = get(conn, "/api/flows/#{encoded_flow_id}/status")

      assert json_response(conn, 200) == %{
               "active" => false,
               "client_count" => 0
             }
    end

    test "handles invalid JSON in sync request", %{conn: conn} do
      flow_id = "invalid-json-flow"

      # Phoenix should raise a ParseError for invalid JSON
      assert_raise Plug.Parsers.ParseError, fn ->
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows/#{flow_id}/sync", "invalid json")
      end
    end
  end

  describe "integration tests" do
    test "sync and status work together", %{conn: conn} do
      flow_id = "integration-flow"
      changes = %{"nodes" => [], "edges" => []}

      # Initially inactive
      conn1 = get(conn, ~p"/api/flows/#{flow_id}/status")
      assert json_response(conn1, 200)["active"] == false

      # Add a client to make it active
      Flows.join_flow(flow_id, "client-1")

      # Now should be active
      conn2 = get(conn, ~p"/api/flows/#{flow_id}/status")
      initial_activity = json_response(conn2, 200)["last_activity"]

      # Wait and sync changes
      :timer.sleep(1001)

      conn3 =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows/#{flow_id}/sync", %{"changes" => changes})

      assert json_response(conn3, 200)["success"] == true

      # Status should reflect updated activity
      conn4 = get(conn, ~p"/api/flows/#{flow_id}/status")
      updated_activity = json_response(conn4, 200)["last_activity"]

      assert updated_activity > initial_activity
    end

    test "multiple flows are handled independently", %{conn: conn} do
      flow1_id = "independent-flow-1"
      flow2_id = "independent-flow-2"

      # Set up different states for each flow
      Flows.join_flow(flow1_id, "client-1")
      Flows.join_flow(flow2_id, "client-2a")
      Flows.join_flow(flow2_id, "client-2b")

      # Check individual statuses
      conn1 = get(conn, ~p"/api/flows/#{flow1_id}/status")
      conn2 = get(conn, ~p"/api/flows/#{flow2_id}/status")

      assert json_response(conn1, 200)["client_count"] == 1
      assert json_response(conn2, 200)["client_count"] == 2

      # Sync changes to one flow
      changes = %{"test" => "data"}

      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow1_id}")
      Phoenix.PubSub.subscribe(Helix.PubSub, "flow:#{flow2_id}")

      conn3 =
        conn
        |> put_req_header("content-type", "application/json")
        |> post(~p"/api/flows/#{flow1_id}/sync", %{"changes" => changes})

      assert json_response(conn3, 200)["success"] == true

      # Only flow1 should receive the broadcast
      assert_receive {:flow_change, ^changes}, 1000
      refute_receive {:flow_change, _}, 100
    end
  end
end
