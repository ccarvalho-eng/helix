defmodule HelixWeb.PageController do
  use HelixWeb, :controller

  def home(conn, _params) do
    # The home page uses the root layout for assets
    render(conn, :home, layout: {HelixWeb.Layouts, :root})
  end
end
