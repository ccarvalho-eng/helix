import React, { useState, useRef, useEffect } from 'react';
import { AIFlowNode, AIFlowConnection, AIFlowMode } from './types';
import { AIPropertiesPanel } from './AIPropertiesPanel';
import { 
  Bot, 
  Eye, 
  Wrench, 
  GitBranch, 
  ArrowLeft, 
  ArrowRight,
  Trash2,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Link,
  Hand
} from 'lucide-react';

// Working Node Component (based on original DiagramShape)
function WorkingNode({ 
  node, 
  isSelected, 
  onSelect, 
  onUpdate, 
  mode, 
  onConnect,
  isConnecting,
  onStartConnection,
  onEndConnection,
  isDragConnecting
}: {
  node: AIFlowNode;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<AIFlowNode>) => void;
  mode: AIFlowMode;
  onConnect?: (nodeId: string) => void;
  isConnecting?: boolean;
  onStartConnection?: (nodeId: string, x: number, y: number) => void;
  onEndConnection?: (nodeId: string) => void;
  isDragConnecting?: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, nodeX: 0, nodeY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (mode === 'connect') {
      onConnect?.(node.id);
      return;
    }

    if (mode === 'select') {
      onSelect();
      setIsDragging(true);
      setDragStart({
        x: e.clientX,
        y: e.clientY,
        nodeX: node.x,
        nodeY: node.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      onUpdate({
        x: dragStart.nodeX + deltaX,
        y: dragStart.nodeY + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const NodeIcon = {
    agent: Bot,
    sensor: Eye,
    skill: Wrench,
    decision: GitBranch,
    input: ArrowLeft,
    output: ArrowRight
  }[node.type];
  
  const iconColor = node.borderColor;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: 'absolute',
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        backgroundColor: node.color,
        border: `${node.borderWidth}px solid ${isSelected ? '#3b82f6' : node.borderColor}`,
        borderRadius: '8px',
        padding: '8px',
        cursor: mode === 'connect' ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        boxShadow: isSelected ? '0 0 0 2px #3b82f6, 0 4px 8px rgba(0, 0, 0, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        transition: isDragging ? 'none' : 'all 0.2s',
        userSelect: 'none',
        zIndex: isDragging ? 1000 : (isSelected ? 100 : 1),
        opacity: isConnecting && !isSelected ? 0.7 : 1,
      }}
    >
      {/* Connection points */}
      <div style={{
        position: 'absolute',
        top: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '8px',
        height: '8px',
        backgroundColor: '#6b7280',
        borderRadius: '50%',
        border: '2px solid white',
        opacity: mode === 'connect' || isSelected ? 1 : 0,
        transition: 'opacity 0.2s'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-4px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '8px',
        height: '8px',
        backgroundColor: '#6b7280',
        borderRadius: '50%',
        border: '2px solid white',
        opacity: mode === 'connect' || isSelected ? 1 : 0,
        transition: 'opacity 0.2s'
      }} />

      <div style={{ marginBottom: '4px' }}>
        <NodeIcon size={20} color={iconColor} />
      </div>
      <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
        {node.label}
      </div>
      {node.description && (
        <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px', textAlign: 'center' }}>
          {node.description.length > 15 ? node.description.slice(0, 15) + '...' : node.description}
        </div>
      )}
    </div>
  );
}

// Connection line component
function ConnectionLine({ connection, nodes }: { connection: AIFlowConnection, nodes: AIFlowNode[] }) {
  const fromNode = nodes.find(n => n.id === connection.fromId);
  const toNode = nodes.find(n => n.id === connection.toId);
  
  if (!fromNode || !toNode) return null;

  const fromX = fromNode.x + fromNode.width / 2;
  const fromY = fromNode.y + fromNode.height / 2;
  const toX = toNode.x + toNode.width / 2;
  const toY = toNode.y + toNode.height / 2;

  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  return (
    <div
      style={{
        position: 'absolute',
        left: fromX,
        top: fromY,
        width: length,
        height: '2px',
        backgroundColor: connection.color,
        transformOrigin: '0 50%',
        transform: `rotate(${angle}deg)`,
        zIndex: 10,
        pointerEvents: 'none'
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: '0',
          top: '50%',
          width: '0',
          height: '0',
          borderTop: '4px solid transparent',
          borderBottom: '4px solid transparent',
          borderLeft: `8px solid ${connection.color}`,
          transform: 'translateY(-50%)',
        }}
      />
    </div>
  );
}

// Canvas component (based on original DiagramCanvas)
function WorkingCanvas({ 
  nodes, 
  connections,
  selectedNode,
  onSelectNode,
  onUpdateNode,
  onAddNode,
  onAddConnection,
  onDeleteNode,
  zoom,
  pan,
  onPanChange,
  mode 
}: {
  nodes: AIFlowNode[];
  connections: AIFlowConnection[];
  selectedNode: AIFlowNode | null;
  onSelectNode: (node: AIFlowNode | null) => void;
  onUpdateNode: (id: string, updates: Partial<AIFlowNode>) => void;
  onAddNode: (type: AIFlowNode['type'], x: number, y: number) => void;
  onAddConnection: (fromId: string, toId: string) => void;
  onDeleteNode: (id: string) => void;
  zoom: number;
  pan: { x: number; y: number };
  onPanChange: (pan: { x: number; y: number }) => void;
  mode: AIFlowMode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (mode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning && mode === 'pan') {
      onPanChange({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectNode(null);
      setConnectingFrom(null);
    }
  };

  const handleNodeConnect = (nodeId: string) => {
    if (connectingFrom === null) {
      setConnectingFrom(nodeId);
    } else if (connectingFrom !== nodeId) {
      onAddConnection(connectingFrom, nodeId);
      setConnectingFrom(null);
    } else {
      setConnectingFrom(null);
    }
  };

  // Handle drag and drop from palette
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const nodeType = e.dataTransfer.getData('nodeType') as AIFlowNode['type'];
    if (nodeType && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      onAddNode(nodeType, x, y);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        overflow: 'hidden',
        background: isDragOver ? '#e0f2fe' : '#f9fafb',
        position: 'relative',
        cursor: mode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 
               mode === 'connect' ? 'crosshair' : 'default',
        border: isDragOver ? '2px dashed #0284c7' : 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
          position: 'relative',
        }}
      >
        {/* Grid pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '5000px',
          height: '5000px',
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.3
        }} />

        {/* Connections */}
        {connections.map((connection) => (
          <ConnectionLine key={connection.id} connection={connection} nodes={nodes} />
        ))}

        {/* Nodes */}
        {nodes.map((node) => (
          <WorkingNode
            key={node.id}
            node={node}
            isSelected={selectedNode?.id === node.id}
            onSelect={() => onSelectNode(node)}
            onUpdate={(updates) => onUpdateNode(node.id, updates)}
            mode={mode}
            onConnect={handleNodeConnect}
            isConnecting={connectingFrom !== null}
          />
        ))}

        {/* Connection mode indicator */}
        {connectingFrom && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#3b82f6',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}>
            Click another node to connect
          </div>
        )}

        {/* Delete button for selected node */}
        {selectedNode && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(selectedNode.id);
            }}
            style={{
              position: 'absolute',
              left: selectedNode.x + selectedNode.width + 8,
              top: selectedNode.y - 8,
              width: '32px',
              height: '32px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
              zIndex: 1001,
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {/* Drop indicator */}
      {isDragOver && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#0284c7',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '500',
          pointerEvents: 'none',
          zIndex: 1000
        }}>
          Drop node here
        </div>
      )}
    </div>
  );
}

