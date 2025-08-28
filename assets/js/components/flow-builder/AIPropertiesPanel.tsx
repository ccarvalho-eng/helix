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
      <div style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '24px', color: '#111827' }}>Properties</h3>
        <div style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
          Select a node or connection to edit its properties.
        </div>
        
        <div style={{ marginTop: '32px', padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '16px', color: '#1f2937' }}>Node Types</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px', color: '#6b7280', lineHeight: '1.4' }}>
            <div><strong style={{ color: '#1f2937' }}>Agent:</strong> Core AI reasoning unit</div>
            <div><strong style={{ color: '#1f2937' }}>Sensor:</strong> Real-time data collection</div>
            <div><strong style={{ color: '#1f2937' }}>Skill:</strong> Specialized capabilities</div>
            <div><strong style={{ color: '#1f2937' }}>Decision:</strong> Conditional logic routing</div>
            <div><strong style={{ color: '#1f2937' }}>Input/Output:</strong> Flow entry/exit points</div>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#1f2937', marginBottom: '6px' }}>Label</label>
          <input
            type="text"
            value={node.label}
            onChange={(e) => handleNodeUpdate({ label: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#ffffff',
              outline: 'none',
              transition: 'all 0.2s',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#1f2937', marginBottom: '6px' }}>Description</label>
          <textarea
            value={node.description}
            onChange={(e) => handleNodeUpdate({ description: e.target.value })}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '13px',
              background: '#ffffff',
              outline: 'none',
              resize: 'vertical',
              minHeight: '60px',
              transition: 'all 0.2s',
              fontFamily: 'inherit',
              lineHeight: '1.4',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              boxSizing: 'border-box'
            }}
            placeholder="Optional description..."
            onFocus={(e) => {
              e.target.style.borderColor = '#9ca3af';
              e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#1f2937', marginBottom: '6px' }}>Background Color</label>
          <input
            type="color"
            value={node.color.replace('20', '')}
            onChange={(e) => handleNodeUpdate({ color: e.target.value + '20' })}
            style={{
              width: '100%',
              height: '32px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#1f2937', marginBottom: '6px' }}>Border Color</label>
          <input
            type="color"
            value={node.borderColor}
            onChange={(e) => handleNodeUpdate({ borderColor: e.target.value })}
            style={{
              width: '100%',
              height: '32px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              cursor: 'pointer',
              background: '#ffffff',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          />
        </div>

        {activeTab === 'config' && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: '500', marginBottom: '12px', color: '#1f2937' }}>
              {config.title}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {config.fields.map((field) => {
                const value = node.config?.[field.key] || '';
                
                const inputBaseStyles = {
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '13px',
                  background: '#ffffff',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box' as const
                };

                const inputFocusHandlers = {
                  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                    e.target.style.borderColor = '#9ca3af';
                    e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
                  },
                  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
                  }
                };
                
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
                        style={inputBaseStyles}
                        {...inputFocusHandlers}
                      />
                    )}
                    
                    {field.type === 'number' && (
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleNodeUpdate({
                          config: { ...node.config, [field.key]: parseInt(e.target.value) || 0 }
                        })}
                        style={inputBaseStyles}
                        {...inputFocusHandlers}
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
                        style={{
                          ...inputBaseStyles,
                          cursor: 'pointer',
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                          backgroundPosition: 'right 12px center',
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: '16px',
                          paddingRight: '40px'
                        }}
                        {...inputFocusHandlers}
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
                        style={{
                          ...inputBaseStyles,
                          minHeight: '60px',
                          resize: 'vertical',
                          lineHeight: '1.4'
                        }}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        {...inputFocusHandlers}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#1f2937', marginBottom: '6px' }}>
          Label
        </label>
        <input
          type="text"
          value={connection.label || ''}
          onChange={(e) => handleConnectionUpdate({ label: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '13px',
            background: '#ffffff',
            outline: 'none',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            boxSizing: 'border-box'
          }}
          placeholder="Optional connection label"
          onFocus={(e) => {
            e.target.style.borderColor = '#9ca3af';
            e.target.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.08)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e5e7eb';
            e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#1f2937', marginBottom: '6px' }}>
          Color
        </label>
        <input
          type="color"
          value={connection.color}
          onChange={(e) => handleConnectionUpdate({ color: e.target.value })}
          style={{
            width: '100%',
            height: '32px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '12px', fontWeight: '400', color: '#1f2937', marginBottom: '6px' }}>
          Width
        </label>
        <input
          type="range"
          min="1"
          max="5"
          value={connection.width}
          onChange={(e) => handleConnectionUpdate({ width: parseInt(e.target.value) })}
          style={{
            width: '100%',
            height: '4px',
            borderRadius: '2px',
            background: '#e5e7eb',
            outline: 'none',
            cursor: 'pointer'
          }}
        />
        <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', display: 'block' }}>
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
          <div style={{ display: 'flex', marginBottom: '12px', borderBottom: '1px solid #f3f4f6' }}>
            <button
              onClick={() => setActiveTab('properties')}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '400',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'properties' ? '#1f2937' : '#9ca3af',
                borderBottom: activeTab === 'properties' ? '2px solid #000000' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Properties
            </button>
            <button
              onClick={() => setActiveTab('config')}
              style={{
                padding: '8px 12px',
                fontSize: '13px',
                fontWeight: '400',
                border: 'none',
                background: 'transparent',
                color: activeTab === 'config' ? '#1f2937' : '#9ca3af',
                borderBottom: activeTab === 'config' ? '2px solid #000000' : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Configuration
            </button>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <span style={{
              display: 'inline-block',
              padding: '4px 8px',
              background: '#f3f4f6',
              color: '#1f2937',
              fontSize: '11px',
              fontWeight: '500',
              borderRadius: '4px',
              letterSpacing: '0.05em'
            }}>
              {selectedNode.type.toUpperCase()}
            </span>
          </div>

          {renderNodeProperties(selectedNode)}
          
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #f3f4f6' }}>
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#000000',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '400',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = '#374151';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = '#000000';
              }}
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