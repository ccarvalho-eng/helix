import { memo } from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';
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
  Zap,
} from 'lucide-react';
import { useThemeContext } from '../../contexts/ThemeContext';
import { AIFlowNode } from '../../types';

type ReactFlowAINode = AIFlowNode;

interface FlowNodeProps {
  readonly data: ReactFlowAINode;
  readonly selected: boolean;
}

export const FlowNode = memo(function FlowNode({ data, selected }: FlowNodeProps) {
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

  // Use the stored dimensions from the node data
  const width = data.width;
  const height = data.height;

  const nodeStyle = {
    '--node-bg-color': data.color,
    '--node-border-color': data.borderColor,
    '--node-shadow': '0 1px 3px rgba(0, 0, 0, 0.06)',
    width: '100%',
    height: '100%',
  } as React.CSSProperties;

  return (
    <div className={`flow-node ${selected ? 'flow-node--selected' : ''}`} style={nodeStyle}>
      <NodeResizer
        color={theme === 'dark' ? 'var(--theme-syntax-green)' : 'var(--theme-text-primary)'}
        isVisible={selected}
        minWidth={80}
        minHeight={50}
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
});
