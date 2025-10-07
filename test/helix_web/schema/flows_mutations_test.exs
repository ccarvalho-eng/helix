defmodule HelixWeb.Schema.FlowsMutationsTest do
  use HelixWeb.GraphQLCase, async: true

  import Helix.AccountsFixtures
  import Helix.FlowsFixtures

  describe "createFlow mutation" do
    @create_flow_mutation """
    mutation CreateFlow($input: CreateFlowInput!) {
      createFlow(input: $input) {
        id
        title
        description
        viewportX
        viewportY
        viewportZoom
        version
        isTemplate
      }
    }
    """

    test "creates flow with valid input when authenticated", %{conn: conn} do
      {_user, token} = create_user_and_token()

      input = %{
        title: "My New Flow",
        description: "Test description",
        viewportX: 10.0,
        viewportY: 20.0,
        viewportZoom: 1.5
      }

      response = graphql_query(conn, @create_flow_mutation, %{input: input}, token)

      assert %{
               "data" => %{
                 "createFlow" => flow
               }
             } = response

      assert flow["title"] == "My New Flow"
      assert flow["description"] == "Test description"
      assert flow["viewportX"] == 10.0
      assert flow["viewportY"] == 20.0
      assert flow["viewportZoom"] == 1.5
      assert flow["version"] == 1
      assert flow["isTemplate"] == false
      assert flow["id"]
    end

    test "creates flow with minimal input", %{conn: conn} do
      {_user, token} = create_user_and_token()

      input = %{title: "Minimal Flow"}

      response = graphql_query(conn, @create_flow_mutation, %{input: input}, token)

      assert %{
               "data" => %{
                 "createFlow" => flow
               }
             } = response

      assert flow["title"] == "Minimal Flow"
      assert flow["viewportX"] == 0.0
      assert flow["viewportY"] == 0.0
      assert flow["viewportZoom"] == 1.0
    end

    test "returns error when not authenticated", %{conn: conn} do
      input = %{title: "Test Flow"}

      response = graphql_query(conn, @create_flow_mutation, %{input: input})

      assert %{
               "data" => %{"createFlow" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end

    test "returns error when title is missing", %{conn: conn} do
      {_user, token} = create_user_and_token()

      input = %{description: "No title"}

      response = graphql_query(conn, @create_flow_mutation, %{input: input}, token)

      assert %{"errors" => errors} = response
      assert length(errors) > 0
    end
  end

  describe "updateFlow mutation" do
    @update_flow_mutation """
    mutation UpdateFlow($id: ID!, $input: UpdateFlowInput!) {
      updateFlow(id: $id, input: $input) {
        id
        title
        description
        viewportX
        version
      }
    }
    """

    test "updates flow with valid input when authenticated and authorized", %{conn: conn} do
      {user, token} = create_user_and_token()
      flow = flow_fixture(%{user_id: user.id, title: "Original Title"})

      input = %{
        title: "Updated Title",
        description: "Updated description",
        viewportX: 50.0
      }

      response = graphql_query(conn, @update_flow_mutation, %{id: flow.id, input: input}, token)

      assert %{
               "data" => %{
                 "updateFlow" => updated_flow
               }
             } = response

      assert updated_flow["id"] == flow.id
      assert updated_flow["title"] == "Updated Title"
      assert updated_flow["description"] == "Updated description"
      assert updated_flow["viewportX"] == 50.0
    end

    test "returns error when flow not found", %{conn: conn} do
      {_user, token} = create_user_and_token()

      input = %{title: "New Title"}

      response =
        graphql_query(
          conn,
          @update_flow_mutation,
          %{id: Ecto.UUID.generate(), input: input},
          token
        )

      assert %{
               "data" => %{"updateFlow" => nil},
               "errors" => [%{"message" => "Flow not found"}]
             } = response
    end

    test "returns error when user does not own flow", %{conn: conn} do
      {_current_user, token} = create_user_and_token()
      other_user = user_fixture()
      flow = flow_fixture(%{user_id: other_user.id, title: "Other User's Flow"})

      input = %{title: "New Title"}

      response = graphql_query(conn, @update_flow_mutation, %{id: flow.id, input: input}, token)

      assert %{
               "data" => %{"updateFlow" => nil},
               "errors" => [%{"message" => "Unauthorized"}]
             } = response
    end

    test "returns error when not authenticated", %{conn: conn} do
      user = user_fixture()
      flow = flow_fixture(%{user_id: user.id, title: "Test Flow"})

      input = %{title: "New Title"}

      response = graphql_query(conn, @update_flow_mutation, %{id: flow.id, input: input})

      assert %{
               "data" => %{"updateFlow" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end
  end

  describe "updateFlowData mutation" do
    @update_flow_data_mutation """
    mutation UpdateFlowData($id: ID!, $input: UpdateFlowDataInput!) {
      updateFlowData(id: $id, input: $input) {
        id
        version
        nodes {
          nodeId
          type
          positionX
          positionY
        }
        edges {
          edgeId
          sourceNodeId
          targetNodeId
        }
      }
    }
    """

    test "updates flow data with valid input", %{conn: conn} do
      {user, token} = create_user_and_token()
      flow = flow_fixture(%{user_id: user.id, title: "Test Flow"})

      input = %{
        nodes: [
          %{
            nodeId: "node-1",
            type: "agent",
            positionX: 100.0,
            positionY: 100.0,
            data: Jason.encode!(%{label: "Node 1"})
          },
          %{
            nodeId: "node-2",
            type: "tool",
            positionX: 300.0,
            positionY: 100.0,
            data: Jason.encode!(%{label: "Node 2"})
          }
        ],
        edges: [
          %{
            edgeId: "edge-1",
            sourceNodeId: "node-1",
            targetNodeId: "node-2",
            animated: true,
            data: Jason.encode!(%{})
          }
        ],
        version: 1
      }

      response =
        graphql_query(conn, @update_flow_data_mutation, %{id: flow.id, input: input}, token)

      assert %{
               "data" => %{
                 "updateFlowData" => updated_flow
               }
             } = response

      assert updated_flow["version"] == 2
      assert length(updated_flow["nodes"]) == 2
      assert length(updated_flow["edges"]) == 1

      node_ids = Enum.map(updated_flow["nodes"], & &1["nodeId"])
      assert "node-1" in node_ids
      assert "node-2" in node_ids
    end

    test "returns version conflict error when version doesn't match", %{conn: conn} do
      {user, token} = create_user_and_token()
      flow = flow_fixture(%{user_id: user.id, title: "Test Flow"})

      input = %{
        nodes: [],
        edges: [],
        version: 999
      }

      response =
        graphql_query(conn, @update_flow_data_mutation, %{id: flow.id, input: input}, token)

      assert %{
               "data" => %{"updateFlowData" => nil},
               "errors" => [%{"message" => "Version conflict"}]
             } = response
    end

    test "returns error when user does not own flow", %{conn: conn} do
      {_current_user, token} = create_user_and_token()
      other_user = user_fixture()
      flow = flow_fixture(%{user_id: other_user.id, title: "Other User's Flow"})

      input = %{nodes: [], edges: [], version: 1}

      response =
        graphql_query(conn, @update_flow_data_mutation, %{id: flow.id, input: input}, token)

      assert %{
               "data" => %{"updateFlowData" => nil},
               "errors" => [%{"message" => "Unauthorized"}]
             } = response
    end
  end

  describe "deleteFlow mutation" do
    @delete_flow_mutation """
    mutation DeleteFlow($id: ID!) {
      deleteFlow(id: $id) {
        id
        title
      }
    }
    """

    test "deletes flow when authenticated and authorized", %{conn: conn} do
      {user, token} = create_user_and_token()
      flow = flow_fixture(%{user_id: user.id, title: "Flow to Delete"})

      response = graphql_query(conn, @delete_flow_mutation, %{id: flow.id}, token)

      assert %{
               "data" => %{
                 "deleteFlow" => deleted_flow
               }
             } = response

      assert deleted_flow["id"] == flow.id
      assert deleted_flow["title"] == "Flow to Delete"

      # Verify flow is soft-deleted (can't be retrieved)
      {:error, :not_found} = Helix.Flows.Storage.get_flow(flow.id)
    end

    test "returns error when flow not found", %{conn: conn} do
      {_user, token} = create_user_and_token()

      response = graphql_query(conn, @delete_flow_mutation, %{id: Ecto.UUID.generate()}, token)

      assert %{
               "data" => %{"deleteFlow" => nil},
               "errors" => [%{"message" => "Flow not found"}]
             } = response
    end

    test "returns error when user does not own flow", %{conn: conn} do
      {_current_user, token} = create_user_and_token()
      other_user = user_fixture()
      flow = flow_fixture(%{user_id: other_user.id, title: "Other User's Flow"})

      response = graphql_query(conn, @delete_flow_mutation, %{id: flow.id}, token)

      assert %{
               "data" => %{"deleteFlow" => nil},
               "errors" => [%{"message" => "Unauthorized"}]
             } = response
    end

    test "returns error when not authenticated", %{conn: conn} do
      user = user_fixture()
      flow = flow_fixture(%{user_id: user.id, title: "Test Flow"})

      response = graphql_query(conn, @delete_flow_mutation, %{id: flow.id})

      assert %{
               "data" => %{"deleteFlow" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end
  end

  describe "duplicateFlow mutation" do
    @duplicate_flow_mutation """
    mutation DuplicateFlow($id: ID!, $title: String) {
      duplicateFlow(id: $id, title: $title) {
        id
        title
        nodes {
          nodeId
          type
        }
        edges {
          edgeId
        }
      }
    }
    """

    test "duplicates flow with all nodes and edges", %{conn: conn} do
      {user, token} = create_user_and_token()
      %{flow: source_flow} = flow_with_data_fixture(%{user_id: user.id, node_count: 2})

      response =
        graphql_query(
          conn,
          @duplicate_flow_mutation,
          %{id: source_flow.id, title: "Copy of Flow"},
          token
        )

      assert %{
               "data" => %{
                 "duplicateFlow" => new_flow
               }
             } = response

      assert new_flow["id"] != source_flow.id
      assert new_flow["title"] == "Copy of Flow"
      assert length(new_flow["nodes"]) == 2
      assert length(new_flow["edges"]) == 1
    end

    test "generates default title when not provided", %{conn: conn} do
      {user, token} = create_user_and_token()
      source_flow = flow_fixture(%{user_id: user.id, title: "Original Flow"})

      response = graphql_query(conn, @duplicate_flow_mutation, %{id: source_flow.id}, token)

      assert %{
               "data" => %{
                 "duplicateFlow" => new_flow
               }
             } = response

      assert String.ends_with?(new_flow["title"], "(Copy)")
    end

    test "returns error when user does not own source flow", %{conn: conn} do
      {_current_user, token} = create_user_and_token()
      other_user = user_fixture()
      flow = flow_fixture(%{user_id: other_user.id, title: "Other User's Flow"})

      response = graphql_query(conn, @duplicate_flow_mutation, %{id: flow.id}, token)

      assert %{
               "data" => %{"duplicateFlow" => nil},
               "errors" => [%{"message" => "Unauthorized"}]
             } = response
    end

    test "returns error when not authenticated", %{conn: conn} do
      user = user_fixture()
      flow = flow_fixture(%{user_id: user.id, title: "Test Flow"})

      response = graphql_query(conn, @duplicate_flow_mutation, %{id: flow.id})

      assert %{
               "data" => %{"duplicateFlow" => nil},
               "errors" => [%{"message" => "Not authenticated"}]
             } = response
    end
  end
end
