import { useState, useEffect, useCallback } from 'react';
import { FlowState } from './useFlowServer';

export interface SavedFlowMetadata {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  thumbnail?: string; // base64 encoded image
}

export interface SavedFlow extends SavedFlowMetadata {
  nodes: any[];
  edges: any[];
  viewport: { x: number; y: number; zoom: number };
}

const FLOWS_STORAGE_KEY = 'helix-flows';
const FLOW_PREFIX = 'helix-flow-';

export interface UseFlowStorageReturn {
  savedFlows: SavedFlowMetadata[];

  // Flow operations
  saveFlow: (flowState: FlowState, thumbnail?: string) => Promise<void>;
  loadFlow: (flowId: string) => Promise<SavedFlow | null>;
  deleteFlow: (flowId: string) => Promise<void>;
  duplicateFlow: (flowId: string, newName?: string) => Promise<SavedFlow>;
  exportFlow: (flowId: string) => Promise<string>; // JSON string
  importFlow: (flowData: string) => Promise<SavedFlow>;

  // Storage management
  refreshFlowList: () => void;
  clearAllFlows: () => Promise<void>;
  getStorageUsage: () => { used: number; available: number; percentage: number };
}

export function useFlowStorage(): UseFlowStorageReturn {
  const [savedFlows, setSavedFlows] = useState<SavedFlowMetadata[]>([]);

  // Load saved flows list on mount
  useEffect(() => {
    refreshFlowList();
  }, []);

  const refreshFlowList = useCallback(() => {
    try {
      const flowsData = localStorage.getItem(FLOWS_STORAGE_KEY);
      if (flowsData) {
        const flows: SavedFlowMetadata[] = JSON.parse(flowsData);
        setSavedFlows(
          flows.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        );
      } else {
        setSavedFlows([]);
      }
    } catch (error) {
      console.error('Error loading flows list:', error);
      setSavedFlows([]);
    }
  }, []);

  const updateFlowsList = useCallback(
    (updater: (flows: SavedFlowMetadata[]) => SavedFlowMetadata[]) => {
      try {
        const flowsData = localStorage.getItem(FLOWS_STORAGE_KEY);
        const currentFlows: SavedFlowMetadata[] = flowsData ? JSON.parse(flowsData) : [];
        const updatedFlows = updater(currentFlows);

        localStorage.setItem(FLOWS_STORAGE_KEY, JSON.stringify(updatedFlows));
        setSavedFlows(
          updatedFlows.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        );
      } catch (error) {
        console.error('Error updating flows list:', error);
        throw error;
      }
    },
    []
  );

  const saveFlow = useCallback(
    async (flowState: FlowState, thumbnail?: string): Promise<void> => {
      try {
        const now = new Date().toISOString();
        const savedFlow: SavedFlow = {
          id: flowState.id,
          name: flowState.name,
          description: flowState.description,
          nodes: flowState.nodes,
          edges: flowState.edges,
          viewport: flowState.viewport,
          created_at: flowState.created_at || now,
          updated_at: now,
          thumbnail,
        };

        // Save full flow data
        localStorage.setItem(`${FLOW_PREFIX}${flowState.id}`, JSON.stringify(savedFlow));

        // Update flows list
        updateFlowsList(flows => {
          const existingIndex = flows.findIndex(f => f.id === flowState.id);
          const metadata: SavedFlowMetadata = {
            id: savedFlow.id,
            name: savedFlow.name,
            description: savedFlow.description,
            created_at: savedFlow.created_at,
            updated_at: savedFlow.updated_at,
            thumbnail: savedFlow.thumbnail,
          };

          if (existingIndex >= 0) {
            flows[existingIndex] = metadata;
          } else {
            flows.push(metadata);
          }

          return flows;
        });

        console.log(`Flow ${flowState.id} saved to localStorage`);
      } catch (error) {
        console.error('Error saving flow:', error);
        throw error;
      }
    },
    [updateFlowsList]
  );

  const loadFlow = useCallback(async (flowId: string): Promise<SavedFlow | null> => {
    try {
      const flowData = localStorage.getItem(`${FLOW_PREFIX}${flowId}`);
      if (!flowData) {
        return null;
      }

      const savedFlow: SavedFlow = JSON.parse(flowData);
      console.log(`Flow ${flowId} loaded from localStorage`);
      return savedFlow;
    } catch (error) {
      console.error(`Error loading flow ${flowId}:`, error);
      return null;
    }
  }, []);

  const deleteFlow = useCallback(
    async (flowId: string): Promise<void> => {
      try {
        // Remove full flow data
        localStorage.removeItem(`${FLOW_PREFIX}${flowId}`);

        // Update flows list
        updateFlowsList(flows => flows.filter(f => f.id !== flowId));

        console.log(`Flow ${flowId} deleted from localStorage`);
      } catch (error) {
        console.error(`Error deleting flow ${flowId}:`, error);
        throw error;
      }
    },
    [updateFlowsList]
  );

  const duplicateFlow = useCallback(
    async (flowId: string, newName?: string): Promise<SavedFlow> => {
      try {
        const originalFlow = await loadFlow(flowId);
        if (!originalFlow) {
          throw new Error(`Flow ${flowId} not found`);
        }

        const newFlowId = generateFlowId();
        const now = new Date().toISOString();
        const duplicatedFlow: SavedFlow = {
          ...originalFlow,
          id: newFlowId,
          name: newName || `${originalFlow.name} (Copy)`,
          created_at: now,
          updated_at: now,
        };

        // Save duplicated flow
        localStorage.setItem(`${FLOW_PREFIX}${newFlowId}`, JSON.stringify(duplicatedFlow));

        // Update flows list
        updateFlowsList(flows => {
          const metadata: SavedFlowMetadata = {
            id: duplicatedFlow.id,
            name: duplicatedFlow.name,
            description: duplicatedFlow.description,
            created_at: duplicatedFlow.created_at,
            updated_at: duplicatedFlow.updated_at,
            thumbnail: duplicatedFlow.thumbnail,
          };

          return [metadata, ...flows];
        });

        console.log(`Flow ${flowId} duplicated as ${newFlowId}`);
        return duplicatedFlow;
      } catch (error) {
        console.error(`Error duplicating flow ${flowId}:`, error);
        throw error;
      }
    },
    [loadFlow, updateFlowsList]
  );

  const exportFlow = useCallback(
    async (flowId: string): Promise<string> => {
      try {
        const savedFlow = await loadFlow(flowId);
        if (!savedFlow) {
          throw new Error(`Flow ${flowId} not found`);
        }

        const exportData = {
          version: '1.0',
          exported_at: new Date().toISOString(),
          flow: savedFlow,
        };

        return JSON.stringify(exportData, null, 2);
      } catch (error) {
        console.error(`Error exporting flow ${flowId}:`, error);
        throw error;
      }
    },
    [loadFlow]
  );

  const importFlow = useCallback(
    async (flowData: string): Promise<SavedFlow> => {
      try {
        const importedData = JSON.parse(flowData);

        if (!importedData.flow) {
          throw new Error('Invalid flow export format');
        }

        const flow = importedData.flow;
        const newFlowId = generateFlowId();
        const now = new Date().toISOString();

        const importedFlow: SavedFlow = {
          ...flow,
          id: newFlowId,
          created_at: now,
          updated_at: now,
        };

        // Save imported flow
        localStorage.setItem(`${FLOW_PREFIX}${newFlowId}`, JSON.stringify(importedFlow));

        // Update flows list
        updateFlowsList(flows => {
          const metadata: SavedFlowMetadata = {
            id: importedFlow.id,
            name: importedFlow.name,
            description: importedFlow.description,
            created_at: importedFlow.created_at,
            updated_at: importedFlow.updated_at,
            thumbnail: importedFlow.thumbnail,
          };

          return [metadata, ...flows];
        });

        console.log(`Flow imported as ${newFlowId}`);
        return importedFlow;
      } catch (error) {
        console.error('Error importing flow:', error);
        throw error;
      }
    },
    [updateFlowsList]
  );

  const clearAllFlows = useCallback(async (): Promise<void> => {
    try {
      // Get all flow keys and remove them
      const keys = Object.keys(localStorage).filter(key => key.startsWith(FLOW_PREFIX));
      keys.forEach(key => localStorage.removeItem(key));

      // Clear flows list
      localStorage.removeItem(FLOWS_STORAGE_KEY);
      setSavedFlows([]);

      console.log('All flows cleared from localStorage');
    } catch (error) {
      console.error('Error clearing flows:', error);
      throw error;
    }
  }, []);

  const getStorageUsage = useCallback(() => {
    try {
      let used = 0;

      // Calculate storage used by flows
      const keys = Object.keys(localStorage).filter(
        key => key.startsWith(FLOW_PREFIX) || key === FLOWS_STORAGE_KEY
      );

      keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
      });

      // Rough estimate of localStorage limit (usually 5-10MB)
      const available = 5 * 1024 * 1024; // 5MB
      const percentage = Math.round((used / available) * 100);

      return {
        used,
        available,
        percentage: Math.min(percentage, 100),
      };
    } catch (error) {
      console.error('Error calculating storage usage:', error);
      return { used: 0, available: 5242880, percentage: 0 };
    }
  }, []);

  return {
    savedFlows,

    saveFlow,
    loadFlow,
    deleteFlow,
    duplicateFlow,
    exportFlow,
    importFlow,

    refreshFlowList,
    clearAllFlows,
    getStorageUsage,
  };
}

// Helper function to generate unique flow IDs
function generateFlowId(): string {
  return `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
