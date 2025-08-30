import React from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  ReactFlowInstance,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  OnSelectionChangeParams,
} from 'reactflow';
import { FlowNode } from '../nodes';
import { AIFlowNode } from '../../types';

interface FlowCanvasProps {
  nodes: Node<AIFlowNode>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onSelectionChange: (_params: OnSelectionChangeParams) => void;
  onInit: (_instance: ReactFlowInstance) => void;
  onDrop: (_event: React.DragEvent) => void;
  onDragOver: (_event: React.DragEvent) => void;
  initialViewport?: { x: number; y: number; zoom: number };
}

const nodeTypes: NodeTypes = {
  aiFlowNode: FlowNode,
};

const edgeTypes: EdgeTypes = {};

export function FlowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onSelectionChange,
  onInit,
  onDrop,
  onDragOver,
  initialViewport = { x: 0, y: 0, zoom: 1 },
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
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultViewport={initialViewport}
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
      >
        <Controls className='flow-canvas__controls' />
        <Background color='#f3f4f6' gap={20} size={1} className='flow-canvas__background' />
      </ReactFlow>
    </div>
  );
}
