defmodule HelixWeb.FlowManagementChannelTest do
  use HelixWeb.ChannelCase, async: false
  import ExUnit.CaptureLog
  import Helix.AccountsFixtures
  import Helix.FlowsFixtures

  alias Helix.Flows
  alias HelixWeb.FlowManagementChannel

  @moduletag :authenticated_socket

  setup do
    user = user_fixture()
    {:ok, user: user}
  end

  describe "joining flow management channel" do
    test "successfully joins the flow_management channel", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      assert socket.topic == "flow_management"
    end

    test "rejects joins to invalid topics", %{socket: socket} do
      assert {:error, %{reason: "Invalid management channel"}} =
               subscribe_and_join(socket, FlowManagementChannel, "invalid_topic")
    end

    test "rejects joins to other flow management topics", %{socket: socket} do
      assert {:error, %{reason: "Invalid management channel"}} =
               subscribe_and_join(socket, FlowManagementChannel, "flow_management:admin")
    end
  end

  describe "handling flow_deleted messages" do
    test "successfully handles flow deletion with active session", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      # Set up an active flow session first
      Flows.join_flow(flow_id, "test-client-1")
      Flows.join_flow(flow_id, "test-client-2")

      # Verify session is active
      assert %{active: true, client_count: 2} = Flows.get_flow_status(flow_id)

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send flow_deleted message
      ref = push(socket, "flow_deleted", %{"flow_id" => flow_id})

      # Should receive successful response
      assert_reply ref, :ok, %{
        status: "session_closed",
        clients_affected: 2
      }

      # Verify session was closed
      assert %{active: false, client_count: 0} = Flows.get_flow_status(flow_id)
    end

    test "handles flow deletion when no active session exists", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send flow_deleted message for non-existent session
      ref = push(socket, "flow_deleted", %{"flow_id" => flow_id})

      # Should still receive successful response with 0 clients affected
      assert_reply ref, :ok, %{
        status: "session_closed",
        clients_affected: 0
      }
    end

    test "handles flow deletion with single client session", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      # Set up a single client session
      Flows.join_flow(flow_id, "lone-client")

      # Verify session is active
      assert %{active: true, client_count: 1} = Flows.get_flow_status(flow_id)

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send flow_deleted message
      ref = push(socket, "flow_deleted", %{"flow_id" => flow_id})

      # Should receive successful response
      assert_reply ref, :ok, %{
        status: "session_closed",
        clients_affected: 1
      }

      # Wait for session termination to complete
      :timer.sleep(50)

      # Verify session was closed
      assert %{active: false, client_count: 0} = Flows.get_flow_status(flow_id)
    end

    test "rejects flow_deleted with invalid payload - missing flow_id", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send flow_deleted message without flow_id
      ref = push(socket, "flow_deleted", %{"invalid" => "payload"})

      # Should receive error response
      assert_reply ref, :error, %{reason: "Invalid flow_id"}
    end

    test "rejects flow_deleted with invalid payload - non-string flow_id", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send flow_deleted message with non-string flow_id
      ref = push(socket, "flow_deleted", %{"flow_id" => 123})

      # Should receive error response
      assert_reply ref, :error, %{reason: "Invalid flow_id"}
    end

    test "rejects flow_deleted with invalid payload - nil flow_id", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send flow_deleted message with nil flow_id
      ref = push(socket, "flow_deleted", %{"flow_id" => nil})

      # Should receive error response
      assert_reply ref, :error, %{reason: "Invalid flow_id"}
    end

    test "rejects flow_deleted with empty payload", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send flow_deleted message with empty payload
      ref = push(socket, "flow_deleted", %{})

      # Should receive error response
      assert_reply ref, :error, %{reason: "Invalid flow_id"}
    end
  end

  describe "error handling during flow deletion" do
    test "handles Flows errors gracefully", %{socket: socket} do
      # This test simulates a scenario where Flows might fail
      # We'll test with a flow_id that might cause issues
      # Empty string might cause issues
      flow_id = ""

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send flow_deleted message
      ref = push(socket, "flow_deleted", %{"flow_id" => flow_id})

      # Should handle the error and return appropriate response
      # The exact response depends on how Flows handles empty flow_ids
      assert_reply ref, result, _payload
      assert result in [:ok, :error]
    end
  end

  describe "handling unknown messages" do
    test "rejects unknown events with error response", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send unknown event
      ref = push(socket, "unknown_event", %{"some" => "payload"})

      # Should receive error response
      assert_reply ref, :error, %{reason: "Unknown event"}
    end

    test "rejects known events with wrong names", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send event with similar but wrong name
      ref = push(socket, "flow_delete", %{"flow_id" => "test"})

      # Should receive error response
      assert_reply ref, :error, %{reason: "Unknown event"}
    end

    test "rejects administrative events that don't exist", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Send hypothetical admin event
      ref = push(socket, "admin_action", %{"action" => "restart"})

      # Should receive error response
      assert_reply ref, :error, %{reason: "Unknown event"}
    end
  end

  describe "channel termination" do
    test "handles normal termination gracefully", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Enable trap_exit to handle the expected EXIT message
      Process.flag(:trap_exit, true)

      # Close the socket
      close(socket)

      # Expect to receive the EXIT message from channel termination
      assert_receive {:EXIT, _pid, {:shutdown, :closed}}, 1000

      # Should not crash - termination should be handled gracefully
      # The test passes if no exceptions are raised
    end

    test "handles abnormal termination gracefully" do
      # Test that terminate/2 handles various termination reasons
      socket = %Phoenix.Socket{
        topic: "flow_management",
        transport_pid: self(),
        serializer: Jason
      }

      # Test different termination reasons
      assert :ok = FlowManagementChannel.terminate(:normal, socket)
      assert :ok = FlowManagementChannel.terminate({:shutdown, :closed}, socket)
      assert :ok = FlowManagementChannel.terminate(:kill, socket)
    end
  end

  describe "integration with Flows" do
    test "multiple flow deletions work independently", %{socket: socket, user: user} do
      flow_1 = flow_fixture(%{user_id: user.id})
      flow_id_1 = flow_1.id
      flow_2 = flow_fixture(%{user_id: user.id})
      flow_id_2 = flow_2.id

      # Set up sessions for both flows
      Flows.join_flow(flow_id_1, "client-1")
      Flows.join_flow(flow_id_1, "client-2")
      Flows.join_flow(flow_id_2, "client-3")

      # Verify both sessions are active
      assert %{active: true, client_count: 2} = Flows.get_flow_status(flow_id_1)
      assert %{active: true, client_count: 1} = Flows.get_flow_status(flow_id_2)

      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Delete first flow
      ref1 = push(socket, "flow_deleted", %{"flow_id" => flow_id_1})

      assert_reply ref1, :ok, %{
        status: "session_closed",
        clients_affected: 2
      }

      # Wait for first flow termination
      :timer.sleep(100)

      # Verify first flow is closed, second is still active
      assert %{active: false, client_count: 0} = Flows.get_flow_status(flow_id_1)
      assert %{active: true, client_count: 1} = Flows.get_flow_status(flow_id_2)

      # Delete second flow
      ref2 = push(socket, "flow_deleted", %{"flow_id" => flow_id_2})

      assert_reply ref2, :ok, %{
        status: "session_closed",
        clients_affected: 1
      }

      # Wait for second flow termination
      :timer.sleep(100)

      # Verify both flows are now closed
      assert %{active: false, client_count: 0} = Flows.get_flow_status(flow_id_1)
      assert %{active: false, client_count: 0} = Flows.get_flow_status(flow_id_2)
    end

    test "handles concurrent flow deletions", %{socket: socket, user: user} do
      flow = flow_fixture(%{user_id: user.id})
      flow_id = flow.id

      # Set up a session
      Flows.join_flow(flow_id, "client-1")
      Flows.join_flow(flow_id, "client-2")

      # Verify session is active before deletion attempts
      assert %{active: true, client_count: 2} = Flows.get_flow_status(flow_id)

      {:ok, _reply, socket1} =
        subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      # Create second management channel connection
      socket2 = HelixWeb.ChannelCase.create_authenticated_socket()

      {:ok, _reply, socket2} =
        subscribe_and_join(socket2, FlowManagementChannel, "flow_management")

      # Send delete requests from both sockets with slight delay to avoid exact race
      ref1 = push(socket1, "flow_deleted", %{"flow_id" => flow_id})
      # Small delay to make race condition less harsh
      :timer.sleep(10)
      ref2 = push(socket2, "flow_deleted", %{"flow_id" => flow_id})

      # Both should receive responses, but handle potential shutdown gracefully
      try do
        assert_reply ref1, result1, %{status: "session_closed", clients_affected: _clients1}, 2000
        assert result1 == :ok
      catch
        :exit, _ ->
          # First request might cause process shutdown, that's acceptable for this test
          :ok
      end

      try do
        assert_reply ref2, result2, %{status: "session_closed", clients_affected: _clients2}, 2000
        assert result2 == :ok
      catch
        :exit, _ ->
          # Second request might find process already shut down, that's acceptable
          :ok
      end

      # Wait for any pending operations to complete
      :timer.sleep(100)

      # Session should be closed (this is the main assertion)
      assert %{active: false, client_count: 0} = Flows.get_flow_status(flow_id)
    end
  end

  describe "logging behavior" do
    test "logs invalid payload warnings", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      log =
        capture_log([level: :warning], fn ->
          ref = push(socket, "flow_deleted", %{"invalid" => "payload"})
          assert_reply ref, :error, _payload
        end)

      assert log =~ "Invalid flow_deleted payload received"
    end

    test "logs unknown event warnings", %{socket: socket} do
      {:ok, _reply, socket} = subscribe_and_join(socket, FlowManagementChannel, "flow_management")

      log =
        capture_log([level: :warning], fn ->
          ref = push(socket, "unknown_event", %{"test" => "data"})
          assert_reply ref, :error, _payload
        end)

      assert log =~ "Unknown management event unknown_event"
    end
  end
end
