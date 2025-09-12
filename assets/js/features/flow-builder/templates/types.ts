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
  | 'invoice-processing'
  | 'employee-onboarding'
  | 'hr-recruitment'
  | 'customer-support-automation'
  | 'feedback-analysis'
  | 'social-media-content'
  | 'blog-generation'
  | 'financial-reporting'
  | 'predictive-analytics'
  | 'iot-data-processing'
  | 'patient-triage'
  | 'medical-diagnosis'
  | 'fraud-detection'
  | 'risk-assessment'
  | 'product-recommendation'
  | 'inventory-optimization';
