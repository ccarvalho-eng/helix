import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Cpu,
  Plus,
  FolderOpen,
  Clock,
  Settings,
  Search,
  FileText,
  Trash2,
  Copy,
  Download,
} from 'lucide-react';
import { ThemeToggle } from '../flow-builder/components/ThemeToggle';
import { useFlowStorage } from '../flow-builder/hooks';
import { useThemeContext, ThemeProvider } from '../flow-builder/contexts/ThemeContext';

const HomePageInternal: React.FC = () => {
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };
  const storage = useFlowStorage();
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreateWorkflow = () => {
    window.location.href = '/flow';
  };

  const handleOpenFlow = (flowId: string) => {
    window.location.href = `/flow?flow=${flowId}`;
  };

  const filteredFlows = useMemo(() => {
    return storage.savedFlows.filter(
      flow =>
        flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        flow.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [storage.savedFlows, searchQuery]);

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  const handleDeleteFlow = (flowId: string, flowName: string) => {
    setFlowToDelete({ id: flowId, name: flowName });
    setShowDeleteConfirm(true);
    setOpenMenuId(null);
  };

  const confirmDeleteFlow = async () => {
    if (!flowToDelete) return;

    try {
      await storage.deleteFlow(flowToDelete.id);
      storage.refreshFlowList();
      setShowDeleteConfirm(false);
      setFlowToDelete(null);
    } catch (error) {
      console.error('Failed to delete flow:', error);
      console.error('Failed to delete flow. Please try again.');
    }
  };

  const cancelDeleteFlow = () => {
    setShowDeleteConfirm(false);
    setFlowToDelete(null);
  };

  const handleDuplicateFlow = async (flowId: string) => {
    try {
      await storage.duplicateFlow(flowId);
      storage.refreshFlowList();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to duplicate flow:', error);
      console.error('Failed to duplicate flow. Please try again.');
    }
  };

  const handleExportFlow = async (flowId: string) => {
    try {
      const exportData = await storage.exportFlow(flowId);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `helix-flow-${flowId}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to export flow:', error);
      console.error('Failed to export flow. Please try again.');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId && menuRefs.current[openMenuId]) {
        const menuElement = menuRefs.current[openMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenuId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

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

            <div
              className='home-quick-action'
              onClick={() => (window.location.href = '/flow?templates=true')}
            >
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
                <span className='home-workflows__count'>{storage.savedFlows.length} flows</span>
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
              </div>
            </div>

            <div className='home-workflows__grid'>
              {filteredFlows.length === 0 && searchQuery && (
                <div className='home-empty-state'>
                  <Search className='home-empty-state__icon' />
                  <h3 className='home-empty-state__title'>No flows found</h3>
                  <p className='home-empty-state__text'>
                    Try adjusting your search terms or create a new flow
                  </p>
                </div>
              )}

              {filteredFlows.length === 0 && !searchQuery && (
                <div className='home-empty-state'>
                  <FileText className='home-empty-state__icon' />
                  <h3 className='home-empty-state__title'>No flows yet</h3>
                  <p className='home-empty-state__text'>
                    Create your first flow to get started with workflow automation
                  </p>
                </div>
              )}

              {filteredFlows.map(flow => (
                <div
                  key={flow.id}
                  className='home-workflow-card'
                  onClick={() => handleOpenFlow(flow.id)}
                >
                  <div className='home-workflow-card__header'>
                    <div className='home-workflow-card__info'>
                      <h3 className='home-workflow-card__title'>{flow.name}</h3>
                      <div className='home-workflow-card__meta'>
                        <Clock className='home-workflow-card__meta-icon' />
                        <span>Last edited {formatDate(flow.updated_at)}</span>
                      </div>
                    </div>
                    <div
                      className='home-workflow-card__menu-container'
                      style={{ position: 'relative' }}
                      ref={el => {
                        if (el) {
                          menuRefs.current[flow.id] = el;
                        }
                      }}
                    >
                      <button
                        className='home-workflow-card__menu'
                        type='button'
                        aria-label='Open workflow menu'
                        onClick={e => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === flow.id ? null : flow.id);
                        }}
                        style={{
                          padding: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: theme === 'dark' ? '#9ca3af' : '#64748b',
                          cursor: 'pointer',
                          borderRadius: '4px',
                        }}
                      >
                        <Settings className='home-workflow-card__menu-icon' />
                      </button>

                      {openMenuId === flow.id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '0',
                            top: '100%',
                            marginTop: '4px',
                            backgroundColor:
                              theme === 'dark' ? 'var(--theme-bg-secondary)' : 'white',
                            border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                            borderRadius: '6px',
                            boxShadow:
                              theme === 'dark'
                                ? '0 10px 25px rgba(0, 0, 0, 0.3)'
                                : '0 10px 25px rgba(0, 0, 0, 0.1)',
                            zIndex: 50,
                            minWidth: '160px',
                          }}
                        >
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDuplicateFlow(flow.id);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: theme === 'dark' ? 'white' : '#374151',
                              cursor: 'pointer',
                              fontSize: '14px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor =
                                theme === 'dark'
                                  ? 'rgba(152, 195, 121, 0.1)'
                                  : 'rgba(0, 0, 0, 0.03)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Copy size={14} />
                            Duplicate
                          </button>

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleExportFlow(flow.id);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: theme === 'dark' ? 'white' : '#374151',
                              cursor: 'pointer',
                              fontSize: '14px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor =
                                theme === 'dark'
                                  ? 'rgba(152, 195, 121, 0.1)'
                                  : 'rgba(0, 0, 0, 0.03)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Download size={14} />
                            Export
                          </button>

                          <div
                            style={{
                              height: '1px',
                              backgroundColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                              margin: '4px 0',
                            }}
                          />

                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleDeleteFlow(flow.id, flow.name);
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: '14px',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className='home-workflow-card__description'>
                    {flow.description || 'No description provided'}
                  </p>

                  <div className='home-workflow-card__footer'>
                    <div className='home-workflow-card__stats'>
                      <span className='home-workflow-card__stat'>Saved Flow</span>
                      <span className='home-workflow-card__stat'>Saved</span>
                    </div>
                    <div className='home-workflow-card__status home-workflow-card__status--saved'></div>
                  </div>
                </div>
              ))}

              <div className='home-empty-card' onClick={handleCreateWorkflow}>
                <Plus className='home-empty-card__icon' />
                <h3 className='home-empty-card__title'>Create New Workflow</h3>
                <p className='home-empty-card__text'>
                  Design a new flow diagram to automate your processes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && flowToDelete && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={cancelDeleteFlow}
        >
          <div
            style={{
              backgroundColor: theme === 'dark' ? 'var(--theme-bg-secondary)' : 'white',
              borderRadius: '12px',
              padding: '24px',
              margin: '20px',
              maxWidth: '400px',
              width: '100%',
              boxShadow:
                theme === 'dark'
                  ? '0 25px 50px rgba(0, 0, 0, 0.5)'
                  : '0 25px 50px rgba(0, 0, 0, 0.15)',
              border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Trash2 size={24} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme === 'dark' ? 'white' : '#111827',
                  }}
                >
                  Delete Flow
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    color: theme === 'dark' ? '#9ca3af' : '#64748b',
                  }}
                >
                  This action cannot be undone
                </p>
              </div>
            </div>

            <p
              style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                lineHeight: '1.5',
                color: theme === 'dark' ? '#d1d5db' : '#374151',
              }}
            >
              Are you sure you want to delete <strong>"{flowToDelete.name}"</strong>? All data
              including nodes, connections, and settings will be permanently removed.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={cancelDeleteFlow}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                  backgroundColor: 'transparent',
                  color: theme === 'dark' ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor =
                    theme === 'dark' ? 'rgba(152, 195, 121, 0.1)' : 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>

              <button
                onClick={confirmDeleteFlow}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }}
              >
                Delete Flow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const HomePage: React.FC = () => {
  return (
    <ThemeProvider>
      <HomePageInternal />
    </ThemeProvider>
  );
};
