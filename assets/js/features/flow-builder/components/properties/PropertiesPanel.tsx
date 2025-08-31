import React, { useState, Fragment } from 'react';
import { HelpCircle, Keyboard } from 'lucide-react';
import { AIFlowNode, AIFlowConnection } from '../../types';
import { ColorPicker } from './ColorPicker';
import { CustomSelect } from './CustomSelect';

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
          <h4 className='properties-panel__help-title'>
            <HelpCircle size={14} />
            Quick Guide
          </h4>
          <div className='properties-panel__help-list'>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Add Nodes:</span>
              <span>Click or drag from palette</span>
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Connect:</span>
              <span>Drag from node handle to another</span>
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Select:</span>
              <span>Click node to view properties</span>
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Resize:</span>
              <span>Drag corners when selected</span>
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Navigate:</span>
              <span>Scroll to pan, Cmd+Scroll to zoom</span>
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Box Select:</span>
              <span>Drag on empty space to select multiple</span>
            </div>
            <div className='properties-panel__help-item'>
              <span className='properties-panel__help-label'>Minimap:</span>
              <span>Use overview map (bottom-right) to navigate</span>
            </div>
          </div>
        </div>

        <div className='properties-panel__help'>
          <h4 className='properties-panel__help-title'>
            <Keyboard size={14} />
            Keyboard Shortcuts
          </h4>
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
            <div className='properties-panel__shortcut'>
              <kbd className='properties-panel__kbd'>Ctrl+L</kbd>
              <span>or</span>
              <kbd className='properties-panel__kbd'>⌘+L</kbd>
              <span>Lock/unlock canvas</span>
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
                style={{
                  textAlign: 'left',
                  padding: '10px 36px 10px 12px',
                  cursor: 'pointer',
                }}
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
                        {String(s.config.skill_type)}
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
                        {String(s.config.endpoint)}
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
                options: ['gpt-4o', 'gpt-4', 'claude-3.5-sonnet', 'claude-3-opus', 'llama-3.1'],
              },
              {
                key: 'provider',
                label: 'Provider',
                type: 'select',
                options: ['openai', 'anthropic', 'ollama', 'custom'],
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
              {
                key: 'reasoning_mode',
                label: 'Reasoning Mode',
                type: 'select',
                options: ['chain_of_thought', 'tree_of_thoughts', 'react', 'simple'],
              },
              { key: 'max_retries', label: 'Max Retries', type: 'number' },
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
                options: ['webhook', 'polling', 'pubsub', 'file', 'database'],
              },
              { key: 'endpoint', label: 'Endpoint/Path', type: 'text' },
              {
                key: 'polling_interval',
                label: 'Polling Interval (ms)',
                type: 'number',
              },
              {
                key: 'output_format',
                label: 'Output Format',
                type: 'select',
                options: ['json', 'xml', 'text', 'csv'],
              },
              { key: 'filters', label: 'Data Filters', type: 'textarea' },
              { key: 'max_queue_size', label: 'Max Queue Size', type: 'number' },
            ],
          };
        case 'skill':
          return {
            title: 'Skill Configuration',
            fields: [
              { key: 'skill_name', label: 'Skill Name', type: 'text' },
              {
                key: 'function_code',
                label: 'Function Code',
                type: 'textarea',
              },
              { key: 'input_schema', label: 'Input Schema (JSON)', type: 'textarea' },
              { key: 'output_schema', label: 'Output Schema (JSON)', type: 'textarea' },
              { key: 'timeout', label: 'Timeout (ms)', type: 'number' },
              { key: 'retry_count', label: 'Retry Count', type: 'number' },
              {
                key: 'error_handling',
                label: 'Error Handling',
                type: 'select',
                options: ['throw', 'return_null', 'continue', 'retry'],
              },
            ],
          };
        case 'memory':
          return {
            title: 'Memory Configuration',
            fields: [
              {
                key: 'memory_type',
                label: 'Memory Type',
                type: 'select',
                options: ['vector_store', 'key_value', 'conversation', 'session'],
              },
              {
                key: 'storage_backend',
                label: 'Storage Backend',
                type: 'select',
                options: ['local', 'redis', 'postgres', 'pinecone', 'chroma'],
              },
              { key: 'max_entries', label: 'Max Entries', type: 'number' },
              {
                key: 'embedding_model',
                label: 'Embedding Model',
                type: 'select',
                options: [
                  'text-embedding-3-small',
                  'text-embedding-3-large',
                  'sentence-transformers',
                ],
              },
              {
                key: 'similarity_threshold',
                label: 'Similarity Threshold',
                type: 'range',
                min: 0,
                max: 1,
                step: 0.1,
              },
              { key: 'index_fields', label: 'Index Fields (JSON)', type: 'textarea' },
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
              { key: 'condition_expression', label: 'Condition Expression', type: 'textarea' },
              { key: 'branches', label: 'Branches (JSON)', type: 'textarea' },
              { key: 'default_branch', label: 'Default Branch', type: 'text' },
            ],
          };
        case 'loop':
          return {
            title: 'Loop Configuration',
            fields: [
              {
                key: 'loop_type',
                label: 'Loop Type',
                type: 'select',
                options: ['for_each', 'while', 'until', 'times'],
              },
              { key: 'iterate_over', label: 'Iterate Over', type: 'text' },
              { key: 'max_iterations', label: 'Max Iterations', type: 'number' },
              { key: 'break_condition', label: 'Break Condition', type: 'text' },
              { key: 'batch_size', label: 'Batch Size', type: 'number' },
              {
                key: 'error_handling',
                label: 'Error Handling',
                type: 'select',
                options: ['continue', 'break', 'throw'],
              },
            ],
          };
        case 'transform':
          return {
            title: 'Transform Configuration',
            fields: [
              {
                key: 'transform_type',
                label: 'Transform Type',
                type: 'select',
                options: ['jq', 'javascript', 'jsonpath', 'template'],
              },
              { key: 'transformation', label: 'Transformation', type: 'textarea' },
              {
                key: 'input_format',
                label: 'Input Format',
                type: 'select',
                options: ['json', 'xml', 'csv', 'text'],
              },
              {
                key: 'output_format',
                label: 'Output Format',
                type: 'select',
                options: ['json', 'xml', 'csv', 'text'],
              },
              { key: 'validation_schema', label: 'Validation Schema (JSON)', type: 'textarea' },
            ],
          };
        case 'input':
          return {
            title: 'Input Configuration',
            fields: [
              {
                key: 'input_type',
                label: 'Input Type',
                type: 'select',
                options: ['form', 'text', 'file', 'json'],
              },
              { key: 'fields', label: 'Form Fields (JSON)', type: 'textarea' },
              { key: 'validation_rules', label: 'Validation Rules (JSON)', type: 'textarea' },
              { key: 'default_values', label: 'Default Values (JSON)', type: 'textarea' },
            ],
          };
        case 'output':
          return {
            title: 'Output Configuration',
            fields: [
              {
                key: 'output_type',
                label: 'Output Type',
                type: 'select',
                options: ['structured', 'text', 'file', 'stream'],
              },
              { key: 'format_template', label: 'Format Template', type: 'textarea' },
              { key: 'destinations', label: 'Destinations (JSON)', type: 'textarea' },
              { key: 'file_path', label: 'File Path', type: 'text' },
              { key: 'webhook_url', label: 'Webhook URL', type: 'text' },
            ],
          };
        case 'api':
          return {
            title: 'API Configuration',
            fields: [
              {
                key: 'method',
                label: 'HTTP Method',
                type: 'select',
                options: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
              },
              { key: 'base_url', label: 'Base URL', type: 'text' },
              { key: 'path', label: 'Path', type: 'text' },
              { key: 'params', label: 'Query Parameters (JSON)', type: 'textarea' },
              { key: 'headers', label: 'Headers (JSON)', type: 'textarea' },
              { key: 'body', label: 'Request Body', type: 'textarea' },
              {
                key: 'auth_type',
                label: 'Auth Type',
                type: 'select',
                options: ['none', 'bearer', 'api_key', 'basic'],
              },
              { key: 'api_key', label: 'API Key', type: 'text' },
              { key: 'timeout', label: 'Timeout (ms)', type: 'number' },
              { key: 'retry_attempts', label: 'Retry Attempts', type: 'number' },
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
        {activeTab === 'properties' && (
          <>
            <div className='properties-panel__section'>
              <div className='properties-panel__section-title'>Basic Properties</div>
              <div className='properties-panel__section-fields'>
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
              </div>
            </div>

            <div className='properties-panel__section'>
              <div className='properties-panel__section-title'>Appearance</div>
              <div className='properties-panel__section-fields'>
                <ColorPicker
                  label='Background Color'
                  value={node.color.length === 9 ? node.color.slice(0, 7) : node.color}
                  onChange={color => handleNodeUpdate({ color: color })}
                  showAlpha={true}
                />

                <ColorPicker
                  label='Border Color'
                  value={node.borderColor}
                  onChange={color => handleNodeUpdate({ borderColor: color })}
                />
              </div>
            </div>

            {renderLinkedSkillsForAgent(node)}
          </>
        )}

        {activeTab === 'config' && (
          <div className='properties-panel__config-section'>
            <div className='properties-panel__config-title'>{config.title}</div>
            <div className='properties-panel__section-fields'>
              {config.fields.map(field => {
                const rawValue = node.config?.[field.key];
                const value = rawValue !== undefined ? String(rawValue) : '';

                return (
                  <div key={field.key} className='properties-panel__field'>
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
                      <div className='properties-panel__number-input'>
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
                        <div className='properties-panel__number-controls'>
                          <button
                            type='button'
                            className='properties-panel__number-btn'
                            onClick={() =>
                              handleNodeUpdate({
                                config: {
                                  ...node.config,
                                  [field.key]:
                                    (parseInt(String(node.config?.[field.key] || '0')) || 0) + 1,
                                },
                              })
                            }
                          >
                            +
                          </button>
                          <button
                            type='button'
                            className='properties-panel__number-btn'
                            onClick={() =>
                              handleNodeUpdate({
                                config: {
                                  ...node.config,
                                  [field.key]: Math.max(
                                    0,
                                    (parseInt(String(node.config?.[field.key] || '0')) || 0) - 1
                                  ),
                                },
                              })
                            }
                          >
                            −
                          </button>
                        </div>
                      </div>
                    )}

                    {field.type === 'range' && (
                      <div>
                        <input
                          type='range'
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          value={rawValue !== undefined ? String(rawValue) : String(field.min)}
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
                        <span className='properties-panel__range-value'>
                          {rawValue !== undefined ? String(rawValue) : String(field.min)}
                        </span>
                      </div>
                    )}

                    {field.type === 'select' && (
                      <CustomSelect
                        value={value}
                        onChange={newValue =>
                          handleNodeUpdate({
                            config: {
                              ...node.config,
                              [field.key]: newValue,
                            },
                          })
                        }
                        options={field.options || []}
                        placeholder='Select...'
                      />
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

      <ColorPicker
        label='Color'
        value={connection.color}
        onChange={color => handleConnectionUpdate({ color: color })}
      />

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
