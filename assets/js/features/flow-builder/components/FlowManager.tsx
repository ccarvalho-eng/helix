import React, { useState, useCallback, useEffect } from 'react';
import {
  Save,
  FolderOpen,
  Trash2,
  Copy,
  Download,
  Upload,
  Plus,
  Search,
  Clock,
  Users,
  FileText,
  ArrowDown,
} from 'lucide-react';
import { useFlowStorage, SavedFlowMetadata, useFlowServer, FlowState } from '../hooks';
import { Modal } from './Modal';
import { useThemeContext } from '../contexts/ThemeContext';

interface FlowManagerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFlow?: FlowState | null;
  onLoadFlow: (flowId: string) => Promise<void>;
  onCreateNew: () => Promise<void>;
}

export function FlowManager({
  isOpen,
  onClose,
  currentFlow,
  onLoadFlow,
  onCreateNew,
}: FlowManagerProps) {
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };
  const storage = useFlowStorage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlows, setSelectedFlows] = useState<Set<string>>(new Set());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const filteredFlows = storage.savedFlows.filter(
    flow =>
      flow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flow.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSaveCurrentFlow = useCallback(async () => {
    if (!currentFlow) return;

    setIsLoading(true);
    try {
      await storage.saveFlow({
        ...currentFlow,
        name: saveName || currentFlow.name,
        description: saveDescription || currentFlow.description,
      });

      setShowSaveDialog(false);
      setSaveName('');
      setSaveDescription('');
      storage.refreshFlowList();
    } catch (error) {
      console.error('Failed to save flow:', error);
      alert('Failed to save flow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentFlow, saveName, saveDescription, storage]);

  const handleDeleteFlow = useCallback(
    async (flowId: string) => {
      if (!confirm('Are you sure you want to delete this flow? This action cannot be undone.')) {
        return;
      }

      setIsLoading(true);
      try {
        await storage.deleteFlow(flowId);
        storage.refreshFlowList();
      } catch (error) {
        console.error('Failed to delete flow:', error);
        alert('Failed to delete flow. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [storage]
  );

  const handleDuplicateFlow = useCallback(
    async (flowId: string) => {
      setIsLoading(true);
      try {
        await storage.duplicateFlow(flowId);
        storage.refreshFlowList();
      } catch (error) {
        console.error('Failed to duplicate flow:', error);
        alert('Failed to duplicate flow. Please try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [storage]
  );

  const handleExportFlow = useCallback(
    async (flowId: string) => {
      try {
        const exportData = await storage.exportFlow(flowId);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `helix-flow-${flowId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to export flow:', error);
        alert('Failed to export flow. Please try again.');
      }
    },
    [storage]
  );

  const handleImportFlow = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const content = await file.text();
        const importedFlow = await storage.importFlow(content);
        storage.refreshFlowList();
        event.target.value = ''; // Reset input
        
        // Close modal and navigate to imported flow
        onClose();
        await onLoadFlow(importedFlow.id);
      } catch (error) {
        console.error('Failed to import flow:', error);
        alert('Failed to import flow. Please check the file format and try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [storage, onClose, onLoadFlow]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedFlows.size === 0) return;

    if (
      !confirm(
        `Are you sure you want to delete ${selectedFlows.size} flow(s)? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(Array.from(selectedFlows).map(flowId => storage.deleteFlow(flowId)));
      storage.refreshFlowList();
      setSelectedFlows(new Set());
    } catch (error) {
      console.error('Failed to delete flows:', error);
      alert('Failed to delete some flows. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFlows, storage]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const storageUsage = storage.getStorageUsage();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title='Flow Manager' size='large'>
      <div className='flow-manager'>
        {/* Header Actions */}
        <div
          className='flow-manager__header'
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: theme === 'dark' ? 'var(--theme-bg-secondary)' : '#f8f9fa',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className='flow-manager__btn flow-manager__btn--primary'
              onClick={onCreateNew}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: theme === 'dark' ? '#98c379' : '#000000',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              <Plus size={16} />
              New Flow
            </button>

            {currentFlow && (
              <button
                className='flow-manager__btn flow-manager__btn--secondary'
                onClick={() => setShowSaveDialog(true)}
                disabled={isLoading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                  backgroundColor: 'transparent',
                  color: theme === 'dark' ? 'white' : '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 
                    theme === 'dark' ? '#98c379' : '#000000';
                  e.currentTarget.style.color = 'white';
                  e.currentTarget.style.borderColor = 
                    theme === 'dark' ? '#98c379' : '#000000';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 
                    theme === 'dark' ? 'white' : '#374151';
                  e.currentTarget.style.borderColor = 
                    theme === 'dark' ? '#374151' : '#d1d5db';
                }}
              >
                <Save size={16} />
                Save Current
              </button>
            )}

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                backgroundColor: 'transparent',
                color: theme === 'dark' ? 'white' : '#374151',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundColor = 
                  theme === 'dark' ? '#98c379' : '#000000';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderColor = 
                  theme === 'dark' ? '#98c379' : '#000000';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 
                  theme === 'dark' ? 'white' : '#374151';
                e.currentTarget.style.borderColor = 
                  theme === 'dark' ? '#374151' : '#d1d5db';
              }}
            >
              <ArrowDown size={16} />
              Import
              <input
                type='file'
                accept='.json'
                onChange={handleImportFlow}
                style={{ display: 'none' }}
              />
            </label>
          </div>

          {selectedFlows.size > 0 && (
            <button
              className='flow-manager__btn flow-manager__btn--danger'
              onClick={handleBulkDelete}
              disabled={isLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#ef4444',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              <Trash2 size={16} />
              Delete Selected ({selectedFlows.size})
            </button>
          )}
        </div>

        {/* Search */}
        <div
          className='flow-manager__search'
          style={{
            position: 'relative',
            marginBottom: '20px',
          }}
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: theme === 'dark' ? '#6b7280' : '#9ca3af',
            }}
          />
          <input
            type='text'
            placeholder='Search flows...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              borderRadius: '6px',
              border: `2px solid ${
                isSearchFocused
                  ? theme === 'dark' ? '#98c379' : '#000000'
                  : theme === 'dark' ? '#374151' : '#d1d5db'
              }`,
              backgroundColor: theme === 'dark' ? 'var(--theme-bg-primary)' : 'white',
              color: theme === 'dark' ? 'white' : '#374151',
              fontSize: '14px',
              outline: 'none',
            }}
          />
        </div>

        {/* Storage Usage */}
        <div
          className='flow-manager__storage'
          style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: theme === 'dark' ? 'var(--theme-bg-secondary)' : '#f1f5f9',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '12px',
              color: theme === 'dark' ? '#9ca3af' : '#64748b',
            }}
          >
            <span>Storage Usage</span>
            <span>{storageUsage.percentage}% used</span>
          </div>
          <div
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: theme === 'dark' ? '#374151' : '#e2e8f0',
              borderRadius: '2px',
              marginTop: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${storageUsage.percentage}%`,
                height: '100%',
                backgroundColor: storageUsage.percentage > 80 ? '#ef4444' : (theme === 'dark' ? '#98c379' : '#000000'),
                borderRadius: '2px',
              }}
            />
          </div>
        </div>

        {/* Flow List */}
        <div
          className='flow-manager__flows'
          style={{
            maxHeight: '400px',
            overflowY: 'auto',
          }}
        >
          {filteredFlows.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: theme === 'dark' ? '#9ca3af' : '#64748b',
              }}
            >
              {searchQuery ? 'No flows match your search.' : 'No saved flows found.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {filteredFlows.map(flow => (
                <div
                  key={flow.id}
                  className={`flow-manager__flow-card ${selectedFlows.has(flow.id) ? 'selected' : ''}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: selectedFlows.has(flow.id)
                      ? theme === 'dark'
                        ? '#1e40af20'
                        : '#dbeafe'
                      : theme === 'dark'
                        ? 'var(--theme-bg-secondary)'
                        : 'white',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input
                    type='checkbox'
                    checked={selectedFlows.has(flow.id)}
                    onChange={e => {
                      const newSelected = new Set(selectedFlows);
                      if (e.target.checked) {
                        newSelected.add(flow.id);
                      } else {
                        newSelected.delete(flow.id);
                      }
                      setSelectedFlows(newSelected);
                    }}
                    onClick={e => e.stopPropagation()}
                    style={{ marginTop: '2px' }}
                  />

                  {flow.thumbnail && (
                    <div
                      style={{
                        width: '60px',
                        height: '40px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6',
                      }}
                    >
                      <img
                        src={flow.thumbnail}
                        alt='Flow thumbnail'
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }} onClick={() => onLoadFlow(flow.id)}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '4px',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '16px',
                          fontWeight: '600',
                          color: theme === 'dark' ? 'white' : '#111827',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {flow.name}
                      </h4>
                    </div>

                    {flow.description && (
                      <p
                        style={{
                          margin: '0 0 8px 0',
                          fontSize: '14px',
                          color: theme === 'dark' ? '#9ca3af' : '#64748b',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {flow.description}
                      </p>
                    )}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        fontSize: '12px',
                        color: theme === 'dark' ? '#6b7280' : '#9ca3af',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={12} />
                        {formatDate(flow.updated_at)}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDuplicateFlow(flow.id);
                      }}
                      disabled={isLoading}
                      style={{
                        padding: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: theme === 'dark' ? '#9ca3af' : '#64748b',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title='Duplicate flow'
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleExportFlow(flow.id);
                      }}
                      disabled={isLoading}
                      style={{
                        padding: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: theme === 'dark' ? '#9ca3af' : '#64748b',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title='Export flow'
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteFlow(flow.id);
                      }}
                      disabled={isLoading}
                      style={{
                        padding: '6px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        borderRadius: '4px',
                      }}
                      title='Delete flow'
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Dialog */}
        {showSaveDialog && (
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
          >
            <div
              style={{
                backgroundColor: theme === 'dark' ? 'var(--theme-bg-primary)' : 'white',
                padding: '24px',
                borderRadius: '12px',
                width: '400px',
                maxWidth: '90vw',
              }}
            >
              <h3
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  color: theme === 'dark' ? 'white' : '#111827',
                }}
              >
                Save Flow
              </h3>

              <input
                type='text'
                placeholder='Flow name'
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '12px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                  backgroundColor: theme === 'dark' ? 'var(--theme-bg-secondary)' : 'white',
                  color: theme === 'dark' ? 'white' : '#374151',
                  fontSize: '14px',
                }}
              />

              <textarea
                placeholder='Description (optional)'
                value={saveDescription}
                onChange={e => setSaveDescription(e.target.value)}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: '16px',
                  borderRadius: '6px',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                  backgroundColor: theme === 'dark' ? 'var(--theme-bg-secondary)' : 'white',
                  color: theme === 'dark' ? 'white' : '#374151',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  onClick={() => setShowSaveDialog(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#d1d5db'}`,
                    backgroundColor: 'transparent',
                    color: theme === 'dark' ? 'white' : '#374151',
                    cursor: 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCurrentFlow}
                  disabled={isLoading || !saveName.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: theme === 'dark' ? '#98c379' : '#000000',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    opacity: !saveName.trim() || isLoading ? 0.5 : 1,
                  }}
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
