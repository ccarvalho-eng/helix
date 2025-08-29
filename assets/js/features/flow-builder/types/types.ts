export interface AIFlowNode {
  id: string;
  type: 'agent' | 'sensor' | 'skill' | 'decision' | 'input' | 'output';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  description: string;
  config: {
    [key: string]: any;
  };
  color: string;
  borderColor: string;
  borderWidth: number;
}

export interface AIFlowConnection {
  id: string;
  fromId: string;
  toId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  width: number;
  label?: string;
}

export type AIFlowMode = 'select' | 'connect' | 'pan';