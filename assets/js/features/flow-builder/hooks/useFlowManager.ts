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
  NodeChange,
  NodeDimensionChange,
  NodePositionChange,
} from 'reactflow';
import { AIFlowNode } from '../types';
import { FlowRegistryEntry, FlowData } from '../../../shared/types/flow';
import { websocketService, FlowChangeData } from '../../../shared/services/websocketService';
import { getTemplate, TemplateType } from '../templates';
import { generateId } from '../../../shared/utils';
import {
  useCreateFlowMutation,
  useGetFlowQuery,
  useUpdateFlowMutation,
  useUpdateFlowDataMutation,
} from '../../../generated/graphql';
import {
  transformNodesToGraphQL,
  transformEdgesToGraphQL,
  parseNodeDataSafely,
  validateFlowData,
} from '../utils';

// GraphQL node type from API
interface GraphQLNode {
  nodeId: string;
  type: string;
  positionX: number;
  positionY: number;
  width?: number;
  height?: number;
  data?: unknown;
}

// GraphQL edge type from API
interface GraphQLEdge {
  edgeId: string;
  sourceNodeId: string;
  targetNodeId: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  edgeType?: string | null;
  animated?: boolean | null;
  data?: unknown;
}

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
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [initialViewport, setInitialViewport] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  });

  // Initialize with empty state, will be loaded in useEffect
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState<AIFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<AIFlowNode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // Custom onNodesChange handler that syncs dimension and position changes to node.data
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // First apply the changes using the internal handler
      onNodesChangeInternal(changes);

      // Then update node.data for dimension and position changes
      changes.forEach(change => {
        if (change.type === 'dimensions') {
          const dimensionChange = change as NodeDimensionChange;
          if (dimensionChange.dimensions) {
            setNodes(nds =>
              nds.map(node => {
                if (node.id === dimensionChange.id) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      width: dimensionChange.dimensions!.width,
                      height: dimensionChange.dimensions!.height,
                    },
                    style: {
                      ...node.style,
                      width: dimensionChange.dimensions!.width,
                      height: dimensionChange.dimensions!.height,
                    },
                  };
                }
                return node;
              })
            );
          }
        } else if (change.type === 'position') {
          const positionChange = change as NodePositionChange;
          if (positionChange.position) {
            setNodes(nds =>
              nds.map(node => {
                if (node.id === positionChange.id) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      x: positionChange.position!.x,
                      y: positionChange.position!.y,
                      position: positionChange.position!,
                    },
                  };
                }
                return node;
              })
            );
          }
        }
      });
    },
    [onNodesChangeInternal, setNodes]
  );

  // GraphQL hooks
  const [createFlowMutation] = useCreateFlowMutation();
  const [updateFlowMutation] = useUpdateFlowMutation();
  const [updateFlowDataMutation] = useUpdateFlowDataMutation();

  // Load flow data from database if flowId is provided
  const {
    data: flowData,
    loading: isLoadingFlow,
    error: flowLoadError,
  } = useGetFlowQuery({
    variables: { id: flowId || '' },
    skip: !flowId, // Skip query if no flowId
  });

  // WebSocket state
  const [isConnected, setIsConnected] = useState(false);
  const [connectedClients, setConnectedClients] = useState(0);
  const [isFlowReady, setIsFlowReady] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isUpdatingFromRemote = useRef(false);
  const remoteUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Version tracking to prevent race conditions
  const isSaving = useRef(false);
  const optimisticVersion = useRef<number>(0);

  // Load or create flow on mount
  useEffect(() => {
    // Track if component is still mounted to prevent race conditions
    let isMounted = true;

    if (flowId) {
      // Wait for GraphQL query to complete
      if (isLoadingFlow) {
        setIsFlowReady(false);
        return;
      }

      // Handle flow load error or not found
      if (flowLoadError || !flowData?.flow) {
        console.error('Failed to load flow:', flowLoadError);
        if (isMounted) {
          window.location.href = '/';
        }
        return;
      }

      // Validate flow data from GraphQL
      const flow = flowData.flow;
      if (!validateFlowData(flow)) {
        console.error('Invalid flow data received from GraphQL API');
        if (isMounted) {
          window.location.href = '/';
        }
        return;
      }
      const flowEntry: FlowRegistryEntry = {
        id: flow.id,
        title: flow.title || 'Untitled Flow',
        lastModified: flow.updatedAt || new Date().toISOString(),
        createdAt: flow.insertedAt || new Date().toISOString(),
        nodeCount: flow.nodes?.length || 0,
        connectionCount: flow.edges?.length || 0,
      };

      if (isMounted) {
        setCurrentFlow(flowEntry);
        setIsNewFlow(false);
        const version = flow.version || 0;
        setCurrentVersion(version);
        optimisticVersion.current = version;

        // Transform nodes from GraphQL format to ReactFlow format
        const transformedNodes: Node<AIFlowNode>[] =
          (flow.nodes as GraphQLNode[] | undefined)?.map((node: GraphQLNode) => {
            const nodeData = parseNodeDataSafely(node.data);
            const type = node.type as AIFlowNode['type'];
            const defaults = nodeDefaults[type] || nodeDefaults.agent;

            const aiFlowNode: AIFlowNode = {
              id: node.nodeId,
              type,
              position: { x: node.positionX, y: node.positionY },
              dimensions: {
                width: node.width || defaults.width,
                height: node.height || defaults.height,
              },
              x: node.positionX,
              y: node.positionY,
              width: node.width || defaults.width,
              height: node.height || defaults.height,
              label: (nodeData.label as string) || defaults.label,
              description: (nodeData.description as string) || '',
              config: (nodeData.config as AIFlowNode['config']) || {},
              color: (nodeData.color as string) || defaults.color,
              borderColor: (nodeData.borderColor as string) || '#e5e7eb',
              borderWidth: (nodeData.borderWidth as number) || 1,
            };

            return {
              id: node.nodeId,
              type: 'aiFlowNode',
              position: { x: node.positionX, y: node.positionY },
              data: aiFlowNode,
              style: {
                width: node.width || defaults.width,
                height: node.height || defaults.height,
              },
            };
          }) || [];

        // Transform edges from GraphQL format to ReactFlow format
        const transformedEdges: Edge[] =
          (flow.edges as GraphQLEdge[] | undefined)?.map((edge: GraphQLEdge) => ({
            id: edge.edgeId,
            source: edge.sourceNodeId,
            target: edge.targetNodeId,
            sourceHandle: edge.sourceHandle || undefined,
            targetHandle: edge.targetHandle || undefined,
            type: edge.edgeType || 'default',
            animated: edge.animated || false,
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
            data: edge.data,
          })) || [];

        setNodes(transformedNodes);
        setEdges(transformedEdges);
        setInitialViewport({
          x: flow.viewportX ?? 0,
          y: flow.viewportY ?? 0,
          zoom: flow.viewportZoom ?? 1,
        });

        // Flow data is ready
        setIsFlowReady(true);
      }
    } else {
      // Create new flow via GraphQL
      const createNewFlow = async () => {
        try {
          const result = await createFlowMutation({
            variables: {
              input: {
                title: 'Untitled Flow',
                viewportX: 0,
                viewportY: 0,
                viewportZoom: 1,
              },
            },
          });

          if (result.data?.createFlow && isMounted) {
            const graphqlFlow = result.data.createFlow;

            // Convert GraphQL response to FlowRegistryEntry format
            const newFlow: FlowRegistryEntry = {
              id: graphqlFlow.id as string,
              title: graphqlFlow.title as string,
              lastModified: (graphqlFlow.updatedAt as string) || new Date().toISOString(),
              createdAt: (graphqlFlow.insertedAt as string) || new Date().toISOString(),
              nodeCount: 0,
              connectionCount: 0,
            };

            setCurrentFlow(newFlow);
            setIsNewFlow(true);
            const version = graphqlFlow.version || 0;
            setCurrentVersion(version);
            optimisticVersion.current = version;
            setNodes([]);
            setEdges([]);
            setIsFlowReady(true);
            window.history.replaceState(null, '', `/flow/${newFlow.id}`);
          } else if (!isMounted) {
            // Component unmounted, don't proceed
            return;
          } else {
            throw new Error('GraphQL mutation returned no data');
          }
        } catch (error) {
          console.error('Failed to create flow:', error);
          if (isMounted) {
            window.alert('Failed to create flow. Please try again.');
          }
        }
      };

      createNewFlow();
    }

    // Cleanup function to prevent race conditions
    return () => {
      isMounted = false;
    };
  }, [flowId, setNodes, setEdges, createFlowMutation, isLoadingFlow, flowLoadError, flowData]);

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

        // Clear any existing timeout to prevent premature flag reset
        if (remoteUpdateTimeoutRef.current) {
          clearTimeout(remoteUpdateTimeoutRef.current);
        }

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
        }

        // Reset flag after a sufficient delay to ensure React state updates complete
        // and auto-save debounce has time to check the flag
        remoteUpdateTimeoutRef.current = setTimeout(() => {
          isUpdatingFromRemote.current = false;
          remoteUpdateTimeoutRef.current = null;
        }, 1000); // Longer than auto-save debounce (500ms)
      },
      onClientJoined: data => setConnectedClients(data.client_count),
      onClientLeft: data => setConnectedClients(data.client_count),
      onFlowDeleted: () => {
        // Flow has been deleted by another user, redirect to home
        window.location.href = '/';
      },
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
          // Successfully joined WebSocket channel
        }
      } catch (error) {
        console.error('Failed to join flow channel:', error);
      } finally {
        setIsFlowReady(true);
      }
    };

    connectAndJoin();

    // Cleanup on unmount or flow change
    return () => {
      websocketService.leaveFlow();
      // Clear remote update timeout
      if (remoteUpdateTimeoutRef.current) {
        clearTimeout(remoteUpdateTimeoutRef.current);
        remoteUpdateTimeoutRef.current = null;
      }
      // Reset remote update flag
      isUpdatingFromRemote.current = false;
    };
  }, [currentFlow, setNodes, setEdges]);

  // Force save function for immediate saves
  const forceSave = useCallback(async () => {
    if (currentFlow && reactFlowInstance) {
      // Wait for any in-progress save to complete
      while (isSaving.current) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }

      isSaving.current = true;
      const versionToUse = optimisticVersion.current;

      try {
        // Transform ReactFlow nodes and edges to GraphQL format
        const graphqlNodes = transformNodesToGraphQL(nodes);
        const graphqlEdges = transformEdgesToGraphQL(edges);

        // Save immediately to database
        const result = await updateFlowDataMutation({
          variables: {
            id: currentFlow.id,
            input: {
              nodes: graphqlNodes,
              edges: graphqlEdges,
              version: versionToUse,
            },
          },
        });

        // Update version after successful save
        if (result.data?.updateFlowData?.version) {
          const newVersion = result.data.updateFlowData.version;
          setCurrentVersion(newVersion);
          optimisticVersion.current = newVersion;
        }

        setHasUnsavedChanges(false);
        return true;
      } catch (error) {
        console.error('Failed to force save:', error);
        return false;
      } finally {
        isSaving.current = false;
      }
    }
    return false;
  }, [currentFlow, nodes, edges, reactFlowInstance, updateFlowDataMutation]);

  // Page unload protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentFlow && hasUnsavedChanges) {
        // Force immediate save
        forceSave();

        // Warn user about potential data loss
        e.preventDefault();
        const message = 'You have unsaved changes. Are you sure you want to leave?';
        e.returnValue = message;
        return message;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && currentFlow && hasUnsavedChanges) {
        // Immediately save when tab becomes hidden
        forceSave();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentFlow, hasUnsavedChanges, forceSave]);

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
      const timeoutId = setTimeout(async () => {
        // Wait for any in-progress save to complete
        while (isSaving.current) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        isSaving.current = true;
        const versionToUse = optimisticVersion.current;

        try {
          // Transform ReactFlow nodes and edges to GraphQL format
          const graphqlNodes = transformNodesToGraphQL(nodes);
          const graphqlEdges = transformEdgesToGraphQL(edges);

          // Save to database via GraphQL
          const result = await updateFlowDataMutation({
            variables: {
              id: currentFlow.id,
              input: {
                nodes: graphqlNodes,
                edges: graphqlEdges,
                version: versionToUse,
              },
            },
          });

          if (result.data?.updateFlowData) {
            // Update version after successful save
            if (result.data.updateFlowData.version) {
              const newVersion = result.data.updateFlowData.version;
              setCurrentVersion(newVersion);
              optimisticVersion.current = newVersion;
            }

            // Update previous data reference
            prevFlowDataRef.current = JSON.parse(JSON.stringify(flowData));

            // Broadcast changes to other clients (only if not updating from remote)
            if (!isUpdatingFromRemote.current && websocketService.isConnected()) {
              websocketService.sendFlowChange(flowData).catch(error => {
                console.error('📡❌ Failed to broadcast flow changes:', error);
              });
            }
          }
        } catch (error) {
          console.error('Failed to save flow to database:', error);
        } finally {
          isSaving.current = false;
        }
      }, 500); // Increased debounce to 500ms for GraphQL operations

      // Store timeout reference for cleanup
      saveTimeoutRef.current = timeoutId;
      setHasUnsavedChanges(false); // Changes will be saved

      return () => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
      };
    }

    // Mark as having unsaved changes immediately
    setHasUnsavedChanges(true);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
      }
    };
  }, [
    nodes,
    edges,
    currentFlow,
    reactFlowInstance,
    updateFlowDataMutation,
    normalizeDataForComparison,
    currentVersion,
  ]);

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
    async (newTitle: string) => {
      if (currentFlow && newTitle.trim()) {
        try {
          // Update title in database via GraphQL
          await updateFlowMutation({
            variables: {
              id: currentFlow.id,
              input: {
                title: newTitle.trim(),
              },
            },
          });

          // Update local state
          setCurrentFlow(prev => (prev ? { ...prev, title: newTitle.trim() } : null));
        } catch (error) {
          console.error('Failed to update flow title:', error);
        }
      }
    },
    [currentFlow, updateFlowMutation]
  );

  const addNode = useCallback(
    (type: AIFlowNode['type'], customLabel?: string, customDescription?: string) => {
      const defaults = nodeDefaults[type];
      const newId = generateId();

      // Calculate smart position near existing nodes
      const calculateNewNodePosition = () => {
        const existingNodes = nodes;

        if (existingNodes.length === 0) {
          return { x: 100, y: 100 };
        }

        // Find the center of all existing nodes
        const centerX =
          existingNodes.reduce((sum, node) => sum + node.position.x, 0) / existingNodes.length;
        const centerY =
          existingNodes.reduce((sum, node) => sum + node.position.y, 0) / existingNodes.length;

        // Place new nodes in a spiral pattern around the center
        const angle = existingNodes.length * 0.5; // Increment angle for each new node
        const radius = 100 + existingNodes.length * 30; // Increasing radius

        return {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        };
      };

      const position = calculateNewNodePosition();

      const nodeData: AIFlowNode = {
        id: newId,
        type,
        position,
        dimensions: { width: defaults.width, height: defaults.height },
        x: position.x,
        y: position.y,
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
        position,
        data: nodeData,
        style: {
          width: defaults.width,
          height: defaults.height,
        },
      };

      setNodes(nds => nds.concat(newNode));
    },
    [setNodes, nodes]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      if (!source || !target) return;

      const uniqueId = generateId();

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
        id: generateId(),
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
        style: {
          width: defaults.width,
          height: defaults.height,
        },
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

  const unlinkEdge = useCallback(
    (sourceId: string, targetId: string) => {
      setEdges(eds => eds.filter(edge => !(edge.source === sourceId && edge.target === targetId)));
    },
    [setEdges]
  );

  const duplicateNode = useCallback(
    (nodeId: string) => {
      setNodes(nds => {
        const nodeToDuplicate = nds.find(node => node.id === nodeId);
        if (!nodeToDuplicate) return nds;

        const newNodeId = generateId();
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
          style: {
            width: nodeToDuplicate.data.width,
            height: nodeToDuplicate.data.height,
          },
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
    unlinkEdge,

    // WebSocket status
    isConnected,
    connectedClients,
    isFlowReady,

    // Save state
    hasUnsavedChanges,
    forceSave,

    // Initial viewport
    initialViewport,

    // Viewport change handler for onMoveEnd
    onMoveEnd: useCallback(() => {
      if (currentFlow && reactFlowInstance) {
        const viewport = reactFlowInstance.getViewport();

        // Debounced save
        const timeoutId = setTimeout(async () => {
          // Wait for any in-progress save to complete
          while (isSaving.current) {
            await new Promise(resolve => setTimeout(resolve, 50));
          }

          isSaving.current = true;
          const versionToUse = optimisticVersion.current;

          try {
            // Transform ReactFlow nodes and edges to GraphQL format
            const graphqlNodes = transformNodesToGraphQL(nodes);
            const graphqlEdges = transformEdgesToGraphQL(edges);

            // Save viewport changes to database
            const result = await updateFlowDataMutation({
              variables: {
                id: currentFlow.id,
                input: {
                  nodes: graphqlNodes,
                  edges: graphqlEdges,
                  version: versionToUse,
                },
              },
            });

            // Update version after successful save
            if (result.data?.updateFlowData?.version) {
              const newVersion = result.data.updateFlowData.version;
              setCurrentVersion(newVersion);
              optimisticVersion.current = newVersion;
            }
          } catch (error) {
            console.error('Failed to save viewport changes:', error);
          } finally {
            isSaving.current = false;
          }
        }, 300);

        return () => clearTimeout(timeoutId);
      }
    }, [currentFlow, nodes, edges, reactFlowInstance, updateFlowDataMutation]),

    // Add template functionality
    addTemplate: useCallback(
      (templateType: TemplateType = 'invoice-processing') => {
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
              width: nodeData.width,
              height: nodeData.height,
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
