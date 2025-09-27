import { useCallback } from 'react';
import { NodeConfig } from '../../../shared/types';
import { AIFlowNode } from '../types';

type ReactFlowAINode = AIFlowNode;

export function useNodeDefaults(
  addNode: (_type: ReactFlowAINode['type'], _label?: string, _description?: string) => void,
  isFlowReady: boolean
) {
  const getNodeDescriptionByType = (type: ReactFlowAINode['type']): string => {
    const descriptions = {
      agent: 'Autonomous AI agent with reasoning capabilities',
      sensor: 'Monitor and collect data from sources',
      skill: 'Execute specific functions or tools',
      memory: 'Store and retrieve context or state',
      decision: 'Route flow based on conditions',
      loop: 'Iterate over data or repeat actions',
      transform: 'Process and format data',
      input: 'Entry point for data or prompts',
      output: 'Final result or endpoint',
      api: 'Connect to external APIs and services',
    };
    return descriptions[type] || `${type} node`;
  };

  const getNodeDefaults = (type: ReactFlowAINode['type']) => {
    const nodeDefaults = {
      agent: { width: 140, height: 80, color: '#f0f9ff', label: 'AI Agent' },
      sensor: { width: 120, height: 60, color: '#f0fdf4', label: 'Sensor' },
      skill: { width: 120, height: 60, color: '#fffbeb', label: 'Skill' },
      decision: {
        width: 100,
        height: 80,
        color: '#fef2f2',
        label: 'Decision',
      },
      input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
      output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
      memory: { width: 120, height: 60, color: '#fdf2f8', label: 'Memory' },
      loop: { width: 100, height: 60, color: '#faf5ff', label: 'Loop' },
      transform: {
        width: 130,
        height: 60,
        color: '#f0fdfa',
        label: 'Transform',
      },
      api: { width: 100, height: 60, color: '#fff7ed', label: 'API' },
    };
    return nodeDefaults[type];
  };

  const addNodeWithDefaults = useCallback(
    (
      type: ReactFlowAINode['type'],
      customLabel?: string,
      customDescription?: string,
      _defaultConfig?: NodeConfig
    ) => {
      if (!isFlowReady) {
        return;
      }

      const defaults = getNodeDefaults(type);
      addNode(
        type,
        customLabel || defaults.label,
        customDescription || getNodeDescriptionByType(type)
      );
    },
    [addNode, isFlowReady]
  );

  return {
    getNodeDescriptionByType,
    getNodeDefaults,
    addNodeWithDefaults,
  };
}
