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
  NodeTypes,
  EdgeTypes,
  MarkerType,
  Handle,
  Position,
  ReactFlowProvider,
  type ColorMode,
} from 'reactflow';

import { AIFlowNode as OriginalAIFlowNode } from './types';
import { PropertiesPanel } from './components/properties';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { ThemeProvider, useThemeContext } from './contexts/ThemeContext';
import { ThemeToggle } from './components/ThemeToggle';
import { 
  Bot, 
  Eye, 
  Wrench, 
  GitBranch, 
  ArrowLeft, 
  ArrowRight,
  Cpu
} from 'lucide-react';

// Extended node interface for React Flow
interface ReactFlowAINode extends OriginalAIFlowNode {
  // React Flow specific fields will be in the Node<ReactFlowAINode> wrapper
}

// Custom Node Component that matches the original design  
function FlowNode({ data, selected }: { data: ReactFlowAINode; selected: boolean }) {
  const NodeIcon = {
    agent: Bot,
    sensor: Eye,
    skill: Wrench,
    decision: GitBranch,
    input: ArrowLeft,
    output: ArrowRight
  }[data.type];
  
  const getIconColor = (nodeType: ReactFlowAINode['type']) => {
    const colors = {
      agent: '#0ea5e9',
      sensor: '#22c55e', 
      skill: '#f59e0b',
      decision: '#ef4444',
      input: '#8b5cf6',
      output: '#06b6d4'
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
    };
    return dimensions[nodeType];
  };

  const { width, height } = getNodeDimensions(data.type);

  const nodeStyle = {
    '--node-bg-color': data.color,
    '--node-border-color': selected ? '#000000' : '#e5e7eb',
    '--node-shadow': selected 
      ? '0 0 0 1px #000000, 0 8px 24px rgba(0, 0, 0, 0.08)' 
      : '0 1px 3px rgba(0, 0, 0, 0.06)',
    '--node-width': width,
    '--node-height': height,
  } as React.CSSProperties;

  return (
    <div
      className={`flow-node ${selected ? 'flow-node--selected' : ''}`}
      style={nodeStyle}
    >
      {/* React Flow Handles for connections - Left and Right only */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="flow-node__handle flow-node__handle--left"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="flow-node__handle flow-node__handle--right"
      />

      <div className="flow-node__icon">
        <NodeIcon size={20} color={iconColor} />
      </div>
      <div className="flow-node__label">
        {data.label}
      </div>
    </div>
  );
}

// Node types for React Flow
const nodeTypes: NodeTypes = {
  aiFlowNode: FlowNode,
};

// Custom edge type that matches original design
const edgeTypes: EdgeTypes = {};


// Node Palette (same as original but adapted for React Flow)  
function ReactFlowNodePalette({ onAddNode, onAddTemplate }: { 
  onAddNode: (type: ReactFlowAINode['type'], customLabel?: string, customDescription?: string) => void;
  onAddTemplate: () => void;
}) {
  const nodeTypes = [
    { type: 'agent' as const, icon: Bot, label: 'AI Agent', color: '#0ea5e9' },
    { type: 'sensor' as const, icon: Eye, label: 'Sensor', color: '#22c55e' },
    { type: 'skill' as const, icon: Wrench, label: 'Skill', color: '#f59e0b' },
    { type: 'decision' as const, icon: GitBranch, label: 'Decision', color: '#ef4444' },
    { type: 'input' as const, icon: ArrowLeft, label: 'Input', color: '#8b5cf6' },
    { type: 'output' as const, icon: ArrowRight, label: 'Output', color: '#06b6d4' },
  ];

  const handleDragStart = (e: React.DragEvent, nodeType: ReactFlowAINode['type']) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="react-flow-node-palette">
      <h3 className="react-flow-node-palette__title">
        AI Flow Nodes
      </h3>
      
      <div className="react-flow-node-palette__nodes">
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            className="react-flow-node-palette__node"
            draggable
            onDragStart={(e) => handleDragStart(e, nodeType.type)}
            onClick={() => onAddNode(nodeType.type)}
          >
            <nodeType.icon size={18} color={nodeType.color} />
            <div className="react-flow-node-palette__node-info">
              <div className="react-flow-node-palette__node-label">
                {nodeType.label}
              </div>
              <div className="react-flow-node-palette__node-hint">
                Drag to canvas or click to add
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="react-flow-node-palette__templates">
        <h4 className="react-flow-node-palette__templates-title">
          Templates
        </h4>
        <div 
          className="react-flow-node-palette__template"
          onClick={onAddTemplate}
        >
          <div className="react-flow-node-palette__template-title">Assassin's Creed Brotherhood</div>
          <div className="react-flow-node-palette__template-description">Ezio, Altaïr, Bayek & Edward coordinate a mission</div>
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

// Internal component that uses React Flow hooks
function FlowBuilderInternal() {
  const { theme } = useThemeContext();
  const initialState = loadFromLocalStorage();
  
  const [nodes, setNodes, onNodesChange] = useNodesState<ReactFlowAINode>(initialState?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialState?.edges || []);
  const [selectedNode, setSelectedNode] = useState<ReactFlowAINode | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Add node function
  const addNode = useCallback((type: ReactFlowAINode['type'], customLabel?: string, customDescription?: string) => {
    const nodeDefaults = {
      agent: { width: 140, height: 80, color: '#f0f9ff', label: 'AI Agent' },
      sensor: { width: 120, height: 60, color: '#f0fdf4', label: 'Sensor' },
      skill: { width: 120, height: 60, color: '#fffbeb', label: 'Skill' },
      decision: { width: 100, height: 80, color: '#fef2f2', label: 'Decision' },
      input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
      output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
    };

    const defaults = nodeDefaults[type];
    const nodeData: ReactFlowAINode = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      x: 0, // React Flow manages position
      y: 0, // React Flow manages position
      width: defaults.width,
      height: defaults.height,
      label: customLabel || defaults.label,
      description: customDescription || '',
      config: {},
      color: defaults.color,
      borderColor: '#e5e7eb',
      borderWidth: 1,
    };

    const newNode: Node<ReactFlowAINode> = {
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

  // Handle connections
  const onConnect = useCallback(
    (connection: Connection) => {
      const edge: Edge = {
        ...connection,
        id: `${connection.source}-${connection.target}`,
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
      setEdges((eds) => addEdge(edge, eds));
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
        decision: { width: 100, height: 80, color: '#fef2f2', label: 'Decision' },
        input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
        output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
      };

      const defaults = nodeDefaults[type];
      const nodeData: ReactFlowAINode = {
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

      const newNode: Node<ReactFlowAINode> = {
        id: nodeData.id,
        type: 'aiFlowNode',
        position,
        data: nodeData,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Handle node selection
  const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node<ReactFlowAINode>[] }) => {
    if (selectedNodes.length > 0) {
      setSelectedNode(selectedNodes[0].data);
    } else {
      setSelectedNode(null);
    }
  }, []);

  // Update node function
  const updateNode = useCallback((id: string, updates: Partial<ReactFlowAINode>) => {
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

  // Delete node function
  const deleteNode = useCallback((id: string) => {
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
  }, [setNodes, setEdges, selectedNode]);

  // Add template function with better spacing and connections
  const addTemplate = useCallback(() => {
    // Template nodes with increased spacing for better layout
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

    // Create nodes
    const newNodes = templateNodeConfigs.map(nodeTemplate => {
      const nodeDefaults = {
        agent: { width: 140, height: 80, color: '#f0f9ff' },
        sensor: { width: 120, height: 60, color: '#f0fdf4' },
        skill: { width: 120, height: 60, color: '#fffbeb' },
        decision: { width: 100, height: 80, color: '#fef2f2' },
        input: { width: 100, height: 60, color: '#faf5ff' },
        output: { width: 100, height: 60, color: '#f0fdfa' },
      };

      const defaults = nodeDefaults[nodeTemplate.type];
      const nodeData: ReactFlowAINode = {
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

      const newNode: Node<ReactFlowAINode> = {
        id: nodeData.id,
        type: 'aiFlowNode',
        position: { x: nodeTemplate.x, y: nodeTemplate.y },
        data: nodeData,
      };

      return newNode;
    });

    // Create template connections/edges
    const templateConnections = [
      // Mission Brief → Eagle Vision
      { source: 'mission-brief', target: 'eagle-vision', sourceHandle: 'right', targetHandle: 'left' },
      // Eagle Vision → All Agents
      { source: 'eagle-vision', target: 'ezio', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'eagle-vision', target: 'altair', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'eagle-vision', target: 'bayek', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'eagle-vision', target: 'edward', sourceHandle: 'right', targetHandle: 'left' },
      // Agents → Skills
      { source: 'ezio', target: 'hidden-blade', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'altair', target: 'hidden-blade', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'ezio', target: 'free-running', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'bayek', target: 'free-running', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'edward', target: 'combat-training', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'altair', target: 'combat-training', sourceHandle: 'right', targetHandle: 'left' },
      // Skills → Decision
      { source: 'hidden-blade', target: 'mission-success', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'free-running', target: 'mission-success', sourceHandle: 'right', targetHandle: 'left' },
      { source: 'combat-training', target: 'mission-success', sourceHandle: 'right', targetHandle: 'left' },
      // Decision → Report
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

    // Add both nodes and edges
    setNodes((nds) => [...nds, ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  }, [setNodes, setEdges]);

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
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNode) {
          deleteNode(selectedNode.id);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode]);

  return (
    <div className="flow-builder">
      {/* Top Bar with Helix Logo (same as original) */}
      <div className="flow-builder__header">
        <a href="/" className="flow-builder__logo">
          <Cpu size={20} />
          Helix
        </a>
        
        <div className="flow-builder__header-controls">
          <div className="flow-builder__stats">
            Nodes: {nodes.length} | Connections: {edges.length}
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flow-builder__content">
        <ReactFlowNodePalette onAddNode={addNode} onAddTemplate={addTemplate} />

        {/* React Flow Canvas */}
        <div className="flow-canvas">
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
            colorMode={theme as ColorMode}
            defaultViewport={initialState?.viewport || { x: 0, y: 0, zoom: 1 }}
            className="flow-canvas__reactflow"
            connectionLineStyle={{ stroke: '#9ca3af', strokeWidth: 2 }}
            defaultEdgeOptions={{
              type: 'default',
              markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
              style: { stroke: '#9ca3af', strokeWidth: 2 },
            }}
            fitView
            attributionPosition="bottom-left"
            proOptions={{ hideAttribution: true }}
          >
            <Controls className="flow-canvas__controls" />
            <Background 
              color="#f3f4f6" 
              gap={20} 
              size={1}
              className="flow-canvas__background"
            />
          </ReactFlow>
        </div>

        {/* Properties Panel (same as original) */}
        <div className="properties-panel">
          <PropertiesPanel
            selectedNode={selectedNode}
            selectedConnection={null}
            onUpdateNode={updateNode}
            onUpdateConnection={() => {}}
            onDeleteNode={deleteNode}
          />
        </div>
      </div>
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
