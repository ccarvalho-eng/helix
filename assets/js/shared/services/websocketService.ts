import { Socket } from 'phoenix';

export interface FlowChangeData {
  changes: unknown;
  timestamp: number;
}

export interface ClientJoinedData {
  client_count: number;
  flow_id: string;
}

export interface WebSocketCallbacks {
  onFlowUpdate?: (data: FlowChangeData) => void;
  onClientJoined?: (data: ClientJoinedData) => void;
  onClientLeft?: (data: ClientJoinedData) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: unknown) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private channel: any = null;
  private currentFlowId: string | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second

  /**
   * Initialize WebSocket connection
   */
  connect() {
    try {
      this.socket = new Socket('/socket', {
        params: {},
        logger: (kind, msg, data) => {
          console.debug(`Phoenix WebSocket ${kind}:`, msg, data);
        }
      });

      this.socket.onOpen(() => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.callbacks.onConnect?.();
      });

      this.socket.onClose(() => {
        console.log('WebSocket disconnected');
        this.callbacks.onDisconnect?.();
        this.attemptReconnect();
      });

      this.socket.onError((error) => {
        console.error('WebSocket error:', error);
        this.callbacks.onError?.(error);
      });

      this.socket.connect();
      return true;
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      return false;
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.channel) {
      this.channel.leave();
      this.channel = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.currentFlowId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Join a flow channel
   */
  async joinFlow(flowId: string): Promise<boolean> {
    if (!this.socket) {
      console.error('WebSocket not connected');
      return false;
    }

    // Leave current channel if exists
    if (this.channel && this.currentFlowId !== flowId) {
      this.channel.leave();
    }

    try {
      this.channel = this.socket.channel(`flow:${flowId}`, {});

      // Set up event handlers
      this.channel.on('flow_update', (data: FlowChangeData) => {
        this.callbacks.onFlowUpdate?.(data);
      });

      this.channel.on('client_joined', (data: ClientJoinedData) => {
        this.callbacks.onClientJoined?.(data);
      });

      this.channel.on('client_left', (data: ClientJoinedData) => {
        this.callbacks.onClientLeft?.(data);
      });

      // Join the channel
      const joinResponse = await new Promise((resolve, reject) => {
        this.channel.join()
          .receive('ok', resolve)
          .receive('error', reject)
          .receive('timeout', () => reject(new Error('Join timeout')));
      });

      this.currentFlowId = flowId;
      console.log(`Joined flow channel: ${flowId}`, joinResponse);
      return true;
    } catch (error) {
      console.error(`Failed to join flow channel ${flowId}:`, error);
      return false;
    }
  }

  /**
   * Leave current flow channel
   */
  leaveFlow() {
    if (this.channel) {
      this.channel.leave();
      this.channel = null;
      this.currentFlowId = null;
    }
  }

  /**
   * Send flow changes to other clients
   */
  sendFlowChange(changes: unknown): Promise<boolean> {
    if (!this.channel) {
      console.warn('No active channel to send flow changes');
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      this.channel.push('flow_change', { changes })
        .receive('ok', () => {
          resolve(true);
        })
        .receive('error', (error: unknown) => {
          console.error('Failed to send flow changes:', error);
          resolve(false);
        })
        .receive('timeout', () => {
          console.error('Flow change send timeout');
          resolve(false);
        });
    });
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: WebSocketCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.socket?.isConnected() ?? false;
  }

  /**
   * Get current flow ID
   */
  getCurrentFlowId(): string | null {
    return this.currentFlowId;
  }

  /**
   * Send ping to test connection
   */
  async ping(): Promise<boolean> {
    if (!this.channel) {
      return false;
    }

    return new Promise((resolve) => {
      this.channel.push('ping', {})
        .receive('ok', () => resolve(true))
        .receive('error', () => resolve(false))
        .receive('timeout', () => resolve(false));
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    this.reconnectAttempts++;

    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.socket.isConnected()) {
        this.socket.connect();
      }
    }, delay);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();