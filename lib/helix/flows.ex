defmodule Helix.Flows do
  @moduledoc """
  The Flows context - provides the boundary API for flow management.

  ## Examples

  The Flows context provides an API for managing flow sessions:

      iex> # Join clients to flows
      iex> Helix.Flows.join_flow("my-flow", "client-1")
      {:ok, 1, "client-1"}

      iex> # Check flow status
      iex> Helix.Flows.get_flow_status("my-flow")
      %{active: true, client_count: 1, last_activity: 1640995200}

      iex> # Apply operations to update flows
      iex> operation = %{type: :node_moved, node_id: "node-1", position: %{x: 100, y: 200}}
      iex> Helix.Flows.apply_operation("my-flow", operation)
      :ok

  """

  alias Helix.Flows.SessionServer
  alias Helix.Flows.Storage
  alias Helix.Flows.Types

  @type flow_id :: Types.flow_id()
  @type client_id :: Types.client_id()
  @type client_count :: Types.client_count()
  @type session_info :: Types.session_info()
  @type flow_status :: Types.flow_status()
  @type sessions_map :: Types.sessions_map()
  @type operation_result :: Types.operation_result()

  # Public API - delegates to the appropriate process

  @doc """
  Join a flow session.

  Validates that the flow exists in the database before joining the session.

  Returns `{:ok, client_count, effective_client_id}` where:
  - client_count is the total number of clients currently connected to the flow
  - effective_client_id is the actual client_id used (may be generated if input was invalid)

  ## Examples

      iex> Helix.Flows.join_flow("test-flow", "client-1")
      {:ok, 1, "client-1"}

      iex> Helix.Flows.join_flow("test-flow", "client-2")
      {:ok, 2, "client-2"}
  """
  @spec join_flow(flow_id(), client_id()) :: {:ok, pos_integer(), client_id()} | {:error, term()}
  def join_flow(flow_id, client_id) do
    # Validate flow exists in database before allowing session join
    case Storage.get_flow(flow_id) do
      {:ok, _flow} ->
        SessionServer.join_flow(flow_id, client_id)

      {:error, :not_found} ->
        {:error, :flow_not_found}
    end
  end

  @doc """
  Leave a flow session.

  ## Examples

      iex> Helix.Flows.join_flow("leave-flow", "client-1")
      {:ok, 1, "client-1"}

      iex> Helix.Flows.leave_flow("leave-flow", "client-1")
      {:ok, 0}

      iex> Helix.Flows.leave_flow("non-existent", "client-1")
      {:ok, 0}
  """
  @spec leave_flow(flow_id(), client_id()) :: operation_result()
  def leave_flow(flow_id, client_id) do
    SessionServer.leave_flow(flow_id, client_id)
  end

  @doc """
  Get flow status.

  ## Examples

      iex> Helix.Flows.get_flow_status("non-existent")
      %{active: false, client_count: 0}

      iex> Helix.Flows.join_flow("status-flow", "client-1")
      {:ok, 1, "client-1"}

      iex> Helix.Flows.get_flow_status("status-flow")
      %{active: true, client_count: 1, last_activity: 1640995200}
  """
  @spec get_flow_status(flow_id()) :: flow_status()
  def get_flow_status(flow_id) do
    SessionServer.get_flow_status(flow_id)
  end

  @doc """
  Apply a delta operation to a flow.

  This is the new API for updating flows - send small delta operations instead of full state updates.
  Operations are applied to in-memory state immediately and persisted periodically.

  ## Examples

      iex> Helix.Flows.join_flow("my-flow", "client-1")
      {:ok, 1, "client-1"}

      iex> operation = %{type: :node_moved, node_id: "node-1", position: %{x: 100, y: 200}}
      iex> Helix.Flows.apply_operation("my-flow", operation)
      :ok
  """
  @spec apply_operation(flow_id(), map()) :: :ok
  def apply_operation(flow_id, operation) do
    SessionServer.apply_operation(flow_id, operation)
  end

  @doc """
  Get all active sessions.

  ## Examples

      iex> Helix.Flows.get_active_sessions()
      %{}

      iex> Helix.Flows.join_flow("active-flow", "client-1")
      {:ok, 1, "client-1"}

      iex> Helix.Flows.get_active_sessions()
      %{"active-flow" => %{client_count: 1, last_activity: 1640995200}}
  """
  @spec get_active_sessions() :: sessions_map()
  def get_active_sessions do
    SessionServer.get_active_sessions()
  end

  @doc """
  Force close a flow session.

  ## Examples

      iex> Helix.Flows.join_flow("close-flow", "client-1")
      {:ok, 1, "client-1"}

      iex> Helix.Flows.force_close_flow_session("close-flow")
      {:ok, 1}

      iex> Helix.Flows.force_close_flow_session("non-existent")
      {:ok, 0}
  """
  @spec force_close_flow_session(flow_id()) :: operation_result()
  def force_close_flow_session(flow_id) do
    SessionServer.force_close_flow_session(flow_id)
  end
end
