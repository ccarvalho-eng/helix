defmodule Helix.Application do
  # See https://hexdocs.pm/elixir/Application.html
  # for more information on OTP Applications
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      HelixWeb.Telemetry,
      Helix.Repo,
      {DNSCluster, query: Application.get_env(:helix, :dns_cluster_query) || :ignore},
      {Phoenix.PubSub, name: Helix.PubSub},
      # Start the Finch HTTP client for sending emails
      {Finch, name: Helix.Finch},
      # Start the Task.Supervisor for supervised background tasks
      {Task.Supervisor, name: Helix.TaskSupervisor},
      # Start the Registry for session processes
      {Registry, keys: :unique, name: Helix.Flows.Registry},
      # Start the DynamicSupervisor for session processes
      {DynamicSupervisor,
       name: Helix.Flows.SessionSupervisor,
       strategy: :one_for_one,
       max_restarts: 10,
       max_seconds: 60},
      # Start the FlowSessionManager
      Helix.Flows.FlowSessionManager,
      # Start a worker by calling: Helix.Worker.start_link(arg)
      # {Helix.Worker, arg},
      # Start to serve requests, typically the last entry
      HelixWeb.Endpoint
    ]

    # See https://hexdocs.pm/elixir/Supervisor.html
    # for other strategies and supported options
    opts = [strategy: :one_for_one, name: Helix.Supervisor]
    Supervisor.start_link(children, opts)
  end

  # Tell Phoenix to update the endpoint configuration
  # whenever the application is updated.
  @impl true
  def config_change(changed, _new, removed) do
    HelixWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
