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
    get "/flow", FlowController, :index
  end

  # API routes
  scope "/api", HelixWeb do
    pipe_through :api

    # Flow management API
    get "/flows", FlowController, :list_flows
    get "/flows/active", FlowController, :active_flows
    get "/flows/:id", FlowController, :get_flow
    post "/flows", FlowController, :create_flow
    put "/flows/:id", FlowController, :update_flow
    delete "/flows/:id", FlowController, :delete_flow
    post "/flows/:id/save", FlowController, :save_flow
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
