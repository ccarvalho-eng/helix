defmodule HelixWeb.PageController do
  use HelixWeb, :controller

  def home(conn, _params) do
    render(conn, :home, layout: {HelixWeb.Layouts, :root})
  end
end
