defmodule Helix.Flows.Storage do
  @moduledoc """
  Storage context for managing flow persistence.

  Provides CRUD operations for flows, nodes, and edges with proper
  authorization and validation.
  """

  import Ecto.Query, warn: false

  alias Helix.Repo
  alias Helix.Flows.{Flow, FlowEdge, FlowNode}

  @type flow_id :: binary()
  @type user_id :: binary()
  @type flow_with_data :: %{flow: Flow.t(), nodes: [FlowNode.t()], edges: [FlowEdge.t()]}

  ## Flow CRUD operations

  @doc """
  Lists all flows for a user (excluding soft-deleted flows).

  ## Parameters
    - user_id: The user's ID

  ## Returns
    - List of Flow structs

  ## Examples

      iex> list_user_flows(user_id)
      [%Flow{}, ...]
  """
  @spec list_user_flows(user_id()) :: [Flow.t()]
  def list_user_flows(user_id) do
    from(f in Flow,
      where: f.user_id == ^user_id,
      where: is_nil(f.deleted_at),
      order_by: [desc: f.updated_at]
    )
    |> Repo.all()
  end

  @doc """
  Gets a single flow by ID (excluding soft-deleted flows).

  ## Parameters
    - flow_id: The flow ID

  ## Returns
    - `{:ok, flow}` if found
    - `{:error, :not_found}` if not found or deleted

  ## Examples

      iex> get_flow(flow_id)
      {:ok, %Flow{}}

      iex> get_flow("nonexistent")
      {:error, :not_found}
  """
  @spec get_flow(flow_id()) :: {:ok, Flow.t()} | {:error, :not_found}
  def get_flow(flow_id) do
    case Repo.get(Flow, flow_id) do
      %Flow{deleted_at: nil} = flow -> {:ok, flow}
      %Flow{} -> {:error, :not_found}
      nil -> {:error, :not_found}
    end
  end

  @doc """
  Gets a flow with authorization check for a specific user.

  ## Parameters
    - user_id: The user ID
    - flow_id: The flow ID

  ## Returns
    - `{:ok, flow}` if found and user is authorized
    - `{:error, :not_found}` if not found
    - `{:error, :unauthorized}` if user is not the owner

  ## Examples

      iex> get_user_flow(user_id, flow_id)
      {:ok, %Flow{}}
  """
  @spec get_user_flow(user_id(), flow_id()) ::
          {:ok, Flow.t()} | {:error, :not_found | :unauthorized}
  def get_user_flow(user_id, flow_id) do
    case get_flow(flow_id) do
      {:ok, %Flow{user_id: ^user_id} = flow} -> {:ok, flow}
      {:ok, _flow} -> {:error, :unauthorized}
      error -> error
    end
  end

  @doc """
  Gets a flow with authorization check and preloaded data (nodes and edges).

  Combines authorization check and data preloading in a single operation
  for better performance.

  ## Parameters
    - user_id: The user ID
    - flow_id: The flow ID

  ## Returns
    - `{:ok, flow}` with nodes and edges preloaded if found and user is authorized
    - `{:error, :not_found}` if not found
    - `{:error, :unauthorized}` if user is not the owner

  ## Examples

      iex> get_user_flow_with_data(user_id, flow_id)
      {:ok, %Flow{nodes: [...], edges: [...]}}
  """
  @spec get_user_flow_with_data(user_id(), flow_id()) ::
          {:ok, Flow.t()} | {:error, :not_found | :unauthorized}
  def get_user_flow_with_data(user_id, flow_id) do
    case get_flow(flow_id) do
      {:ok, %Flow{user_id: ^user_id} = flow} ->
        {:ok, Repo.preload(flow, [:nodes, :edges])}

      {:ok, _flow} ->
        {:error, :unauthorized}

      error ->
        error
    end
  end

  @doc """
  Gets a flow with all nodes and edges preloaded.

  ## Parameters
    - flow_id: The flow ID

  ## Returns
    - `{:ok, flow}` with nodes and edges preloaded
    - `{:error, :not_found}` if not found or deleted

  ## Examples

      iex> get_flow_with_data(flow_id)
      {:ok, %Flow{nodes: [...], edges: [...]}}
  """
  @spec get_flow_with_data(flow_id()) :: {:ok, Flow.t()} | {:error, :not_found}
  def get_flow_with_data(flow_id) do
    case get_flow(flow_id) do
      {:ok, flow} ->
        flow = Repo.preload(flow, [:nodes, :edges])
        {:ok, flow}

      error ->
        error
    end
  end

  @doc """
  Creates a new flow.

  ## Parameters
    - attrs: Map with :user_id, :title, and optional fields

  ## Returns
    - `{:ok, flow}` if successful
    - `{:error, changeset}` if validation fails

  ## Examples

      iex> create_flow(%{user_id: user_id, title: "My Flow"})
      {:ok, %Flow{}}
  """
  @spec create_flow(map()) :: {:ok, Flow.t()} | {:error, Ecto.Changeset.t()}
  def create_flow(attrs) do
    %Flow{}
    |> Flow.create_changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a flow's metadata (title, description, viewport).

  ## Parameters
    - flow: The Flow struct
    - attrs: Map of attributes to update

  ## Returns
    - `{:ok, flow}` if successful
    - `{:error, changeset}` if validation fails

  ## Examples

      iex> update_flow(flow, %{title: "Updated Title"})
      {:ok, %Flow{}}
  """
  @spec update_flow(Flow.t(), map()) :: {:ok, Flow.t()} | {:error, Ecto.Changeset.t()}
  def update_flow(%Flow{} = flow, attrs) do
    flow
    |> Flow.update_changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Soft deletes a flow by setting deleted_at timestamp.

  ## Parameters
    - flow: The Flow struct

  ## Returns
    - `{:ok, flow}` if successful
    - `{:error, changeset}` if update fails

  ## Examples

      iex> delete_flow(flow)
      {:ok, %Flow{deleted_at: ~U[2025-10-07 09:00:00Z]}}
  """
  @spec delete_flow(Flow.t()) :: {:ok, Flow.t()} | {:error, Ecto.Changeset.t()}
  def delete_flow(%Flow{} = flow) do
    flow
    |> Flow.soft_delete_changeset()
    |> Repo.update()
  end

  @doc """
  Duplicates a flow with all its nodes and edges for a user.

  ## Parameters
    - flow_id: The source flow ID
    - user_id: The user ID who will own the duplicate
    - new_title: Optional title for the duplicated flow

  ## Returns
    - `{:ok, new_flow}` with nodes and edges preloaded
    - `{:error, :not_found}` if source flow not found

  ## Examples

      iex> duplicate_flow(flow_id, user_id, "Copy of Flow")
      {:ok, %Flow{nodes: [...], edges: [...]}}
  """
  @spec duplicate_flow(flow_id(), user_id(), String.t() | nil) ::
          {:ok, Flow.t()} | {:error, :not_found | Ecto.Changeset.t()}
  def duplicate_flow(flow_id, user_id, new_title \\ nil) do
    with {:ok, source_flow} <- get_flow_with_data(flow_id) do
      title = new_title || "#{source_flow.title} (Copy)"
      now = DateTime.utc_now() |> DateTime.truncate(:second)

      new_flow_attrs = %{
        user_id: user_id,
        title: title,
        description: source_flow.description,
        viewport_x: source_flow.viewport_x,
        viewport_y: source_flow.viewport_y,
        viewport_zoom: source_flow.viewport_zoom,
        is_template: false
      }

      # Use Ecto.Multi for atomic duplication
      Ecto.Multi.new()
      |> Ecto.Multi.insert(:new_flow, Flow.create_changeset(%Flow{}, new_flow_attrs))
      |> Ecto.Multi.run(:nodes, fn _repo, %{new_flow: new_flow} ->
        nodes_attrs =
          Enum.map(source_flow.nodes, fn node ->
            %{
              flow_id: new_flow.id,
              node_id: node.node_id,
              type: node.type,
              position_x: node.position_x,
              position_y: node.position_y,
              width: node.width,
              height: node.height,
              data: node.data,
              inserted_at: now,
              updated_at: now
            }
          end)

        {count, _} = Repo.insert_all(FlowNode, nodes_attrs)
        {:ok, count}
      end)
      |> Ecto.Multi.run(:edges, fn _repo, %{new_flow: new_flow} ->
        edges_attrs =
          Enum.map(source_flow.edges, fn edge ->
            %{
              flow_id: new_flow.id,
              edge_id: edge.edge_id,
              source_node_id: edge.source_node_id,
              target_node_id: edge.target_node_id,
              source_handle: edge.source_handle,
              target_handle: edge.target_handle,
              edge_type: edge.edge_type,
              animated: edge.animated,
              data: edge.data,
              inserted_at: now,
              updated_at: now
            }
          end)

        {count, _} = Repo.insert_all(FlowEdge, edges_attrs)
        {:ok, count}
      end)
      |> Repo.transaction()
      |> case do
        {:ok, %{new_flow: new_flow}} ->
          # Preload nodes and edges before returning
          {:ok, Repo.preload(new_flow, [:nodes, :edges])}

        {:error, :new_flow, changeset, _} ->
          {:error, changeset}

        {:error, _, reason, _} ->
          {:error, reason}
      end
    end
  end

  ## Flow data operations (nodes and edges)

  @doc """
  Updates flow data (nodes and edges) in a single transaction.

  Uses optimistic locking via the version field to prevent conflicts.

  ## Parameters
    - flow: The Flow struct
    - nodes_attrs: List of node attribute maps
    - edges_attrs: List of edge attribute maps
    - expected_version: Expected current version for optimistic locking

  ## Returns
    - `{:ok, flow}` with updated data preloaded
    - `{:error, :version_conflict}` if version doesn't match
    - `{:error, changeset}` if validation fails

  ## Examples

      iex> update_flow_data(flow, nodes, edges, 1)
      {:ok, %Flow{version: 2, nodes: [...], edges: [...]}}
  """
  @spec update_flow_data(Flow.t(), [map()], [map()], integer()) ::
          {:ok, Flow.t()} | {:error, :version_conflict | Ecto.Changeset.t()}
  def update_flow_data(%Flow{} = flow, nodes_attrs, edges_attrs, expected_version) do
    with :ok <- check_version(flow, expected_version) do
      now = DateTime.utc_now() |> DateTime.truncate(:second)

      # Prepare nodes and edges with timestamps for bulk insert
      nodes_to_insert =
        Enum.map(nodes_attrs, fn node_attrs ->
          node_attrs
          |> Map.put(:flow_id, flow.id)
          |> Map.put(:inserted_at, now)
          |> Map.put(:updated_at, now)
        end)

      edges_to_insert =
        Enum.map(edges_attrs, fn edge_attrs ->
          edge_attrs
          |> Map.put(:flow_id, flow.id)
          |> Map.put(:inserted_at, now)
          |> Map.put(:updated_at, now)
        end)

      # Use Ecto.Multi for atomic transaction
      Ecto.Multi.new()
      |> Ecto.Multi.delete_all(:delete_nodes, from(n in FlowNode, where: n.flow_id == ^flow.id))
      |> Ecto.Multi.delete_all(:delete_edges, from(e in FlowEdge, where: e.flow_id == ^flow.id))
      |> Ecto.Multi.insert_all(:insert_nodes, FlowNode, nodes_to_insert)
      |> Ecto.Multi.insert_all(:insert_edges, FlowEdge, edges_to_insert)
      |> Ecto.Multi.update(:increment_version, Flow.increment_version_changeset(flow))
      |> Repo.transaction()
      |> case do
        {:ok, %{increment_version: updated_flow}} ->
          {:ok, Repo.preload(updated_flow, [:nodes, :edges], force: true)}

        {:error, _operation, reason, _changes} ->
          {:error, reason}
      end
    end
  end

  ## Template operations

  @doc """
  Lists all template flows, optionally filtered by category.

  ## Parameters
    - category: Optional category filter

  ## Returns
    - List of Flow structs marked as templates

  ## Examples

      iex> list_templates()
      [%Flow{is_template: true}, ...]

      iex> list_templates("healthcare")
      [%Flow{template_category: "healthcare"}, ...]
  """
  @spec list_templates(String.t() | nil) :: [Flow.t()]
  def list_templates(category \\ nil) do
    query =
      from(f in Flow,
        where: f.is_template == true,
        where: is_nil(f.deleted_at),
        order_by: [asc: f.title]
      )

    query =
      if category do
        from(f in query, where: f.template_category == ^category)
      else
        query
      end

    Repo.all(query)
  end

  # Private functions

  defp check_version(%Flow{version: current_version}, expected_version)
       when current_version == expected_version,
       do: :ok

  defp check_version(_flow, _expected_version), do: {:error, :version_conflict}
end
