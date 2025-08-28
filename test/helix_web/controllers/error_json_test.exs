defmodule HelixWeb.ErrorJSONTest do
  use HelixWeb.ConnCase, async: true

  test "renders 404" do
    assert HelixWeb.ErrorJSON.render("404.json", %{}) == %{errors: %{detail: "Not Found"}}
  end

  test "renders 500" do
    assert HelixWeb.ErrorJSON.render("500.json", %{}) ==
             %{errors: %{detail: "Internal Server Error"}}
  end
end
