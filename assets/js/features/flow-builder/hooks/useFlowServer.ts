import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket, Channel } from 'phoenix';

export interface FlowState {
  id: string;
  name: string;
  description: string;
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
  created_at: string;
  updated_at: string;
  connected_users: string[];
}

export interface UseFlowServerOptions {
  flowId: string;
  userId: string;
  onFlowUpdated?: (flow: FlowState) => void;
  onNodesUpdated?: (flow: FlowState) => void;
  onEdgesUpdated?: (flow: FlowState) => void;
  onPresenceUpdated?: (presence: { connected_users: string[] }) => void;
  onSaveRequested?: (flow: FlowState) => void;
  onConnectionStatusChange?: (connected: boolean) => void;
}

export interface UseFlowServerReturn {
  flowState: FlowState | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connectedUsers: string[];

  // Flow operations
  createFlow: (attrs?: Partial<FlowState>) => Promise<FlowState>;
  getFlow: () => Promise<FlowState>;
  updateMetadata: (name: string, description: string) => Promise<FlowState>;
  updateNodes: (nodes: any[]) => Promise<FlowState>;
  updateEdges: (edges: any[]) => Promise<FlowState>;
  updateViewport: (viewport: { x: number; y: number; zoom: number }) => Promise<FlowState>;
  saveFlow: () => Promise<void>;
  loadFlow: (flowData: any) => Promise<FlowState>;
}

export function useFlowServer(options: UseFlowServerOptions): UseFlowServerReturn {
  const {
    flowId,
    userId,
    onFlowUpdated,
    onNodesUpdated,
    onEdgesUpdated,
    onPresenceUpdated,
    onSaveRequested,
    onConnectionStatusChange,
  } = options;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

  const channelRef = useRef<Channel | null>(null);

  // Initialize socket and channel
  useEffect(() => {
    if (!flowId || !userId) {
      console.log('useFlowServer: Missing flowId or userId', { flowId, userId });
      return;
    }

    setConnecting(true);
    setError(null);

    // Create socket connection
    const newSocket = new Socket('/socket', {
      params: { user_id: userId },
    });

    newSocket.onOpen(() => {
      console.log('Socket connected');
      onConnectionStatusChange?.(true);
    });

    newSocket.onClose(() => {
      console.log('Socket disconnected');
      setConnected(false);
      onConnectionStatusChange?.(false);
    });

    newSocket.onError((error: any) => {
      console.error('Socket error:', error);
      setError('Connection failed');
      setConnecting(false);
      onConnectionStatusChange?.(false);
    });

    newSocket.connect();

    // Join flow channel
    const newChannel = newSocket.channel(`flow:${flowId}`, { user_id: userId });

    newChannel
      .join()
      .receive('ok', (response: any) => {
        console.log('Joined flow channel successfully', response);
        console.log('Initial connected users:', response.connected_users);
        setFlowState(response);
        if (response.connected_users) {
          setConnectedUsers(response.connected_users);
        }
        setConnected(true);
        setConnecting(false);
        setError(null);
        onConnectionStatusChange?.(true);
      })
      .receive('error', (reason: any) => {
        console.error('Failed to join flow channel:', reason);
        setError(`Failed to join flow: ${reason.reason || 'unknown error'}`);
        setConnecting(false);
        onConnectionStatusChange?.(false);
      });

    // Set up channel event listeners
    setupChannelListeners(newChannel);

    setChannel(newChannel);
    channelRef.current = newChannel;

    // Cleanup function
    return () => {
      if (newChannel) {
        newChannel.leave();
      }
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [flowId, userId]);

  const setupChannelListeners = useCallback(
    (ch: Channel) => {
      ch.on('flow_updated', (flow: FlowState) => {
        console.log('Flow updated:', flow);
        setFlowState(flow);
        onFlowUpdated?.(flow);
      });

      ch.on('nodes_updated', (flow: FlowState) => {
        console.log('Nodes updated:', flow);
        setFlowState(flow);
        onNodesUpdated?.(flow);
      });

      ch.on('edges_updated', (flow: FlowState) => {
        console.log('Edges updated:', flow);
        setFlowState(flow);
        onEdgesUpdated?.(flow);
      });

      ch.on('presence_updated', (presence: { connected_users: string[] }) => {
        console.log('Presence updated:', presence);
        console.log('Setting connected users to:', presence.connected_users);
        setConnectedUsers(presence.connected_users);
        onPresenceUpdated?.(presence);
      });

      ch.on('save_requested', (flow: FlowState) => {
        console.log('Save requested:', flow);
        onSaveRequested?.(flow);
      });
    },
    [onFlowUpdated, onNodesUpdated, onEdgesUpdated, onPresenceUpdated, onSaveRequested]
  );

  // Channel operation helpers
  const pushToChannel = useCallback(
    async (event: string, payload: any = {}): Promise<any> => {
      return new Promise((resolve, reject) => {
        if (!channel || !connected) {
          reject(new Error('Not connected to channel'));
          return;
        }

        channel.push(event, payload).receive('ok', resolve).receive('error', reject);
      });
    },
    [channel, connected]
  );

  // Flow operations
  const createFlow = useCallback(
    async (attrs: Partial<FlowState> = {}): Promise<FlowState> => {
      const result = await pushToChannel('create_flow', attrs);
      setFlowState(result);
      return result;
    },
    [pushToChannel]
  );

  const getFlow = useCallback(async (): Promise<FlowState> => {
    const result = await pushToChannel('get_flow');
    setFlowState(result);
    return result;
  }, [pushToChannel]);

  const updateMetadata = useCallback(
    async (name: string, description: string): Promise<FlowState> => {
      const result = await pushToChannel('update_metadata', { name, description });
      setFlowState(result);
      return result;
    },
    [pushToChannel]
  );

  const updateNodes = useCallback(
    async (nodes: any[]): Promise<FlowState> => {
      const result = await pushToChannel('update_nodes', { nodes });
      setFlowState(result);
      return result;
    },
    [pushToChannel]
  );

  const updateEdges = useCallback(
    async (edges: any[]): Promise<FlowState> => {
      const result = await pushToChannel('update_edges', { edges });
      setFlowState(result);
      return result;
    },
    [pushToChannel]
  );

  const updateViewport = useCallback(
    async (viewport: { x: number; y: number; zoom: number }): Promise<FlowState> => {
      const result = await pushToChannel('update_viewport', { viewport });
      setFlowState(result);
      return result;
    },
    [pushToChannel]
  );

  const saveFlow = useCallback(async (): Promise<void> => {
    await pushToChannel('save_flow');
  }, [pushToChannel]);

  const loadFlow = useCallback(
    async (flowData: any): Promise<FlowState> => {
      const result = await pushToChannel('load_flow', { flow_data: flowData });
      setFlowState(result);
      return result;
    },
    [pushToChannel]
  );

  return {
    flowState,
    connected,
    connecting,
    error,
    connectedUsers,

    createFlow,
    getFlow,
    updateMetadata,
    updateNodes,
    updateEdges,
    updateViewport,
    saveFlow,
    loadFlow,
  };
}
