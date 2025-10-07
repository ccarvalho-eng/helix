import { Template } from '../types';

export const riskAssessmentTemplate: Template = {
  id: 'risk-assessment',
  name: 'Financial Risk Assessment',
  description: 'Financial risk analysis and scoring',
  category: 'finance',
  nodes: [
    {
      id: 'financial-data',
      type: 'input',
      label: 'Financial Data',
      description: 'Client financial information and portfolio data',
      x: 100,
      y: 250,
    },
    {
      id: 'risk-analyzer',
      type: 'agent',
      label: 'Risk Analyzer',
      description: 'AI agent specialized in financial risk assessment',
      x: 300,
      y: 250,
      config: {
        model: 'financial-risk-llm',
        temperature: 0.2,
        max_tokens: 800,
        system_prompt: 'Analyze financial data and assess various risk factors.',
      },
    },
    {
      id: 'risk-report',
      type: 'output',
      label: 'Risk Assessment Report',
      description: 'Risk analysis and recommendations',
      x: 500,
      y: 250,
    },
  ],
  connections: [
    {
      source: 'financial-data',
      target: 'risk-analyzer',
      sourceHandle: 'right',
      targetHandle: 'left',
    },
    {
      source: 'risk-analyzer',
      target: 'risk-report',
      sourceHandle: 'right',
      targetHandle: 'left',
    },
  ],
};
