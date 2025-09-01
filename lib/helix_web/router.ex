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

  scope "/", HelixWeb do
    pipe_through :browser

    get "/", PageController, :home
  end

  # Flow routes
  scope "/flow", HelixWeb do
    pipe_through :browser

    get "/", FlowController, :index
  end

  # API routes
  scope "/api", HelixWeb do
    pipe_through :api
  end

  # Flow API routes
  scope "/api/flows", HelixWeb do
    pipe_through :api

    get "/", FlowController, :list_flows
    get "/active", FlowController, :active_flows
    get "/:id", FlowController, :get_flow
    post "/", FlowController, :create_flow
    put "/:id", FlowController, :update_flow
    delete "/:id", FlowController, :delete_flow
    post "/:id/save", FlowController, :save_flow
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
