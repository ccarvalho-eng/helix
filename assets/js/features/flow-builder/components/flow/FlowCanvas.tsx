import { memo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  Node,
  Edge,
  Connection,
  NodeChange,
  EdgeChange,
  OnSelectionChangeParams,
  ReactFlowInstance,
  OnMoveEnd,
  Viewport,
} from 'reactflow';
import { FlowNode } from './FlowNode';

const nodeTypes: NodeTypes = {
  aiFlowNode: FlowNode,
};

const edgeTypes: EdgeTypes = {};

interface FlowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (_changes: NodeChange[]) => void;
  onEdgesChange: (_changes: EdgeChange[]) => void;
  onConnect: (_connection: Connection) => void;
  onSelectionChange: (_elements: OnSelectionChangeParams) => void;
  onInit: (_instance: ReactFlowInstance) => void;
  onDrop: (_event: React.DragEvent) => void;
  onDragOver: (_event: React.DragEvent) => void;
  onMoveEnd: OnMoveEnd;
  initialViewport: Viewport;
  isCanvasLocked: boolean;
}

export const FlowCanvas = memo(function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectionChange,
  onInit,
  onDrop,
  onDragOver,
  onMoveEnd,
  initialViewport,
  isCanvasLocked,
}: FlowCanvasProps) {
  return (
    <div className='flow-canvas'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        onInit={onInit}
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
        nodesDraggable={!isCanvasLocked}
        nodesConnectable={!isCanvasLocked}
        elementsSelectable={!isCanvasLocked}
        panOnDrag={!isCanvasLocked}
        zoomOnScroll={!isCanvasLocked}
        fitView
        attributionPosition='bottom-left'
        proOptions={{ hideAttribution: true }}
      >
        <Background color='#cbd5e1' gap={16} />
        <Controls />
        <MiniMap
          nodeColor='#6b7280'
          maskColor='rgba(255, 255, 255, 0.2)'
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
          }}
        />
      </ReactFlow>
    </div>
  );
});
