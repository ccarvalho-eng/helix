import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
  NodeResizer,
  ReactFlowInstance,
} from 'reactflow';

import { AIFlowNode as OriginalAIFlowNode } from './types';
import { NodeConfig } from '../../shared/types';
import {
  getTemplate,
  TemplateType,
  getFeaturedTemplates,
  getTemplatesByCategory,
} from './templates';
import { Template } from './types';
import { PropertiesPanel } from './components/properties';
import { ErrorBoundary } from '../../shared/components/ui/ErrorBoundary';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Modal } from './components/Modal';
import { FlowManager } from './components/FlowManager';
import { UserListPopover } from './components/UserListPopover';
import { generateUsername } from './utils/usernameGenerator';
import { generateId, cryptoRandom } from '../../shared/utils';
import {
  Bot,
  Eye,
  Wrench,
  GitBranch,
  ArrowLeft,
  ArrowRight,
  Brain,
  RotateCcw,
  RefreshCw,
  Cpu,
  Circle,
  Zap,
  Menu,
  Sliders,
  Settings,
  Gamepad2,
  FolderOpen,
  Save,
} from 'lucide-react';

import { useFlowServer, useFlowStorage } from './hooks';

// Extended node type for React Flow
type ReactFlowAINode = OriginalAIFlowNode;

// Custom Node Component that matches the original design
function FlowNode({ data, selected }: { data: ReactFlowAINode; selected?: boolean }) {
  // Handle case where data might be undefined
  if (!data) {
    console.error('FlowNode: data is undefined');
    return <div>Error: Node data missing</div>;
  }
  const { theme } = useThemeContext();
  const NodeIcon = {
    agent: Bot,
    sensor: Eye,
    skill: Wrench,
    decision: GitBranch,
    input: ArrowLeft,
    output: ArrowRight,
    memory: Brain,
    loop: RotateCcw,
    transform: RefreshCw,
    api: Zap,
  }[data.type];

  const getIconColor = (nodeType: ReactFlowAINode['type']) => {
    const colors = {
      agent: '#0ea5e9',
      sensor: '#22c55e',
      skill: '#f59e0b',
      decision: '#ef4444',
      input: '#6366f1',
      output: '#06b6d4',
      memory: '#ec4899',
      loop: '#8b5cf6',
      transform: '#14b8a6',
      api: '#f97316',
    };
    return colors[nodeType];
  };

  const iconColor = getIconColor(data.type);

  // Use smaller, fixed dimensions for better canvas appearance
  const getNodeDimensions = (nodeType: ReactFlowAINode['type']) => {
    const dimensions = {
      agent: { width: '140px', height: '80px' },
      sensor: { width: '120px', height: '60px' },
      skill: { width: '120px', height: '60px' },
      decision: { width: '100px', height: '80px' },
      input: { width: '100px', height: '60px' },
      output: { width: '100px', height: '60px' },
      memory: { width: '120px', height: '60px' },
      loop: { width: '100px', height: '60px' },
      transform: { width: '130px', height: '60px' },
      api: { width: '100px', height: '60px' },
    };
    return dimensions[nodeType];
  };

  const { width, height } = getNodeDimensions(data.type);

  const nodeStyle = {
    '--node-bg-color': data.color,
    '--node-border-color': data.borderColor,
    '--node-shadow': '0 1px 3px rgba(0, 0, 0, 0.06)',
    // Remove fixed dimensions to allow resizing
    width: '100%',
    height: '100%',
  } as React.CSSProperties;

  return (
    <div className={`flow-node ${selected ? 'flow-node--selected' : ''}`} style={nodeStyle}>
      {/* Node Resizer - only visible when selected */}
      <NodeResizer
        color={theme === 'dark' ? '#98c379' : '#000000'}
        isVisible={selected}
        minWidth={parseInt(width)}
        minHeight={parseInt(height)}
      />

      {/* React Flow Handles for connections - Left and Right only */}
      <Handle
        type='target'
        position={Position.Left}
        id='left'
        className='flow-node__handle flow-node__handle--left'
      />
      <Handle
        type='source'
        position={Position.Right}
        id='right'
        className='flow-node__handle flow-node__handle--right'
      />

      <div className='flow-node__icon'>
        <NodeIcon size={20} color={iconColor} />
      </div>
      <div className='flow-node__label'>{data.label}</div>
    </div>
  );
}

// Node types for React Flow
const nodeTypes: NodeTypes = {
  aiFlowNode: FlowNode,
};

const edgeTypes: EdgeTypes = {};

