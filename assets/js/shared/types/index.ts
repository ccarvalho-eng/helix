// Global application types

export type Theme = 'light' | 'dark';

export type NodeType = 'agent' | 'sensor' | 'skill' | 'decision' | 'input' | 'output';

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface NodeConfig {
  [key: string]: any;
}

export interface BaseNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  position: Position;
  dimensions: Dimensions;
  config?: NodeConfig;
}

export interface Connection {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
}