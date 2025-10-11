defmodule HelixWeb.FlowControllerTest do
  use HelixWeb.ConnCase, async: true

  describe "GET /" do
    test "renders the flow builder index page", %{conn: conn} do
      conn = get(conn, ~p"/")
      assert html_response(conn, 200) =~ "data-page=\"flow-builder\""
    end
  end

  describe "GET /flow/:id" do
    test "renders the flow builder for new flow", %{conn: conn} do
      conn = get(conn, ~p"/flow/new-flow-123")
      assert html_response(conn, 200) =~ "data-page=\"flow-builder\""
    end

    test "renders the flow builder for existing flow", %{conn: conn} do
      conn = get(conn, ~p"/flow/existing-flow-456")
      assert html_response(conn, 200) =~ "data-page=\"flow-builder\""
    end

    test "handles special characters in flow ID", %{conn: conn} do
      flow_id = "flow-with-special-chars-123_456"
      conn = get(conn, ~p"/flow/#{flow_id}")
      assert html_response(conn, 200) =~ "data-page=\"flow-builder\""
    end
  end
end
