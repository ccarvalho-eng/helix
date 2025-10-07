defmodule HelixWeb.Resolvers.Flows do
  @moduledoc """
  GraphQL resolvers for Flows context.
  """

  alias Helix.Flows.Storage

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
end
