import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Node,
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
import { useFlowManager } from './hooks/useFlowManager';
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

// Extract flow ID from URL
const getFlowIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/\/flow\/(.+)/);
  return match ? match[1] : null;
};

// Internal component that uses React Flow hooks
function FlowBuilderInternal() {
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };
  const flowId = getFlowIdFromUrl();
  
  const {
    currentFlow,
    // isNewFlow,
    updateFlowTitle,
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
    duplicateNode,
    initialViewport
  } = useFlowManager(flowId);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<'technology' | 'gaming'>('technology');
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);

    return () => {
      mq.removeEventListener('change', update);
    };
  }, []);

  // Handle title editing
  const handleStartEditingTitle = () => {
    if (currentFlow) {
      setEditingTitle(currentFlow.title);
      setIsEditingTitle(true);
    }
  };

  const handleSaveTitle = () => {
    if (editingTitle.trim() && currentFlow) {
      updateFlowTitle(editingTitle.trim());
    }
    setIsEditingTitle(false);
    setEditingTitle('');
  };

  const handleCancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

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

  // Add node function (now uses the hook's addNode)
  const addNodeWithDefaults = useCallback(
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

      // Node creation is now handled by the hook

      addNode(type, customLabel, customDescription || getNodeDescriptionByType(type));
    },
    [addNode]
  );

  // Connection handling is now managed by the hook

  // Drag and drop handling is now managed by the hook

  // Drop handling is now managed by the hook

  // Selection change wrapper to handle properties panel
  const handleSelectionChange = useCallback(
    (params: { nodes: Node<ReactFlowAINode>[] }) => {
      onSelectionChange(params);
      if (params.nodes.length > 0) {
        setIsPropertiesOpen(true);
      }
    },
    [onSelectionChange]
  );

  // Node update function is now managed by the hook

  // Node deletion function is now managed by the hook

  // Node duplication function is now managed by the hook

  // Add template function using the new template system
  const addTemplate = useCallback(
    (templateType: TemplateType = 'assassins-creed') => {
      const template = getTemplate(templateType);
      const { nodes: templateNodes, connections: templateConnections } = template;

      // Create nodes
      templateNodes.map(nodeTemplate => {
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
      templateConnections.map((conn, index) => ({
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
      // Note: This functionality should be moved to the hook in a future update
      console.error('Template addition needs to be refactored to use the new hook system');
    },
    []
  );

  // Auto-save is now managed by the hook

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

        {/* Centered flow title */}
        <div className='flow-builder__center'>
          {currentFlow && (
            <div className='flow-builder__current-flow'>
              {isEditingTitle ? (
                <input
                  type='text'
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelEditingTitle();
                  }}
                  className='flow-builder__title-input'
                  autoFocus
                />
              ) : (
                <h2 
                  className='flow-builder__flow-title'
                  onClick={handleStartEditingTitle}
                  title='Click to edit flow title'
                >
                  {currentFlow.title}
                </h2>
              )}
            </div>
          )}
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
            onAddNode={addNodeWithDefaults}
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
            onSelectionChange={handleSelectionChange}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultViewport={initialViewport}
            className={`flow-canvas__reactflow ${isCanvasLocked ? 'flow-canvas__reactflow--locked' : ''}`}
            connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2 }}
            defaultEdgeOptions={{
              type: 'default',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
              style: { stroke: '#9ca3af', strokeWidth: 2 },
            }}
            fitView
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
            onUnlinkEdge={(_sourceId, _targetId) => {
              // This functionality should be moved to the hook
              console.error('Edge unlinking needs to be refactored to use the new hook system');
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
