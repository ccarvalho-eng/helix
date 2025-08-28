defmodule HelixWeb.FlowController do
  use HelixWeb, :controller

  def index(conn, _params) do
    render(conn, :index, layout: {HelixWeb.Layouts, :flow})
  end
end