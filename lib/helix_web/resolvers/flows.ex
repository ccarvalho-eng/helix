defmodule HelixWeb.Resolvers.Flows do
  @moduledoc """
  GraphQL resolvers for Flows context.
  """

  alias Helix.Flows.Storage
  alias HelixWeb.Utils

  @doc """
  Lists all flows for the currently authenticated user.

  Requires authentication via JWT token.

  ## Returns
    - `{:ok, [Flow.t()]}` with list of user's flows
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec list_my_flows(any(), any(), Absinthe.Resolution.t()) ::
          {:ok, list()} | {:error, String.t()}
  def list_my_flows(_parent, _args, %{context: %{current_user: user}}) do
    {:ok, Storage.list_user_flows(user.id)}
  end

  def list_my_flows(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Gets a single flow by ID with authorization check.

  Requires authentication and verifies that the current user owns the flow.
  Preloads nodes and edges.

  ## Parameters
    - id: The flow's UUID

  ## Returns
    - `{:ok, Flow.t()}` with nodes and edges preloaded
    - `{:error, "Flow not found"}` when flow doesn't exist
    - `{:error, "Unauthorized"}` when user doesn't own the flow
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec get_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def get_flow(_parent, %{id: flow_id}, %{context: %{current_user: user}}) do
    case Storage.get_user_flow_with_data(user.id, flow_id) do
      {:ok, flow_with_data} -> {:ok, flow_with_data}
      {:error, :not_found} -> {:error, "Flow not found"}
      {:error, :unauthorized} -> {:error, "Unauthorized"}
    end
  end

  def get_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  ## Mutations

  @doc """
  Creates a new flow for the current user.

  Requires authentication.

  ## Parameters
    - input: Map with flow attributes

  ## Returns
    - `{:ok, Flow.t()}` with created flow
    - `{:error, String.t()}` on validation errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec create_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def create_flow(_parent, %{input: input}, %{context: %{current_user: user}}) do
    attrs = Map.put(input, :user_id, user.id)

    case Storage.create_flow(attrs) do
      {:ok, flow} -> {:ok, flow}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def create_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Updates flow metadata (title, description, viewport).

  Requires authentication and ownership.

  ## Parameters
    - id: Flow ID
    - input: Map with flow attributes to update

  ## Returns
    - `{:ok, Flow.t()}` with updated flow
    - `{:error, String.t()}` on validation or authorization errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec update_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def update_flow(_parent, %{id: flow_id, input: input}, %{context: %{current_user: user}}) do
    with {:ok, flow} <- Storage.get_user_flow(user.id, flow_id),
         {:ok, updated_flow} <- Storage.update_flow(flow, input) do
      {:ok, updated_flow}
    else
      {:error, :not_found} -> {:error, "Flow not found"}
      {:error, :unauthorized} -> {:error, "Unauthorized"}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def update_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Updates flow data (nodes and edges) with optimistic locking.

  Requires authentication and ownership.

  ## Parameters
    - id: Flow ID
    - input: Map with nodes, edges, and version

  ## Returns
    - `{:ok, Flow.t()}` with updated flow and preloaded data
    - `{:error, "Version conflict"}` when version doesn't match
    - `{:error, String.t()}` on other errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec update_flow_data(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def update_flow_data(
        _parent,
        %{id: flow_id, input: %{nodes: nodes, edges: edges, version: version}},
        %{context: %{current_user: user}}
      ) do
    # First verify ownership
    with {:ok, _flow} <- Storage.get_user_flow(user.id, flow_id),
         {:ok, updated_flow} <- Storage.update_flow_data(flow_id, nodes, edges, version) do
      {:ok, updated_flow}
    else
      {:error, :not_found} -> {:error, "Flow not found"}
      {:error, :unauthorized} -> {:error, "Unauthorized"}
      {:error, :version_conflict} -> {:error, "Version conflict"}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def update_flow_data(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Deletes a flow (soft delete).

  Requires authentication and ownership.

  ## Parameters
    - id: Flow ID

  ## Returns
    - `{:ok, Flow.t()}` with deleted flow
    - `{:error, String.t()}` on errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec delete_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def delete_flow(_parent, %{id: flow_id}, %{context: %{current_user: user}}) do
    with {:ok, flow} <- Storage.get_user_flow(user.id, flow_id),
         {:ok, deleted_flow} <- Storage.delete_flow(flow) do
      {:ok, deleted_flow}
    else
      {:error, :not_found} -> {:error, "Flow not found"}
      {:error, :unauthorized} -> {:error, "Unauthorized"}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def delete_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end

  @doc """
  Duplicates a flow.

  Requires authentication and ownership of source flow.

  ## Parameters
    - id: Source flow ID
    - title: Optional title for the duplicated flow

  ## Returns
    - `{:ok, Flow.t()}` with new flow
    - `{:error, String.t()}` on errors
    - `{:error, "Not authenticated"}` when not authenticated
  """
  @spec duplicate_flow(any(), map(), Absinthe.Resolution.t()) ::
          {:ok, any()} | {:error, String.t()}
  def duplicate_flow(_parent, %{id: flow_id} = args, %{context: %{current_user: user}}) do
    title = Map.get(args, :title)

    # Verify ownership of source flow
    with {:ok, _flow} <- Storage.get_user_flow(user.id, flow_id),
         {:ok, new_flow} <- Storage.duplicate_flow(flow_id, user.id, title),
         {:ok, new_flow_with_data} <- Storage.get_flow_with_data(new_flow.id) do
      {:ok, new_flow_with_data}
    else
      {:error, :not_found} -> {:error, "Flow not found"}
      {:error, :unauthorized} -> {:error, "Unauthorized"}
      {:error, changeset} -> {:error, Utils.format_changeset_errors(changeset)}
    end
  end

  def duplicate_flow(_parent, _args, _resolution) do
    {:error, "Not authenticated"}
  end
end
