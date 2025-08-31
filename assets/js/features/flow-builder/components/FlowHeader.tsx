import React from 'react';
import { Cpu } from 'lucide-react';

interface FlowHeaderProps {
  nodeCount: number;
  edgeCount: number;
}

export function FlowHeader({ nodeCount, edgeCount }: FlowHeaderProps) {
  return (
    <div className='flow-builder__header'>
      <div className='flow-builder__brand'>
        <a href='/' style={{ display: 'contents' }}>
          <Cpu className='flow-builder__logo' />
          <h1 className='flow-builder__title'>Helix</h1>
          <span className='flow-builder__subtitle'>AI Flow Builder</span>
        </a>
      </div>

      <div className='flow-builder__stats'>
        Nodes: {nodeCount} | Connections: {edgeCount}
      </div>
    </div>
  );
}
