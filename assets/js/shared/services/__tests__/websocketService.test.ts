import { websocketService } from '../websocketService';

// Mock console.error to suppress error messages during tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Mock Phoenix with simpler implementation
const mockChannel = {
  join: jest.fn(),
  leave: jest.fn(),
  push: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

const mockSocket = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  isConnected: jest.fn(() => false),
  onOpen: jest.fn(),
  onClose: jest.fn(),
  onError: jest.fn(),
  channel: jest.fn(() => mockChannel),
};

jest.mock('phoenix', () => ({
  Socket: jest.fn(() => mockSocket),
}));

describe('websocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the service to a clean state
    websocketService.disconnect();

    // Setup default mock returns
    mockChannel.join.mockReturnValue({
      receive: jest.fn().mockImplementation(function (this: any, status: string, callback: (data: any) => void) {
        if (status === 'ok') {
          setTimeout(() => callback({}), 0);
        }
        return this;
      }),
    });

    mockChannel.push.mockReturnValue({
      receive: jest.fn().mockImplementation(function (this: any, status: string, callback: (data: any) => void) {
        if (status === 'ok') {
          setTimeout(() => callback({ status: 'success' }), 0);
        }
        return this;
      }),
    });
  });

  describe('basic connection functionality', () => {
    it('should initialize and connect', () => {
      expect(() => websocketService.connect()).not.toThrow();
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should check connection status', () => {
      const isConnected = websocketService.isConnected();
      expect(typeof isConnected).toBe('boolean');
      expect(isConnected).toBe(false);
    });

    it('should return consistent boolean values', () => {
      const result1 = websocketService.isConnected();
      const result2 = websocketService.isConnected();
      expect(result1).toBe(result2);
      expect(typeof result1).toBe('boolean');
      expect(typeof result2).toBe('boolean');
    });

    it('should disconnect properly', () => {
      websocketService.connect();
      websocketService.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('flow management', () => {
    beforeEach(() => {
      websocketService.connect();
      mockSocket.isConnected.mockReturnValue(true);
    });

    it('should attempt to join flow channel', async () => {
      await websocketService.joinFlow('test-flow-id');
      expect(mockSocket.channel).toHaveBeenCalledWith('flow:test-flow-id', {});
      expect(mockChannel.join).toHaveBeenCalled();
    });

    it('should leave flow channel', () => {
      websocketService.leaveFlow();
      expect(mockChannel.leave).toHaveBeenCalled();
    });
  });

  describe('flow deletion notification', () => {
    beforeEach(() => {
      websocketService.connect();
      mockSocket.isConnected.mockReturnValue(true);
    });

    it('should attempt to notify flow deletion', async () => {
      await websocketService.notifyFlowDeleted('test-flow-id');

      expect(mockSocket.channel).toHaveBeenCalledWith('flow_management', {});
      expect(mockChannel.join).toHaveBeenCalled();
      expect(mockChannel.push).toHaveBeenCalledWith('flow_deleted', { flow_id: 'test-flow-id' });
      expect(mockChannel.leave).toHaveBeenCalled();
    });

    it('should handle flow deletion notification when not connected', async () => {
      mockSocket.isConnected.mockReturnValue(false);
      websocketService.disconnect();

      const result = await websocketService.notifyFlowDeleted('test-flow-id');
      expect(result).toBe(false);
    });

    it('should handle exceptions during flow deletion notification', async () => {
      // Mock channel creation to throw
      mockSocket.channel.mockImplementationOnce(() => {
        throw new Error('Channel creation failed');
      });

      const result = await websocketService.notifyFlowDeleted('test-flow-id');
      expect(result).toBe(false);
    });
  });

  describe('callback management', () => {
    it('should set callbacks', () => {
      const callbacks = {
        onConnect: jest.fn(),
        onDisconnect: jest.fn(),
        onFlowUpdate: jest.fn(),
      };

      expect(() => websocketService.setCallbacks(callbacks)).not.toThrow();
    });

    it('should get current flow ID', () => {
      websocketService.connect();
      mockSocket.isConnected.mockReturnValue(true);

      // Initially should return null
      expect(websocketService.getCurrentFlowId()).toBe(null);
    });

    it('should handle sendFlowChange without active channel', async () => {
      const changes = { nodes: [], edges: [] };
      const result = await websocketService.sendFlowChange(changes);

      expect(result).toBe(false);
    });

    it('should handle ping without active channel', async () => {
      const result = await websocketService.ping();
      expect(result).toBe(false);
    });
  });
});
