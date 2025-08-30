import type { AIFlowNode } from '../types';

export interface FlowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: AIFlowNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }>;
}

// Re-export Template from main types
export type { Template } from '../types';

export type TemplateType = 
  | 'assassins-creed'
  | 'lotr'
  | 'the-witcher'
  | 'zelda'
  | 'skyrim'
  | 'cyber-security'
  | 'devops-pipeline'
  | 'software-automation';