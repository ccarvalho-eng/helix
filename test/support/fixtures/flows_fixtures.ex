defmodule Helix.FlowsFixtures do
  @moduledoc """
  This module defines test helpers for creating flow entities.
  """

  alias Helix.Flows.{FlowEdge, FlowNode}
  alias Helix.Repo

  @doc """
  Generate a unique flow.

  ## Examples

      iex> flow_fixture()
      %Flow{}

      iex> flow_fixture(%{title: "Custom Flow"})
      %Flow{title: "Custom Flow"}
  """
  def flow_fixture(attrs \\ %{}) do
    _user_id = Map.get(attrs, :user_id) || raise "user_id is required for flow_fixture"

    {:ok, flow} =
      attrs
      |> Enum.into(%{
        title: "Test Flow #{System.unique_integer([:positive])}",
        description: "Test description",
        viewport_x: 0.0,
        viewport_y: 0.0,
        viewport_zoom: 1.0
      })
      |> Helix.Flows.Storage.create_flow()

    flow
  end

  @doc """
  Generate a flow node.

  ## Examples

      iex> flow_node_fixture(%{flow_id: flow.id})
      %FlowNode{}

      iex> flow_node_fixture(%{flow_id: flow.id, type: "custom"})
      %FlowNode{type: "custom"}
  """
  def flow_node_fixture(attrs \\ %{}) do
    flow_id = Map.get(attrs, :flow_id) || raise "flow_id is required for flow_node_fixture"

    %FlowNode{}
    |> FlowNode.changeset(
      Enum.into(attrs, %{
        flow_id: flow_id,
        node_id: "node-#{System.unique_integer([:positive])}",
        type: "agent",
        position_x: 100.0,
        position_y: 100.0,
        width: 150.0,
        height: 80.0,
        data: %{label: "Test Node"}
      })
    )
    |> Repo.insert!()
  end

  @doc """
  Generate a flow edge.

  ## Examples

      iex> flow_edge_fixture(%{flow_id: flow.id, source_node_id: "n1", target_node_id: "n2"})
      %FlowEdge{}
  """
  def flow_edge_fixture(attrs \\ %{}) do
    flow_id = Map.get(attrs, :flow_id) || raise "flow_id is required for flow_edge_fixture"

    source_node_id =
      Map.get(attrs, :source_node_id) || raise "source_node_id is required for flow_edge_fixture"

    target_node_id =
      Map.get(attrs, :target_node_id) || raise "target_node_id is required for flow_edge_fixture"

    %FlowEdge{}
    |> FlowEdge.changeset(
      Enum.into(attrs, %{
        flow_id: flow_id,
        edge_id: "edge-#{System.unique_integer([:positive])}",
        source_node_id: source_node_id,
        target_node_id: target_node_id,
        source_handle: nil,
        target_handle: nil,
        edge_type: "default",
        animated: false,
        data: %{}
      })
    )
    |> Repo.insert!()
  end

  @doc """
  Generate a complete flow with nodes and edges.

  ## Examples

      iex> flow_with_data_fixture(%{user_id: user.id})
      %{flow: %Flow{}, nodes: [%FlowNode{}, ...], edges: [%FlowEdge{}]}

      iex> flow_with_data_fixture(%{user_id: user.id, node_count: 5})
      %{flow: %Flow{}, nodes: [5 nodes], edges: [4 edges]}
  """
  def flow_with_data_fixture(attrs \\ %{}) do
    user_id = Map.get(attrs, :user_id) || raise "user_id is required"
    node_count = Map.get(attrs, :node_count, 3)

    flow = flow_fixture(%{user_id: user_id})

    # Create nodes
    nodes =
      Enum.map(1..node_count, fn i ->
        flow_node_fixture(%{
          flow_id: flow.id,
          node_id: "node-#{i}",
          type: Enum.random(["agent", "tool", "model"]),
          position_x: i * 150.0,
          position_y: 100.0,
          data: %{label: "Node #{i}"}
        })
      end)

    # Create edges between consecutive nodes
    edges =
      if node_count > 1 do
        Enum.map(1..(node_count - 1), fn i ->
          flow_edge_fixture(%{
            flow_id: flow.id,
            source_node_id: "node-#{i}",
            target_node_id: "node-#{i + 1}",
            animated: rem(i, 2) == 0
          })
        end)
      else
        []
      end

    %{flow: flow, nodes: nodes, edges: edges}
  end

  @doc """
  Generate a template flow.

  ## Examples

      iex> template_flow_fixture(%{user_id: user.id, template_category: "healthcare"})
      %Flow{is_template: true, template_category: "healthcare"}
  """
  def template_flow_fixture(attrs \\ %{}) do
    user_id = Map.get(attrs, :user_id) || raise "user_id is required"
    category = Map.get(attrs, :template_category, "general")

    flow_fixture(%{
      user_id: user_id,
      title: "#{String.capitalize(category)} Template",
      description: "Template for #{category} workflows",
      is_template: true,
      template_category: category
    })
  end
end
