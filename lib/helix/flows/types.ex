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
  @type operation_result :: {:ok, client_count()} | {:error, term()}

  @typedoc """
  Represents flow data structure with nodes and edges.

  This type is used for transmitting flow state between the client,
  channel, and session server, and for persistence operations.
  """
  @type flow_data :: %{
          nodes: [node_data()],
          edges: [edge_data()],
          viewport: viewport_data()
        }

  @type node_data :: %{
          node_id: String.t(),
          type: String.t(),
          position_x: float(),
          position_y: float(),
          width: float() | nil,
          height: float() | nil,
          data: map()
        }

  @type edge_data :: %{
          edge_id: String.t(),
          source_node_id: String.t(),
          target_node_id: String.t(),
          source_handle: String.t() | nil,
          target_handle: String.t() | nil,
          edge_type: String.t() | nil,
          animated: boolean(),
          data: map()
        }

  @type viewport_data :: %{
          x: float(),
          y: float(),
          zoom: float()
        }
end
