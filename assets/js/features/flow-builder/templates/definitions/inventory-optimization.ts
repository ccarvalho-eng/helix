import { Template } from '../types';

export const inventoryOptimizationTemplate: Template = {
  id: 'inventory-optimization',
  name: 'Inventory Optimization System',
  description: 'AI-driven inventory management and optimization',
  category: 'e-commerce',
  nodes: [
    {
      id: 'inventory-data',
      type: 'input',
      label: 'Inventory Data',
      description: 'Current inventory levels and historical sales data',
      x: 100,
      y: 250,
    },
    {
      id: 'optimization-ai',
      type: 'agent',
      label: 'Inventory Optimizer',
      description: 'AI agent for inventory optimization and demand forecasting',
      x: 300,
      y: 250,
      config: {
        model: 'inventory-optimization-llm',
        temperature: 0.2,
        max_tokens: 800,
        system_prompt:
          'Optimize inventory levels based on demand patterns and business constraints.',
      },
    },
    {
      id: 'optimization-plan',
      type: 'output',
      label: 'Optimization Plan',
      description: 'Inventory optimization recommendations and reorder suggestions',
      x: 500,
      y: 250,
    },
  ],
  connections: [
    {
      source: 'inventory-data',
      target: 'optimization-ai',
      sourceHandle: 'right',
      targetHandle: 'left',
    },
    {
      source: 'optimization-ai',
      target: 'optimization-plan',
      sourceHandle: 'right',
      targetHandle: 'left',
    },
  ],
};
