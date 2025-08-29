import { useState, useCallback, useEffect } from 'react';
import { 
  Node, 
  Edge, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  MarkerType, 
  ReactFlowInstance 
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

  const addNode = useCallback((type: AIFlowNode['type'], customLabel?: string, customDescription?: string) => {
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
        y: Math.random() * 400 + 100 
      },
      data: nodeData,
    };

    setNodes((nds) => nds.concat(newNode));
  }, [setNodes]);

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
      setEdges((eds) => addEdge(edge, eds));
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

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node<AIFlowNode>[] }) => {
    if (selectedNodes.length > 0) {
      setSelectedNode(selectedNodes[0].data);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const updateNode = useCallback((id: string, updates: Partial<AIFlowNode>) => {
    setNodes((nds) =>
      nds.map((node) => {
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
  }, [setNodes, selectedNode]);

  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  const addTemplate = useCallback(() => {
    const templateNodeConfigs = [
      { id: 'mission-brief', type: 'input' as const, label: 'Mission Brief', description: 'Receive assassination target and intel', x: 100, y: 300 },
      { id: 'eagle-vision', type: 'sensor' as const, label: 'Eagle Vision', description: 'Scan environment for threats and opportunities', x: 350, y: 200 },
      { id: 'ezio', type: 'agent' as const, label: 'Ezio Auditore', description: 'Master strategist, plans the approach and coordinates team', x: 600, y: 100 },
      { id: 'altair', type: 'agent' as const, label: 'Altaïr Ibn-LaAhad', description: 'Legendary assassin, executes high-priority eliminations', x: 600, y: 250 },
      { id: 'bayek', type: 'agent' as const, label: 'Bayek of Siwa', description: 'Hidden One, investigates targets and gathers intelligence', x: 600, y: 400 },
      { id: 'edward', type: 'agent' as const, label: 'Edward Kenway', description: 'Pirate assassin, handles naval operations and combat', x: 600, y: 550 },
      { id: 'hidden-blade', type: 'skill' as const, label: 'Hidden Blade', description: 'Silent assassination technique', x: 900, y: 150 },
      { id: 'free-running', type: 'skill' as const, label: 'Free Running', description: 'Parkour and escape routes', x: 900, y: 300 },
      { id: 'combat-training', type: 'skill' as const, label: 'Combat Training', description: 'Sword fighting and counter-attacks', x: 900, y: 450 },
      { id: 'mission-success', type: 'decision' as const, label: 'Mission Success?', description: 'Evaluate if target eliminated and escape completed', x: 1200, y: 325 },
      { id: 'brotherhood-report', type: 'output' as const, label: 'Brotherhood Report', description: 'Mission status and next objectives', x: 1500, y: 325 },
    ];

    const newNodes = templateNodeConfigs.map(nodeTemplate => {
      const defaults = nodeDefaults[nodeTemplate.type];
      const nodeData: AIFlowNode = {
        id: nodeTemplate.id,
        type: nodeTemplate.type,
        x: nodeTemplate.x,
        y: nodeTemplate.y,
        width: defaults.width,
        height: defaults.height,
        label: nodeTemplate.label,
        description: nodeTemplate.description,
        config: {},
        color: defaults.color,
        borderColor: '#e5e7eb',
        borderWidth: 1,
      };

      return {
        id: nodeData.id,
        type: 'aiFlowNode' as const,
        position: { x: nodeTemplate.x, y: nodeTemplate.y },
        data: nodeData,
      };
    });

    const templateConnections = [
      { source: 'mission-brief', target: 'eagle-vision', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'eagle-vision', target: 'ezio', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'eagle-vision', target: 'altair', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'eagle-vision', target: 'bayek', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'eagle-vision', target: 'edward', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'ezio', target: 'hidden-blade', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'altair', target: 'hidden-blade', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'ezio', target: 'free-running', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'bayek', target: 'free-running', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'edward', target: 'combat-training', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'altair', target: 'combat-training', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'hidden-blade', target: 'mission-success', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'free-running', target: 'mission-success', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'combat-training', target: 'mission-success', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'mission-success', target: 'brotherhood-report', sourceHandle: 'right', targetHandle: 'left' },
    ];

    const newEdges = templateConnections.map((conn, index) => ({
      id: `template-edge-${index}`,
      source: conn.source,
      target: conn.target,
      sourceHandle: conn.sourceHandle,
      targetHandle: conn.targetHandle,
      type: 'default',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
      style: { stroke: '#9ca3af', strokeWidth: 2 },
    }));

    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  }, [setNodes, setEdges]);

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
    addTemplate,
    initialViewport: initialState?.viewport || { x: 0, y: 0, zoom: 1 }
  };
}