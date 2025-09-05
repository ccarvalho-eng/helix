import { Socket, Channel } from 'phoenix';

export interface FlowChangeData {
  changes: unknown;
  timestamp: number;
}

export interface ClientJoinedData {
  client_count: number;
  flow_id: string;
}

export interface WebSocketCallbacks {
  onFlowUpdate?: (_data: FlowChangeData) => void;
  onClientJoined?: (_data: ClientJoinedData) => void;
  onClientLeft?: (_data: ClientJoinedData) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (_error: unknown) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private channel: Channel | null = null;
  private currentFlowId: string | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private maxReconnectDelay = 30000; // Max 30 seconds
  private reconnectTimer: number | null = null;
  private connectionLost = false;

  /**
   * Initialize WebSocket connection
   */
  connect() {
    try {
      this.socket = new Socket('/socket', {
        params: {},
        logger: (kind: string, msg: string, data: unknown) => {
          console.debug(`🔌📝 Phoenix WebSocket ${kind}:`, msg, data);
        },
      });

      this.socket.onOpen(() => {
        console.log('🔌✅ WebSocket connected to Phoenix server');
        this.reconnectAttempts = 0;
        this.connectionLost = false;

        // Clear any pending reconnection timers
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Automatically rejoin flow channel if we had one before disconnect
        if (this.currentFlowId && this.connectionLost) {
          console.log(`🔌🔄 Automatically rejoining flow channel: ${this.currentFlowId}`);
          // Use setTimeout to ensure the connection is fully established
          setTimeout(() => this.rejoinCurrentFlow(), 100);
        }

        this.callbacks.onConnect?.();
      });

      this.socket.onClose(() => {
        console.log('🔌🔽 WebSocket disconnected from Phoenix server');
        this.connectionLost = true;
        this.callbacks.onDisconnect?.();
        this.attemptReconnect();
      });

      this.socket.onError((error: unknown) => {
        console.error('🔌❌ WebSocket connection error:', error);
        this.callbacks.onError?.(error);
      });

      this.socket.connect();
      return true;
    } catch (error) {
      console.error('🔌❌ Failed to initialize WebSocket connection:', error);
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
      console.error('🔌⚠️ WebSocket not connected - cannot join flow');
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
        this.channel
          ?.join()
          .receive('ok', resolve)
          .receive('error', reject)
          .receive('timeout', () => reject(new Error('Join timeout')));
      });

      this.currentFlowId = flowId;
      console.log(`🔌🎯 Joined flow channel: ${flowId}`, joinResponse);
      return true;
    } catch (error) {
      console.error(`🔌❌ Failed to join flow channel ${flowId}:`, error);
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
      console.warn('🔌⚠️ No active channel - cannot send flow changes');
      return Promise.resolve(false);
    }

    return new Promise(resolve => {
      this.channel
        ?.push('flow_change', { changes })
        .receive('ok', () => {
          resolve(true);
        })
        .receive('error', (error: unknown) => {
          console.error('📡❌ Failed to send flow changes:', error);
          resolve(false);
        })
        .receive('timeout', () => {
          console.error('📡⏰ Flow change send timeout - server not responding');
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

    return new Promise(resolve => {
      this.channel
        ?.push('ping', {})
        .receive('ok', () => resolve(true))
        .receive('error', () => resolve(false))
        .receive('timeout', () => resolve(false));
    });
  }

  /**
   * Attempt to reconnect with exponential backoff and capped delay
   */
  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🔌🚫 Max reconnection attempts reached - giving up');
      return;
    }

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );
    this.reconnectAttempts++;

    console.log(
      `🔌🔄 Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      if (this.socket && !this.socket.isConnected()) {
        this.socket.connect();
      }
    }, delay) as unknown as number;
  }

  /**
   * Rejoin the current flow channel after reconnection
   */
  private async rejoinCurrentFlow() {
    if (!this.currentFlowId || !this.socket?.isConnected()) {
      return;
    }

    try {
      // Reset channel to force a new join
      this.channel = null;
      const success = await this.joinFlow(this.currentFlowId);

      if (success) {
        console.log(`🔌✅ Successfully rejoined flow channel: ${this.currentFlowId}`);
      } else {
        console.error(`🔌❌ Failed to rejoin flow channel: ${this.currentFlowId}`);
      }
    } catch (error) {
      console.error(`🔌❌ Error rejoining flow channel: ${this.currentFlowId}`, error);
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
