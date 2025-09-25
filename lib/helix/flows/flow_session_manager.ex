defmodule Helix.Flows.FlowSessionManager do
  @moduledoc """
  Manages flow sessions using DynamicSupervisor and Registry.
  Provides supervisory/lookup functions only - business logic stays in SessionServer.
  """

  use GenServer
  require Logger

  alias Helix.Flows.SessionServer

  @registry Helix.Flows.Registry
  @supervisor Helix.Flows.SessionSupervisor

  # Client API

  @spec start_link(keyword()) :: GenServer.on_start()
  def start_link(opts) do
    GenServer.start_link(__MODULE__, opts, name: __MODULE__)
  end

  @doc """
  Get or start a session process for the given flow_id.
  Uses Registry to prevent race conditions.
  """
  @spec get_or_start_session(String.t()) :: {:ok, pid()} | {:error, term()}
  def get_or_start_session(flow_id) when is_binary(flow_id) do
    trimmed_flow_id = String.trim(flow_id)

    if byte_size(trimmed_flow_id) == 0 do
      {:error, :invalid_flow_id}
    else
      do_get_or_start_session(trimmed_flow_id)
    end
  end

  def get_or_start_session(_), do: {:error, :invalid_flow_id}

  defp do_get_or_start_session(flow_id) do
    via_tuple = via_tuple(flow_id)

    case Registry.lookup(@registry, flow_id) do
      [{pid, _}] ->
        {:ok, pid}

      [] ->
        case DynamicSupervisor.start_child(
               @supervisor,
               {SessionServer, [flow_id: flow_id, name: via_tuple]}
             ) do
          {:ok, pid} -> {:ok, pid}
          {:error, {:already_started, pid}} -> {:ok, pid}
          error -> error
        end
    end
  end

  @doc """
  Stop a session process if it exists.
  """
  @spec stop_session(String.t()) :: :ok
  def stop_session(flow_id) do
    case Registry.lookup(@registry, flow_id) do
      [{pid, _}] ->
        DynamicSupervisor.terminate_child(@supervisor, pid)
        :ok

      [] ->
        :ok
    end
  end

  @doc """
  List all active session PIDs.
  """
  @spec list_active_sessions() :: [pid()]
  def list_active_sessions do
    @registry
    |> Registry.select([{{:_, :"$1", :_}, [], [:"$1"]}])
  end

  @doc """
  Get session count.
  """
  @spec session_count() :: non_neg_integer()
  def session_count do
    Registry.count(@registry)
  end

  # Private helpers

  defp via_tuple(flow_id) do
    {:via, Registry, {@registry, flow_id}}
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    {:ok, %{}}
  end
end
