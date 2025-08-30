import React, { useState, Fragment } from 'react';
import { AIFlowNode, AIFlowConnection } from '../../types';

interface PropertiesPanelProps {
  selectedNode: AIFlowNode | null;
  selectedConnection: AIFlowConnection | null;
  onUpdateNode: (_id: string, _updates: Partial<AIFlowNode>) => void;
  onUpdateConnection: (_id: string, _updates: Partial<AIFlowConnection>) => void;
  onDeleteNode: (_id: string) => void;
  allNodes?: AIFlowNode[];
  allEdges?: { source: string; target: string }[];
  onOpenNodeModal?: (_nodeId: string) => void;
  onUnlinkEdge?: (_sourceId: string, _targetId: string) => void;
}

export function PropertiesPanel({
  selectedNode,
  selectedConnection,
  onUpdateNode,
  onUpdateConnection,
  onDeleteNode,
  allNodes = [],
  allEdges = [],
  onOpenNodeModal,
  onUnlinkEdge,
}: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<'properties' | 'config'>('properties');

  if (!selectedNode && !selectedConnection) {
    return (
      <div className='properties-panel__empty'>
        <h3 className='properties-panel__empty-title'>Properties</h3>
        <div className='properties-panel__empty-text'>
          Select a node or connection to edit its properties.
        </div>

        <div className='properties-panel__help'>
          <h4 className='properties-panel__help-title'>Node Types</h4>
          <div className='properties-panel__help-list'>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Agent:</span> Core AI reasoning unit
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Sensor:</span> Real-time data
              collection
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Skill:</span> Specialized capabilities
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Decision:</span> Conditional logic
              routing
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Input/Output:</span> Flow entry/exit
              points
            </div>
          </div>
        </div>

        <div className='properties-panel__help'>
          <h4 className='properties-panel__help-title'>Quick Guide</h4>
          <div className='properties-panel__help-list'>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Add Nodes:</span> Click or drag from
              palette
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Connect:</span> Drag from node handle
              to another
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Select:</span> Click node to view
              properties
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Resize:</span> Drag corners when
              selected
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Navigate:</span> Scroll to pan,
              Cmd+Scroll to zoom
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Box Select:</span> Drag on empty space
              to select multiple
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Minimap:</span> Use overview map
              (bottom-right) to navigate
            </div>
          </div>
        </div>

        <div className='properties-panel__help'>
          <h4 className='properties-panel__help-title'>Keyboard Shortcuts</h4>
          <div className='properties-panel__shortcuts-list'>
            <div className='properties-panel__shortcut'>
              <kbd className='properties-panel__kbd'>Ctrl+D</kbd>
              <span>or</span>
              <kbd className='properties-panel__kbd'>⌘+D</kbd>
              <span>Duplicate node</span>
            </div>
            <div className='properties-panel__shortcut'>
              <kbd className='properties-panel__kbd'>Del</kbd>
              <span>Delete selected node</span>
            </div>
            <div className='properties-panel__shortcut'>
              <kbd className='properties-panel__kbd'>Ctrl+Scroll</kbd>
              <span>or</span>
              <kbd className='properties-panel__kbd'>⌘+Scroll</kbd>
              <span>Zoom</span>
            </div>
            <div className='properties-panel__shortcut'>
              <kbd className='properties-panel__kbd'>Scroll</kbd>
              <span>Pan canvas</span>
            </div>
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

  const renderLinkedSkillsForAgent = (node: AIFlowNode) => {
    if (node.type !== 'agent') return null;
    // find edges from this agent to skills
    const skillIds = new Set(allEdges.filter(e => e.source === node.id).map(e => e.target));
    const skills = allNodes.filter(n => skillIds.has(n.id) && n.type === 'skill');
    if (skills.length === 0) return null;
    return (
      <div className='properties-panel__help' style={{ marginTop: 12 }}>
        <h4 className='properties-panel__help-title'>Linked Skills</h4>
        <div
          className='properties-panel__help-list'
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}
        >
          {skills.map(s => (
            <div key={s.id} style={{ position: 'relative' }}>
              <button
                onClick={() => onOpenNodeModal && onOpenNodeModal(s.id)}
                className='properties-panel__input properties-panel__skill-card'
                style={{ textAlign: 'left', padding: '10px 36px 10px 12px', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 13, color: 'inherit', marginBottom: 2 }}>{s.label}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--flow-builder-text-secondary)',
                    marginBottom: 2,
                  }}
                >
                  {s.description || 'Skill'}
                </div>
                {(s.config?.skill_type || s.config?.endpoint) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {s.config?.skill_type && (
                      <span
                        className='properties-panel__badge'
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          border: '1px solid var(--flow-builder-border)',
                          borderRadius: 9999,
                        }}
                      >
                        {s.config.skill_type}
                      </span>
                    )}
                    {s.config?.endpoint && (
                      <span
                        className='properties-panel__badge'
                        style={{
                          fontSize: 10,
                          padding: '2px 6px',
                          border: '1px solid var(--flow-builder-border)',
                          borderRadius: 9999,
                        }}
                      >
                        {s.config.endpoint}
                      </span>
                    )}
                  </div>
                )}
              </button>
              {/* Unlink (X) button */}
              <button
                aria-label='Unlink skill'
                onClick={e => {
                  e.stopPropagation();
                  if (onUnlinkEdge) onUnlinkEdge(node.id, s.id);
                }}
                className='properties-panel__unlink'
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: '1px solid var(--flow-builder-border)',
                  background: 'var(--flow-builder-button-bg)',
                  color: 'var(--flow-builder-button-text)',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderNodeProperties = (node: AIFlowNode) => {
    const getNodeTypeConfig = (type: AIFlowNode['type']) => {
      switch (type) {
        case 'agent':
          return {
            title: 'AI Agent Configuration',
            fields: [
              {
                key: 'model',
                label: 'AI Model',
                type: 'select',
                options: ['gpt-4', 'claude-3', 'llama-2'],
              },
              {
                key: 'temperature',
                label: 'Temperature',
                type: 'range',
                min: 0,
                max: 1,
                step: 0.1,
              },
              { key: 'max_tokens', label: 'Max Tokens', type: 'number' },
              {
                key: 'system_prompt',
                label: 'System Prompt',
                type: 'textarea',
              },
              { key: 'skills', label: 'Available Skills', type: 'multiselect' },
            ],
          };
        case 'sensor':
          return {
            title: 'Sensor Configuration',
            fields: [
              {
                key: 'source_type',
                label: 'Source Type',
                type: 'select',
                options: ['webhook', 'polling', 'pubsub', 'file'],
              },
              { key: 'endpoint', label: 'Endpoint/Path', type: 'text' },
              {
                key: 'interval',
                label: 'Polling Interval (seconds)',
                type: 'number',
              },
              { key: 'filters', label: 'Data Filters', type: 'textarea' },
            ],
          };
        case 'skill':
          return {
            title: 'Skill Configuration',
            fields: [
              {
                key: 'skill_type',
                label: 'Skill Type',
                type: 'select',
                options: ['api_call', 'data_transform', 'file_operation', 'custom'],
              },
              { key: 'endpoint', label: 'API Endpoint', type: 'text' },
              {
                key: 'method',
                label: 'HTTP Method',
                type: 'select',
                options: ['GET', 'POST', 'PUT', 'DELETE'],
              },
              { key: 'parameters', label: 'Parameters', type: 'textarea' },
            ],
          };
        case 'decision':
          return {
            title: 'Decision Logic',
            fields: [
              {
                key: 'condition_type',
                label: 'Condition Type',
                type: 'select',
                options: ['javascript', 'jq', 'simple'],
              },
              { key: 'condition', label: 'Condition', type: 'textarea' },
              { key: 'true_path', label: 'True Path', type: 'text' },
              { key: 'false_path', label: 'False Path', type: 'text' },
            ],
          };
        default:
          return {
            title: 'Basic Configuration',
            fields: [
              {
                key: 'data_format',
                label: 'Data Format',
                type: 'select',
                options: ['json', 'text', 'binary'],
              },
            ],
          };
      }
    };

    const config = getNodeTypeConfig(node.type);

    return (
      <div className='properties-panel__fields'>
        <div className='properties-panel__field'>
          <label className='properties-panel__label'>Label</label>
          <input
            type='text'
            value={node.label}
            onChange={e => handleNodeUpdate({ label: e.target.value })}
            className='properties-panel__input'
          />
        </div>

        <div className='properties-panel__field'>
          <label className='properties-panel__label'>Description</label>
          <textarea
            value={node.description}
            onChange={e => handleNodeUpdate({ description: e.target.value })}
            className='properties-panel__input properties-panel__textarea'
            placeholder='Optional description...'
          />
        </div>

        <div className='properties-panel__field'>
          <label className='properties-panel__label'>Background Color</label>
          <input
            type='color'
            value={node.color.replace('20', '')}
            onChange={e => handleNodeUpdate({ color: e.target.value + '20' })}
            className='properties-panel__input properties-panel__color-input'
          />
        </div>

        <div className='properties-panel__field'>
          <label className='properties-panel__label'>Border Color</label>
          <input
            type='color'
            value={node.borderColor}
            onChange={e => handleNodeUpdate({ borderColor: e.target.value })}
            className='properties-panel__input properties-panel__color-input'
          />
        </div>

        {renderLinkedSkillsForAgent(node)}

        {activeTab === 'config' && (
          <div className='properties-panel__config-section'>
            <h4 className='properties-panel__config-title'>{config.title}</h4>
            <div className='properties-panel__fields'>
              {config.fields.map(field => {
                const value = node.config?.[field.key] || '';

                return (
                  <div key={field.key}>
                    <label className='properties-panel__label'>{field.label}</label>

                    {field.type === 'text' && (
                      <input
                        type='text'
                        value={value}
                        onChange={e =>
                          handleNodeUpdate({
                            config: {
                              ...node.config,
                              [field.key]: e.target.value,
                            },
                          })
                        }
                        className='properties-panel__input'
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type='number'
                        value={value}
                        onChange={e =>
                          handleNodeUpdate({
                            config: {
                              ...node.config,
                              [field.key]: parseInt(e.target.value) || 0,
                            },
                          })
                        }
                        className='properties-panel__input'
                      />
                    )}

                    {field.type === 'range' && (
                      <div>
                        <input
                          type='range'
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={value || field.min}
                          onChange={e =>
                            handleNodeUpdate({
                              config: {
                                ...node.config,
                                [field.key]: parseFloat(e.target.value),
                              },
                            })
                          }
                          className='properties-panel__range'
                        />
                        <span className='properties-panel__range-value'>{value || field.min}</span>
                      </div>
                    )}

                    {field.type === 'select' && (
                      <select
                        value={value}
                        onChange={e =>
                          handleNodeUpdate({
                            config: {
                              ...node.config,
                              [field.key]: e.target.value,
                            },
                          })
                        }
                        className='properties-panel__input properties-panel__select'
                      >
                        <option value=''>Select...</option>
                        {field.options?.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        value={value}
                        onChange={e =>
                          handleNodeUpdate({
                            config: {
                              ...node.config,
                              [field.key]: e.target.value,
                            },
                          })
                        }
                        className='properties-panel__input properties-panel__textarea'
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
    <div className='properties-panel__fields'>
      <div className='properties-panel__field'>
        <label className='properties-panel__label'>Label</label>
        <input
          type='text'
          value={connection.label || ''}
          onChange={e => handleConnectionUpdate({ label: e.target.value })}
          className='properties-panel__input'
          placeholder='Optional connection label'
        />
      </div>

      <div className='properties-panel__field'>
        <label className='properties-panel__label'>Color</label>
        <input
          type='color'
          value={connection.color}
          onChange={e => handleConnectionUpdate({ color: e.target.value })}
          className='properties-panel__input properties-panel__color-input'
        />
      </div>

      <div className='properties-panel__field'>
        <label className='properties-panel__label'>Width</label>
        <input
          type='range'
          min='1'
          max='5'
          value={connection.width}
          onChange={e => handleConnectionUpdate({ width: parseInt(e.target.value) })}
          className='properties-panel__range'
        />
        <span className='properties-panel__range-value'>{connection.width}px</span>
      </div>
    </div>
  );

  return (
    <div className='properties-panel__content'>
      <h3 className='properties-panel__title'>Properties</h3>

      {selectedNode && (
        <Fragment>
          <div className='properties-panel__tabs'>
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
            <span className='properties-panel__node-type'>{selectedNode.type.toUpperCase()}</span>
          </div>

          {renderNodeProperties(selectedNode)}

          <div className='properties-panel__delete-section'>
            <button
              onClick={() => onDeleteNode(selectedNode.id)}
              className='properties-panel__delete-btn'
            >
              Delete Node
            </button>
          </div>
        </Fragment>
      )}

      {selectedConnection && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <span className='properties-panel__node-type'>CONNECTION</span>
          </div>
          {renderConnectionProperties(selectedConnection)}
        </div>
      )}
    </div>
  );
}
