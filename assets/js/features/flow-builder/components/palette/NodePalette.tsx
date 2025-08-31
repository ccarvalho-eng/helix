import React from 'react';
import {
  Bot,
  Eye,
  Wrench,
  GitBranch,
  ArrowLeft,
  ArrowRight,
  Brain,
  RotateCcw,
  RefreshCw,
  Zap,
  Sparkles,
} from 'lucide-react';
import { AIFlowNode } from '../../types';
import { NodeConfig } from '../../../../shared/types';

interface NodePaletteProps {
  onAddNode: (
    _type: AIFlowNode['type'],
    _customLabel?: string,
    _customDescription?: string,
    _defaultConfig?: NodeConfig
  ) => void;
  onAddTemplate: () => void;
}

type NodeCategory = 'core' | 'logic' | 'io';

interface NodeDefinition {
  type: AIFlowNode['type'];
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  color: string;
  description: string;
  category: 'core' | 'logic' | 'io';
  properties: NodeConfig;
}

const nodeDefinitions: NodeDefinition[] = [
  // Core Agent Nodes
  {
    type: 'agent' as const,
    icon: Bot,
    label: 'Agent',
    color: '#0ea5e9',
    description: 'Autonomous AI agent with reasoning capabilities',
    category: 'core',
    properties: {
      model: 'gpt-4o',
      provider: 'openai',
      temperature: 0.7,
      max_tokens: 2000,
      system_prompt: 'You are a helpful AI assistant.',
      skills: [],
      memory_enabled: true,
      reasoning_mode: 'chain_of_thought',
      max_retries: 3,
    },
  },
  {
    type: 'sensor' as const,
    icon: Eye,
    label: 'Sensor',
    color: '#22c55e',
    description: 'Monitor and collect data from sources',
    category: 'core',
    properties: {
      source_type: 'webhook',
      endpoint: '/webhook',
      polling_interval: 5000,
      filters: [],
      output_format: 'json',
      trigger_conditions: [],
      max_queue_size: 1000,
    },
  },
  {
    type: 'skill' as const,
    icon: Wrench,
    label: 'Skill',
    color: '#f59e0b',
    description: 'Execute specific functions or tools',
    category: 'core',
    properties: {
      skill_name: 'custom_function',
      function_code: 'return input;',
      input_schema: {},
      output_schema: {},
      timeout: 30000,
      retry_count: 3,
      error_handling: 'throw',
    },
  },
  {
    type: 'memory' as const,
    icon: Brain,
    label: 'Memory',
    color: '#ec4899',
    description: 'Store and retrieve context or state',
    category: 'core',
    properties: {
      memory_type: 'vector_store',
      storage_backend: 'local',
      max_entries: 1000,
      embedding_model: 'text-embedding-3-small',
      similarity_threshold: 0.8,
      persistence: true,
      search_enabled: true,
      index_fields: ['content', 'metadata'],
    },
  },
  // Logic Control Nodes
  {
    type: 'decision' as const,
    icon: GitBranch,
    label: 'Decision',
    color: '#ef4444',
    description: 'Route flow based on conditions',
    category: 'logic',
    properties: {
      condition_type: 'javascript',
      condition_expression: 'input.status === "success"',
      branches: [
        { name: 'success', condition: 'result === true' },
        { name: 'failure', condition: 'result === false' },
        { name: 'default', condition: 'else' },
      ],
      default_branch: 'default',
    },
  },
  {
    type: 'loop' as const,
    icon: RotateCcw,
    label: 'Loop',
    color: '#8b5cf6',
    description: 'Iterate over data or repeat actions',
    category: 'logic',
    properties: {
      loop_type: 'for_each',
      iterate_over: 'input.items',
      max_iterations: 100,
      break_condition: '',
      parallel_execution: false,
      batch_size: 10,
      error_handling: 'continue',
    },
  },
  {
    type: 'transform' as const,
    icon: RefreshCw,
    label: 'Transform',
    color: '#14b8a6',
    description: 'Process and format data',
    category: 'logic',
    properties: {
      transform_type: 'jq',
      transformation: '.items | map({id: .id, name: .name})',
      input_format: 'json',
      output_format: 'json',
      validation_schema: {},
      error_on_invalid: false,
    },
  },
  // I/O Nodes
  {
    type: 'input' as const,
    icon: ArrowLeft,
    label: 'Input',
    color: '#6366f1',
    description: 'Entry point for data or prompts',
    category: 'io',
    properties: {
      input_type: 'form',
      fields: [
        { name: 'message', type: 'text', required: true, placeholder: 'Enter your message...' },
      ],
      validation_rules: {},
      default_values: {},
      ui_config: { layout: 'vertical', submit_button: 'Process' },
    },
  },
  {
    type: 'output' as const,
    icon: ArrowRight,
    label: 'Output',
    color: '#06b6d4',
    description: 'Final result or endpoint',
    category: 'io',
    properties: {
      output_type: 'structured',
      format_template: '{{result}}',
      destinations: ['console', 'file', 'webhook'],
      file_path: './output.json',
      webhook_url: '',
      compression: false,
      encryption: false,
    },
  },
  {
    type: 'api' as const,
    icon: Zap,
    label: 'API',
    color: '#f97316',
    description: 'Connect to external APIs and services',
    category: 'io',
    properties: {
      method: 'GET',
      base_url: 'https://api.example.com',
      path: '/endpoint',
      params: {},
      headers: { 'Content-Type': 'application/json' },
      body: '',
      timeout: 10000,
      auth_type: 'none',
      api_key: '',
      retry_attempts: 3,
    },
  },
];

