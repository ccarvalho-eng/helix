defmodule HelixWeb.FlowHTML do
  @moduledoc """
  This module contains pages rendered by FlowController.

  See the `flow_html` directory for all templates.
  """
  use HelixWeb, :html

  embed_templates "flow_html/*"
end
