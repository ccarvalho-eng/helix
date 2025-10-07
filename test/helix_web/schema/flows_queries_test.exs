defmodule HelixWeb.Schema.FlowsQueriesTest do
  use HelixWeb.GraphQLCase, async: true

  import Helix.AccountsFixtures
  import Helix.FlowsFixtures

  describe "myFlows query" do
    @my_flows_query """
    query MyFlows {
      myFlows {
        id
        title
        description
        viewportX
        viewportY
        viewportZoom
        version
        isTemplate
        templateCategory
      }
    }
    """

    test "returns current user's flows when authenticated", %{conn: conn} do
      {user, token} = create_user_and_token()
      flow1 = flow_fixture(%{user_id: user.id, title: "Flow 1"})
      flow2 = flow_fixture(%{user_id: user.id, title: "Flow 2"})

      # Create another user's flow (should not be returned)
      other_user = user_fixture()
      _other_flow = flow_fixture(%{user_id: other_user.id, title: "Other Flow"})

      response = graphql_query(conn, @my_flows_query, %{}, token)

      assert %{
               "data" => %{
                 "myFlows" => flows
               }
             } = response

      assert length(flows) == 2

      flow_ids = Enum.map(flows, & &1["id"])
      assert flow1.id in flow_ids
      assert flow2.id in flow_ids

      # Verify flow details
      flow1_data = Enum.find(flows, &(&1["id"] == flow1.id))
      assert flow1_data["title"] == "Flow 1"
      assert flow1_data["version"] == 1
      assert flow1_data["isTemplate"] == false
      assert flow1_data["viewportX"] == 0.0
      assert flow1_data["viewportY"] == 0.0
      assert flow1_data["viewportZoom"] == 1.0
    end

    test "returns empty list when user has no flows", %{conn: conn} do
      {_user, token} = create_user_and_token()

      response = graphql_query(conn, @my_flows_query, %{}, token)

      assert %{
               "data" => %{
                 "myFlows" => []
               }
             } = response
    end

    test "returns error when not authenticated", %{conn: conn} do
      response = graphql_query(conn, @my_flows_query)

      assert %{
               "data" => %{"myFlows" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end

    test "excludes soft-deleted flows", %{conn: conn} do
      {user, token} = create_user_and_token()
      flow1 = flow_fixture(%{user_id: user.id, title: "Active Flow"})
      flow2 = flow_fixture(%{user_id: user.id, title: "Deleted Flow"})

      # Soft delete flow2
      {:ok, _deleted} = Helix.Flows.Storage.delete_flow(flow2)

      response = graphql_query(conn, @my_flows_query, %{}, token)

      assert %{
               "data" => %{
                 "myFlows" => flows
               }
             } = response

      assert length(flows) == 1
      assert hd(flows)["id"] == flow1.id
    end
  end

  describe "flow query" do
    @flow_query """
    query Flow($id: ID!) {
      flow(id: $id) {
        id
        title
        description
        viewportX
        viewportY
        viewportZoom
        version
        isTemplate
        templateCategory
        nodes {
          id
          nodeId
          type
          positionX
          positionY
          width
          height
          data
        }
        edges {
          id
          edgeId
          sourceNodeId
          targetNodeId
          sourceHandle
          targetHandle
          edgeType
          animated
          data
        }
      }
    }
    """

    test "returns flow with nodes and edges when authenticated and authorized", %{conn: conn} do
      {user, token} = create_user_and_token()

      %{flow: flow, nodes: nodes, edges: edges} =
        flow_with_data_fixture(%{user_id: user.id, node_count: 2})

      response = graphql_query(conn, @flow_query, %{id: flow.id}, token)

      assert %{
               "data" => %{
                 "flow" => flow_data
               }
             } = response

      assert flow_data["id"] == flow.id
      assert flow_data["title"] =~ "Test Flow"
      assert flow_data["version"] == 1

      # Verify nodes
      assert length(flow_data["nodes"]) == 2
      node_ids = Enum.map(nodes, & &1.id)
      returned_node_ids = Enum.map(flow_data["nodes"], & &1["id"])
      assert Enum.all?(returned_node_ids, &(&1 in node_ids))

      # Verify node details
      first_node = hd(flow_data["nodes"])
      assert first_node["nodeId"] =~ "node-"
      assert first_node["type"] in ["agent", "tool", "model"]
      assert is_float(first_node["positionX"])
      assert is_float(first_node["positionY"])
      assert is_map(first_node["data"])

      # Verify edges
      assert length(flow_data["edges"]) == 1
      edge_ids = Enum.map(edges, & &1.id)
      returned_edge_ids = Enum.map(flow_data["edges"], & &1["id"])
      assert Enum.all?(returned_edge_ids, &(&1 in edge_ids))

      # Verify edge details
      first_edge = hd(flow_data["edges"])
      assert first_edge["edgeId"] =~ "edge-"
      assert first_edge["sourceNodeId"] == "node-1"
      assert first_edge["targetNodeId"] == "node-2"
      assert is_boolean(first_edge["animated"])
    end

    test "returns error when not authenticated", %{conn: conn} do
      user = user_fixture()
      flow = flow_fixture(%{user_id: user.id, title: "Test Flow"})

      response = graphql_query(conn, @flow_query, %{id: flow.id})

      assert %{
               "data" => %{"flow" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end

    test "returns error when flow not found", %{conn: conn} do
      {_user, token} = create_user_and_token()
      non_existent_id = Ecto.UUID.generate()

      response = graphql_query(conn, @flow_query, %{id: non_existent_id}, token)

      assert %{
               "data" => %{"flow" => nil},
               "errors" => [%{"message" => "Flow not found"}]
             } = response
    end

    test "returns error when user does not own the flow", %{conn: conn} do
      {_current_user, token} = create_user_and_token()
      other_user = user_fixture()
      other_flow = flow_fixture(%{user_id: other_user.id, title: "Other User's Flow"})

      response = graphql_query(conn, @flow_query, %{id: other_flow.id}, token)

      assert %{
               "data" => %{"flow" => nil},
               "errors" => [%{"message" => "Unauthorized"}]
             } = response
    end

    test "returns error for soft-deleted flow", %{conn: conn} do
      {user, token} = create_user_and_token()
      flow = flow_fixture(%{user_id: user.id, title: "Deleted Flow"})
      {:ok, _deleted} = Helix.Flows.Storage.delete_flow(flow)

      response = graphql_query(conn, @flow_query, %{id: flow.id}, token)

      assert %{
               "data" => %{"flow" => nil},
               "errors" => [%{"message" => "Flow not found"}]
             } = response
    end
  end
end
