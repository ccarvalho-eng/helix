defmodule Helix.Flows.Types do
  @moduledoc """
  Shared type definitions for the Flows context.
  """

  @type flow_id :: String.t()
  @type client_id :: String.t()
  @type client_count :: non_neg_integer()
  @type timestamp :: integer()

  @type session_info :: %{client_count: client_count(), last_activity: timestamp()}
  @type active_status :: %{active: true, client_count: client_count(), last_activity: timestamp()}
  @type inactive_status :: %{active: false, client_count: 0}
  @type flow_status :: active_status() | inactive_status()

  @type sessions_map :: %{flow_id() => session_info()}
  @type operation_result :: {:ok, client_count()}
end
