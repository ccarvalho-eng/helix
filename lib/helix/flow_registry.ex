defmodule Helix.FlowRegistry do
  @moduledoc """
  Registry and supervisor for managing FlowServer processes.
  Provides dynamic process supervision and discovery for active flows.
  """

  use DynamicSupervisor
  require Logger

  def start_link(init_arg) do
    DynamicSupervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @doc """
  Starts a new FlowServer process for the given flow_id.
  Returns {:ok, pid} if successful or {:error, reason} if not.
  """
  def start_flow(flow_id) when is_binary(flow_id) do
    case get_flow_pid(flow_id) do
      nil ->
        child_spec = {Helix.FlowServer, flow_id}

        case DynamicSupervisor.start_child(__MODULE__, child_spec) do
          {:ok, pid} ->
            Logger.info("Started FlowServer for flow_id: #{flow_id}")
            {:ok, pid}

          {:error, {:already_started, pid}} ->
            {:ok, pid}

          error ->
            Logger.error(
              "Failed to start FlowServer for flow_id: #{flow_id}, error: #{inspect(error)}"
            )

            error
        end

      pid ->
        {:ok, pid}
    end
  end

  @doc """
  Stops a FlowServer process for the given flow_id.
  """
  def stop_flow(flow_id) when is_binary(flow_id) do
    case get_flow_pid(flow_id) do
      nil ->
        {:error, :not_found}

      pid ->
        DynamicSupervisor.terminate_child(__MODULE__, pid)
    end
  end

  @doc """
  Gets the PID of a FlowServer process for the given flow_id.
  Returns nil if the process doesn't exist.
  """
  def get_flow_pid(flow_id) when is_binary(flow_id) do
    case Registry.lookup(Helix.FlowProcessRegistry, flow_id) do
      [{pid, _}] -> pid
      [] -> nil
    end
  end

  @doc """
  Returns a list of all active flow IDs.
  """
  def list_active_flows do
    Registry.select(Helix.FlowProcessRegistry, [{{:"$1", :_, :_}, [], [:"$1"]}])
  end

  @doc """
  Returns the count of active flow processes.
  """
  def active_flow_count do
    Registry.count(Helix.FlowProcessRegistry)
  end

  @doc """
  Checks if a flow is currently active (has a running process).
  """
  def flow_active?(flow_id) when is_binary(flow_id) do
    get_flow_pid(flow_id) != nil
  end

  @doc """
  Returns information about all active flows including their PIDs and metadata.
  """
  def flow_info do
    Registry.select(Helix.FlowProcessRegistry, [{{:"$1", :"$2", :_}, [], [{{:"$1", :"$2"}}]}])
    |> Enum.map(fn {flow_id, pid} ->
      %{
        flow_id: flow_id,
        pid: inspect(pid),
        alive: Process.alive?(pid),
        started_at: DateTime.utc_now() |> DateTime.to_iso8601()
      }
    end)
  end

  @doc """
  Gracefully shuts down all flow processes.
  Useful for application shutdown or maintenance.
  """
  def shutdown_all_flows do
    __MODULE__
    |> DynamicSupervisor.which_children()
    |> Enum.each(fn {_, pid, _, _} ->
      DynamicSupervisor.terminate_child(__MODULE__, pid)
    end)
  end

  # Supervisor Callbacks

  @impl true
  def init(_init_arg) do
    Logger.info("FlowRegistry started")
    DynamicSupervisor.init(strategy: :one_for_one)
  end
end
