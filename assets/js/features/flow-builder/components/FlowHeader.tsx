import React from 'react';
import { Cpu } from 'lucide-react';

interface FlowHeaderProps {
  nodeCount: number;
  edgeCount: number;
}

export function FlowHeader({ nodeCount, edgeCount }: FlowHeaderProps) {
  return (
    <div className='flow-builder__header'>
      <a href='/' className='flow-builder__logo'>
        <Cpu size={20} />
        Helix
      </a>

      <div className='flow-builder__stats'>
        Nodes: {nodeCount} | Connections: {edgeCount}
      </div>
    </div>
  );
}
