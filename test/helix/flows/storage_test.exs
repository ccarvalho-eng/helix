defmodule Helix.Flows.StorageTest do
  use Helix.DataCase, async: true

  alias Helix.Flows.Storage

  import Helix.AccountsFixtures
  import Helix.FlowsFixtures

  describe "list_user_flows/1" do
    setup do
      user = user_fixture()
      {:ok, user: user}
    end

    test "returns empty list when user has no flows", %{user: user} do
      assert [] = Storage.list_user_flows(user.id)
    end

    test "returns user's flows ordered by updated_at desc", %{user: user} do
      {:ok, _flow1} = Storage.create_flow(%{user_id: user.id, title: "Flow 1"})
      {:ok, _flow2} = Storage.create_flow(%{user_id: user.id, title: "Flow 2"})

      flows = Storage.list_user_flows(user.id)
      assert length(flows) == 2
      # Verify ordered by updated_at desc (most recent first)
      [first, second] = flows
      assert DateTime.compare(first.updated_at, second.updated_at) in [:gt, :eq]
    end

    test "excludes soft-deleted flows", %{user: user} do
      {:ok, flow1} = Storage.create_flow(%{user_id: user.id, title: "Flow 1"})
      {:ok, flow2} = Storage.create_flow(%{user_id: user.id, title: "Flow 2"})
      {:ok, _deleted} = Storage.delete_flow(flow1)

      flows = Storage.list_user_flows(user.id)
      assert length(flows) == 1
      assert [^flow2] = flows
    end

    test "does not return other users' flows", %{user: user1} do
      user2 = user_fixture()
      _flow = flow_fixture(%{user_id: user2.id, title: "User 2 Flow"})

      assert [] = Storage.list_user_flows(user1.id)
    end
  end

  describe "get_flow/1" do
    setup do
      user = user_fixture()
      {:ok, user: user}
    end

    test "returns flow when it exists", %{user: user} do
      {:ok, created_flow} = Storage.create_flow(%{user_id: user.id, title: "Test Flow"})
      assert {:ok, flow} = Storage.get_flow(created_flow.id)
      assert flow.id == created_flow.id
      assert flow.title == "Test Flow"
    end

    test "returns error when flow does not exist" do
      assert {:error, :not_found} = Storage.get_flow(Ecto.UUID.generate())
    end

    test "returns error for soft-deleted flow", %{user: user} do
      {:ok, flow} = Storage.create_flow(%{user_id: user.id, title: "Test Flow"})
      {:ok, _deleted} = Storage.delete_flow(flow)

      assert {:error, :not_found} = Storage.get_flow(flow.id)
    end
  end

  describe "get_user_flow/2" do
    setup do
      user1 = user_fixture()
      user2 = user_fixture()
      {:ok, user1: user1, user2: user2}
    end

    test "returns flow when user owns it", %{user1: user} do
      {:ok, created_flow} = Storage.create_flow(%{user_id: user.id, title: "Test Flow"})
      assert {:ok, flow} = Storage.get_user_flow(user.id, created_flow.id)
      assert flow.id == created_flow.id
    end

    test "returns unauthorized when user does not own flow", %{user1: user1, user2: user2} do
      {:ok, flow} = Storage.create_flow(%{user_id: user2.id, title: "User 2 Flow"})

      assert {:error, :unauthorized} = Storage.get_user_flow(user1.id, flow.id)
    end

    test "returns not_found when flow does not exist", %{user1: user} do
      assert {:error, :not_found} = Storage.get_user_flow(user.id, Ecto.UUID.generate())
    end
  end

  describe "get_flow_with_data/1" do
    setup do
      user = user_fixture()

      %{flow: flow, nodes: nodes, edges: edges} =
        flow_with_data_fixture(%{user_id: user.id, node_count: 2})

      {:ok, user: user, flow: flow, expected_nodes: nodes, expected_edges: edges}
    end

    test "preloads nodes and edges", %{
      flow: flow,
      expected_nodes: expected_nodes,
      expected_edges: expected_edges
    } do
      assert {:ok, loaded_flow} = Storage.get_flow_with_data(flow.id)
      assert length(loaded_flow.nodes) == 2
      assert length(loaded_flow.edges) == 1

      node_ids = Enum.map(expected_nodes, & &1.id)
      edge_ids = Enum.map(expected_edges, & &1.id)

      assert Enum.all?(loaded_flow.nodes, &(&1.id in node_ids))
      assert Enum.all?(loaded_flow.edges, &(&1.id in edge_ids))
    end
  end

  describe "create_flow/1" do
    setup do
      user = user_fixture()
      {:ok, user: user}
    end

    test "creates flow with valid attributes", %{user: user} do
      attrs = %{
        user_id: user.id,
        title: "My Flow",
        description: "Test description",
        viewport_x: 10.0,
        viewport_y: 20.0,
        viewport_zoom: 1.5
      }

      assert {:ok, flow} = Storage.create_flow(attrs)
      assert flow.title == "My Flow"
      assert flow.description == "Test description"
      assert flow.viewport_x == 10.0
      assert flow.viewport_y == 20.0
      assert flow.viewport_zoom == 1.5
      assert flow.version == 1
      assert flow.is_template == false
      assert is_nil(flow.deleted_at)
    end

    test "creates flow with minimal attributes", %{user: user} do
      attrs = %{user_id: user.id, title: "Minimal Flow"}

      assert {:ok, flow} = Storage.create_flow(attrs)
      assert flow.title == "Minimal Flow"
      assert flow.viewport_x == 0.0
      assert flow.viewport_y == 0.0
      assert flow.viewport_zoom == 1.0
    end

    test "returns error when title is missing", %{user: user} do
      attrs = %{user_id: user.id}

      assert {:error, changeset} = Storage.create_flow(attrs)
      assert %{title: ["can't be blank"]} = errors_on(changeset)
    end

    test "returns error when title is empty", %{user: user} do
      attrs = %{user_id: user.id, title: ""}

      assert {:error, changeset} = Storage.create_flow(attrs)
      assert %{title: [_]} = errors_on(changeset)
    end

    test "returns error when viewport_zoom is invalid", %{user: user} do
      attrs = %{user_id: user.id, title: "Flow", viewport_zoom: 0}

      assert {:error, changeset} = Storage.create_flow(attrs)
      assert %{viewport_zoom: [_]} = errors_on(changeset)
    end

    test "returns error when user_id does not exist" do
      attrs = %{user_id: Ecto.UUID.generate(), title: "Flow"}

      assert {:error, changeset} = Storage.create_flow(attrs)
      assert %{user_id: [_]} = errors_on(changeset)
    end
  end

  describe "update_flow/2" do
    setup do
      user = user_fixture()
      flow = flow_fixture(%{user_id: user.id, title: "Original Title"})
      {:ok, user: user, flow: flow}
    end

    test "updates flow with valid attributes", %{flow: flow} do
      attrs = %{
        title: "Updated Title",
        description: "Updated description",
        viewport_x: 50.0
      }

      assert {:ok, updated_flow} = Storage.update_flow(flow, attrs)
      assert updated_flow.title == "Updated Title"
      assert updated_flow.description == "Updated description"
      assert updated_flow.viewport_x == 50.0
      assert updated_flow.version == 1
    end

    test "returns error when title is empty", %{flow: flow} do
      assert {:error, changeset} = Storage.update_flow(flow, %{title: ""})
      assert %{title: [_]} = errors_on(changeset)
    end

    test "returns error when viewport_zoom is invalid", %{flow: flow} do
      assert {:error, changeset} = Storage.update_flow(flow, %{viewport_zoom: -1})
      assert %{viewport_zoom: [_]} = errors_on(changeset)
    end
  end

  describe "delete_flow/1" do
    setup do
      user = user_fixture()
      flow = flow_fixture(%{user_id: user.id, title: "Test Flow"})
      {:ok, user: user, flow: flow}
    end

    test "soft deletes flow by setting deleted_at", %{flow: flow} do
      assert {:ok, deleted_flow} = Storage.delete_flow(flow)
      assert deleted_flow.deleted_at != nil
      assert {:error, :not_found} = Storage.get_flow(flow.id)
    end
  end

  describe "duplicate_flow/3" do
    setup do
      user = user_fixture()
      %{flow: flow} = flow_with_data_fixture(%{user_id: user.id, node_count: 2})
      {:ok, user: user, flow: flow}
    end

    test "duplicates flow with all nodes and edges", %{user: user, flow: source_flow} do
      assert {:ok, new_flow} = Storage.duplicate_flow(source_flow.id, user.id, "Duplicated Flow")
      assert new_flow.id != source_flow.id
      assert new_flow.title == "Duplicated Flow"
      assert new_flow.user_id == user.id

      {:ok, loaded_flow} = Storage.get_flow_with_data(new_flow.id)
      assert length(loaded_flow.nodes) == 2
      assert length(loaded_flow.edges) == 1
    end

    test "generates default title when not provided", %{user: user, flow: source_flow} do
      assert {:ok, new_flow} = Storage.duplicate_flow(source_flow.id, user.id)
      assert String.ends_with?(new_flow.title, "(Copy)")
    end

    test "returns error when source flow not found", %{user: user} do
      assert {:error, :not_found} = Storage.duplicate_flow(Ecto.UUID.generate(), user.id)
    end
  end

  describe "update_flow_data/4" do
    setup do
      user = user_fixture()
      flow = flow_fixture(%{user_id: user.id, title: "Test Flow"})
      {:ok, user: user, flow: flow}
    end

    test "updates nodes and edges with correct version", %{flow: flow} do
      nodes_attrs = [
        %{node_id: "n1", type: "agent", position_x: 10, position_y: 20, data: %{label: "Node 1"}},
        %{node_id: "n2", type: "tool", position_x: 30, position_y: 40, data: %{label: "Node 2"}}
      ]

      edges_attrs = [
        %{
          edge_id: "e1",
          source_node_id: "n1",
          target_node_id: "n2",
          animated: true,
          data: %{}
        }
      ]

      assert {:ok, updated_flow} = Storage.update_flow_data(flow.id, nodes_attrs, edges_attrs, 1)
      assert updated_flow.version == 2
      assert length(updated_flow.nodes) == 2
      assert length(updated_flow.edges) == 1
    end

    test "returns version conflict when version doesn't match", %{flow: flow} do
      assert {:error, :version_conflict} = Storage.update_flow_data(flow.id, [], [], 999)
    end

    test "replaces existing nodes and edges", %{flow: flow} do
      # Insert initial data
      flow_node_fixture(%{
        flow_id: flow.id,
        node_id: "old-node",
        type: "agent",
        position_x: 0,
        position_y: 0
      })

      new_nodes = [
        %{node_id: "new-node", type: "tool", position_x: 100, position_y: 100, data: %{}}
      ]

      assert {:ok, updated_flow} = Storage.update_flow_data(flow.id, new_nodes, [], 1)
      assert length(updated_flow.nodes) == 1
      assert hd(updated_flow.nodes).node_id == "new-node"
    end
  end

  describe "list_templates/1" do
    setup do
      user = user_fixture()

      _template1 = template_flow_fixture(%{user_id: user.id, template_category: "healthcare"})
      _template2 = template_flow_fixture(%{user_id: user.id, template_category: "finance"})
      _regular_flow = flow_fixture(%{user_id: user.id, title: "Regular Flow"})

      {:ok, user: user}
    end

    test "returns all templates when category is nil" do
      templates = Storage.list_templates()
      assert length(templates) == 2
      assert Enum.all?(templates, &(&1.is_template == true))
    end

    test "filters templates by category" do
      templates = Storage.list_templates("healthcare")
      assert length(templates) == 1
      assert hd(templates).template_category == "healthcare"
    end

    test "returns empty list for non-existent category" do
      templates = Storage.list_templates("nonexistent")
      assert templates == []
    end
  end
end
