import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Plus,
  FolderOpen,
  Clock,
  Settings,
  Search,
  Filter,
  Edit,
  Copy,
  Trash2,
} from 'lucide-react';
import { ThemeToggle } from '../flow-builder/components/ThemeToggle';
import { flowStorage } from '../../shared/services/flowStorage';
import { FlowRegistryEntry } from '../../shared/types/flow';

export const HomePage: React.FC = () => {
  const [flows, setFlows] = useState<FlowRegistryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Load flows on component mount
  useEffect(() => {
    loadFlows();
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.home-workflow-card__menu-container')) {
        document.querySelectorAll('.home-workflow-card__dropdown.show').forEach(dropdown => {
          dropdown.classList.remove('show');
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadFlows = () => {
    const registry = flowStorage.getFlowRegistry();
    setFlows(registry.flows);
  };

  const handleCreateWorkflow = () => {
    const newFlow = flowStorage.createFlow();
    window.location.href = `/flow/${newFlow.id}`;
  };

  const handleEditTitle = (flow: FlowRegistryEntry) => {
    setEditingFlowId(flow.id);
    setEditingTitle(flow.title);
  };

  const handleSaveTitle = () => {
    if (editingFlowId && editingTitle.trim()) {
      flowStorage.updateFlowTitle(editingFlowId, editingTitle.trim());
      loadFlows();
    }
    setEditingFlowId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingFlowId(null);
    setEditingTitle('');
  };

  const handleDuplicateFlow = (flowId: string) => {
    try {
      flowStorage.duplicateFlow(flowId);
      loadFlows();
      // Optionally navigate to the duplicated flow
      // window.location.href = `/flow/${duplicatedFlow.id}`;
    } catch (error) {
      console.error('Failed to duplicate flow:', error);
      window.alert('Failed to duplicate flow. Please try again.');
    }
  };

  const handleDeleteFlow = (flowId: string) => {
    flowStorage.deleteFlow(flowId);
    loadFlows();
    setShowDeleteConfirm(null);
  };

  const handleOpenFlow = (flowId: string) => {
    window.location.href = `/flow/${flowId}`;
  };

  // Filter flows based on search query
  const filteredFlows = flows.filter(flow =>
    flow.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 7) return `${days} days ago`;
    if (days < 14) return '1 week ago';
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className='home-page'>
      {/* Header with Logo and Navigation */}
      <div className='home-header'>
        <div className='home-header__content'>
          <div className='home-header__brand'>
            <Cpu className='home-header__logo' />
            <h1 className='home-header__title'>Helix</h1>
            <span className='home-header__subtitle'>AI Flow Builder</span>
          </div>

          <div className='home-header__actions'>
            <button onClick={handleCreateWorkflow} className='home-header__create-btn'>
              <Plus className='home-header__create-icon' />
              New Flow
            </button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className='home-main'>
        <div className='home-main__content'>
          {/* Quick Actions */}
          <div className='home-quick-actions'>
            <button onClick={handleCreateWorkflow} className='home-quick-action'>
              <Plus className='home-quick-action__icon' />
              <div className='home-quick-action__content'>
                <h3 className='home-quick-action__title'>Create New Flow</h3>
                <p className='home-quick-action__desc'>Start building a new workflow diagram</p>
              </div>
            </button>

            <div className='home-quick-action'>
              <FolderOpen className='home-quick-action__icon' />
              <div className='home-quick-action__content'>
                <h3 className='home-quick-action__title'>Browse Templates</h3>
                <p className='home-quick-action__desc'>Choose from pre-built workflow templates</p>
              </div>
            </div>
          </div>

          {/* Workflow Management Section */}
          <div className='home-workflows'>
            <div className='home-workflows__header'>
              <div className='home-workflows__title-section'>
                <h2 className='home-workflows__title'>My Workflows</h2>
                <span className='home-workflows__count'>{flows.length} flows</span>
              </div>

              <div className='home-workflows__controls'>
                <div className='home-workflows__search'>
                  <Search className='home-workflows__search-icon' />
                  <input
                    type='text'
                    placeholder='Search workflows...'
                    className='home-workflows__search-input'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                <button className='home-workflows__filter-btn'>
                  <Filter className='home-workflows__filter-icon' />
                  Filter
                </button>
              </div>
            </div>

            <div className='home-workflows__grid'>
              {filteredFlows.map(flow => (
                <div key={flow.id} className='home-workflow-card'>
                  <div className='home-workflow-card__header'>
                    <div
                      className='home-workflow-card__info'
                      onClick={() => handleOpenFlow(flow.id)}
                    >
                      {editingFlowId === flow.id ? (
                        <div className='home-workflow-card__title-edit'>
                          <input
                            type='text'
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveTitle();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className='home-workflow-card__title-input'
                            autoFocus
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                      ) : (
                        <h3 className='home-workflow-card__title'>{flow.title}</h3>
                      )}
                      <div className='home-workflow-card__meta'>
                        <Clock className='home-workflow-card__meta-icon' />
                        <span>{formatDate(flow.lastModified)}</span>
                      </div>
                    </div>
                    <div className='home-workflow-card__menu-container'>
                      <button
                        className='home-workflow-card__gear'
                        type='button'
                        aria-label='Flow options'
                        onClick={e => {
                          e.stopPropagation();
                          const dropdown = e.currentTarget.nextElementSibling as HTMLElement;
                          // Close other dropdowns
                          document
                            .querySelectorAll('.home-workflow-card__dropdown.show')
                            .forEach(d => {
                              if (d !== dropdown) d.classList.remove('show');
                            });
                          dropdown.classList.toggle('show');
                        }}
                      >
                        <Settings className='home-workflow-card__gear-icon' />
                      </button>
                      <div className='home-workflow-card__dropdown'>
                        <button
                          className='home-workflow-card__dropdown-item'
                          onClick={e => {
                            e.stopPropagation();
                            handleEditTitle(flow);
                            e.currentTarget.parentElement?.classList.remove('show');
                          }}
                        >
                          <Edit size={16} />
                          Rename
                        </button>
                        <button
                          className='home-workflow-card__dropdown-item'
                          onClick={e => {
                            e.stopPropagation();
                            handleDuplicateFlow(flow.id);
                            e.currentTarget.parentElement?.classList.remove('show');
                          }}
                        >
                          <Copy size={16} />
                          Duplicate
                        </button>
                        <button
                          className='home-workflow-card__dropdown-item home-workflow-card__dropdown-item--danger'
                          onClick={e => {
                            e.stopPropagation();
                            setShowDeleteConfirm(flow.id);
                            e.currentTarget.parentElement?.classList.remove('show');
                          }}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className='home-workflow-card__body' onClick={() => handleOpenFlow(flow.id)}>
                    <p className='home-workflow-card__description'>
                      AI workflow with {flow.nodeCount || 0} nodes and {flow.connectionCount || 0}{' '}
                      connections
                    </p>

                    <div className='home-workflow-card__footer'>
                      <div className='home-workflow-card__stats'>
                        <span className='home-workflow-card__stat'>
                          {flow.nodeCount || 0} nodes
                        </span>
                        <span className='home-workflow-card__stat'>
                          {flow.connectionCount || 0} connections
                        </span>
                        <span className='home-workflow-card__stat'>Active</span>
                      </div>
                      <div className='home-workflow-card__status home-workflow-card__status--active'></div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Create New Flow Card */}
              <div className='home-empty-card' onClick={handleCreateWorkflow}>
                <Plus className='home-empty-card__icon' />
                <h3 className='home-empty-card__title'>Create New Workflow</h3>
                <p className='home-empty-card__text'>
                  Design a new flow diagram to automate your processes
                </p>
              </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
              <div className='home-modal-backdrop' onClick={() => setShowDeleteConfirm(null)}>
                <div className='home-modal' onClick={e => e.stopPropagation()}>
                  <div className='home-modal__header'>
                    <h3 className='home-modal__title'>Delete Workflow</h3>
                    <button
                      className='home-modal__close'
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      ×
                    </button>
                  </div>
                  <div className='home-modal__body'>
                    <p>
                      Are you sure you want to delete this workflow? This action cannot be undone.
                    </p>
                  </div>
                  <div className='home-modal__footer'>
                    <button
                      className='home-modal__button home-modal__button--secondary'
                      onClick={() => setShowDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className='home-modal__button home-modal__button--danger'
                      onClick={() => handleDeleteFlow(showDeleteConfirm)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
