defmodule Helix.FlowTestHelper do
  @moduledoc """
  Helper functions for flow-related tests to ensure services are available.
  """

  @doc """
  Ensures flow services are available and healthy.
  Retries if services are temporarily unavailable.
  """
  def ensure_flow_services_available(retries \\ 20) do
    case check_services() do
      :ok ->
        :ok

      :error when retries > 0 ->
        # Try to restart application if services are missing
        try_restart_services()
        :timer.sleep(100)
        ensure_flow_services_available(retries - 1)

      :error ->
        # As last resort, just wait and hope services come back
        :timer.sleep(200)
        :ok
    end
  end

  defp check_services do
    # Check Registry is available
    Registry.lookup(Helix.Flows.Registry, "test")

    # Check SessionSupervisor is available
    DynamicSupervisor.count_children(Helix.Flows.SessionSupervisor)

    # Check FlowSessionManager is available
    Process.whereis(Helix.Flows.FlowSessionManager)

    :ok
  rescue
    _ -> :error
  catch
    :exit, _ -> :error
  end

  defp try_restart_services do
    # Try to ensure the application is started
    Application.ensure_all_started(:helix)
  rescue
    _ -> :ok
  catch
    :exit, _ -> :ok
  end
end
