import { flowStorage } from '../flowStorage';
import { FlowRegistry, FlowData } from '../../types/flow';

describe('flowStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('registry management', () => {
    it('should return empty registry when localStorage is empty', () => {
      const registry = flowStorage.getFlowRegistry();
      expect(registry).toEqual({ flows: [] });
    });

    it('should save and retrieve registry correctly', () => {
      const testRegistry: FlowRegistry = {
        flows: [
          {
            id: 'flow-1',
            title: 'Test Flow 1',
            lastModified: '2024-01-01T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
            nodeCount: 5,
            connectionCount: 3,
          },
        ],
      };

      flowStorage.saveFlowRegistry(testRegistry);
      const retrieved = flowStorage.getFlowRegistry();

      expect(retrieved).toEqual(testRegistry);
    });
  });

  describe('flow data management', () => {
    it('should return null for non-existent flow', () => {
      const flowData = flowStorage.getFlow('non-existent-id');
      expect(flowData).toBeNull();
    });

    it('should save and retrieve flow data correctly', () => {
      const testFlowData: FlowData = {
        nodes: [
          {
            id: 'node-1',
            type: 'default',
            position: { x: 100, y: 200 },
            data: { id: 'node-1', label: 'Test Node' },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'default',
          },
        ],
        viewport: { x: 0, y: 0, zoom: 1.5 },
      };

      flowStorage.saveFlow('test-flow-id', testFlowData);
      const retrieved = flowStorage.getFlow('test-flow-id');

      expect(retrieved).toEqual(testFlowData);
    });

    it('should update registry metadata when saving flow', () => {
      // First create a flow registry entry
      const registry: FlowRegistry = {
        flows: [
          {
            id: 'test-flow',
            title: 'Test Flow',
            lastModified: '2024-01-01T00:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
            nodeCount: 0,
            connectionCount: 0,
          },
        ],
      };

      flowStorage.saveFlowRegistry(registry);

      const testFlowData: FlowData = {
        nodes: [
          { id: 'n1', data: {}, type: 'default', position: { x: 0, y: 0 } },
          { id: 'n2', data: {}, type: 'default', position: { x: 0, y: 0 } },
        ],
        edges: [{ id: 'e1', source: 'n1', target: 'n2', type: 'default' }],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      flowStorage.saveFlow('test-flow', testFlowData);

      const updatedRegistry = flowStorage.getFlowRegistry();
      expect(updatedRegistry.flows[0]).toMatchObject({
        nodeCount: 2,
        connectionCount: 1,
      });
    });
  });

  describe('flow creation', () => {
    it('should create flow with default title', () => {
      const newFlow = flowStorage.createFlow();

      expect(newFlow).toMatchObject({
        title: 'Untitled Flow',
        nodeCount: 0,
        connectionCount: 0,
      });
      expect(newFlow.id).toBeTruthy();
      expect(newFlow.createdAt).toBeTruthy();
      expect(newFlow.lastModified).toBeTruthy();

      // Check it was added to registry
      const registry = flowStorage.getFlowRegistry();
      expect(registry.flows).toHaveLength(1);
      expect(registry.flows[0]).toMatchObject({
        id: newFlow.id,
        title: 'Untitled Flow',
        nodeCount: 0,
        connectionCount: 0,
      });
    });

    it('should create flow with custom title', () => {
      const customTitle = 'My Custom Flow';
      const newFlow = flowStorage.createFlow(customTitle);

      expect(newFlow.title).toBe(customTitle);
    });

    it('should create empty flow data file', () => {
      const newFlow = flowStorage.createFlow();
      const flowData = flowStorage.getFlow(newFlow.id);

      expect(flowData).toEqual({
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      });
    });

    it('should generate unique IDs for multiple flows', () => {
      const flow1 = flowStorage.createFlow();
      const flow2 = flowStorage.createFlow();

      expect(flow1.id).not.toBe(flow2.id);

      const registry = flowStorage.getFlowRegistry();
      expect(registry.flows).toHaveLength(2);
    });
  });

  describe('flow title updates', () => {
    it('should update flow title and timestamp', () => {
      const flow = flowStorage.createFlow('Original Title');

      flowStorage.updateFlowTitle(flow.id, 'Updated Title');

      const registry = flowStorage.getFlowRegistry();
      expect(registry.flows[0]).toMatchObject({
        title: 'Updated Title',
      });
    });

    it('should not update non-existent flow title', () => {
      const originalRegistry = flowStorage.getFlowRegistry();

      flowStorage.updateFlowTitle('non-existent-id', 'New Title');

      const newRegistry = flowStorage.getFlowRegistry();
      expect(newRegistry).toEqual(originalRegistry);
    });
  });

  describe('flow deletion', () => {
    it('should delete flow data and registry entry', () => {
      const flow = flowStorage.createFlow('Test Flow');

      // Verify it exists
      expect(flowStorage.getFlow(flow.id)).toBeTruthy();
      expect(flowStorage.getFlowRegistry().flows).toHaveLength(1);

      flowStorage.deleteFlow(flow.id);

      // Verify it's deleted
      expect(flowStorage.getFlow(flow.id)).toBeNull();
      expect(flowStorage.getFlowRegistry().flows).toHaveLength(0);
    });

    it('should not error when deleting non-existent flow', () => {
      expect(() => {
        flowStorage.deleteFlow('non-existent-id');
      }).not.toThrow();
    });
  });

  describe('flow duplication', () => {
    it('should duplicate flow with new IDs', () => {
      // Create original flow
      const originalFlow = flowStorage.createFlow('Original Flow');
      const originalData: FlowData = {
        nodes: [
          {
            id: 'original-node-1',
            type: 'default',
            position: { x: 100, y: 200 },
            data: { id: 'original-node-1', label: 'Node 1' },
          },
          {
            id: 'original-node-2',
            type: 'default',
            position: { x: 300, y: 400 },
            data: { id: 'original-node-2', label: 'Node 2' },
          },
        ],
        edges: [
          {
            id: 'original-edge-1',
            source: 'original-node-1',
            target: 'original-node-2',
            type: 'default',
          },
        ],
        viewport: { x: 50, y: 75, zoom: 1.2 },
      };

      flowStorage.saveFlow(originalFlow.id, originalData);

      // Duplicate the flow
      const duplicatedFlow = flowStorage.duplicateFlow(originalFlow.id);

      expect(duplicatedFlow).toMatchObject({
        title: 'Original Flow (Copy)',
        nodeCount: 2,
        connectionCount: 1,
      });
      expect(duplicatedFlow.id).not.toBe(originalFlow.id);

      // Check duplicated data
      const duplicatedData = flowStorage.getFlow(duplicatedFlow.id);
      expect(duplicatedData).toBeTruthy();
      expect(duplicatedData!.nodes).toHaveLength(2);
      expect(duplicatedData!.edges).toHaveLength(1);

      // Node IDs should be different
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const firstNode = duplicatedData!.nodes[0] as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const secondNode = duplicatedData!.nodes[1] as any;
      expect(firstNode.id).not.toBe('original-node-1');
      expect(secondNode.id).not.toBe('original-node-2');

      // Edge should reference new node IDs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const edge = duplicatedData!.edges[0] as any;
      expect(edge.source).toBe(firstNode.id);
      expect(edge.target).toBe(secondNode.id);

      // Other properties should be preserved
      expect(duplicatedData!.viewport).toEqual(originalData.viewport);
      expect(firstNode.position).toEqual({ x: 100, y: 200 });
    });

    it('should throw error when duplicating non-existent flow', () => {
      expect(() => {
        flowStorage.duplicateFlow('non-existent-id');
      }).toThrow('Flow non-existent-id not found');
    });

    it('should handle flows with no nodes or edges', () => {
      const originalFlow = flowStorage.createFlow('Empty Flow');
      const emptyData: FlowData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      flowStorage.saveFlow(originalFlow.id, emptyData);

      const duplicatedFlow = flowStorage.duplicateFlow(originalFlow.id);
      const duplicatedData = flowStorage.getFlow(duplicatedFlow.id);

      expect(duplicatedData).toEqual(emptyData);
      expect(duplicatedFlow.nodeCount).toBe(0);
      expect(duplicatedFlow.connectionCount).toBe(0);
    });
  });

  describe('UUID generation', () => {
    it('should generate valid UUID format', () => {
      const flow = flowStorage.createFlow();
      expect(flow.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    });

    it('should generate unique IDs', () => {
      const flow1 = flowStorage.createFlow();
      const flow2 = flowStorage.createFlow();
      expect(flow1.id).not.toBe(flow2.id);
    });
  });
});
