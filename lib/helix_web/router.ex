defmodule HelixWeb.Router do
  use HelixWeb, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_live_flash
    plug :put_root_layout, html: {HelixWeb.Layouts, :root}
    plug :protect_from_forgery
    plug :put_secure_browser_headers
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  pipeline :graphql do
    plug :accepts, ["json"]
    plug HelixWeb.Context
  end

  scope "/", HelixWeb do
    pipe_through :browser

    get "/", PageController, :home
    get "/flow", FlowController, :index
    get "/flow/:id", FlowController, :show
  end

  # API routes for flow synchronization
  scope "/api", HelixWeb do
    pipe_through :api

    post "/flows/:id/sync", FlowController, :sync
    get "/flows/:id/status", FlowController, :status
  end

  # GraphQL API
  scope "/api" do
    pipe_through :graphql

    forward "/graphql", Absinthe.Plug, schema: HelixWeb.Schema

    if Application.compile_env(:helix, :dev_routes) do
      forward "/graphiql", Absinthe.Plug.GraphiQL,
        schema: HelixWeb.Schema,
        interface: :simple
    end
  end

  # Enable LiveDashboard and Swoosh mailbox preview in development
  if Application.compile_env(:helix, :dev_routes) do
    # If you want to use the LiveDashboard in production, you should put
    # it behind authentication and allow only admins to access it.
    # If your application does not have an admins-only section yet,
    # you can use Plug.BasicAuth to set up some basic authentication
    # as long as you are also using SSL (which you should anyway).
    import Phoenix.LiveDashboard.Router

    scope "/dev" do
      pipe_through :browser

      live_dashboard "/dashboard", metrics: HelixWeb.Telemetry
      forward "/mailbox", Plug.Swoosh.MailboxPreview
    end
  end
end
