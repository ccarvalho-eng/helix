import { useState, useCallback, useEffect, useRef } from 'react';
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
import { flowStorage } from '../../../shared/services/flowStorage';
import { FlowRegistryEntry, FlowData } from '../../../shared/types/flow';
import { websocketService, FlowChangeData } from '../../../shared/services/websocketService';

const nodeDefaults = {
  agent: { width: 140, height: 80, color: '#f0f9ff', label: 'AI Agent' },
  sensor: { width: 120, height: 60, color: '#f0fdf4', label: 'Sensor' },
  skill: { width: 120, height: 60, color: '#fffbeb', label: 'Skill' },
  decision: { width: 100, height: 80, color: '#fef2f2', label: 'Decision' },
  input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
  output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
  memory: { width: 120, height: 60, color: '#fdf2f8', label: 'Memory' },
  loop: { width: 100, height: 60, color: '#faf5ff', label: 'Loop' },
  transform: { width: 130, height: 60, color: '#f0fdfa', label: 'Transform' },
  api: { width: 100, height: 60, color: '#fff7ed', label: 'API' },
};

export function useFlowManager(flowId: string | null) {
  const [currentFlow, setCurrentFlow] = useState<FlowRegistryEntry | null>(null);
  const [isNewFlow, setIsNewFlow] = useState(false);
  
  // Initialize with empty state, will be loaded in useEffect
  const [nodes, setNodes, onNodesChange] = useNodesState<AIFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<AIFlowNode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  
  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState(0);
  const isUpdatingFromRemote = useRef(false);

  // Load or create flow on mount
  useEffect(() => {
    if (flowId) {
      // Load existing flow
      const registry = flowStorage.getFlowRegistry();
      const flowEntry = registry.flows.find(f => f.id === flowId);
      
      if (flowEntry) {
        setCurrentFlow(flowEntry);
        setIsNewFlow(false);
        
        const flowData = flowStorage.getFlow(flowId);
        if (flowData) {
          setNodes(flowData.nodes || []);
          setEdges(flowData.edges || []);
        }
      } else {
        // Flow not found, redirect to home
        window.location.href = '/';
      }
    } else {
      // Create new flow
      const newFlow = flowStorage.createFlow();
      setCurrentFlow(newFlow);
      setIsNewFlow(true);
      setNodes([]);
      setEdges([]);
      // Update URL to include the new flow ID
      window.history.replaceState(null, '', `/flow/${newFlow.id}`);
    }
  }, [flowId, setNodes, setEdges]);

  // WebSocket connection management
  useEffect(() => {
    if (!currentFlow) return;

    // Set up WebSocket callbacks
    websocketService.setCallbacks({
      onConnect: () => setIsConnected(true),
      onDisconnect: () => setIsConnected(false),
      onFlowUpdate: (data: FlowChangeData) => {
        // Prevent infinite loops when receiving our own changes
        if (isUpdatingFromRemote.current) return;
        
        isUpdatingFromRemote.current = true;
        
        try {
          const changes = data.changes as FlowData;
          if (changes.nodes) {
            setNodes(changes.nodes as any);
          }
          if (changes.edges) {
            setEdges(changes.edges as any);
          }
        } catch (error) {
          console.error('Failed to apply remote flow changes:', error);
        } finally {
          // Reset flag after a short delay to allow for React state updates
          setTimeout(() => {
            isUpdatingFromRemote.current = false;
          }, 100);
        }
      },
      onClientJoined: (data) => setConnectedClients(data.client_count),
      onClientLeft: (data) => setConnectedClients(data.client_count),
      onError: (error) => console.error('WebSocket error:', error),
    });

    // Connect to WebSocket and join flow channel
    const connectAndJoin = async () => {
      if (!websocketService.isConnected()) {
        websocketService.connect();
      }
      
      // Wait a moment for connection to establish
      setTimeout(async () => {
        const joined = await websocketService.joinFlow(currentFlow.id);
        if (joined) {
          console.log(`Joined WebSocket channel for flow: ${currentFlow.id}`);
        }
      }, 500);
    };

    connectAndJoin();

    // Cleanup on unmount or flow change
    return () => {
      websocketService.leaveFlow();
    };
  }, [currentFlow, setNodes, setEdges]);

  // Auto-save flow data when nodes or edges change
  useEffect(() => {
    if (currentFlow && reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      const flowData: FlowData = {
        nodes,
        edges,
        viewport
      };
      
      // Debounce the save and broadcast operations
      const timeoutId = setTimeout(() => {
        // Save to localStorage
        flowStorage.saveFlow(currentFlow.id, flowData);
        
        // Broadcast changes to other clients (only if not updating from remote)
        if (!isUpdatingFromRemote.current && websocketService.isConnected()) {
          websocketService.sendFlowChange(flowData).catch(error => {
            console.error('Failed to broadcast flow changes:', error);
          });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, currentFlow, reactFlowInstance]);

  const updateFlowTitle = useCallback(
    (newTitle: string) => {
      if (currentFlow && newTitle.trim()) {
        flowStorage.updateFlowTitle(currentFlow.id, newTitle.trim());
        setCurrentFlow(prev => prev ? { ...prev, title: newTitle.trim() } : null);
      }
    },
    [currentFlow]
  );

  const addNode = useCallback(
    (type: AIFlowNode['type'], customLabel?: string, customDescription?: string) => {
      const defaults = nodeDefaults[type];
      const nodeData: AIFlowNode = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        position: { x: 0, y: 0 },
        dimensions: { width: defaults.width, height: defaults.height },
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
      if (!connection.source || !connection.target) return;

      const edge: Edge = {
        ...connection,
        source: connection.source,
        target: connection.target,
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
        position: { x: position.x, y: position.y },
        dimensions: { width: defaults.width, height: defaults.height },
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

  const duplicateNode = useCallback(
    (nodeId: string) => {
      setNodes(nds => {
        const nodeToDuplicate = nds.find(node => node.id === nodeId);
        if (!nodeToDuplicate) return nds;

        const newNodeId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const duplicatedNode: Node<AIFlowNode> = {
          ...nodeToDuplicate,
          id: newNodeId,
          position: {
            x: nodeToDuplicate.position.x + 20,
            y: nodeToDuplicate.position.y + 20,
          },
          data: {
            ...nodeToDuplicate.data,
            id: newNodeId,
          },
          selected: false,
        };

        return [...nds, duplicatedNode];
      });
    },
    [setNodes]
  );

  return {
    // Flow metadata
    currentFlow,
    isNewFlow,
    updateFlowTitle,
    
    // React Flow state
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
    
    // Node operations
    addNode,
    updateNode,
    deleteNode,
    duplicateNode,
    
    // WebSocket status
    isConnected,
    connectedClients,
    
    // Initial viewport
    initialViewport: { x: 0, y: 0, zoom: 1 },
  };
}