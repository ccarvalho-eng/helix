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
import { getTemplate, TemplateType } from '../templates';

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
  const [initialViewport, setInitialViewport] = useState({ x: 0, y: 0, zoom: 1 });

  // Initialize with empty state, will be loaded in useEffect
  const [nodes, setNodes, onNodesChange] = useNodesState<AIFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<AIFlowNode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState(0);
  const [isFlowReady, setIsFlowReady] = useState(false);
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
          setNodes((flowData.nodes as Node<AIFlowNode>[]) || []);
          setEdges((flowData.edges as Edge[]) || []);
          if (flowData.viewport) {
            setInitialViewport(flowData.viewport);
          }
        }
        // Flow data is ready, but WebSocket connection will be handled separately
        setIsFlowReady(true);
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
      setIsFlowReady(true); // New flows are ready immediately
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
            setNodes(changes.nodes as Node<AIFlowNode>[]);
          }
          if (changes.edges) {
            setEdges(changes.edges as Edge[]);
          }
        } catch (error) {
          console.error('🔄❌ Failed to apply remote flow changes:', error);
        } finally {
          // Reset flag after a short delay to allow for React state updates
          try {
            const changes = data.changes as FlowData;
            if (changes.nodes) {
              setNodes(changes.nodes as Node<AIFlowNode>[]);
            }
            if (changes.edges) {
              setEdges(changes.edges as Edge[]);
            }
          } catch (error) {
            console.error('🔄❌ Failed to apply remote flow changes:', error);
          } finally {
            queueMicrotask(() => {
              isUpdatingFromRemote.current = false;
            });
          }
        }
      },
      onClientJoined: data => setConnectedClients(data.client_count),
      onClientLeft: data => setConnectedClients(data.client_count),
      onError: error => console.error('🔌❌ WebSocket connection error:', error),
    });

    // Connect to WebSocket and join flow channel
    const connectAndJoin = async () => {
      setIsFlowReady(false);

      if (!websocketService.isConnected()) {
        websocketService.connect();

        // Wait for connection to establish with a proper timeout
        const connectionTimeout = 10000; // 10 seconds
        const checkInterval = 100; // Check every 100ms
        let elapsed = 0;

        while (!websocketService.isConnected() && elapsed < connectionTimeout) {
          await new Promise(resolve => setTimeout(resolve, checkInterval));
          elapsed += checkInterval;
        }

        if (!websocketService.isConnected()) {
          console.error(
            '🔌⏰ WebSocket connection timeout - proceeding without real-time features'
          );
          setIsFlowReady(true);
          return;
        }
      }

      try {
        const joined = await websocketService.joinFlow(currentFlow.id);
        if (joined) {
          console.log(`🔌✅ Joined WebSocket channel for flow: ${currentFlow.id}`);
        }
      } catch (error) {
        console.error('🔌❌ Failed to join flow channel:', error);
      } finally {
        setIsFlowReady(true);
      }
    };

    connectAndJoin();

    // Cleanup on unmount or flow change
    return () => {
      websocketService.leaveFlow();
    };
  }, [currentFlow, setNodes, setEdges]);

  // Track previous state to detect actual changes
  const prevFlowDataRef = useRef<FlowData | null>(null);
  const hasInitializedRef = useRef(false);

  // Function to normalize data for comparison (exclude selection and other UI-only state)
  const normalizeDataForComparison = useCallback((data: FlowData) => {
    return {
      nodes: data.nodes.map((node: unknown) => {
        const typedNode = node as Node<AIFlowNode>;
        return {
          ...typedNode,
          selected: undefined, // Remove selection state
          dragging: undefined, // Remove dragging state
          data: typedNode.data
            ? {
                ...typedNode.data,
                selected: undefined,
                dragging: undefined,
              }
            : typedNode.data,
        };
      }),
      edges: data.edges.map((edge: unknown) => {
        const typedEdge = edge as Edge;
        return {
          ...typedEdge,
          selected: undefined, // Remove selection state
          animated: undefined, // Remove animation state if it's UI-only
        };
      }),
      viewport: data.viewport,
    };
  }, []);

  // Auto-save flow data when nodes or edges change
  useEffect(() => {
    if (
      currentFlow &&
      reactFlowInstance &&
      hasInitializedRef.current &&
      !isUpdatingFromRemote.current
    ) {
      const viewport = reactFlowInstance.getViewport();
      const flowData: FlowData = {
        nodes,
        edges,
        viewport,
      };

      // Check if data actually changed (exclude selection and UI-only changes)
      const prevData = prevFlowDataRef.current;
      const normalizedCurrent = normalizeDataForComparison(flowData);
      const normalizedPrevious = prevData ? normalizeDataForComparison(prevData) : null;

      const hasChanges =
        !normalizedPrevious ||
        JSON.stringify(normalizedPrevious.nodes) !== JSON.stringify(normalizedCurrent.nodes) ||
        JSON.stringify(normalizedPrevious.edges) !== JSON.stringify(normalizedCurrent.edges);

      if (!hasChanges) {
        return; // No actual changes, skip save and broadcast
      }

      // Debounce the save and broadcast operations
      const timeoutId = setTimeout(() => {
        // Save to localStorage
        flowStorage.saveFlow(currentFlow.id, flowData);

        // Update previous data reference
        prevFlowDataRef.current = JSON.parse(JSON.stringify(flowData));

        // Broadcast changes to other clients (only if not updating from remote)
        if (!isUpdatingFromRemote.current && websocketService.isConnected()) {
          websocketService.sendFlowChange(flowData).catch(error => {
            console.error('📡❌ Failed to broadcast flow changes:', error);
          });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, currentFlow, reactFlowInstance]);

  // Mark as initialized after first load
  useEffect(() => {
    if (currentFlow && nodes.length >= 0 && edges.length >= 0) {
      if (!hasInitializedRef.current) {
        hasInitializedRef.current = true;
        // Set initial reference data
        if (reactFlowInstance) {
          const viewport = reactFlowInstance.getViewport();
          const initialFlowData = {
            nodes,
            edges,
            viewport,
          };
          prevFlowDataRef.current = normalizeDataForComparison(initialFlowData);
        }
      }
    }
  }, [currentFlow, nodes, edges, reactFlowInstance, normalizeDataForComparison]);

  const updateFlowTitle = useCallback(
    (newTitle: string) => {
      if (currentFlow && newTitle.trim()) {
        flowStorage.updateFlowTitle(currentFlow.id, newTitle.trim());
        setCurrentFlow(prev => (prev ? { ...prev, title: newTitle.trim() } : null));
      }
    },
    [currentFlow]
  );

  const addNode = useCallback(
    (type: AIFlowNode['type'], customLabel?: string, customDescription?: string) => {
      const defaults = nodeDefaults[type];
      const newId = crypto?.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      const nodeData: AIFlowNode = {
        id: newId,
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
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target) return;

      const baseId = `${source}:${sourceHandle || ''}->${target}:${targetHandle || ''}`;
      const uniqueId = `${baseId}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

      setEdges(eds => {
        // Prevent duplicates for same endpoints/handles
        const exists = eds.some(
          e =>
            e.source === source &&
            e.target === target &&
            e.sourceHandle === sourceHandle &&
            e.targetHandle === targetHandle
        );
        if (exists) return eds;

        const edge: Edge = {
          id: uniqueId,
          source,
          target,
          sourceHandle,
          targetHandle,
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
        return addEdge(edge, eds);
      });
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
    isFlowReady,

    // Initial viewport
    initialViewport,

    // Viewport change handler for onMoveEnd
    onMoveEnd: useCallback(() => {
      if (currentFlow && reactFlowInstance) {
        const viewport = reactFlowInstance.getViewport();
        const flowData: FlowData = {
          nodes,
          edges,
          viewport,
        };

        // Debounced save
        const timeoutId = setTimeout(() => {
          flowStorage.saveFlow(currentFlow.id, flowData);

          // Update timestamp
          const registry = flowStorage.getFlowRegistry();
          const flowIndex = registry.flows.findIndex(f => f.id === currentFlow.id);
          if (flowIndex >= 0) {
            registry.flows[flowIndex].lastModified = new Date().toISOString();
            flowStorage.saveFlowRegistry(registry);
          }
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }, [currentFlow, nodes, edges, reactFlowInstance]),

    // Add template functionality
    addTemplate: useCallback(
      (templateType: TemplateType = 'assassins-creed') => {
        const template = getTemplate(templateType);
        const { nodes: templateNodes, connections: templateConnections } = template;

        // Create nodes from template
        const newNodes = templateNodes.map(nodeTemplate => {
          const defaults = nodeDefaults[nodeTemplate.type as keyof typeof nodeDefaults];

          const nodeData: AIFlowNode = {
            id: nodeTemplate.id,
            type: nodeTemplate.type,
            x: nodeTemplate.x,
            y: nodeTemplate.y,
            width: defaults.width,
            height: defaults.height,
            label: nodeTemplate.label,
            description: nodeTemplate.description,
            config: nodeTemplate.config || {},
            color: defaults.color,
            borderColor: '#e5e7eb',
            borderWidth: 1,
            position: { x: nodeTemplate.x, y: nodeTemplate.y },
            dimensions: { width: defaults.width, height: defaults.height },
          };

          return {
            id: nodeTemplate.id,
            type: 'aiFlowNode' as const,
            position: { x: nodeTemplate.x, y: nodeTemplate.y },
            data: nodeData,
            style: {
              width: defaults.width,
              height: defaults.height,
            },
          };
        });

        // Create edges from template connections
        const newEdges = templateConnections.map((conn, index) => ({
          id: `template-edge-${index}`,
          source: conn.source,
          target: conn.target,
          sourceHandle: conn.sourceHandle,
          targetHandle: conn.targetHandle,
          type: 'default' as const,
          markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
          style: { stroke: '#9ca3af', strokeWidth: 2 },
        }));

        // Add the new nodes and edges to the current flow
        setNodes(prevNodes => [...prevNodes, ...newNodes]);
        setEdges(prevEdges => [...prevEdges, ...newEdges]);
      },
      [setNodes, setEdges]
    ),
  };
}
