import { flowStorage } from '../flowStorage';

// Simple test to verify configuration works
describe('FlowStorage - Basic Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return empty registry when localStorage is empty', () => {
    const registry = flowStorage.getFlowRegistry();
    expect(registry).toEqual({ flows: [] });
  });

  it('should save and retrieve registry', () => {
    const registry = {
      flows: [
        {
          id: 'test-flow',
          title: 'Test Flow',
          lastModified: '2024-01-01',
          createdAt: '2024-01-01',
        },
      ],
    };

    flowStorage.saveFlowRegistry(registry);
    const retrieved = flowStorage.getFlowRegistry();

    expect(retrieved).toEqual(registry);
  });
});
