defmodule Helix.Flows do
  @moduledoc """
  The Flows context - provides the boundary API for flow management.

  ## Examples

  The Flows context provides a simple API for managing flow sessions:

      iex> # Join clients to flows
      iex> Helix.Flows.join_flow("my-flow", "client-1")
      {:ok, 1}

      iex> # Check flow status
      iex> Helix.Flows.get_flow_status("my-flow")
      %{active: true, client_count: 1, last_activity: 1640995200}

      iex> # Broadcast changes to all clients
      iex> Helix.Flows.broadcast_flow_change("my-flow", %{nodes: [], edges: []})
      :ok

  """

  use Supervisor

  alias Helix.Flows.SessionServer
  alias Helix.Flows.Types

  @type flow_id :: Types.flow_id()
  @type client_id :: Types.client_id()
  @type client_count :: Types.client_count()
  @type session_info :: Types.session_info()
  @type flow_status :: Types.flow_status()
  @type sessions_map :: Types.sessions_map()
  @type operation_result :: Types.operation_result()

  @doc """
  Start the flows supervision tree
  """
  @spec start_link(keyword()) :: Supervisor.on_start()
  def start_link(opts \\ []) do
    Supervisor.start_link(__MODULE__, opts, name: Keyword.get(opts, :name, __MODULE__.Supervisor))
  end

  @impl Supervisor
  def init(opts) do
    children = [
      {SessionServer, []}
    ]

    strategy = Keyword.get(opts, :strategy, :one_for_one)
    Supervisor.init(children, strategy: strategy)
  end

  # Public API - delegates to the appropriate process

  @doc """
  Join a flow session.

  ## Examples

      iex> Helix.Flows.join_flow("test-flow", "client-1")
      {:ok, 1}

      iex> Helix.Flows.join_flow("test-flow", "client-2")
      {:ok, 2}
  """
  @spec join_flow(flow_id(), client_id()) :: operation_result()
  def join_flow(flow_id, client_id) do
    SessionServer.join_flow(flow_id, client_id)
  end

  @doc """
  Leave a flow session.

  ## Examples

      iex> Helix.Flows.join_flow("leave-flow", "client-1")
      {:ok, 1}

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
      {:ok, 1}

      iex> Helix.Flows.get_flow_status("status-flow")
      %{active: true, client_count: 1, last_activity: 1640995200}
  """
  @spec get_flow_status(flow_id()) :: flow_status()
  def get_flow_status(flow_id) do
    SessionServer.get_flow_status(flow_id)
  end

  @doc """
  Broadcast changes to all clients in a flow.

  ## Examples

      iex> Helix.Flows.join_flow("broadcast-flow", "client-1")
      {:ok, 1}

      iex> Helix.Flows.broadcast_flow_change("broadcast-flow", %{nodes: []})
      :ok
  """
  @spec broadcast_flow_change(flow_id(), map()) :: :ok
  def broadcast_flow_change(flow_id, changes) do
    SessionServer.broadcast_flow_change(flow_id, changes)
  end

  @doc """
  Get all active sessions.

  ## Examples

      iex> Helix.Flows.get_active_sessions()
      %{}

      iex> Helix.Flows.join_flow("active-flow", "client-1")
      {:ok, 1}

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
      {:ok, 1}

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
