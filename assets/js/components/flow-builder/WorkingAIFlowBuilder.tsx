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
  Hand,
  Cpu
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
  
  const getIconColor = (nodeType: AIFlowNode['type']) => {
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
  
  const iconColor = getIconColor(node.type);

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
        border: `1px solid ${isSelected ? '#000000' : '#e5e7eb'}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: mode === 'connect' ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '13px',
        fontWeight: '400',
        color: '#1f2937',
        boxShadow: isSelected ? '0 0 0 1px #000000, 0 8px 24px rgba(0, 0, 0, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.06)',
        transition: isDragging ? 'none' : 'all 0.2s',
        userSelect: 'none',
        zIndex: isDragging ? 1000 : (isSelected ? 100 : 1),
        opacity: isConnecting && !isSelected ? 0.7 : 1,
      }}
    >
      {/* Connection points */}
      <div style={{
        position: 'absolute',
        top: '-3px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '6px',
        height: '6px',
        backgroundColor: '#9ca3af',
        borderRadius: '50%',
        border: '1px solid white',
        opacity: mode === 'connect' || isSelected ? 1 : 0,
        transition: 'opacity 0.2s'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-3px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '6px',
        height: '6px',
        backgroundColor: '#9ca3af',
        borderRadius: '50%',
        border: '1px solid white',
        opacity: mode === 'connect' || isSelected ? 1 : 0,
        transition: 'opacity 0.2s'
      }} />

      <div style={{ marginBottom: '4px' }}>
        <NodeIcon size={20} color={iconColor} />
      </div>
      <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
        {node.label}
      </div>
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
  mode,
  onZoomIn,
  onZoomOut,
  onSetMode
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
  onZoomIn: () => void;
  onZoomOut: () => void;
  onSetMode: (mode: AIFlowMode) => void;
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
        background: isDragOver ? '#f8f9fa' : '#ffffff',
        position: 'relative',
        cursor: mode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 
               mode === 'connect' ? 'crosshair' : 'default',
        border: isDragOver ? '2px dashed #9ca3af' : 'none',
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
            linear-gradient(to right, #f3f4f6 1px, transparent 1px),
            linear-gradient(to bottom, #f3f4f6 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          opacity: 0.4
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
            background: '#000000',
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
              background: '#000000',
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
              e.currentTarget.style.background = '#374151';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#000000';
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
          background: '#000000',
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
      
      {/* Floating Tools Panel */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        left: '24px',
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '8px',
        zIndex: 1000
      }}>
        <Button onClick={onZoomOut}>
          <ZoomOut size={16} />
        </Button>
        <span style={{ fontSize: '13px', minWidth: '50px', textAlign: 'center', color: '#1f2937', padding: '0 8px' }}>
          {Math.round(zoom * 100)}%
        </span>
        <Button onClick={onZoomIn}>
          <ZoomIn size={16} />
        </Button>
        
        <div style={{ width: '1px', height: '20px', background: '#e5e7eb', margin: '0 4px' }} />
        
        <Button active={mode === 'select'} onClick={() => onSetMode('select')}>
          <MousePointer size={16} />
        </Button>
        <Button active={mode === 'connect'} onClick={() => onSetMode('connect')}>
          <Link size={16} />
        </Button>
        <Button active={mode === 'pan'} onClick={() => onSetMode('pan')}>
          <Hand size={16} />
        </Button>
      </div>
    </div>
  );
}

// Node Palette
function WorkingNodePalette({ onAddNode, nodes, onUpdateNode }: { 
  onAddNode: (type: AIFlowNode['type'], x: number, y: number, customLabel?: string, customDescription?: string) => void;
  nodes: AIFlowNode[];
  onUpdateNode: (id: string, updates: Partial<AIFlowNode>) => void;
}) {
  const nodeTypes = [
    { type: 'agent' as const, icon: Bot, label: 'AI Agent', color: '#0ea5e9' },
    { type: 'sensor' as const, icon: Eye, label: 'Sensor', color: '#22c55e' },
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
      boxShadow: '2px 0 12px rgba(0, 0, 0, 0.06)',
      padding: '20px',
      overflowY: 'auto'
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
            onClick={() => onAddNode(nodeType.type, 100, 100)}
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
          onClick={() => {
            // Create Assassin's Creed Brotherhood nodes with custom labels
            onAddNode('input', 50, 200, 'Mission Brief', 'Receive assassination target and intel');
            onAddNode('sensor', 250, 120, 'Eagle Vision', 'Scan environment for threats and opportunities');
            onAddNode('agent', 450, 50, 'Ezio Auditore', 'Master strategist, plans the approach and coordinates team');
            onAddNode('agent', 450, 170, 'Altaïr Ibn-LaAhad', 'Legendary assassin, executes high-priority eliminations');
            onAddNode('agent', 450, 290, 'Bayek of Siwa', 'Hidden One, investigates targets and gathers intelligence');
            onAddNode('agent', 450, 410, 'Edward Kenway', 'Pirate assassin, handles naval operations and combat');
            onAddNode('skill', 700, 90, 'Hidden Blade', 'Silent assassination technique');
            onAddNode('skill', 700, 210, 'Free Running', 'Parkour and escape routes');
            onAddNode('skill', 700, 330, 'Combat Training', 'Sword fighting and counter-attacks');
            onAddNode('decision', 900, 230, 'Mission Success?', 'Evaluate if target eliminated and escape completed');
            onAddNode('output', 1100, 230, 'Brotherhood Report', 'Mission status and next objectives');
          }}
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
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>(initialState?.pan || { x: 0, y: 0 });
  const [mode, setMode] = useState<AIFlowMode>('select');

  const addNode = (type: AIFlowNode['type'], x: number, y: number, customLabel?: string, customDescription?: string) => {
    const nodeDefaults = {
      agent: { width: 140, height: 80, color: '#f0f9ff', label: 'AI Agent' },
      sensor: { width: 120, height: 60, color: '#f0fdf4', label: 'Sensor' },
      skill: { width: 120, height: 60, color: '#fffbeb', label: 'Skill' },
      decision: { width: 100, height: 80, color: '#fef2f2', label: 'Decision' },
      input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
      output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
    };

    const defaults = nodeDefaults[type];
    const newNode: AIFlowNode = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      x,
      y,
      width: defaults.width,
      height: defaults.height,
      label: customLabel || defaults.label,
      description: customDescription || '',
      config: {},
      color: defaults.color,
      borderColor: '#e5e7eb',
      borderWidth: 1,
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
      color: '#9ca3af',
      width: 2,
    };
    setConnections([...connections, newConnection]);
  };

  const zoomIn = () => setZoom(Math.min(zoom + 0.1, 3));
  const zoomOut = () => setZoom(Math.max(zoom - 0.1, 0.3));

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
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#ffffff' }}>
      {/* Top Bar with Helix Logo */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px 24px', 
        borderBottom: '1px solid #e5e7eb', 
        background: '#ffffff',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
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
          Nodes: {nodes.length} | Connections: {connections.length}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <WorkingNodePalette onAddNode={addNode} nodes={nodes} onUpdateNode={updateNode} />

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
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onSetMode={setMode}
        />

        {/* Properties Panel */}
        <div style={{ 
          width: '250px', 
          borderLeft: '1px solid #e5e7eb', 
          background: '#ffffff',
          boxShadow: '-2px 0 12px rgba(0, 0, 0, 0.06)',
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