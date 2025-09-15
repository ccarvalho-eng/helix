defmodule HelixWeb.PageController do
  use HelixWeb, :controller

  def home(conn, _params) do
    # Show home page - authentication will be handled by frontend JavaScript
    render(conn, :home, layout: {HelixWeb.Layouts, :root})
  end
end
