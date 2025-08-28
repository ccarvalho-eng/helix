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
} from 'reactflow';
import 'reactflow/dist/style.css';

import { AIFlowNode as OriginalAIFlowNode, AIFlowConnection } from './types';
import { AIPropertiesPanel } from './AIPropertiesPanel';
import { 
  Bot, 
  Eye, 
  Wrench, 
  GitBranch, 
  ArrowLeft, 
  ArrowRight,
  Trash2,
  MousePointer,
  Link,
  Hand,
  Cpu
} from 'lucide-react';

// Extended node interface for React Flow
interface ReactFlowAINode extends OriginalAIFlowNode {
  // React Flow specific fields will be in the Node<ReactFlowAINode> wrapper
}

// Custom Node Component that matches the original design
function CustomAIFlowNode({ data, selected }: { data: ReactFlowAINode; selected: boolean }) {
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

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: data.color,
        border: `1px solid ${selected ? '#000000' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: '400',
        color: '#1f2937',
        boxShadow: selected ? '0 0 0 1px #000000, 0 8px 24px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.06)',
        transition: 'all 0.2s',
        userSelect: 'none',
        minWidth: width,
        minHeight: height,
      }}
    >
      {/* React Flow Handles for connections - All 4 sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{
          top: -3,
          width: 6,
          height: 6,
          backgroundColor: '#9ca3af',
          border: '1px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          bottom: -3,
          width: 6,
          height: 6,
          backgroundColor: '#9ca3af',
          border: '1px solid white',
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          left: -3,
          width: 6,
          height: 6,
          backgroundColor: '#9ca3af',
          border: '1px solid white',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          right: -3,
          width: 6,
          height: 6,
          backgroundColor: '#9ca3af',
          border: '1px solid white',
        }}
      />

      <div style={{ marginBottom: '4px' }}>
        <NodeIcon size={20} color={iconColor} />
      </div>
      <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
        {data.label}
      </div>
    </div>
  );
}

// Node types for React Flow
const nodeTypes: NodeTypes = {
  aiFlowNode: CustomAIFlowNode,
};

// Custom edge type that matches original design
const edgeTypes: EdgeTypes = {
  // Use default bezier edge with custom styling
};

// Button component (same as original)
function Button({ 
  children, 
  onClick, 
  disabled = false, 
  active = false
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '10px 16px',
        fontSize: '13px',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        background: active ? '#000000' : '#ffffff',
        color: active ? '#ffffff' : '#1f2937',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s',
      }}
      onMouseOver={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = '#f9fafb';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = '#ffffff';
        }
      }}
    >
      {children}
    </button>
  );
}

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
    <div style={{ 
      width: '250px',
      minWidth: '250px',
      maxWidth: '250px',
      height: '100%',
      borderRight: '1px solid #e5e7eb', 
      background: '#ffffff',
      boxShadow: '2px 0 12px rgba(0, 0, 0, 0.06)',
      padding: '20px',
      overflowY: 'auto',
      flexShrink: 0
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#111827' }}>
        AI Flow Nodes
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            draggable
            onDragStart={(e) => handleDragStart(e, nodeType.type)}
            onClick={() => onAddNode(nodeType.type)}
            style={{
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              userSelect: 'none',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#9ca3af';
              e.currentTarget.style.background = '#f9fafb';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <nodeType.icon size={18} color={nodeType.color} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '400', color: '#1f2937' }}>
                {nodeType.label}
              </div>
              <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                Drag to canvas or click to add
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px', color: '#111827' }}>
          Templates
        </h4>
        <div 
          style={{
            padding: '12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '8px',
            transition: 'all 0.2s'
          }}
          onClick={onAddTemplate}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f9fafb';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: '400', color: '#1f2937' }}>Assassin's Creed Brotherhood</div>
          <div style={{ fontSize: '11px', color: '#9ca3af' }}>Ezio, Altaïr, Bayek & Edward coordinate a mission</div>
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
function ReactFlowAIFlowBuilderInternal() {
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
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      background: '#ffffff',
      overflow: 'hidden'
    }}>
      {/* Top Bar with Helix Logo (same as original) */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px 24px', 
        borderBottom: '1px solid #e5e7eb', 
        background: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        flexShrink: 0
      }}>
        <a href="/" style={{ 
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '24px', 
          fontWeight: 'bold', 
          color: '#111827',
          letterSpacing: '-0.025em',
          textDecoration: 'none',
          cursor: 'pointer'
        }}>
          <Cpu size={20} />
          Helix
        </a>
        
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          Nodes: {nodes.length} | Connections: {edges.length}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        flex: 1,
        width: '100%',
        height: 'calc(100vh - 73px)', // Subtract header height
        overflow: 'hidden' 
      }}>
        <ReactFlowNodePalette onAddNode={addNode} onAddTemplate={addTemplate} />

        {/* React Flow Canvas */}
        <div style={{ 
          flex: 1,
          width: '100%',
          height: '100%',
          position: 'relative'
        }}>
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
            style={{ 
              width: '100%',
              height: '100%',
              background: '#ffffff' 
            }}
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
            <Controls 
              style={{
                bottom: 24,
                left: 24,
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
              }}
            />
            <Background 
              color="#f3f4f6" 
              gap={20} 
              size={1}
              style={{ opacity: 0.4 }}
            />
          </ReactFlow>
        </div>

        {/* Properties Panel (same as original) */}
        <div style={{ 
          width: '320px',
          minWidth: '320px',
          maxWidth: '320px',
          height: '100%',
          borderLeft: '1px solid #e5e7eb', 
          background: '#ffffff',
          boxShadow: '-2px 0 12px rgba(0, 0, 0, 0.06)',
          overflowY: 'auto',
          flexShrink: 0
        }}>
          <AIPropertiesPanel
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

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ReactFlow Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: '#fee', color: '#c00', border: '1px solid #fcc' }}>
          <h2>Something went wrong with ReactFlow</h2>
          <p>Error: {this.state.error?.toString()}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Main React Flow AI Flow Builder with Provider wrapper
export function ReactFlowAIFlowBuilder() {
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <ReactFlowAIFlowBuilderInternal />
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}