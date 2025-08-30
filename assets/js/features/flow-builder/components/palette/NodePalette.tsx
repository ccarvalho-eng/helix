import React from 'react';
import { Bot, Eye, Wrench, GitBranch, ArrowLeft, ArrowRight } from 'lucide-react';
import { AIFlowNode } from '../../types';

interface NodePaletteProps {
  onAddNode: (
    _type: AIFlowNode['type'],
    _customLabel?: string,
    _customDescription?: string
  ) => void;
  onAddTemplate: () => void;
}

const nodeTypes = [
  { type: 'agent' as const, icon: Bot, label: 'AI Agent', color: '#0ea5e9' },
  { type: 'sensor' as const, icon: Eye, label: 'Sensor', color: '#22c55e' },
  { type: 'skill' as const, icon: Wrench, label: 'Skill', color: '#f59e0b' },
  { type: 'decision' as const, icon: GitBranch, label: 'Decision', color: '#ef4444' },
  { type: 'input' as const, icon: ArrowLeft, label: 'Input', color: '#8b5cf6' },
  { type: 'output' as const, icon: ArrowRight, label: 'Output', color: '#06b6d4' },
];

export function NodePalette({ onAddNode, onAddTemplate }: NodePaletteProps) {
  const handleDragStart = (e: React.DragEvent, nodeType: AIFlowNode['type']) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className='node-palette'>
      <h3 className='node-palette__title'>AI Flow Nodes</h3>

      <div className='node-palette__nodes'>
        {nodeTypes.map(nodeType => (
          <div
            key={nodeType.type}
            className='node-palette__node'
            draggable
            onDragStart={e => handleDragStart(e, nodeType.type)}
            onClick={() => onAddNode(nodeType.type)}
          >
            <nodeType.icon size={18} color={nodeType.color} />
            <div className='node-palette__node-info'>
              <div className='node-palette__node-label'>{nodeType.label}</div>
              <div className='node-palette__node-hint'>Drag to canvas or click to add</div>
            </div>
          </div>
        ))}
      </div>

      <div className='node-palette__templates'>
        <h4 className='node-palette__templates-title'>Templates</h4>
        <div className='node-palette__template' onClick={onAddTemplate}>
          <div className='node-palette__template-title'>Assassin's Creed Brotherhood</div>
          <div className='node-palette__template-description'>
            Ezio, Altaïr, Bayek & Edward coordinate a mission
          </div>
        </div>
      </div>
    </div>
  );
}