// Node Palette
function WorkingNodePalette({ onAddNode }: { onAddNode: (type: AIFlowNode['type'], x: number, y: number) => void }) {
  const nodeTypes = [
    { type: 'agent' as const, icon: Bot, label: 'AI Agent', color: '#3b82f6' },
    { type: 'sensor' as const, icon: Eye, label: 'Sensor', color: '#10b981' },
    { type: 'skill' as const, icon: Wrench, label: 'Skill', color: '#f59e0b' },
    { type: 'decision' as const, icon: GitBranch, label: 'Decision', color: '#ef4444' },
    { type: 'input' as const, icon: ArrowLeft, label: 'Input', color: '#8b5cf6' },
    { type: 'output' as const, icon: ArrowRight, label: 'Output', color: '#06b6d4' },
  ];

  const handleDragStart = (e: React.DragEvent, nodeType: AIFlowNode['type']) => {
    e.dataTransfer.setData('nodeType', nodeType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div style={{ 
      width: '250px', 
      borderRight: '1px solid #e5e7eb', 
      background: '#ffffff',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#374151' }}>
        AI Flow Nodes
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
        {nodeTypes.map((nodeType) => (
          <div
            key={nodeType.type}
            draggable
            onDragStart={(e) => handleDragStart(e, nodeType.type)}
            onClick={() => onAddNode(nodeType.type, 100, 100)}
            style={{
              padding: '12px',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s',
              userSelect: 'none',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = nodeType.color;
              e.currentTarget.style.background = nodeType.color + '10';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <nodeType.icon size={20} color={nodeType.color} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                {nodeType.label}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Drag to canvas or click to add
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h4 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '12px', color: '#374151' }}>
          Templates
        </h4>
        <div 
          style={{
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '8px',
            transition: 'all 0.2s'
          }}
          onClick={() => {
            // Create template nodes all at once
            onAddNode('input', 50, 150);
            onAddNode('agent', 250, 150);
            onAddNode('output', 450, 150);
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Simple Flow</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Input → Agent → Output</div>
        </div>
        
        <div 
          style={{
            padding: '12px',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '8px',
            transition: 'all 0.2s'
          }}
          onClick={() => {
            // Create complex AI processing pipeline template
            // First create all the nodes with predetermined IDs
            const nodeIds = {
              input: 'pipeline-input-' + Date.now(),
              sensor: 'pipeline-sensor-' + Date.now(),
              decision1: 'pipeline-decision1-' + Date.now(),
              agent1: 'pipeline-agent1-' + Date.now(),
              agent2: 'pipeline-agent2-' + Date.now(),
              skill1: 'pipeline-skill1-' + Date.now(),
              skill2: 'pipeline-skill2-' + Date.now(),
              skill3: 'pipeline-skill3-' + Date.now(),
              decision2: 'pipeline-decision2-' + Date.now(),
              output: 'pipeline-output-' + Date.now(),
            };

            // Create nodes
            onAddNode('input', 50, 120);
            onAddNode('sensor', 50, 220);
            onAddNode('decision', 250, 150);
            onAddNode('agent', 450, 100);
            onAddNode('agent', 450, 200);
            onAddNode('skill', 650, 80);
            onAddNode('skill', 650, 120);
            onAddNode('skill', 650, 180);
            onAddNode('decision', 850, 150);
            onAddNode('output', 1050, 150);
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>AI Processing Pipeline</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>Complex flow with sensors, decisions, and skills</div>
        </div>
      </div>
    </div>
  );
}

// Button component
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
        padding: '8px 12px',
        fontSize: '14px',
        border: '1px solid #d1d5db',
        borderRadius: '6px',
        background: active ? '#3b82f6' : '#ffffff',
        color: active ? '#ffffff' : '#374151',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.2s',
      }}
      onMouseOver={(e) => {
        if (!disabled && !active) {
          e.currentTarget.style.background = '#f3f4f6';
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

// Local storage key
const STORAGE_KEY = 'ai-flow-builder-state';

// Local storage functions
const saveToLocalStorage = (data: {
  nodes: AIFlowNode[];
  connections: AIFlowConnection[];
  zoom: number;
  pan: { x: number; y: number };
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

// Main Working AI Flow Builder
export function WorkingAIFlowBuilder() {
  // Load initial state from localStorage
  const initialState = loadFromLocalStorage();
  
  const [nodes, setNodes] = useState<AIFlowNode[]>(initialState?.nodes || []);
  const [connections, setConnections] = useState<AIFlowConnection[]>(initialState?.connections || []);
  const [selectedNode, setSelectedNode] = useState<AIFlowNode | null>(null);
  const [zoom, setZoom] = useState(initialState?.zoom || 1);
  const [pan, setPan] = useState<{ x: number; y: number }>(initialState?.pan || { x: 0, y: 0 });
  const [mode, setMode] = useState<AIFlowMode>('select');

  const addNode = (type: AIFlowNode['type'], x: number, y: number) => {
    const nodeDefaults = {
      agent: { width: 140, height: 80, color: '#3b82f620', label: 'AI Agent' },
      sensor: { width: 120, height: 60, color: '#10b98120', label: 'Sensor' },
      skill: { width: 120, height: 60, color: '#f59e0b20', label: 'Skill' },
      decision: { width: 100, height: 80, color: '#ef444420', label: 'Decision' },
      input: { width: 100, height: 60, color: '#8b5cf620', label: 'Input' },
      output: { width: 100, height: 60, color: '#06b6d420', label: 'Output' },
    };

    const defaults = nodeDefaults[type];
    const newNode: AIFlowNode = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      x,
      y,
      width: defaults.width,
      height: defaults.height,
      label: defaults.label,
      description: '',
      config: {},
      color: defaults.color,
      borderColor: defaults.color.replace('20', ''),
      borderWidth: 2,
    };
    
    setNodes(prevNodes => [...prevNodes, newNode]);
  };

  const updateNode = (id: string, updates: Partial<AIFlowNode>) => {
    setNodes(nodes.map(node => node.id === id ? { ...node, ...updates } : node));
    if (selectedNode?.id === id) {
      setSelectedNode({ ...selectedNode, ...updates });
    }
  };

  const deleteNode = (id: string) => {
    setNodes(nodes.filter(node => node.id !== id));
    setConnections(connections.filter(conn => conn.fromId !== id && conn.toId !== id));
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
  };

  const addConnection = (fromId: string, toId: string) => {
    const newConnection: AIFlowConnection = {
      id: Date.now().toString(),
      fromId,
      toId,
      fromX: 0,
      fromY: 0,
      toX: 0,
      toY: 0,
      color: '#6b7280',
      width: 2,
    };
    setConnections([...connections, newConnection]);
  };

  const zoomIn = () => setZoom(Math.min(zoom * 1.2, 3));
  const zoomOut = () => setZoom(Math.max(zoom / 1.2, 0.3));

  // Auto-save to localStorage whenever state changes
  useEffect(() => {
    saveToLocalStorage({ nodes, connections, zoom, pan });
  }, [nodes, connections, zoom, pan]);

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
  }, [selectedNode]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f3f4f6' }}>
      {/* Toolbar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        padding: '12px', 
        borderBottom: '1px solid #e5e7eb', 
        background: '#ffffff',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
      }}>
        <Button onClick={zoomOut}>
          <ZoomOut size={16} />
        </Button>
        <span style={{ fontSize: '14px', minWidth: '60px', textAlign: 'center', color: '#374151' }}>
          {Math.round(zoom * 100)}%
        </span>
        <Button onClick={zoomIn}>
          <ZoomIn size={16} />
        </Button>
        
        <div style={{ width: '1px', height: '24px', background: '#d1d5db', margin: '0 8px' }} />
        
        <Button active={mode === 'select'} onClick={() => setMode('select')}>
          <MousePointer size={16} />
          Select
        </Button>
        <Button active={mode === 'connect'} onClick={() => setMode('connect')}>
          <Link size={16} />
          Connect
        </Button>
        <Button active={mode === 'pan'} onClick={() => setMode('pan')}>
          <Hand size={16} />
          Pan
        </Button>
        
        <div style={{ marginLeft: 'auto' }}>
          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Nodes: {nodes.length} | Connections: {connections.length}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <WorkingNodePalette onAddNode={addNode} />

        <WorkingCanvas
          nodes={nodes}
          connections={connections}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          onUpdateNode={updateNode}
          onAddNode={addNode}
          onAddConnection={addConnection}
          onDeleteNode={deleteNode}
          zoom={zoom}
          pan={pan}
          onPanChange={setPan}
          mode={mode}
        />

        {/* Properties Panel */}
        <div style={{ 
          width: '250px', 
          borderLeft: '1px solid #e5e7eb', 
          background: '#ffffff',
          overflowY: 'auto'
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