const categoryLabels: Record<NodeCategory, string> = {
  core: 'Core Agents',
  logic: 'Logic Control',
  io: 'Input/Output',
};

const categoryIcons: Record<
  NodeCategory,
  React.ComponentType<{ size?: number; color?: string }>
> = {
  core: Bot,
  logic: GitBranch,
  io: ArrowLeft,
};

export function NodePalette({ onAddNode, onAddTemplate }: NodePaletteProps) {
  const handleDragStart = (e: React.DragEvent, nodeType: AIFlowNode['type']) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleNodeClick = (nodeDefinition: NodeDefinition) => {
    // Pass the node type and its default properties
    onAddNode(
      nodeDefinition.type,
      nodeDefinition.label,
      nodeDefinition.description,
      nodeDefinition.properties
    );
  };

  const nodesByCategory = nodeDefinitions.reduce(
    (acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    },
    {} as Record<NodeCategory, NodeDefinition[]>
  );

  return (
    <div className='node-palette'>
      <div className='node-palette__header'>
        <h3 className='node-palette__title'>Node Palette</h3>
      </div>

      <div className='node-palette__content'>
        {Object.entries(categoryLabels).map(([category, label]) => {
          const nodes = nodesByCategory[category as NodeCategory] || [];
          const CategoryIcon = categoryIcons[category as NodeCategory];

          return (
            <div key={category} className='node-palette__section'>
              <div className='node-palette__section-header'>
                <CategoryIcon size={14} color='var(--flow-builder-text-muted)' />
                <h4 className='node-palette__section-title'>{label}</h4>
              </div>

              <div className='node-palette__nodes-grid'>
                {nodes.map(nodeDefinition => (
                  <div
                    key={nodeDefinition.type}
                    className='node-palette__node'
                    draggable
                    onDragStart={e => handleDragStart(e, nodeDefinition.type)}
                    onClick={() => handleNodeClick(nodeDefinition)}
                    title={nodeDefinition.description}
                  >
                    <div className='node-palette__node-icon'>
                      <nodeDefinition.icon size={16} color={nodeDefinition.color} />
                    </div>
                    <div className='node-palette__node-info'>
                      <div className='node-palette__node-label'>{nodeDefinition.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className='node-palette__templates'>
        <div className='node-palette__templates-title'>
          <Sparkles size={12} />
          Templates
        </div>
        <div className='node-palette__template' onClick={onAddTemplate}>
          <div className='node-palette__template-title'>Assassin's Creed Brotherhood</div>
          <div className='node-palette__template-description'>
            Ezio, Altaïr, Bayek & Edward coordinate a mission
          </div>
        </div>
      </div>
    </div>
  );
}
