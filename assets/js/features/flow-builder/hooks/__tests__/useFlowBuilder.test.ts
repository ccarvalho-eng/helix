import { renderHook, act } from '@testing-library/react';
import { useFlowBuilder } from '../useFlowBuilder';

// Mock generateId
jest.mock('../../../../shared/utils', () => ({
  generateId: jest.fn(() => 'test-id-123'),
}));

// Mock ReactFlow
jest.mock('reactflow', () => ({
  useNodesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
  useEdgesState: jest.fn(() => [[], jest.fn(), jest.fn()]),
  addEdge: jest.fn((edge, edges) => [...edges, edge]),
  MarkerType: {
    ArrowClosed: 'arrowclosed',
    Arrow: 'arrow',
  },
  Position: {
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
    Left: 'left',
  },
  ConnectionMode: {
    Strict: 'strict',
    Loose: 'loose',
  },
}));

const mockReactFlow = jest.requireMock('reactflow');

describe('useFlowBuilder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.getItem = jest.fn().mockReturnValue(null);

    // Setup default mock implementations
    const mockNodes: unknown[] = [];
    const mockEdges: unknown[] = [];
    const mockSetNodes = jest.fn();
    const mockSetEdges = jest.fn();
    const mockOnNodesChange = jest.fn();
    const mockOnEdgesChange = jest.fn();

    mockReactFlow.useNodesState.mockReturnValue([mockNodes, mockSetNodes, mockOnNodesChange]);
    mockReactFlow.useEdgesState.mockReturnValue([mockEdges, mockSetEdges, mockOnEdgesChange]);
  });

  describe('initialization', () => {
    it('should initialize with empty state when no localStorage data exists', () => {
      const { result } = renderHook(() => useFlowBuilder());

      expect(result.current.nodes).toEqual([]);
      expect(result.current.edges).toEqual([]);
      expect(result.current.selectedNode).toBeNull();
    });

    it('should handle localStorage parsing errors gracefully', () => {
      localStorage.getItem = jest.fn().mockReturnValue('invalid-json');

      renderHook(() => useFlowBuilder());

      expect(mockReactFlow.useNodesState).toHaveBeenCalledWith([]);
      expect(mockReactFlow.useEdgesState).toHaveBeenCalledWith([]);
    });
  });

  describe('addNode', () => {
    it('should create and add a new node', () => {
      const mockSetNodes = jest.fn();
      mockReactFlow.useNodesState.mockReturnValue([[], mockSetNodes, jest.fn()]);

      const { result } = renderHook(() => useFlowBuilder());

      act(() => {
        result.current.addNode('agent', 'Custom Agent', 'Test description');
      });

      expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should use default label when no custom label provided', () => {
      const mockSetNodes = jest.fn();
      mockReactFlow.useNodesState.mockReturnValue([[], mockSetNodes, jest.fn()]);

      const { result } = renderHook(() => useFlowBuilder());

      act(() => {
        result.current.addNode('sensor');
      });

      expect(mockSetNodes).toHaveBeenCalled();
    });
  });

  describe('onConnect', () => {
    it('should create edge when connecting nodes', () => {
      const mockSetEdges = jest.fn();
      mockReactFlow.useEdgesState.mockReturnValue([[], mockSetEdges, jest.fn()]);

      const { result } = renderHook(() => useFlowBuilder());

      const connection = {
        source: 'node1',
        target: 'node2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(connection);
      });

      expect(mockSetEdges).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not create edge when connection is invalid', () => {
      const mockSetEdges = jest.fn();
      mockReactFlow.useEdgesState.mockReturnValue([[], mockSetEdges, jest.fn()]);

      const { result } = renderHook(() => useFlowBuilder());

      const invalidConnection = {
        source: null,
        target: 'node2',
        sourceHandle: null,
        targetHandle: null,
      };

      act(() => {
        result.current.onConnect(invalidConnection);
      });

      expect(mockSetEdges).not.toHaveBeenCalled();
    });
  });

  describe('node selection', () => {
    it('should update selected node when nodes are selected', () => {
      const { result } = renderHook(() => useFlowBuilder());

      const mockNodeData = {
        id: 'node1',
        type: 'agent' as const,
        label: 'Test Agent',
        description: 'Test description',
        x: 100,
        y: 200,
        width: 140,
        height: 80,
        color: '#f0f9ff',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        position: { x: 100, y: 200 },
        dimensions: { width: 140, height: 80 },
        config: {},
      };

      const selectedNodes = [
        {
          id: 'node1',
          type: 'aiFlowNode' as const,
          position: { x: 100, y: 200 },
          data: mockNodeData,
        },
      ];

      act(() => {
        result.current.onSelectionChange({ nodes: selectedNodes });
      });

      expect(result.current.selectedNode).toEqual(mockNodeData);
    });

    it('should clear selected node when no nodes selected', () => {
      const { result } = renderHook(() => useFlowBuilder());

      act(() => {
        result.current.onSelectionChange({ nodes: [] });
      });

      expect(result.current.selectedNode).toBeNull();
    });
  });

  describe('updateNode', () => {
    it('should call setNodes with update function', () => {
      const mockSetNodes = jest.fn();
      mockReactFlow.useNodesState.mockReturnValue([[], mockSetNodes, jest.fn()]);

      const { result } = renderHook(() => useFlowBuilder());

      act(() => {
        result.current.updateNode('node1', { label: 'Updated Label' });
      });

      expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('deleteNode', () => {
    it('should call setNodes and setEdges with removal functions', () => {
      const mockSetNodes = jest.fn();
      const mockSetEdges = jest.fn();

      mockReactFlow.useNodesState.mockReturnValue([[], mockSetNodes, jest.fn()]);
      mockReactFlow.useEdgesState.mockReturnValue([[], mockSetEdges, jest.fn()]);

      const { result } = renderHook(() => useFlowBuilder());

      act(() => {
        result.current.deleteNode('node1');
      });

      expect(mockSetNodes).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetEdges).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('drag operations', () => {
    it('should set correct drop effect on drag over', () => {
      const { result } = renderHook(() => useFlowBuilder());

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: { dropEffect: '' },
      } as unknown as React.DragEvent;

      act(() => {
        result.current.onDragOver(mockEvent);
      });

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.dataTransfer.dropEffect).toBe('move');
    });

    it('should not add node when no React Flow instance', () => {
      const mockSetNodes = jest.fn();
      mockReactFlow.useNodesState.mockReturnValue([[], mockSetNodes, jest.fn()]);

      const { result } = renderHook(() => useFlowBuilder());

      const mockEvent = {
        preventDefault: jest.fn(),
        dataTransfer: {
          getData: jest.fn().mockReturnValue('agent'),
        },
        clientX: 150,
        clientY: 250,
      } as unknown as React.DragEvent;

      act(() => {
        result.current.onDrop(mockEvent);
      });

      expect(mockSetNodes).not.toHaveBeenCalled();
    });
  });
});
