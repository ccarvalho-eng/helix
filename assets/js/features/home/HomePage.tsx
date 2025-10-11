import { useState, useEffect } from 'react';
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
  LogOut,
} from 'lucide-react';
import { ThemeToggle } from '../flow-builder/components/ThemeToggle';
import { useAuth } from '../../shared/contexts/AuthContext';
import { ProtectedRoute } from '../../shared/components/ProtectedRoute';
import { FlowRegistryEntry } from '../../shared/types/flow';
import { websocketService } from '../../shared/services/websocketService';
import {
  useMyFlowsQuery,
  useCreateFlowMutation,
  useUpdateFlowMutation,
  useDeleteFlowMutation,
  useDuplicateFlowMutation,
} from '../../generated/graphql';

// Extend Window interface to include topbar
declare global {
  interface Window {
    topbar?: {
      show: () => void;
      hide: () => void;
    };
  }
}

export function HomePage() {
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // GraphQL hooks
  const { data: flowsData, loading: loadingFlows, refetch: refetchFlows } = useMyFlowsQuery();
  const [createFlowMutation] = useCreateFlowMutation();
  const [updateFlowMutation] = useUpdateFlowMutation();
  const [deleteFlowMutation] = useDeleteFlowMutation();
  const [duplicateFlowMutation] = useDuplicateFlowMutation();

  // Transform GraphQL data to FlowRegistryEntry format
  const flows: FlowRegistryEntry[] =
    flowsData?.myFlows?.map((flow: any) => ({
      id: flow.id,
      title: flow.title,
      lastModified: flow.updatedAt,
      createdAt: flow.insertedAt,
      nodeCount: 0, // We don't have node count in the list query, can add if needed
      connectionCount: 0,
    })) || [];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  // Initialize websocket connection on mount
  useEffect(() => {
    if (!websocketService.isConnected()) {
      websocketService.connect();
    }
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

  const handleCreateWorkflow = async () => {
    try {
      const result = await createFlowMutation({
        variables: {
          input: {
            title: 'Untitled Flow',
            viewportX: 0,
            viewportY: 0,
            viewportZoom: 1,
          },
        },
      });

      if (result.data?.createFlow) {
        window.location.href = `/flow/${result.data.createFlow.id}`;
      }
    } catch (error) {
      console.error('Failed to create flow:', error);
      window.alert('Failed to create flow. Please try again.');
    }
  };

  const handleBrowseTemplates = async () => {
    try {
      const result = await createFlowMutation({
        variables: {
          input: {
            title: 'Untitled Flow',
            viewportX: 0,
            viewportY: 0,
            viewportZoom: 1,
          },
        },
      });

      if (result.data?.createFlow) {
        window.location.href = `/flow/${result.data.createFlow.id}?templates=true`;
      }
    } catch (error) {
      console.error('Failed to create flow:', error);
      window.alert('Failed to create flow. Please try again.');
    }
  };

  const handleEditTitle = (flow: FlowRegistryEntry) => {
    setEditingFlowId(flow.id);
    setEditingTitle(flow.title);
  };

  const handleSaveTitle = async () => {
    if (editingFlowId && editingTitle.trim()) {
      try {
        await updateFlowMutation({
          variables: {
            id: editingFlowId,
            input: {
              title: editingTitle.trim(),
            },
          },
        });
        await refetchFlows();
      } catch (error) {
        console.error('Failed to update flow title:', error);
        window.alert('Failed to update flow title. Please try again.');
      }
    }
    setEditingFlowId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingFlowId(null);
    setEditingTitle('');
  };

  const handleDuplicateFlow = async (flowId: string) => {
    try {
      const result = await duplicateFlowMutation({
        variables: {
          id: flowId,
        },
      });

      if (result.data?.duplicateFlow) {
        await refetchFlows();
        // Optionally navigate to the duplicated flow
        // window.location.href = `/flow/${result.data.duplicateFlow.id}`;
      }
    } catch (error) {
      console.error('Failed to duplicate flow:', error);
      window.alert('Failed to duplicate flow. Please try again.');
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    try {
      // Delete from database via GraphQL
      await deleteFlowMutation({
        variables: {
          id: flowId,
        },
      });

      // Notify websocket service about the deletion
      if (websocketService.isConnected()) {
        await websocketService.notifyFlowDeleted(flowId);
      }

      await refetchFlows();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Failed to delete flow:', error);
      window.alert('Failed to delete flow. Please try again.');
      setShowDeleteConfirm(null);
    }
  };

  const handleOpenFlow = (flowId: string) => {
    window.location.href = `/flow/${flowId}`;
  };

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

  // Enhanced filter flows based on search query
  const filteredFlows = flows.filter(flow => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase().trim();
    const title = flow.title.toLowerCase();
    const nodeCount = (flow.nodeCount || 0).toString();
    const connectionCount = (flow.connectionCount || 0).toString();
    const createdDate = formatDate(flow.createdAt).toLowerCase();
    const modifiedDate = formatDate(flow.lastModified).toLowerCase();

    // Search across multiple fields
    return (
      title.includes(query) ||
      nodeCount.includes(query) ||
      connectionCount.includes(query) ||
      createdDate.includes(query) ||
      modifiedDate.includes(query) ||
      // Support search terms like "nodes", "connections"
      (query.includes('node') && nodeCount !== '0') ||
      (query.includes('connection') && connectionCount !== '0') ||
      // Support search by relative dates
      (query.includes('today') && createdDate.includes('today')) ||
      (query.includes('yesterday') && createdDate.includes('1 day ago')) ||
      (query.includes('week') && createdDate.includes('week')) ||
      (query.includes('recent') &&
        (createdDate.includes('today') || createdDate.includes('1 day ago')))
    );
  });

  return (
    <ProtectedRoute>
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
              <button
                onClick={handleLogout}
                className='home-header__logout-btn'
                title='Logout'
                aria-label='Logout'
              >
                <LogOut size={16} />
              </button>
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

              <button className='home-quick-action' onClick={handleBrowseTemplates}>
                <FolderOpen className='home-quick-action__icon' />
                <div className='home-quick-action__content'>
                  <h3 className='home-quick-action__title'>Browse Templates</h3>
                  <p className='home-quick-action__desc'>
                    Choose from pre-built workflow templates
                  </p>
                </div>
              </button>
            </div>

            {/* Workflow Management Section */}
            <div className='home-workflows'>
              <div className='home-workflows__header'>
                <div className='home-workflows__title-section'>
                  <h2 className='home-workflows__title'>My Workflows</h2>
                  <span className='home-workflows__count'>
                    {searchQuery.trim() ? (
                      <>
                        {filteredFlows.length} of {flows.length} flows
                        {filteredFlows.length !== flows.length && (
                          <span className='home-workflows__search-indicator'> (filtered)</span>
                        )}
                      </>
                    ) : (
                      `${flows.length} flows`
                    )}
                  </span>
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
                {filteredFlows.length === 0 && searchQuery.trim() ? (
                  <div className='home-search-empty'>
                    <Search className='home-search-empty__icon' />
                    <h3 className='home-search-empty__title'>No flows found</h3>
                    <p className='home-search-empty__text'>
                      No flows match "{searchQuery}". Try searching for:
                    </p>
                    <ul className='home-search-empty__suggestions'>
                      <li>Flow titles or partial names</li>
                      <li>Node counts (e.g., "3", "5 nodes")</li>
                      <li>Connection counts (e.g., "2", "4 connections")</li>
                      <li>Creation dates (e.g., "today", "week", "recent")</li>
                    </ul>
                    <button className='home-search-empty__clear' onClick={() => setSearchQuery('')}>
                      Clear search
                    </button>
                  </div>
                ) : (
                  filteredFlows.map(flow => (
                    <div
                      key={flow.id}
                      className='home-workflow-card'
                      onClick={() => handleOpenFlow(flow.id)}
                    >
                      <div className='home-workflow-card__header'>
                        <div className='home-workflow-card__info'>
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

                      <div className='home-workflow-card__body'>
                        <p className='home-workflow-card__description'>
                          AI workflow with {flow.nodeCount || 0} nodes and{' '}
                          {flow.connectionCount || 0} connections
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
                  ))
                )}

                {/* Create New Flow Card - only show when not filtering or when there are results */}
                {(!searchQuery.trim() || filteredFlows.length > 0) && (
                  <div className='home-empty-card' onClick={handleCreateWorkflow}>
                    <Plus className='home-empty-card__icon' />
                    <h3 className='home-empty-card__title'>Create New Workflow</h3>
                    <p className='home-empty-card__text'>
                      Design a new flow diagram to automate your processes
                    </p>
                  </div>
                )}
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
    </ProtectedRoute>
  );
}
