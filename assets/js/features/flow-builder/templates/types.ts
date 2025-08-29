export interface TemplateNode {
  id: string;
  type: 'agent' | 'sensor' | 'skill' | 'decision' | 'input' | 'output';
  label: string;
  description: string;
  x: number;
  y: number;
  config?: { [key: string]: any };
}

export interface TemplateConnection {
  source: string;
  target: string;
  sourceHandle: 'right';
  targetHandle: 'left';
}

export type TemplateCategory = 'gaming' | 'technology';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  nodes: TemplateNode[];
  connections: TemplateConnection[];
}

export type TemplateType = 'assassins-creed' | 'lotr' | 'the-witcher' | 'zelda' | 'skyrim' | 'cyber-security' | 'devops-pipeline' | 'software-automation';
