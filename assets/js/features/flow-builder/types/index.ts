// Flow Builder specific types
import type { BaseNode, Connection, NodeType } from '../../../shared/types';

export interface AIFlowNode extends BaseNode {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  borderColor: string;
  borderWidth: number;
}

export interface AIFlowConnection extends Connection {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  color: string;
  width: number;
  label?: string;
}

export type AIFlowMode = 'select' | 'connect' | 'pan';

// Template related types
export type TemplateCategory = 'gaming' | 'technology';

export interface TemplateNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  x: number;
  y: number;
  config?: { [key: string]: string | number | boolean | string[] | undefined };
}

export interface TemplateConnection {
  source: string;
  target: string;
  sourceHandle: 'right';
  targetHandle: 'left';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  nodes: TemplateNode[];
  connections: TemplateConnection[];
}

export type TemplateType =
  | 'assassins-creed'
  | 'lotr'
  | 'the-witcher'
  | 'zelda'
  | 'skyrim'
  | 'cyber-security'
  | 'devops-pipeline'
  | 'software-automation';