// Node Palette - Simplified version with category selector
function ReactFlowNodePalette({
  onAddNode,
  onAddTemplate: _onAddTemplate,
  onOpenTemplatesModal,
  onTemplateClick,
}: {
  onAddNode: (
    _type: ReactFlowAINode['type'],
    _customLabel?: string,
    _customDescription?: string,
    _defaultConfig?: NodeConfig
  ) => void;
  onAddTemplate: (_templateType: TemplateType) => void;
  onOpenTemplatesModal: () => void;
  onTemplateClick: (_template: Template) => void;
}) {
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };
  const nodeDefinitions = [
    // Core nodes
    {
      type: 'agent' as const,
      icon: Bot,
      label: 'Agent',
      color: '#0ea5e9',
      category: 'core' as const,
    },
    {
      type: 'sensor' as const,
      icon: Eye,
      label: 'Sensor',
      color: '#22c55e',
      category: 'core' as const,
    },
    {
      type: 'skill' as const,
      icon: Wrench,
      label: 'Skill',
      color: '#f59e0b',
      category: 'core' as const,
    },
    {
      type: 'memory' as const,
      icon: Brain,
      label: 'Memory',
      color: '#ec4899',
      category: 'core' as const,
    },
    // Logic nodes
    {
      type: 'decision' as const,
      icon: GitBranch,
      label: 'Decision',
      color: '#ef4444',
      category: 'logic' as const,
    },
    {
      type: 'loop' as const,
      icon: RotateCcw,
      label: 'Loop',
      color: '#8b5cf6',
      category: 'logic' as const,
    },
    {
      type: 'transform' as const,
      icon: RefreshCw,
      label: 'Transform',
      color: '#14b8a6',
      category: 'logic' as const,
    },
    // I/O nodes
    {
      type: 'input' as const,
      icon: ArrowLeft,
      label: 'Input',
      color: '#6366f1',
      category: 'io' as const,
    },
    {
      type: 'output' as const,
      icon: ArrowRight,
      label: 'Output',
      color: '#06b6d4',
      category: 'io' as const,
    },
    {
      type: 'api' as const,
      icon: Zap,
      label: 'API',
      color: '#f97316',
      category: 'io' as const,
    },
  ];

  const categoryLabels = {
    core: 'Core Agents',
    logic: 'Logic Control',
    io: 'Input/Output',
  };

  const categoryIcons = {
    core: Bot,
    logic: GitBranch,
    io: ArrowLeft,
  };

  const nodesByCategory = nodeDefinitions.reduce(
    (acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    },
    {} as Record<'core' | 'logic' | 'io', typeof nodeDefinitions>
  );

  const handleDragStart = (e: React.DragEvent, nodeType: ReactFlowAINode['type']) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className='node-palette'>
      <div className='node-palette__header'>
        <h3 className='node-palette__title'>Node Palette</h3>
      </div>

      <div className='node-palette__content'>
        {Object.entries(categoryLabels).map(([category, label]) => {
          const nodes = nodesByCategory[category as 'core' | 'logic' | 'io'] || [];
          const CategoryIcon = categoryIcons[category as 'core' | 'logic' | 'io'];

          return (
            <div key={category} className='node-palette__section'>
              <div className='node-palette__section-header'>
                <CategoryIcon size={14} color='var(--flow-builder-text-muted)' />
                <h4 className='node-palette__section-title'>{label}</h4>
              </div>

              <div className='node-palette__nodes-grid'>
                {nodes.map(nodeDefinition => (
                  <div
                    key={nodeDefinition.type}
                    className='node-palette__node'
                    draggable
                    onDragStart={e => handleDragStart(e, nodeDefinition.type)}
                    onClick={() => onAddNode(nodeDefinition.type)}
                  >
                    <div className='node-palette__node-icon'>
                      <nodeDefinition.icon size={16} color={nodeDefinition.color} />
                    </div>
                    <div className='node-palette__node-info'>
                      <div className='node-palette__node-label'>{nodeDefinition.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className='react-flow-node-palette__templates'>
        <h4 className='react-flow-node-palette__templates-title'>Templates</h4>
        {(() => {
          const getTemplateIcon = (category: string) => {
            switch (category) {
              case 'technology':
                return Settings;
              case 'gaming':
                return Gamepad2;
              default:
                return Circle;
            }
          };

          const templates = getFeaturedTemplates();
          return templates.map(t => (
            <div
              key={t.id}
              className='react-flow-node-palette__template'
              onClick={() => onTemplateClick(t)}
            >
              <div className='react-flow-node-palette__template-title'>
                {(() => {
                  const IconComponent = getTemplateIcon(t.category);
                  return (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <IconComponent size={16} style={{ color: '#6b7280', flexShrink: 0 }} />
                      {t.name}
                    </div>
                  );
                })()}
              </div>
              <div className='react-flow-node-palette__template-description'>{t.description}</div>
            </div>
          ));
        })()}
        <div
          className='react-flow-node-palette__see-all-link'
          style={{
            marginTop: 12,
            padding: '8px 12px',
            fontSize: 14,
            color: theme === 'dark' ? 'var(--theme-text-secondary)' : '#6b7280',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: 6,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor =
              theme === 'dark' ? 'var(--theme-bg-tertiary)' : '#f3f4f6';
            e.currentTarget.style.color =
              theme === 'dark' ? 'var(--theme-syntax-green)' : '#374151';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color =
              theme === 'dark' ? 'var(--theme-text-secondary)' : '#6b7280';
          }}
          onClick={onOpenTemplatesModal}
        >
          See all templates →
        </div>
      </div>
    </div>
  );
}

// GenServer + localStorage hybrid storage system for reliability

// Internal component that uses React Flow hooks
function FlowBuilderInternal({
  username,
  onUsernameChange,
}: {
  username: string;
  onUsernameChange: (_username: string) => void;
}) {
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };

  // Generate or get flow ID from URL params or create new one
  const flowId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const urlFlowId = params.get('flow');
    if (urlFlowId) return urlFlowId;

    // Generate a new flow ID
    const newFlowId = `flow_${generateId()}`;
    // Update URL without reloading
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('flow', newFlowId);
    window.history.replaceState({}, '', newUrl.toString());
    return newFlowId;
  }, []);

  // Generate user ID
  const userId = useMemo(() => {
    let storedUserId = localStorage.getItem('helix-user-id');

    if (!storedUserId) {
      // Generate a persistent user ID that will be reused across sessions
      storedUserId = `user_${generateId()}`;
      localStorage.setItem('helix-user-id', storedUserId);
    }

    return storedUserId;
  }, []);

  // Initialize local storage and server hooks
  const storage = useFlowStorage();

  // Create the combined user identifier
  const serverUserId = `${username}_${userId}`;

  // Track if we're currently making local updates to prevent echo conflicts
  const localUpdateInProgressRef = useRef(false);

  const server = useFlowServer({
    flowId,
    userId: serverUserId,
    onFlowUpdated: flow => {
      console.log('📥 Flow updated from server:', flow);
      // Only update metadata, not nodes/edges (handled by onNodesUpdated/onEdgesUpdated)
      if (flow.name && flow.name !== currentFlowName) {
        setCurrentFlowName(flow.name);
      }
      setHasUnsavedChanges(false); // Server is the source of truth
    },
    onNodesUpdated: flow => {
      console.log('📥 Server nodes update received:', {
        nodeCount: flow.nodes?.length || 0,
        localUpdateInProgress: localUpdateInProgressRef.current,
        timestamp: new Date().toISOString(),
      });

      // Skip server updates if we're in the middle of a local update
      if (localUpdateInProgressRef.current) {
        console.log('⏸️ Ignoring server node update - local update in progress');
        return;
      }

      console.log('🔧 Processing server nodes update:', flow);
      if (flow.nodes) {
        // Check if server data is actually different from current state
        setNodes(currentNodes => {
          const serverNodes = flow.nodes.map((nodeData: ReactFlowAINode) => ({
            id: nodeData.id,
            type: 'aiFlowNode',
            position: nodeData.position || { x: nodeData.x || 0, y: nodeData.y || 0 },
            data: nodeData,
            style: {
              width: nodeData.width,
              height: nodeData.height,
            },
          }));

          // Only update if the server has different data
          const hasChanges = serverNodes.some(serverNode => {
            const currentNode = currentNodes.find(n => n.id === serverNode.id);
            if (!currentNode) return true; // New node

            // Check if position is significantly different (avoid floating point issues)
            const positionChanged =
              Math.abs((currentNode.position?.x || 0) - (serverNode.position?.x || 0)) > 5 ||
              Math.abs((currentNode.position?.y || 0) - (serverNode.position?.y || 0)) > 5;

            return positionChanged || currentNode.data.label !== serverNode.data.label;
          });

          if (hasChanges) {
            console.log('✅ Applying server node updates - changes detected');
            setHasUnsavedChanges(false);
            return serverNodes;
          } else {
            console.log('⏸️ Ignoring server update - no significant changes');
            return currentNodes;
          }
        });
      }
    },
    onEdgesUpdated: flow => {
      console.log('Edges updated from server:', flow);
      setEdges(flow.edges || []);
    },
    onSaveRequested: async flow => {
      console.log('Save requested by server:', flow);
      try {
        await storage.saveFlow(flow);
        console.log('Flow saved to localStorage');
      } catch (error) {
        console.error('Failed to save flow to localStorage:', error);
      }
    },
    onConnectionStatusChange: connected => {
      setServerConnected(connected);
    },
  });

  // React Flow state
  const [nodes, setNodes, onNodesChangeOriginal] = useNodesState<ReactFlowAINode>([]);
  const [edges, setEdges, onEdgesChangeOriginal] = useEdgesState([]);

  // Debounced server sync
  const serverSyncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Wrap change handlers to track unsaved changes
  const onNodesChange = useCallback(
    (changes: any) => {
      // Check if these are meaningful changes or just noise
      const significantChanges = changes.filter((c: any) => {
        // Ignore these types of changes as they're usually React Flow internal updates
        if (['select', 'dimensions', 'replace'].includes(c.type)) {
          return false;
        }

        if (c.type === 'position' && !c.dragging) {
          // Position change without dragging - check if it's a significant move
          const node = c.item || c;
          if (node.position) {
            const positionDelta = Math.abs(node.position.x || 0) + Math.abs(node.position.y || 0);
            return positionDelta > 5; // Only care about moves > 5px
          }
        }

        // Allow other types (add, remove, etc.)
        return true;
      });

      if (significantChanges.length === 0) {
        console.log(
          '👻 Phantom node changes (ignored):',
          changes.map((c: any) => c.type)
        );
        return; // Skip processing phantom changes
      }

      console.log('🔄 Significant node changes detected:', significantChanges);
      console.log(
        '🔍 Change types:',
        significantChanges.map((c: any) => c.type)
      );
      console.log('🔍 Stack trace:', new Error().stack?.split('\n').slice(1, 5));

      // Mark that we're doing a local update to prevent server echo conflicts
      localUpdateInProgressRef.current = true;

      onNodesChangeOriginal(changes);
      setHasUnsavedChanges(true);

      // Sync all changes to server (debounced)
      if (server.connected) {
        // Clear previous timeout
        if (serverSyncTimeoutRef.current) {
          clearTimeout(serverSyncTimeoutRef.current);
        }

        // Set new timeout for server sync
        serverSyncTimeoutRef.current = setTimeout(() => {
          console.log('Syncing node changes to server...');
          // Get the latest node state after the timeout
          setNodes(currentNodes => {
            const updatedNodes = currentNodes.map(n => ({
              ...n.data,
              position: n.position,
              x: n.position.x,
              y: n.position.y,
            }));
            console.log('Sending updated nodes to server:', updatedNodes.length);

            server
              .updateNodes(updatedNodes)
              .then(() => {
                // Clear the local update flag after successful server sync
                setTimeout(() => {
                  localUpdateInProgressRef.current = false;
                }, 500); // Brief delay to avoid race conditions
              })
              .catch(error => {
                console.error('Failed to sync nodes to server:', error);
                localUpdateInProgressRef.current = false;
              });

            return currentNodes; // Don't change the nodes, just sync to server
          });
        }, 500); // Increased debounce to reduce phantom updates
      } else {
        // Clear the flag immediately if not connected to server
        setTimeout(() => {
          localUpdateInProgressRef.current = false;
        }, 100);
      }
    },
    [onNodesChangeOriginal, server]
  );

  const onEdgesChange = useCallback(
    (changes: any) => {
      console.log('Edge changes detected:', changes);
      onEdgesChangeOriginal(changes);
      setHasUnsavedChanges(true);

      // Sync edge changes to server
      if (server.connected) {
        setTimeout(() => {
          console.log('Syncing edge changes to server...');
          setEdges(currentEdges => {
            console.log('Sending updated edges to server:', currentEdges.length);
            server.updateEdges(currentEdges).catch(console.error);
            return currentEdges;
          });
        }, 200); // Quick sync for edges
      }
    },
    [onEdgesChangeOriginal, server]
  );
  const [selectedNode, setSelectedNode] = useState<ReactFlowAINode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<'technology' | 'gaming'>('technology');
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [serverConnected, setServerConnected] = useState(false);
  const [currentFlowName, setCurrentFlowName] = useState('Untitled Flow');
  const [isFlowManagerOpen, setIsFlowManagerOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [_lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isEditingFlowName, setIsEditingFlowName] = useState(false);
  const [editingFlowName, setEditingFlowName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editingUsername, setEditingUsername] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [userListAnchor, setUserListAnchor] = useState<HTMLElement | null>(null);

  // Track if we've initialized to prevent re-initialization loops
  const initializationRef = useRef(false);

  // Initialize flow on mount - ONLY ONCE
  useEffect(() => {
    if (initializationRef.current) {
      console.log('⏭️ Skipping re-initialization - already initialized');
      return;
    }

    console.log('🚀 Initializing flow - first time only');
    initializationRef.current = true;

    const initializeFlow = async () => {
      try {
        // First try to load from localStorage
        const savedFlow = await storage.loadFlow(flowId);
        if (savedFlow) {
          console.log('📂 Loaded flow from localStorage:', savedFlow);
          // Load directly - convert to React Flow format
          const reactFlowNodes = (savedFlow.nodes || []).map((nodeData: any) => ({
            id: nodeData.id,
            type: 'aiFlowNode',
            position: nodeData.position || { x: nodeData.x || 0, y: nodeData.y || 0 },
            data: nodeData,
            style: {
              width: nodeData.width,
              height: nodeData.height,
            },
          }));
          setNodes(reactFlowNodes);
          setEdges(savedFlow.edges || []);
          setCurrentFlowName(savedFlow.name);

          // Fit view to content after loading (with delay to ensure nodes are rendered)
          setTimeout(() => {
            if (reactFlowInstance && reactFlowNodes.length > 0) {
              reactFlowInstance.fitView({ padding: 0.1 });
            }
          }, 100);

          // Create flow on server if connected (server will handle initial sync)
          if (server.connected) {
            await server.createFlow({
              name: savedFlow.name,
              description: savedFlow.description,
              nodes: savedFlow.nodes,
              edges: savedFlow.edges,
              viewport: savedFlow.viewport,
            });
          }
        } else {
          console.log('🆕 Creating new flow');
          // Create new flow
          if (server.connected) {
            await server.createFlow({ name: 'Untitled Flow', description: '' });
          }
        }
      } catch (error) {
        console.error('❌ Failed to initialize flow:', error);
        initializationRef.current = false; // Allow retry on error
      }
    };

    initializeFlow();
  }, [flowId]); // Only depend on flowId - run once per flow

  // Separate effect to handle server connection and initial load from server
  useEffect(() => {
    if (!server.connected || !server.flowState) return;

    // Only load from server if we haven't loaded anything yet (empty canvas)
    if (nodes.length === 0 && server.flowState.nodes?.length > 0) {
      console.log('🔄 Loading initial data from server');
      const reactFlowNodes = (server.flowState.nodes || []).map((nodeData: ReactFlowAINode) => ({
        id: nodeData.id,
        type: 'aiFlowNode',
        position: nodeData.position || { x: nodeData.x || 0, y: nodeData.y || 0 },
        data: nodeData,
        style: {
          width: nodeData.width,
          height: nodeData.height,
        },
      }));
      setNodes(reactFlowNodes);
      setEdges(server.flowState.edges || []);
      setCurrentFlowName(server.flowState.name);

      // Update viewport if available
      if (server.flowState.viewport && reactFlowInstance) {
        reactFlowInstance.setViewport(server.flowState.viewport);
      }
    }
  }, [server.connected]); // Only run when connection changes

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);

    return () => {
      mq.removeEventListener('change', update);
    };
  }, []);

  // Check for templates parameter and open templates modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldShowTemplates = params.get('templates') === 'true';

    if (shouldShowTemplates) {
      setIsTemplatesModalOpen(true);
      // Clean up URL
      params.delete('templates');
      const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Helper function to get node description by type
  const getNodeDescriptionByType = (type: ReactFlowAINode['type']): string => {
    const descriptions = {
      agent: 'Autonomous AI agent with reasoning capabilities',
      sensor: 'Monitor and collect data from sources',
      skill: 'Execute specific functions or tools',
      memory: 'Store and retrieve context or state',
      decision: 'Route flow based on conditions',
      loop: 'Iterate over data or repeat actions',
      transform: 'Process and format data',
      input: 'Entry point for data or prompts',
      output: 'Final result or endpoint',
      api: 'Connect to external APIs and services',
    };
    return descriptions[type] || `${type} node`;
  };

  // Add node function
  const addNode = useCallback(
    (
      type: ReactFlowAINode['type'],
      customLabel?: string,
      customDescription?: string,
      defaultConfig?: NodeConfig
    ) => {
      const nodeDefaults = {
        agent: { width: 140, height: 80, color: '#f0f9ff', label: 'AI Agent' },
        sensor: { width: 120, height: 60, color: '#f0fdf4', label: 'Sensor' },
        skill: { width: 120, height: 60, color: '#fffbeb', label: 'Skill' },
        decision: {
          width: 100,
          height: 80,
          color: '#fef2f2',
          label: 'Decision',
        },
        input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
        output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
        memory: { width: 120, height: 60, color: '#fdf2f8', label: 'Memory' },
        loop: { width: 100, height: 60, color: '#faf5ff', label: 'Loop' },
        transform: {
          width: 130,
          height: 60,
          color: '#f0fdfa',
          label: 'Transform',
        },
        api: { width: 100, height: 60, color: '#fff7ed', label: 'API' },
      };

      const defaults = nodeDefaults[type];
      const nodeData: ReactFlowAINode = {
        id: generateId(),
        type,
        position: { x: 0, y: 0 },
        dimensions: { width: defaults.width, height: defaults.height },
        label: customLabel || defaults.label,
        description: customDescription || getNodeDescriptionByType(type),
        config: defaultConfig || {},
        x: 0,
        y: 0,
        width: defaults.width,
        height: defaults.height,
        color: defaults.color,
        borderColor: '#e5e7eb',
        borderWidth: 1,
      };

      const newNode: Node<ReactFlowAINode> = {
        id: nodeData.id,
        type: 'aiFlowNode',
        position: {
          x: cryptoRandom() * 400 + 100,
          y: cryptoRandom() * 400 + 100,
        },
        data: nodeData,
        style: {
          width: defaults.width,
          height: defaults.height,
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);

      // Sync with server
      if (server.connected) {
        server.updateNodes(newNodes.map(n => n.data)).catch(console.error);
      }
    },
    [setNodes, nodes, server]
  );

  // Handle connections
  const onConnect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const edge: Edge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle,
        targetHandle: connection.targetHandle,
        type: 'default', // Use default bezier edge
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
      const newEdges = addEdge(edge, edges);
      setEdges(newEdges);

      // Sync with server
      if (server.connected) {
        server.updateEdges(newEdges).catch(console.error);
      }
    },
    [setEdges, edges, server]
  );

  // Handle drag over for node palette
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop for node palette
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as ReactFlowAINode['type'];

      if (typeof type === 'undefined' || !type || !reactFlowInstance) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Create node at the dropped position
      const nodeDefaults = {
        agent: { width: 140, height: 80, color: '#f0f9ff', label: 'AI Agent' },
        sensor: { width: 120, height: 60, color: '#f0fdf4', label: 'Sensor' },
        skill: { width: 120, height: 60, color: '#fffbeb', label: 'Skill' },
        decision: {
          width: 100,
          height: 80,
          color: '#fef2f2',
          label: 'Decision',
        },
        input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
        output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
        memory: { width: 120, height: 60, color: '#fdf2f8', label: 'Memory' },
        loop: { width: 100, height: 60, color: '#faf5ff', label: 'Loop' },
        transform: {
          width: 130,
          height: 60,
          color: '#f0fdfa',
          label: 'Transform',
        },
        api: { width: 100, height: 60, color: '#fff7ed', label: 'API' },
      };

      const defaults = nodeDefaults[type];
      const nodeData: ReactFlowAINode = {
        id: generateId(),
        type,
        position: { x: position.x, y: position.y },
        dimensions: { width: defaults.width, height: defaults.height },
        x: position.x,
        y: position.y,
        width: defaults.width,
        height: defaults.height,
        label: defaults.label,
        description: getNodeDescriptionByType(type),
        config: {},
        color: defaults.color,
        borderColor: '#e5e7eb',
        borderWidth: 1,
      };

      const newNode: Node<ReactFlowAINode> = {
        id: nodeData.id,
        type: 'aiFlowNode', // Always use aiFlowNode as the React Flow type
        position,
        data: nodeData,
        style: {
          width: defaults.width,
          height: defaults.height,
        },
      };

      const newNodes = [...nodes, newNode];
      setNodes(newNodes);

      // Sync with server
      if (server.connected) {
        server.updateNodes(newNodes.map(n => n.data)).catch(console.error);
      }
    },
    [reactFlowInstance, setNodes, nodes, server]
  );

  // Handle node selection
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node<ReactFlowAINode>[] }) => {
      if (selectedNodes.length > 0) {
        setSelectedNode(selectedNodes[0].data);
        setIsPropertiesOpen(true);
      } else {
        setSelectedNode(null);
      }
    },
    []
  );

  // Update node function
  const updateNode = useCallback(
    (id: string, updates: Partial<ReactFlowAINode>) => {
      const newNodes = nodes.map(node => {
        if (node.id === id) {
          const updatedData = { ...node.data, ...updates };
          return { ...node, data: updatedData };
        }
        return node;
      });

      setNodes(newNodes);

      if (selectedNode?.id === id) {
        setSelectedNode({ ...selectedNode, ...updates });
      }

      // Sync with server
      if (server.connected) {
        server.updateNodes(newNodes.map(n => n.data)).catch(console.error);
      }
    },
    [setNodes, selectedNode, nodes, server]
  );

  // Delete node function
  const deleteNode = useCallback(
    (id: string) => {
      const newNodes = nodes.filter(node => node.id !== id);
      const newEdges = edges.filter(edge => edge.source !== id && edge.target !== id);

      setNodes(newNodes);
      setEdges(newEdges);

      if (selectedNode?.id === id) {
        setSelectedNode(null);
      }

      // Sync with server
      if (server.connected) {
        server.updateNodes(newNodes.map(n => n.data)).catch(console.error);
        server.updateEdges(newEdges).catch(console.error);
      }
    },
    [setNodes, setEdges, selectedNode, nodes, edges, server]
  );

  // Duplicate node function
  const duplicateNode = useCallback(
    (nodeId: string) => {
      setNodes(nds => {
        const nodeToDuplicate = nds.find(node => node.id === nodeId);
        if (!nodeToDuplicate) return nds;

        const newNodeId = generateId();
        const duplicatedNode: Node<ReactFlowAINode> = {
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

  // Add template function using the new template system
  const addTemplate = useCallback(
    (templateType: TemplateType = 'assassins-creed') => {
      const template = getTemplate(templateType);
      const { nodes: templateNodes, connections: templateConnections } = template;

      // Create nodes
      const newNodes = templateNodes.map(nodeTemplate => {
        const nodeDefaults = {
          agent: { width: 140, height: 80, color: '#f0f9ff' },
          sensor: { width: 120, height: 60, color: '#f0fdf4' },
          skill: { width: 120, height: 60, color: '#fffbeb' },
          decision: { width: 100, height: 80, color: '#fef2f2' },
          input: { width: 100, height: 60, color: '#faf5ff' },
          output: { width: 100, height: 60, color: '#f0fdfa' },
          memory: { width: 120, height: 60, color: '#fdf2f8' },
          loop: { width: 100, height: 60, color: '#faf5ff' },
          transform: { width: 130, height: 60, color: '#f0fdfa' },
          api: { width: 100, height: 60, color: '#fff7ed' },
        };

        const defaults = nodeDefaults[nodeTemplate.type];
        const nodeData: ReactFlowAINode = {
          id: nodeTemplate.id,
          type: nodeTemplate.type,
          position: { x: nodeTemplate.x, y: nodeTemplate.y },
          dimensions: { width: defaults.width, height: defaults.height },
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
        };

        const newNode: Node<ReactFlowAINode> = {
          id: nodeData.id,
          type: 'aiFlowNode',
          position: { x: nodeTemplate.x, y: nodeTemplate.y },
          data: nodeData,
          style: {
            width: defaults.width,
            height: defaults.height,
          },
        };

        return newNode;
      });

      // Create template connections/edges

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

      // Add both nodes and edges
      setNodes(nds => [...nds, ...newNodes]);
      setEdges(eds => [...eds, ...newEdges]);
    },
    [setNodes, setEdges]
  );

  // FlowManager functions
  const handleLoadFlow = useCallback(
    async (flowId: string) => {
      try {
        const savedFlow = await storage.loadFlow(flowId);
        if (savedFlow) {
          if (server.connected) {
            await server.loadFlow(savedFlow);
          } else {
            // Convert to React Flow format
            const reactFlowNodes = (savedFlow.nodes || []).map((nodeData: any) => ({
              id: nodeData.id,
              type: 'aiFlowNode',
              position: nodeData.position || { x: nodeData.x || 0, y: nodeData.y || 0 },
              data: nodeData,
              style: {
                width: nodeData.width,
                height: nodeData.height,
              },
            }));
            setNodes(reactFlowNodes);
            setEdges(savedFlow.edges || []);
            setCurrentFlowName(savedFlow.name);
            if (reactFlowInstance && savedFlow.viewport) {
              reactFlowInstance.setViewport(savedFlow.viewport);
            }
          }
          setIsFlowManagerOpen(false);
        }
      } catch (error) {
        console.error('Failed to load flow:', error);
        alert('Failed to load flow. Please try again.');
      }
    },
    [storage, server, setNodes, setEdges, reactFlowInstance]
  );

  const handleCreateNewFlow = useCallback(async () => {
    try {
      // Clear current state
      setNodes([]);
      setEdges([]);
      setCurrentFlowName('Untitled Flow');

      if (server.connected) {
        await server.createFlow({ name: 'Untitled Flow', description: '' });
      }

      // Update URL with new flow ID
      const newFlowId = `flow_${generateId()}`;
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('flow', newFlowId);
      window.history.pushState({}, '', newUrl.toString());

      setIsFlowManagerOpen(false);
    } catch (error) {
      console.error('Failed to create new flow:', error);
      alert('Failed to create new flow. Please try again.');
    }
  }, [server, setNodes, setEdges]);

  // Flow name editing handlers
  const handleStartEditingFlowName = useCallback(() => {
    setEditingFlowName(currentFlowName);
    setIsEditingFlowName(true);
  }, [currentFlowName]);

  const handleSaveFlowName = useCallback(async () => {
    const trimmedName = editingFlowName.trim();
    if (!trimmedName) {
      setEditingFlowName(currentFlowName);
      setIsEditingFlowName(false);
      return;
    }

    try {
      if (server.connected) {
        await server.updateMetadata(trimmedName, server.flowState?.description || '');
      }
      setCurrentFlowName(trimmedName);
      setIsEditingFlowName(false);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to update flow name:', error);
      // Revert on error
      setEditingFlowName(currentFlowName);
      setIsEditingFlowName(false);
    }
  }, [editingFlowName, currentFlowName, server]);

  const handleCancelEditingFlowName = useCallback(() => {
    setEditingFlowName(currentFlowName);
    setIsEditingFlowName(false);
  }, [currentFlowName]);

  // Username editing handlers
  const handleStartEditingUsername = useCallback(() => {
    setEditingUsername(username);
    setIsEditingUsername(true);
  }, [username]);

  const handleSaveUsername = useCallback(() => {
    const trimmedUsername = editingUsername.trim();
    if (!trimmedUsername) {
      setEditingUsername(username);
      setIsEditingUsername(false);
      return;
    }

    onUsernameChange(trimmedUsername);
    setIsEditingUsername(false);
  }, [editingUsername, username, onUsernameChange]);

  const handleCancelEditingUsername = useCallback(() => {
    setEditingUsername(username);
    setIsEditingUsername(false);
  }, [username]);

  // Note: Viewport auto-save removed to prevent infinite update loops
  // Viewport will be saved manually when user makes significant changes

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete node with Delete/Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          deleteNode(selectedNode.id);
        }
      }

      // Duplicate node with Ctrl+D (Windows/Linux) or Cmd+D (Mac)
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); // Prevent browser bookmark shortcut
        if (selectedNode) {
          duplicateNode(selectedNode.id);
        }
      }

      // Escape closes drawers on mobile
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setIsPropertiesOpen(false);
        setIsTemplatesModalOpen(false);
      }

      // Toggle canvas lock with Ctrl+Shift+L or Cmd+Shift+L
      if (e.key === 'L' && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault();
        setIsCanvasLocked(!isCanvasLocked);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode, duplicateNode, isCanvasLocked]);

  const hasAnyDrawerOpen = (isPaletteOpen || isPropertiesOpen) && isMobile;

  return (
    <div className='flow-builder'>
      {/* Header with consistent branding */}
      <div className='flow-builder__header'>
        <div className='flow-builder__brand'>
          <a href='/' style={{ display: 'contents' }}>
            <Cpu className='flow-builder__logo' />
            <h1 className='flow-builder__title'>Helix</h1>
            <span className='flow-builder__subtitle'>AI Flow Builder</span>
          </a>
        </div>

        <div className='flow-builder__flow-info'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Flow Name */}
            <div className='flow-builder__flow-name'>
              {isEditingFlowName ? (
                <input
                  type='text'
                  value={editingFlowName}
                  onChange={e => setEditingFlowName(e.target.value)}
                  onBlur={handleSaveFlowName}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      handleSaveFlowName();
                    } else if (e.key === 'Escape') {
                      handleCancelEditingFlowName();
                    }
                  }}
                  autoFocus
                  style={{
                    background:
                      theme === 'dark' ? 'rgba(40, 44, 52, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                    border: `2px solid ${theme === 'dark' ? '#98c379' : '#000000'}`,
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    fontWeight: '600',
                    color: 'inherit',
                    outline: 'none',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    minWidth: '140px',
                    boxShadow:
                      theme === 'dark'
                        ? '0 0 0 3px rgba(152, 195, 121, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3)'
                        : '0 0 0 3px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                  }}
                />
              ) : (
                <span
                  onClick={handleStartEditingFlowName}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    transition: 'all 0.2s ease',
                    border: '2px solid transparent',
                    fontWeight: '600',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      theme === 'dark' ? 'rgba(152, 195, 121, 0.1)' : 'rgba(0, 0, 0, 0.03)';
                    e.currentTarget.style.borderColor =
                      theme === 'dark' ? 'rgba(152, 195, 121, 0.3)' : 'rgba(0, 0, 0, 0.1)';
                    e.currentTarget.style.boxShadow =
                      theme === 'dark'
                        ? '0 0 0 2px rgba(152, 195, 121, 0.05), 0 1px 4px rgba(0, 0, 0, 0.2)'
                        : '0 0 0 2px rgba(0, 0, 0, 0.02), 0 1px 4px rgba(0, 0, 0, 0.05)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  title='Click to edit flow name'
                >
                  {currentFlowName}
                </span>
              )}
            </div>

            {/* User Info - moved inline */}
            <div
              className='flow-builder__user-info'
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {/* Current user display */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#5c6370' : '#6b7280' }}>
                  joined as
                </span>
                {isEditingUsername ? (
                  <input
                    type='text'
                    value={editingUsername}
                    onChange={e => setEditingUsername(e.target.value)}
                    onBlur={handleSaveUsername}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleSaveUsername();
                      } else if (e.key === 'Escape') {
                        handleCancelEditingUsername();
                      }
                    }}
                    autoFocus
                    style={{
                      background:
                        theme === 'dark' ? 'rgba(40, 44, 52, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                      border: `1px solid ${theme === 'dark' ? '#61afef' : '#3b82f6'}`,
                      fontSize: '12px',
                      fontFamily: 'inherit',
                      fontWeight: '500',
                      color: 'inherit',
                      outline: 'none',
                      borderRadius: '4px',
                      padding: '2px 6px',
                      minWidth: '80px',
                    }}
                  />
                ) : (
                  <span
                    onClick={handleStartEditingUsername}
                    style={{
                      cursor: 'pointer',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      fontWeight: '500',
                      fontSize: '12px',
                      backgroundColor: theme === 'dark' ? '#61afef20' : '#3b82f620',
                      color: theme === 'dark' ? '#61afef' : '#3b82f6',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.backgroundColor =
                        theme === 'dark' ? '#61afef30' : '#3b82f630';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor =
                        theme === 'dark' ? '#61afef20' : '#3b82f620';
                    }}
                    title='Click to edit username'
                  >
                    {username}
                  </span>
                )}
              </div>

              {/* Connected users count */}
              {server.connectedUsers.length > 1 && (
                <span
                  onClick={e => {
                    setUserListAnchor(e.currentTarget);
                    setShowUserList(true);
                  }}
                  style={{
                    cursor: 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: theme === 'dark' ? '#22c55e20' : '#22c55e20',
                    color: theme === 'dark' ? '#22c55e' : '#16a34a',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor =
                      theme === 'dark' ? '#22c55e30' : '#22c55e30';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor =
                      theme === 'dark' ? '#22c55e20' : '#22c55e20';
                  }}
                  title='Click to see all connected users'
                >
                  +{server.connectedUsers.length - 1} other
                  {server.connectedUsers.length === 2 ? '' : 's'}
                </span>
              )}
            </div>
          </div>

          {/* Connection status - now separate row */}
          <div className='flow-builder__connection-status'>
            <div
              className={`flow-builder__status-indicator ${serverConnected ? 'connected' : 'disconnected'}`}
              title={serverConnected ? 'Connected to server' : 'Server disconnected'}
            />
          </div>
        </div>

        <div className='flow-builder__header-controls'>
          <div className='flow-builder__stats'>
            <span className='flow-builder__stat'>
              <Circle size={14} className='flow-builder__stat-icon' />
              {nodes.length} nodes
            </span>
            <span className='flow-builder__stat'>
              <Zap size={14} className='flow-builder__stat-icon' />
              {edges.length} connections
            </span>
          </div>

          <button
            className='flow-builder__save-btn'
            onClick={async () => {
              if (isSaving) return; // Prevent multiple saves

              try {
                setIsSaving(true);

                // Capture current React Flow state including positions
                const currentViewport = reactFlowInstance?.getViewport() || { x: 0, y: 0, zoom: 1 };
                const currentFlowState = {
                  id: flowId,
                  name: currentFlowName,
                  description: server.flowState?.description || '',
                  nodes: nodes.map(n => ({
                    ...n.data,
                    position: n.position,
                    x: n.position.x,
                    y: n.position.y,
                  })),
                  edges: edges,
                  viewport: currentViewport,
                  createdAt: server.flowState?.createdAt || new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                };

                await storage.saveFlow(currentFlowState);

                // Also update server if connected
                if (server.connected) {
                  await server.updateMetadata(currentFlowName, server.flowState?.description || '');
                  await server.updateNodes(currentFlowState.nodes);
                  await server.updateEdges(edges);
                }

                setHasUnsavedChanges(false);
                setLastSavedTime(new Date());
                console.log('Flow saved successfully');
              } catch (error) {
                console.error('Failed to save flow:', error);
              } finally {
                setIsSaving(false);
              }
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${
                isSaving
                  ? '#06b6d4'
                  : hasUnsavedChanges
                    ? '#f59e0b'
                    : theme === 'dark'
                      ? '#374151'
                      : '#d1d5db'
              }`,
              backgroundColor: isSaving
                ? '#06b6d4'
                : hasUnsavedChanges
                  ? '#f59e0b'
                  : theme === 'dark'
                    ? '#16a34a'
                    : '#16a34a',
              color: 'white',
              cursor: isSaving ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: isSaving
                ? '0 0 0 2px rgba(6, 182, 212, 0.2)'
                : hasUnsavedChanges
                  ? '0 0 0 2px rgba(245, 158, 11, 0.2)'
                  : 'none',
              opacity: isSaving ? 0.8 : 1,
              transition: 'all 0.2s ease',
            }}
            title={
              isSaving
                ? 'Saving...'
                : hasUnsavedChanges
                  ? 'Save Flow (Unsaved changes)'
                  : 'Save Flow'
            }
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save*' : 'Save'}
            {hasUnsavedChanges && !isSaving && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#dc2626',
                  borderRadius: '50%',
                  border: '2px solid white',
                }}
              />
            )}
          </button>

          <button
            className='flow-builder__flow-manager-btn'
            onClick={() => setIsFlowManagerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
              backgroundColor: 'transparent',
              color: theme === 'dark' ? 'white' : '#374151',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
            title='Flow Manager'
          >
            <FolderOpen size={16} />
            Flows
          </button>

          <ThemeToggle />
          {/* Mobile burgers */}
          <button
            className='flow-builder__burger flow-builder__burger--left'
            aria-label='Toggle node palette'
            onClick={() => setIsPaletteOpen(v => !v)}
          >
            <Menu size={18} />
          </button>
          <button
            className='flow-builder__burger flow-builder__burger--right'
            aria-label='Toggle properties'
            onClick={() => setIsPropertiesOpen(v => !v)}
          >
            <Sliders size={18} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className='flow-builder__content'>
        <div
          className={`${isPaletteOpen ? 'drawer drawer--left drawer--open' : 'drawer drawer--left'}`}
        >
          {/* Mobile close button for palette */}
          {isPaletteOpen && (
            <button
              className='drawer__close drawer__close--left'
              aria-label='Close node palette'
              onClick={() => setIsPaletteOpen(false)}
            >
              ×
            </button>
          )}
          <ReactFlowNodePalette
            onAddNode={addNode}
            onAddTemplate={addTemplate}
            onOpenTemplatesModal={() => setIsTemplatesModalOpen(true)}
            onTemplateClick={template => addTemplate(template.id as TemplateType)}
          />
        </div>

        {/* React Flow Canvas */}
        <div className='flow-canvas'>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onSelectionChange={onSelectionChange}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultViewport={server.flowState?.viewport || { x: 0, y: 0, zoom: 1 }}
            className={`flow-canvas__reactflow ${isCanvasLocked ? 'flow-canvas__reactflow--locked' : ''}`}
            connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2 }}
            defaultEdgeOptions={{
              type: 'default',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
              style: { stroke: '#9ca3af', strokeWidth: 2 },
            }}
            attributionPosition='bottom-left'
            proOptions={{ hideAttribution: true }}
            panOnScroll={!isCanvasLocked}
            selectionOnDrag={!isCanvasLocked}
            panOnDrag={isCanvasLocked ? false : [1, 2]}
            zoomOnScroll={!isCanvasLocked}
            zoomOnPinch={!isCanvasLocked}
            zoomOnDoubleClick={false}
            nodesConnectable={!isCanvasLocked}
            nodesDraggable={!isCanvasLocked}
            elementsSelectable={!isCanvasLocked}
          >
            <Controls className='flow-canvas__controls' />
            <MiniMap
              style={{
                height: 120,
                width: 200,
                backgroundColor:
                  theme === 'dark' ? 'var(--theme-bg-secondary, #21252b)' : '#ffffff',
                border: `1px solid ${theme === 'dark' ? 'var(--theme-border-primary, #3e4451)' : '#e5e7eb'}`,
                borderRadius: '8px',
                boxShadow:
                  theme === 'dark'
                    ? 'var(--theme-shadow, 0 4px 12px rgba(0, 0, 0, 0.3))'
                    : '0 2px 8px rgba(0, 0, 0, 0.1)',
              }}
              nodeColor={theme === 'dark' ? 'var(--theme-bg-tertiary, #32363e)' : '#f8f9fa'}
              nodeStrokeColor={
                theme === 'dark' ? 'var(--theme-border-primary, #3e4451)' : '#dee2e6'
              }
              nodeBorderRadius={4}
              maskColor={theme === 'dark' ? 'rgba(40, 44, 52, 0.8)' : 'rgba(255, 255, 255, 0.8)'}
              zoomable
              pannable
              position='bottom-right'
              offsetScale={0.8}
            />
            <Background color='#f3f4f6' gap={20} size={1} className='flow-canvas__background' />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        <div
          className={`properties-panel ${isPropertiesOpen ? 'drawer drawer--right drawer--open' : 'drawer drawer--right'}`}
        >
          <PropertiesPanel
            selectedNode={selectedNode}
            selectedConnection={null}
            onUpdateNode={updateNode}
            onUpdateConnection={() => {}}
            onDeleteNode={deleteNode}
            allNodes={nodes.map(n => n.data)}
            allEdges={edges.map(e => ({
              source: e.source,
              target: e.target,
            }))}
            onOpenNodeModal={nodeId => setModalNodeId(nodeId)}
            onUnlinkEdge={(sourceId, targetId) => {
              setEdges(eds => eds.filter(e => !(e.source === sourceId && e.target === targetId)));
            }}
          />
        </div>
      </div>

      {/* Mobile backdrop */}
      {hasAnyDrawerOpen && (
        <div
          className='flow-builder__backdrop'
          onClick={() => {
            setIsPaletteOpen(false);
            setIsPropertiesOpen(false);
          }}
        />
      )}

      {/* Templates modal */}
      <Modal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        title='All Templates'
        size='large'
      >
        <div>
          {/* Category Tabs */}
          <div
            className='flow-builder__template-tabs'
            style={{
              display: 'flex',
              borderBottom: '1px solid #e5e7eb',
              marginBottom: '20px',
            }}
          >
            <button
              className={`flow-builder__template-tab ${activeTemplateTab === 'technology' ? 'active' : ''}`}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                borderBottom:
                  activeTemplateTab === 'technology'
                    ? `2px solid ${theme === 'dark' ? '#98c379' : '#0f172a'}`
                    : '2px solid transparent',
                color:
                  activeTemplateTab === 'technology'
                    ? theme === 'dark'
                      ? '#98c379'
                      : '#0f172a'
                    : '#6b7280',
                fontWeight: activeTemplateTab === 'technology' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={() => setActiveTemplateTab('technology')}
            >
              <Settings size={16} />
              Technology
            </button>
            <button
              className={`flow-builder__template-tab ${activeTemplateTab === 'gaming' ? 'active' : ''}`}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                borderBottom:
                  activeTemplateTab === 'gaming'
                    ? `2px solid ${theme === 'dark' ? '#98c379' : '#0f172a'}`
                    : '2px solid transparent',
                color:
                  activeTemplateTab === 'gaming'
                    ? theme === 'dark'
                      ? '#98c379'
                      : '#0f172a'
                    : '#6b7280',
                fontWeight: activeTemplateTab === 'gaming' ? '600' : '400',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onClick={() => setActiveTemplateTab('gaming')}
            >
              <Gamepad2 size={16} />
              Gaming
            </button>
          </div>

          {/* Template Cards */}
          <div className='flow-builder__templates-grid'>
            {getTemplatesByCategory(activeTemplateTab).map(template => {
              const getTemplateIcon = (category: string) => {
                switch (category) {
                  case 'technology':
                    return Settings;
                  case 'gaming':
                    return Gamepad2;
                  default:
                    return Circle;
                }
              };
              const IconComponent = getTemplateIcon(template.category);

              return (
                <div
                  key={template.id}
                  className='flow-builder__template-card'
                  onClick={() => {
                    addTemplate(template.id as TemplateType);
                    setIsTemplatesModalOpen(false);
                  }}
                >
                  <div className='flow-builder__template-card-header'>
                    <h3
                      className='flow-builder__template-card-title'
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <IconComponent size={18} style={{ color: '#6b7280', flexShrink: 0 }} />
                      {template.name}
                    </h3>
                  </div>
                  <p className='flow-builder__template-card-description'>{template.description}</p>
                  <div className='flow-builder__template-card-stats'>
                    <span>{template.nodes.length} nodes</span>
                    <span>{template.connections.length} connections</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* Node details modal */}
      {modalNodeId && (
        <div className='flow-builder__modal-backdrop' onClick={() => setModalNodeId(null)}>
          <div className='flow-builder__modal' onClick={e => e.stopPropagation()}>
            {(() => {
              const node = nodes.find(n => n.id === modalNodeId);
              if (!node) return null;
              const d = node.data;
              return (
                <>
                  <div className='flow-builder__modal-header'>
                    <div className='flow-builder__modal-title'>
                      <span className='flow-builder__modal-title-text'>{d.label}</span>
                      <span className='flow-builder__modal-badge'>{d.type.toUpperCase()}</span>
                    </div>
                    <button
                      className='flow-builder__modal-close'
                      aria-label='Close'
                      onClick={() => setModalNodeId(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className='flow-builder__modal-body'>
                    {d.description && (
                      <div className='flow-builder__modal-desc'>{d.description}</div>
                    )}
                    <div className='flow-builder__modal-section'>
                      <div className='flow-builder__modal-section-title'>Configuration</div>
                      <pre className='flow-builder__modal-code'>
                        {JSON.stringify(d.config || {}, null, 2)}
                      </pre>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Flow Manager */}
      <FlowManager
        isOpen={isFlowManagerOpen}
        onClose={() => setIsFlowManagerOpen(false)}
        currentFlow={server.flowState}
        onLoadFlow={handleLoadFlow}
        onCreateNew={handleCreateNewFlow}
      />

      {/* User List Popover */}
      <UserListPopover
        isOpen={showUserList}
        onClose={() => setShowUserList(false)}
        users={server.connectedUsers}
        currentUser={`${username}_${userId}`}
        anchorElement={userListAnchor}
      />
    </div>
  );
}

// Username wrapper component that generates username automatically
function FlowBuilderWithAuth() {
  const [currentUsername, setCurrentUsername] = useState('');

  // Generate or get username on mount - persist for this tab session
  useEffect(() => {
    // Check if we already have a username for this tab session
    const sessionUsername = sessionStorage.getItem('helix-session-username');
    if (sessionUsername) {
      setCurrentUsername(sessionUsername);
    } else {
      // Generate a new username and store it for this session
      const newUsername = generateUsername();
      setCurrentUsername(newUsername);
      sessionStorage.setItem('helix-session-username', newUsername);
    }
  }, []);

  // Handle username changes and optionally persist for this session
  const handleUsernameChange = useCallback((newUsername: string) => {
    setCurrentUsername(newUsername);
    // Optional: store in sessionStorage instead of localStorage for per-tab persistence
    sessionStorage.setItem('helix-session-username', newUsername);
  }, []);

  // Don't render until we have a username
  if (!currentUsername) return null;

  return <FlowBuilderInternal username={currentUsername} onUsernameChange={handleUsernameChange} />;
}

// Main React Flow AI Flow Builder with Provider wrapper
export function FlowBuilder() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ReactFlowProvider>
          <FlowBuilderWithAuth />
        </ReactFlowProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
