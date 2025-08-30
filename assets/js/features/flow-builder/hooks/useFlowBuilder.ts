import { useState, useCallback, useEffect } from 'react';
import {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  ReactFlowInstance,
} from 'reactflow';
import { AIFlowNode } from '../types';

const STORAGE_KEY = 'react-flow-ai-flow-builder-state';

const nodeDefaults = {
  agent: { width: 140, height: 80, color: '#f0f9ff', label: 'AI Agent' },
  sensor: { width: 120, height: 60, color: '#f0fdf4', label: 'Sensor' },
  skill: { width: 120, height: 60, color: '#fffbeb', label: 'Skill' },
  decision: { width: 100, height: 80, color: '#fef2f2', label: 'Decision' },
  input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
  output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
};

const saveToLocalStorage = (data: {
  nodes: Node<AIFlowNode>[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }
  return null;
};

export function useFlowBuilder() {
  const initialState = loadFromLocalStorage();

  const [nodes, setNodes, onNodesChange] = useNodesState<AIFlowNode>(initialState?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialState?.edges || []);
  const [selectedNode, setSelectedNode] = useState<AIFlowNode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  const addNode = useCallback(
    (type: AIFlowNode['type'], customLabel?: string, customDescription?: string) => {
      const defaults = nodeDefaults[type];
      const nodeData: AIFlowNode = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        x: 0,
        y: 0,
        width: defaults.width,
        height: defaults.height,
        label: customLabel || defaults.label,
        description: customDescription || '',
        config: {},
        color: defaults.color,
        borderColor: '#e5e7eb',
        borderWidth: 1,
      };

      const newNode: Node<AIFlowNode> = {
        id: nodeData.id,
        type: 'aiFlowNode',
        position: {
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: nodeData,
      };

      setNodes(nds => nds.concat(newNode));
    },
    [setNodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
        type: 'default',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: '#9ca3af',
        },
        style: {
          stroke: '#9ca3af',
          strokeWidth: 2,
        },
      };
      setEdges(eds => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as AIFlowNode['type'];

      if (typeof type === 'undefined' || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const defaults = nodeDefaults[type];
      const nodeData: AIFlowNode = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        x: position.x,
        y: position.y,
        width: defaults.width,
        height: defaults.height,
        label: defaults.label,
        description: '',
        config: {},
        color: defaults.color,
        borderColor: '#e5e7eb',
        borderWidth: 1,
      };

      const newNode: Node<AIFlowNode> = {
        id: nodeData.id,
        type: 'aiFlowNode',
        position,
        data: nodeData,
      };

      setNodes(nds => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node<AIFlowNode>[] }) => {
      if (selectedNodes.length > 0) {
        setSelectedNode(selectedNodes[0].data);
      } else {
        setSelectedNode(null);
      }
    },
    []
  );

  const updateNode = useCallback(
    (id: string, updates: Partial<AIFlowNode>) => {
      setNodes(nds =>
        nds.map(node => {
          if (node.id === id) {
            const updatedData = { ...node.data, ...updates };
            return { ...node, data: updatedData };
          }
          return node;
        })
      );

      if (selectedNode?.id === id) {
        setSelectedNode({ ...selectedNode, ...updates });
      }
    },
    [setNodes, selectedNode]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes(nds => nds.filter(node => node.id !== id));
      setEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));
      if (selectedNode?.id === id) {
        setSelectedNode(null);
      }
    },
    [setNodes, setEdges, selectedNode]
  );

  useEffect(() => {
    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      saveToLocalStorage({ nodes, edges, viewport });
    }
  }, [nodes, edges, reactFlowInstance]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          deleteNode(selectedNode.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode]);

  return {
    nodes,
    edges,
    selectedNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onSelectionChange,
    onDragOver,
    onDrop,
    setReactFlowInstance,
    addNode,
    updateNode,
    deleteNode,
    initialViewport: initialState?.viewport || { x: 0, y: 0, zoom: 1 },
  };
}
