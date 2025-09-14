defmodule HelixWeb.AuthController do
  use HelixWeb, :controller

  def login(conn, _params) do
    render(conn, :login, layout: {HelixWeb.Layouts, :root})
  end
end
