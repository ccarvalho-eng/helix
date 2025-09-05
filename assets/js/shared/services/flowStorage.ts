import {
  FlowRegistry,
  FlowRegistryEntry,
  FlowData,
  FlowStorageService,
  StoredNode,
  StoredEdge,
} from '../types/flow';

const REGISTRY_KEY = 'flows-registry';
const FLOW_KEY_PREFIX = 'flow-';

class FlowStorageServiceImpl implements FlowStorageService {
  /**
   * Get the flow registry from localStorage
   */
  getFlowRegistry(): FlowRegistry {
    try {
      const stored = localStorage.getItem(REGISTRY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load flow registry from localStorage:', error);
    }
    return { flows: [] };
  }

  /**
   * Save the flow registry to localStorage
   */
  saveFlowRegistry(registry: FlowRegistry): void {
    try {
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
    } catch (error) {
      console.error('Failed to save flow registry to localStorage:', error);
    }
  }

  /**
   * Get a specific flow's data
   */
  getFlow(id: string): FlowData | null {
    try {
      const stored = localStorage.getItem(`${FLOW_KEY_PREFIX}${id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error(`Failed to load flow ${id} from localStorage:`, error);
    }
    return null;
  }

  /**
   * Save flow data and update registry metadata
   */
  saveFlow(id: string, data: FlowData): void {
    try {
      // Save flow data
      localStorage.setItem(`${FLOW_KEY_PREFIX}${id}`, JSON.stringify(data));

      // Update registry with metadata
      const registry = this.getFlowRegistry();
      const flowIndex = registry.flows.findIndex(f => f.id === id);

      if (flowIndex >= 0) {
        registry.flows[flowIndex].lastModified = new Date().toISOString();
        registry.flows[flowIndex].nodeCount = data.nodes?.length || 0;
        registry.flows[flowIndex].connectionCount = data.edges?.length || 0;
        this.saveFlowRegistry(registry);
      }
    } catch (error) {
      console.error(`Failed to save flow ${id}:`, error);
    }
  }

  /**
   * Create a new flow entry
   */
  createFlow(title?: string): FlowRegistryEntry {
    const id = this.generateFlowId();
    const now = new Date().toISOString();
    const flowTitle = title || 'Untitled Flow';

    const newFlow: FlowRegistryEntry = {
      id,
      title: flowTitle,
      lastModified: now,
      createdAt: now,
      nodeCount: 0,
      connectionCount: 0,
    };

    // Add to registry
    const registry = this.getFlowRegistry();
    registry.flows.push(newFlow);
    this.saveFlowRegistry(registry);

    // Create empty flow data
    const emptyFlowData: FlowData = {
      nodes: [],
      edges: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };
    this.saveFlow(id, emptyFlowData);

    return newFlow;
  }

  /**
   * Update flow title
   */
  updateFlowTitle(id: string, title: string): void {
    const registry = this.getFlowRegistry();
    const flowIndex = registry.flows.findIndex(f => f.id === id);

    if (flowIndex >= 0) {
      registry.flows[flowIndex].title = title;
      registry.flows[flowIndex].lastModified = new Date().toISOString();
      this.saveFlowRegistry(registry);
    }
  }

  /**
   * Delete a flow
   */
  deleteFlow(id: string): void {
    try {
      // Remove flow data
      localStorage.removeItem(`${FLOW_KEY_PREFIX}${id}`);

      // Remove from registry
      const registry = this.getFlowRegistry();
      registry.flows = registry.flows.filter(f => f.id !== id);
      this.saveFlowRegistry(registry);
    } catch (error) {
      console.error(`Failed to delete flow ${id}:`, error);
    }
  }

  /**
   * Duplicate an existing flow
   */
  duplicateFlow(id: string): FlowRegistryEntry {
    const sourceFlow = this.getFlow(id);
    const sourceRegistry = this.getFlowRegistry();
    const sourceEntry = sourceRegistry.flows.find(f => f.id === id);

    if (!sourceFlow || !sourceEntry) {
      throw new Error(`Flow ${id} not found`);
    }

    const newId = this.generateFlowId();
    const now = new Date().toISOString();
    const newTitle = `${sourceEntry.title} (Copy)`;

    const duplicatedFlow: FlowRegistryEntry = {
      id: newId,
      title: newTitle,
      lastModified: now,
      createdAt: now,
      nodeCount: sourceFlow.nodes?.length || 0,
      connectionCount: sourceFlow.edges?.length || 0,
    };

    // Add to registry
    const registry = this.getFlowRegistry();
    registry.flows.push(duplicatedFlow);
    this.saveFlowRegistry(registry);

    // Build old->new ID mapping first
    const idMap = new Map<string, string>();

    // Create duplicated nodes with new IDs
    const duplicatedNodes: StoredNode[] = (sourceFlow.nodes || []).map(node => {
      const typedNode = node as StoredNode;
      const newId = this.generateNodeId();
      idMap.set(typedNode.id, newId);
      return {
        ...typedNode,
        id: newId,
        data: { ...typedNode.data, id: newId },
      };
    });

    // Create duplicated edges using the ID mapping
    const duplicatedEdges: StoredEdge[] = (sourceFlow.edges || []).map(edge => {
      const typedEdge = edge as StoredEdge;
      return {
        ...typedEdge,
        id: window.crypto.randomUUID(),
        source: idMap.get(typedEdge.source) || typedEdge.source,
        target: idMap.get(typedEdge.target) || typedEdge.target,
      };
    });

    // Copy flow data with properly remapped nodes and edges
    const duplicatedFlowData: FlowData = {
      ...sourceFlow,
      nodes: duplicatedNodes,
      edges: duplicatedEdges,
    };

    this.saveFlow(newId, duplicatedFlowData);

    return duplicatedFlow;
  }

  /**
   * Generate unique flow ID using UUID v4
   */
  private generateFlowId(): string {
    return `flow-${window.crypto.randomUUID()}`;
  }

  /**
   * Generate unique node ID using UUID v4
   */
  private generateNodeId(): string {
    return window.crypto.randomUUID();
  }
}

export const flowStorage = new FlowStorageServiceImpl();
