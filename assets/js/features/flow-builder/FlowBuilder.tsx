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
import { TemplateType, getFeaturedTemplates, getTemplatesByCategory } from './templates';
import { Template } from './types';
import { PropertiesPanel } from './components/properties';
import { ErrorBoundary } from '../../shared/components/ui/ErrorBoundary';
import { useAuth } from '../../shared/contexts/AuthContext';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { Modal } from './components/Modal';
import { DownloadButton } from './components/DownloadButton';
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
  ChevronDown,
  ChevronUp,
  BarChart3,
  Users,
  FileText,
  Heart,
  DollarSign,
  ShoppingCart,
  LogOut,
} from 'lucide-react';

type ReactFlowAINode = OriginalAIFlowNode;
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
    width: '100%',
    height: '100%',
  } as React.CSSProperties;

  return (
    <div className={`flow-node ${selected ? 'flow-node--selected' : ''}`} style={nodeStyle}>
      {/* Node Resizer - only visible when selected */}
      <NodeResizer
        color={theme === 'dark' ? 'var(--theme-syntax-green)' : 'var(--theme-text-primary)'}
        isVisible={selected}
        minWidth={parseInt(width)}
        minHeight={parseInt(height)}
        handleStyle={{
          width: '6px',
          height: '6px',
          border: '1px solid',
          borderRadius: '1px',
        }}
        lineStyle={{
          borderWidth: '1px',
          borderStyle: 'dashed',
          opacity: 0.6,
        }}
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

const nodeTypes: NodeTypes = {
  aiFlowNode: FlowNode,
};

const edgeTypes: EdgeTypes = {};

function ReactFlowNodePalette({
  onAddNode,
  onAddTemplate: _onAddTemplate,
  onOpenTemplatesModal,
  onTemplateClick,
  isFlowReady,
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
  isFlowReady: boolean;
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
                    className={`node-palette__node ${!isFlowReady ? 'node-palette__node--disabled' : ''}`}
                    data-node-type={nodeDefinition.type}
                    data-testid={`node-palette-${nodeDefinition.type}`}
                    draggable={isFlowReady}
                    onDragStart={
                      isFlowReady ? e => handleDragStart(e, nodeDefinition.type) : undefined
                    }
                    onClick={isFlowReady ? () => onAddNode(nodeDefinition.type) : undefined}
                    title={isFlowReady ? undefined : 'Connecting to flow...'}
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
            // Map template categories to meaningful icons
            switch (category) {
              case 'business-automation':
                return Settings; // Keep Settings for business automation
              case 'customer-service':
                return Users;
              case 'content-creation':
                return FileText;
              case 'data-analysis':
                return BarChart3;
              case 'healthcare':
                return Heart;
              case 'finance':
                return DollarSign;
              case 'e-commerce':
                return ShoppingCart;
              // Legacy support
              case 'technology':
                return Settings;
              case 'gaming':
                return Gamepad2;
              default:
                return Settings; // Default to Settings icon for workflows
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

const getFlowIdFromUrl = (): string | null => {
  const path = window.location.pathname;
  const match = path.match(/\/flow\/(.+)/);
  return match ? match[1] : null;
};

function FlowBuilderInternal() {
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };
  const { logout } = useAuth();
  const flowId = getFlowIdFromUrl();

  const {
    currentFlow,
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
    unlinkEdge,
    initialViewport,
    onMoveEnd,
    addTemplate,
    isFlowReady,
    isConnected,
  } = useFlowManager(flowId);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [modalNodeId, setModalNodeId] = useState<string | null>(null);
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<
    | 'business-automation'
    | 'customer-service'
    | 'content-creation'
    | 'data-analysis'
    | 'healthcare'
    | 'finance'
    | 'e-commerce'
  >('business-automation');
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [isMobileStatsOpen, setIsMobileStatsOpen] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('templates') === 'true') {
      setIsTemplatesModalOpen(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);
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

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const handleCancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle('');
  };

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

  const addNodeWithDefaults = useCallback(
    (
      type: ReactFlowAINode['type'],
      customLabel?: string,
      customDescription?: string,
      _defaultConfig?: NodeConfig
    ) => {
      if (!isFlowReady) {
        return;
      }
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
      addNode(
        type,
        customLabel || defaults.label,
        customDescription || getNodeDescriptionByType(type)
      );
    },
    [addNode, isFlowReady]
  );

  const handleSelectionChange = useCallback(
    (params: { nodes: Node<ReactFlowAINode>[] }) => {
      onSelectionChange(params);
      if (params.nodes.length > 0) {
        setIsPropertiesOpen(true);
      }
    },
    [onSelectionChange]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if user is typing in an editable context
      const target = e.target as HTMLElement;

      // Comprehensive check for editable contexts
      const isInEditableContext = () => {
        if (!target) return false;

        // Check direct element
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable
        ) {
          return true;
        }

        // Check for readonly/disabled states (these shouldn't prevent deletion)
        if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
          if (target.readOnly || target.disabled) return false;
        }

        // Traverse up to check for contentEditable parents
        let element = target.parentElement;
        while (element) {
          if (element.isContentEditable) return true;
          element = element.parentElement;
        }

        return false;
      };

      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete nodes if not in editable context and event wasn't handled
        if (selectedNode && !isInEditableContext() && !e.defaultPrevented) {
          e.preventDefault(); // Prevent browser navigation
          deleteNode(selectedNode.id);
        }
      }

      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedNode) {
          duplicateNode(selectedNode.id);
        }
      }

      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setIsPropertiesOpen(false);
        setIsTemplatesModalOpen(false);
        setIsMobileStatsOpen(false);
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

  // Close mobile stats panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        isMobileStatsOpen &&
        !target.closest('.flow-builder__mobile-stats-panel') &&
        !target.closest('.flow-builder__mobile-stats-toggle')
      ) {
        setIsMobileStatsOpen(false);
      }
    };

    if (isMobileStatsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isMobileStatsOpen]);

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
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={e => {
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

        <div className='flow-builder__header-controls' style={{ position: 'relative' }}>
          {/* Desktop stats and controls */}
          {!isMobile && (
            <>
              <div className='flow-builder__stats'>
                <span className='flow-builder__stat'>
                  <Circle size={14} className='flow-builder__stat-icon' />
                  {nodes.length} nodes
                </span>
                <span className='flow-builder__stat'>
                  <Zap size={14} className='flow-builder__stat-icon' />
                  {edges.length} connections
                </span>
                {!isFlowReady && (
                  <span className='flow-builder__stat flow-builder__stat--connecting'>
                    <Circle
                      size={14}
                      className='flow-builder__stat-icon flow-builder__stat-icon--pulse'
                    />
                    Connecting...
                  </span>
                )}
                {isFlowReady && isConnected && (
                  <span className='flow-builder__stat flow-builder__stat--connected'>
                    <Circle
                      size={14}
                      className='flow-builder__stat-icon flow-builder__stat-icon--connected'
                    />
                    Live
                  </span>
                )}
              </div>
              <DownloadButton
                filename={currentFlow?.title.toLowerCase().replace(/\s+/g, '-') || 'flow-diagram'}
              />
              <ThemeToggle />
              <button
                className='flow-builder__logout-btn'
                onClick={handleLogout}
                title='Logout'
                aria-label='Logout'
              >
                <LogOut size={16} />
              </button>
            </>
          )}

          {/* Mobile controls */}
          {isMobile && (
            <>
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
              <button
                className={`flow-builder__mobile-stats-toggle ${isMobileStatsOpen ? 'flow-builder__mobile-stats-toggle--active' : ''}`}
                onClick={() => setIsMobileStatsOpen(!isMobileStatsOpen)}
                aria-label='Toggle stats and controls'
              >
                <BarChart3 size={14} />
                <span>
                  {nodes.length}n {edges.length}c
                </span>
                {isMobileStatsOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              <DownloadButton
                filename={currentFlow?.title.toLowerCase().replace(/\s+/g, '-') || 'flow-diagram'}
              />
              <ThemeToggle />
              <button
                className='flow-builder__logout-btn'
                onClick={handleLogout}
                title='Logout'
                aria-label='Logout'
              >
                <LogOut size={16} />
              </button>
            </>
          )}
        </div>

        {/* Mobile expandable stats/controls */}
        {isMobile && isMobileStatsOpen && (
          <div className='flow-builder__mobile-stats-panel'>
            {/* Stats */}
            <div className='flow-builder__mobile-stats-panel__stats'>
              <div className='flow-builder__mobile-stats-panel__stat'>
                <Circle size={14} />
                {nodes.length} nodes
              </div>
              <div className='flow-builder__mobile-stats-panel__stat'>
                <Zap size={14} />
                {edges.length} connections
              </div>
              {!isFlowReady && (
                <div className='flow-builder__mobile-stats-panel__stat flow-builder__mobile-stats-panel__stat--connecting'>
                  <Circle size={14} />
                  Connecting...
                </div>
              )}
              {isFlowReady && isConnected && (
                <div className='flow-builder__mobile-stats-panel__stat flow-builder__mobile-stats-panel__stat--connected'>
                  <Circle size={14} />
                  Live
                </div>
              )}
            </div>
          </div>
        )}
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
            isFlowReady={isFlowReady}
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
            onMoveEnd={onMoveEnd}
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
                  theme === 'dark' ? 'var(--theme-bg-secondary)' : 'var(--flow-builder-bg)',
                border:
                  theme === 'dark'
                    ? '1px solid var(--theme-border-primary)'
                    : '1px solid var(--flow-builder-border)',
                borderRadius: '8px',
                boxShadow: theme === 'dark' ? 'var(--theme-shadow)' : 'var(--flow-builder-shadow)',
              }}
              nodeColor={theme === 'dark' ? '#4b5563' : '#e5e7eb'}
              nodeStrokeColor={theme === 'dark' ? '#6b7280' : '#d1d5db'}
              nodeBorderRadius={3}
              maskColor={theme === 'dark' ? 'rgba(17, 24, 39, 0.75)' : 'rgba(249, 250, 251, 0.75)'}
              zoomable
              pannable
              position='bottom-right'
              offsetScale={0.8}
            />
            <Background
              color={theme === 'dark' ? 'var(--theme-text-secondary)' : 'var(--theme-text-muted)'}
              gap={20}
              size={1}
              className='flow-canvas__background'
            />
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        <div
          className={`properties-panel ${isPropertiesOpen ? 'drawer drawer--right drawer--open' : 'drawer drawer--right'}`}
          data-testid='properties-panel'
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
              unlinkEdge(sourceId, targetId);
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
            setIsMobileStatsOpen(false);
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
        <div
          style={{
            display: 'flex',
            height: '500px',
            maxHeight: '70vh',
          }}
        >
          {/* Sidebar */}
          <div
            className='flow-builder__templates-sidebar'
            style={{
              width: '240px',
              borderRight: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
              padding: '16px',
              backgroundColor: 'transparent',
            }}
          >
            <h3
              style={{
                fontSize: '14px',
                fontWeight: '600',
                color: theme === 'dark' ? '#e5e7eb' : '#374151',
                marginBottom: '16px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Categories
            </h3>
            <div className='flow-builder__category-list'>
              {[
                { id: 'business-automation', label: 'Business Automation', icon: Settings },
                { id: 'customer-service', label: 'Customer Service', icon: Users },
                { id: 'content-creation', label: 'Content Creation', icon: FileText },
                { id: 'data-analysis', label: 'Data Analysis', icon: BarChart3 },
                { id: 'healthcare', label: 'Healthcare', icon: Heart },
                { id: 'finance', label: 'Finance', icon: DollarSign },
                { id: 'e-commerce', label: 'E-Commerce', icon: ShoppingCart },
              ].map(category => {
                const IconComponent = category.icon;
                const isActive = activeTemplateTab === category.id;
                return (
                  <button
                    key={category.id}
                    className={`flow-builder__category-item ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      width: '100%',
                      padding: '12px 16px',
                      margin: '4px 0',
                      border: 'none',
                      borderRadius: '8px',
                      background: isActive
                        ? theme === 'dark'
                          ? '#374151'
                          : '#e5e7eb'
                        : 'transparent',
                      color: isActive
                        ? theme === 'dark'
                          ? '#98c379'
                          : '#0f172a'
                        : theme === 'dark'
                          ? '#d1d5db'
                          : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isActive ? '600' : '400',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => setActiveTemplateTab(category.id as typeof activeTemplateTab)}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor =
                          theme === 'dark' ? '#2d3748' : '#f3f4f6';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <IconComponent size={18} style={{ flexShrink: 0 }} />
                    {category.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template Cards */}
          <div
            className='flow-builder__templates-content'
            style={{
              flex: 1,
              padding: '16px 24px',
              overflow: 'auto',
            }}
          >
            <div className='flow-builder__templates-grid'>
              {getTemplatesByCategory(activeTemplateTab).map(template => {
                const getTemplateIcon = (category: string) => {
                  switch (category) {
                    case 'business-automation':
                      return Settings;
                    case 'customer-service':
                      return Users;
                    case 'content-creation':
                      return FileText;
                    case 'data-analysis':
                      return BarChart3;
                    case 'healthcare':
                      return Heart;
                    case 'finance':
                      return DollarSign;
                    case 'e-commerce':
                      return ShoppingCart;
                    default:
                      return Settings; // Default to Settings instead of Circle
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
                    <p className='flow-builder__template-card-description'>
                      {template.description}
                    </p>
                    <div className='flow-builder__template-card-stats'>
                      <span>{template.nodes.length} nodes</span>
                      <span>{template.connections.length} connections</span>
                    </div>
                  </div>
                );
              })}
            </div>
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
