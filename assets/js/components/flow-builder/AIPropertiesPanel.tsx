import React, { useState } from 'react';
import { AIFlowNode, AIFlowConnection } from './types';

interface AIPropertiesPanelProps {
  selectedNode: AIFlowNode | null;
  selectedConnection: AIFlowConnection | null;
  onUpdateNode: (id: string, updates: Partial<AIFlowNode>) => void;
  onUpdateConnection: (id: string, updates: Partial<AIFlowConnection>) => void;
  onDeleteNode: (id: string) => void;
}

export function AIPropertiesPanel({
  selectedNode,
  selectedConnection,
  onUpdateNode,
  onUpdateConnection,
  onDeleteNode,
}: AIPropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'config'>('properties');

  if (!selectedNode && !selectedConnection) {
    return (
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Properties</h3>
        <div className="text-sm text-gray-500">
          Select a node or connection to edit its properties.
        </div>
        
        <div className="mt-8 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold mb-2 text-gray-700">AI Node Types</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div><strong>Agent:</strong> Core AI reasoning unit with configurable models and prompts</div>
            <div><strong>Sensor:</strong> Input source for real-time data collection</div>
            <div><strong>Skill:</strong> Specialized capability like API calls or data processing</div>
            <div><strong>Decision:</strong> Conditional logic for flow routing</div>
            <div><strong>Input/Output:</strong> Entry and exit points for the flow</div>
          </div>
        </div>
      </div>
    );
  }

  const handleNodeUpdate = (updates: Partial<AIFlowNode>) => {
    if (selectedNode) {
      onUpdateNode(selectedNode.id, updates);
    }
  };

  const handleConnectionUpdate = (updates: Partial<AIFlowConnection>) => {
    if (selectedConnection) {
      onUpdateConnection(selectedConnection.id, updates);
    }
  };

  const renderNodeProperties = (node: AIFlowNode) => {
    const getNodeTypeConfig = (type: AIFlowNode['type']) => {
      switch (type) {
        case 'agent':
          return {
            title: 'AI Agent Configuration',
            fields: [
              { key: 'model', label: 'AI Model', type: 'select', options: ['gpt-4', 'claude-3', 'llama-2'] },
              { key: 'temperature', label: 'Temperature', type: 'range', min: 0, max: 1, step: 0.1 },
              { key: 'max_tokens', label: 'Max Tokens', type: 'number' },
              { key: 'system_prompt', label: 'System Prompt', type: 'textarea' },
              { key: 'skills', label: 'Available Skills', type: 'multiselect' },
            ]
          };
        case 'sensor':
          return {
            title: 'Sensor Configuration',
            fields: [
              { key: 'source_type', label: 'Source Type', type: 'select', options: ['webhook', 'polling', 'pubsub', 'file'] },
              { key: 'endpoint', label: 'Endpoint/Path', type: 'text' },
              { key: 'interval', label: 'Polling Interval (seconds)', type: 'number' },
              { key: 'filters', label: 'Data Filters', type: 'textarea' },
            ]
          };
        case 'skill':
          return {
            title: 'Skill Configuration',
            fields: [
              { key: 'skill_type', label: 'Skill Type', type: 'select', options: ['api_call', 'data_transform', 'file_operation', 'custom'] },
              { key: 'endpoint', label: 'API Endpoint', type: 'text' },
              { key: 'method', label: 'HTTP Method', type: 'select', options: ['GET', 'POST', 'PUT', 'DELETE'] },
              { key: 'parameters', label: 'Parameters', type: 'textarea' },
            ]
          };
        case 'decision':
          return {
            title: 'Decision Logic',
            fields: [
              { key: 'condition_type', label: 'Condition Type', type: 'select', options: ['javascript', 'jq', 'simple'] },
              { key: 'condition', label: 'Condition', type: 'textarea' },
              { key: 'true_path', label: 'True Path', type: 'text' },
              { key: 'false_path', label: 'False Path', type: 'text' },
            ]
          };
        default:
          return {
            title: 'Basic Configuration',
            fields: [
              { key: 'data_format', label: 'Data Format', type: 'select', options: ['json', 'text', 'binary'] },
            ]
          };
      }
    };

    const config = getNodeTypeConfig(node.type);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
          <input
            type="text"
            value={node.label}
            onChange={(e) => handleNodeUpdate({ label: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={node.description}
            onChange={(e) => handleNodeUpdate({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-16"
            placeholder="Optional description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
          <input
            type="color"
            value={node.color.replace('20', '')} // Remove transparency
            onChange={(e) => handleNodeUpdate({ color: e.target.value + '20' })}
            className="w-full h-8 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
          <input
            type="color"
            value={node.borderColor}
            onChange={(e) => handleNodeUpdate({ borderColor: e.target.value })}
            className="w-full h-8 border border-gray-300 rounded-md"
          />
        </div>

        {activeTab === 'config' && (
          <div className="mt-6">
            <h4 className="text-md font-semibold mb-3 text-gray-800">{config.title}</h4>
            <div className="space-y-3">
              {config.fields.map((field) => {
                const value = node.config?.[field.key] || '';
                
                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleNodeUpdate({
                          config: { ...node.config, [field.key]: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    )}
                    
                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleNodeUpdate({
                          config: { ...node.config, [field.key]: parseInt(e.target.value) || 0 }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    )}
                    
                    {field.type === 'range' && (
                      <div>
                        <input
                          type="range"
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={value || field.min}
                          onChange={(e) => handleNodeUpdate({
                            config: { ...node.config, [field.key]: parseFloat(e.target.value) }
                          })}
                          className="w-full"
                        />
                        <span className="text-xs text-gray-500">{value || field.min}</span>
                      </div>
                    )}
                    
                    {field.type === 'select' && (
                      <select
                        value={value}
                        onChange={(e) => handleNodeUpdate({
                          config: { ...node.config, [field.key]: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="">Select...</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    
                    {field.type === 'textarea' && (
                      <textarea
                        value={value}
                        onChange={(e) => handleNodeUpdate({
                          config: { ...node.config, [field.key]: e.target.value }
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm h-20"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConnectionProperties = (connection: AIFlowConnection) => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
        <input
          type="text"
          value={connection.label || ''}
          onChange={(e) => handleConnectionUpdate({ label: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          placeholder="Optional connection label"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
        <input
          type="color"
          value={connection.color}
          onChange={(e) => handleConnectionUpdate({ color: e.target.value })}
          className="w-full h-8 border border-gray-300 rounded-md"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
        <input
          type="range"
          min="1"
          max="5"
          value={connection.width}
          onChange={(e) => handleConnectionUpdate({ width: parseInt(e.target.value) })}
          className="w-full"
        />
        <span className="text-xs text-gray-500">{connection.width}px</span>
      </div>
    </div>
  );

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Properties</h3>

      {selectedNode && (
        <>
          <div className="flex mb-4 border-b">
            <button
              onClick={() => setActiveTab('properties')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'properties'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'config'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Configuration
            </button>
          </div>

          <div className="mb-3">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {selectedNode.type.toUpperCase()}
            </span>
          </div>

          {renderNodeProperties(selectedNode)}
          
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="w-full px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-md hover:bg-red-600 transition-colors"
            >
              Delete Node
            </button>
          </div>
        </>
      )}

      {selectedConnection && (
        <div>
          <div className="mb-3">
            <span className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
              CONNECTION
            </span>
          </div>
          {renderConnectionProperties(selectedConnection)}
        </div>
      )}
    </div>
  );
}