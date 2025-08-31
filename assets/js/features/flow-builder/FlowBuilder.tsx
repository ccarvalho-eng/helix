import React, { useState, useCallback, useEffect } from 'react';
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
} from 'lucide-react';

// Extended node type for React Flow
type ReactFlowAINode = OriginalAIFlowNode;

// Custom Node Component that matches the original design
function FlowNode({
  data,
  selected,
}: {
  readonly data: ReactFlowAINode;
  readonly selected: boolean;
}) {
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
            color: '#6b7280',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: 6,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#f3f4f6';
            e.currentTarget.style.color = '#374151';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
          onClick={onOpenTemplatesModal}
        >
          See all templates →
        </div>
      </div>
    </div>
  );
}

// Local storage functions (same as original)
const STORAGE_KEY = 'react-flow-ai-flow-builder-state';

const saveToLocalStorage = (data: {
  nodes: Node<ReactFlowAINode>[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Failed to save to localStorage
  }
};

const loadFromLocalStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Failed to load from localStorage
  }
  return null;
};

// Internal component that uses React Flow hooks
function FlowBuilderInternal() {
  const { theme } = useThemeContext();
  const initialState = loadFromLocalStorage();

  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowAINode>(
    initialState?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialState?.edges || []);
  const [selectedNode, setSelectedNode] = useState<ReactFlowAINode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<'technology' | 'gaming'>('technology');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);

    return () => {
      mq.removeEventListener('change', update);
    };
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
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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
          x: Math.random() * 400 + 100,
          y: Math.random() * 400 + 100,
        },
        data: nodeData,
        style: {
          width: defaults.width,
          height: defaults.height,
        },
      };

      setNodes(nds => nds.concat(newNode));
    },
    [setNodes]
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
      setEdges(eds => addEdge(edge, eds));
    },
    [setEdges]
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
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
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

  // Delete node function
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

  // Duplicate node function
  const duplicateNode = useCallback(
    (nodeId: string) => {
      setNodes(nds => {
        const nodeToDuplicate = nds.find(node => node.id === nodeId);
        if (!nodeToDuplicate) return nds;

        const newNodeId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
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

  // Auto-save to localStorage
  useEffect(() => {
    if (reactFlowInstance) {
      const viewport = reactFlowInstance.getViewport();
      saveToLocalStorage({ nodes, edges, viewport });
    }
  }, [nodes, edges, reactFlowInstance]);

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
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode, duplicateNode]);

  const hasAnyDrawerOpen = (isPaletteOpen || isPropertiesOpen) && isMobile;

  return (
    <div className='flow-builder'>
      {/* Top Bar with Helix Logo (same as original) */}
      <div className='flow-builder__header'>
        <a href='/' className='flow-builder__logo'>
          <Cpu size={20} />
          Helix
        </a>

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
            defaultViewport={initialState?.viewport || { x: 0, y: 0, zoom: 1 }}
            className='flow-canvas__reactflow'
            connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2 }}
            defaultEdgeOptions={{
              type: 'default',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
              style: { stroke: '#9ca3af', strokeWidth: 2 },
            }}
            fitView
            attributionPosition='bottom-left'
            proOptions={{ hideAttribution: true }}
            panOnScroll={true}
            selectionOnDrag={true}
            panOnDrag={[1, 2]}
            zoomOnScroll={true}
            zoomOnPinch={true}
            zoomOnDoubleClick={false}
          >
            <Controls className='flow-canvas__controls' />
            <MiniMap
              style={{
                height: 120,
                width: 200,
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
                border: `1px solid ${theme === 'dark' ? '#404040' : '#e5e7eb'}`,
                borderRadius: '8px',
              }}
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
                    ? '2px solid #0ea5e9'
                    : '2px solid transparent',
                color: activeTemplateTab === 'technology' ? '#0ea5e9' : '#6b7280',
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
                  activeTemplateTab === 'gaming' ? '2px solid #0ea5e9' : '2px solid transparent',
                color: activeTemplateTab === 'gaming' ? '#0ea5e9' : '#6b7280',
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
    </div>
  );
}

// Main React Flow AI Flow Builder with Provider wrapper
export function FlowBuilder() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ReactFlowProvider>
          <FlowBuilderInternal />
        </ReactFlowProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
