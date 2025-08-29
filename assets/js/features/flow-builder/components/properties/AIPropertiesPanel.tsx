import React, { useState } from 'react';
import { AIFlowNode, AIFlowConnection } from '../../types';

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
      <div className="properties-panel__empty">
        <h3 className="properties-panel__empty-title">Properties</h3>
        <div className="properties-panel__empty-text">
          Select a node or connection to edit its properties.
        </div>
        
        <div className="properties-panel__help">
          <h4 className="properties-panel__help-title">Node Types</h4>
          <div className="properties-panel__help-list">
            <div className="properties-panel__help-item"><span className="properties-panel__help-label">Agent:</span> Core AI reasoning unit</div>
            <div className="properties-panel__help-item"><span className="properties-panel__help-label">Sensor:</span> Real-time data collection</div>
            <div className="properties-panel__help-item"><span className="properties-panel__help-label">Skill:</span> Specialized capabilities</div>
            <div className="properties-panel__help-item"><span className="properties-panel__help-label">Decision:</span> Conditional logic routing</div>
            <div className="properties-panel__help-item"><span className="properties-panel__help-label">Input/Output:</span> Flow entry/exit points</div>
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
      <div className="properties-panel__fields">
        <div className="properties-panel__field">
          <label className="properties-panel__label">Label</label>
          <input
            type="text"
            value={node.label}
            onChange={(e) => handleNodeUpdate({ label: e.target.value })}
            className="properties-panel__input"
          />
        </div>

        <div className="properties-panel__field">
          <label className="properties-panel__label">Description</label>
          <textarea
            value={node.description}
            onChange={(e) => handleNodeUpdate({ description: e.target.value })}
            className="properties-panel__input properties-panel__textarea"
            placeholder="Optional description..."
          />
        </div>

        <div className="properties-panel__field">
          <label className="properties-panel__label">Background Color</label>
          <input
            type="color"
            value={node.color.replace('20', '')}
            onChange={(e) => handleNodeUpdate({ color: e.target.value + '20' })}
            className="properties-panel__input properties-panel__color-input"
          />
        </div>

        <div className="properties-panel__field">
          <label className="properties-panel__label">Border Color</label>
          <input
            type="color"
            value={node.borderColor}
            onChange={(e) => handleNodeUpdate({ borderColor: e.target.value })}
            className="properties-panel__input properties-panel__color-input"
          />
        </div>

        {activeTab === 'config' && (
          <div className="properties-panel__config-section">
            <h4 className="properties-panel__config-title">
              {config.title}
            </h4>
            <div className="properties-panel__fields">
              {config.fields.map((field) => {
                const value = node.config?.[field.key] || '';
                
                return (
                  <div key={field.key}>
                    <label style={{ 
                      display: 'block', 
                      fontSize: '12px', 
                      fontWeight: '400', 
                      color: '#1f2937', 
                      marginBottom: '6px' 
                    }}>
                      {field.label}
                    </label>
                    
                    {field.type === 'text' && (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleNodeUpdate({
                          config: { ...node.config, [field.key]: e.target.value }
                        })}
                        className="properties-panel__input"
                      />
                    )}
                    
                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleNodeUpdate({
                          config: { ...node.config, [field.key]: parseInt(e.target.value) || 0 }
                        })}
                        className="properties-panel__input"
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
                          style={{
                            width: '100%',
                            height: '4px',
                            borderRadius: '2px',
                            background: '#e5e7eb',
                            outline: 'none',
                            cursor: 'pointer'
                          }}
                        />
                        <span style={{ 
                          fontSize: '11px', 
                          color: '#6b7280', 
                          marginTop: '2px', 
                          display: 'block' 
                        }}>
                          {value || field.min}
                        </span>
                      </div>
                    )}
                    
                    {field.type === 'select' && (
                      <select
                        value={value}
                        onChange={(e) => handleNodeUpdate({
                          config: { ...node.config, [field.key]: e.target.value }
                        })}
                        className="properties-panel__input"
                        style={{
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 12px center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '16px',
                          paddingRight: '40px'
                        }}
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
                        className="properties-panel__input properties-panel__textarea"
                        style={{
                          minHeight: '60px',
                          resize: 'vertical',
                          lineHeight: '1.4'
                        }}
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
    <div className="properties-panel__fields">
      <div className="properties-panel__field">
        <label className="properties-panel__label">
          Label
        </label>
        <input
          type="text"
          value={connection.label || ''}
          onChange={(e) => handleConnectionUpdate({ label: e.target.value })}
          className="properties-panel__input"
          placeholder="Optional connection label"
        />
      </div>

      <div className="properties-panel__field">
        <label className="properties-panel__label">
          Color
        </label>
        <input
          type="color"
          value={connection.color}
          onChange={(e) => handleConnectionUpdate({ color: e.target.value })}
          className="properties-panel__input properties-panel__color-input"
        />
      </div>

      <div className="properties-panel__field">
        <label className="properties-panel__label">
          Width
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={connection.width}
          onChange={(e) => handleConnectionUpdate({ width: parseInt(e.target.value) })}
          className="properties-panel__range"
        />
        <span className="properties-panel__range-value">
          {connection.width}px
        </span>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ fontSize: '16px', fontWeight: '500', marginBottom: '16px', color: '#1f2937' }}>Properties</h3>

      {selectedNode && (
        <>
          <div className="properties-panel__tabs">
            <button
              onClick={() => setActiveTab('properties')}
              className={`properties-panel__tab ${activeTab === 'properties' ? 'properties-panel__tab--active' : ''}`}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={`properties-panel__tab ${activeTab === 'config' ? 'properties-panel__tab--active' : ''}`}
            >
              Configuration
            </button>
          </div>

          <div>
            <span className="properties-panel__node-type">
              {selectedNode.type.toUpperCase()}
            </span>
          </div>

          {renderNodeProperties(selectedNode)}
          
          <div className="properties-panel__delete-section">
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className="properties-panel__delete-btn"
            >
              Delete Node
            </button>
          </div>
        </>
      )}

      {selectedConnection && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#dcfce7',
              color: '#166534',
              fontSize: '11px',
              fontWeight: '500',
              borderRadius: '4px',
              letterSpacing: '0.05em'
            }}>
              CONNECTION
            </span>
          </div>
          {renderConnectionProperties(selectedConnection)}
        </div>
      )}
    </div>
  );
}