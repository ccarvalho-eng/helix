import { websocketService } from '../websocketService';

// Mock Phoenix
jest.mock('phoenix', () => ({
  Socket: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    isConnected: jest.fn(() => false),
    onOpen: jest.fn(),
    onClose: jest.fn(),
    onError: jest.fn(),
    channel: jest.fn(() => ({
      join: jest.fn(),
      leave: jest.fn(),
      push: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    })),
  })),
}));

describe('websocketService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize and connect', () => {
    expect(() => websocketService.connect()).not.toThrow();
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
});
