import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Eye, Wrench, GitBranch, ArrowLeft, ArrowRight } from 'lucide-react';
import { AIFlowNode } from '../../types';

interface FlowNodeProps {
  data: AIFlowNode;
  selected: boolean;
}

const NodeIcon = {
  agent: Bot,
  sensor: Eye,
  skill: Wrench,
  decision: GitBranch,
  input: ArrowLeft,
  output: ArrowRight,
};

const nodeColors = {
  agent: '#0ea5e9',
  sensor: '#22c55e',
  skill: '#f59e0b',
  decision: '#ef4444',
  input: '#8b5cf6',
  output: '#06b6d4',
};

const nodeDimensions = {
  agent: { width: '140px', height: '80px' },
  sensor: { width: '120px', height: '60px' },
  skill: { width: '120px', height: '60px' },
  decision: { width: '100px', height: '80px' },
  input: { width: '100px', height: '60px' },
  output: { width: '100px', height: '60px' },
};

export function FlowNode({ data, selected }: FlowNodeProps) {
  const NodeIconComponent = NodeIcon[data.type];
  const iconColor = nodeColors[data.type];
  const { width, height } = nodeDimensions[data.type];

  const nodeStyle = {
    '--node-bg-color': data.color,
    '--node-border-color': '#e5e7eb',
    '--node-shadow': '0 1px 3px rgba(0, 0, 0, 0.06)',
    '--node-width': width,
    '--node-height': height,
  } as React.CSSProperties;

  return (
    <div className={`flow-node ${selected ? 'flow-node--selected' : ''}`} style={nodeStyle}>
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
        <NodeIconComponent size={20} color={iconColor} />
      </div>
      <div className='flow-node__label'>{data.label}</div>
    </div>
  );
}
