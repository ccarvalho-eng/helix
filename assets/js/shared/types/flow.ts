export interface FlowRegistryEntry {
  id: string;
  title: string;
  lastModified: string;
  createdAt: string;
  nodeCount?: number;
  connectionCount?: number;
}

export interface FlowRegistry {
  flows: FlowRegistryEntry[];
}

export interface FlowData {
  nodes: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number };
}

export interface FlowStorageService {
  getFlowRegistry(): FlowRegistry;
  getFlow(_id: string): FlowData | null;
  saveFlow(_id: string, _data: FlowData): void;
  createFlow(_title?: string): FlowRegistryEntry;
  updateFlowTitle(_id: string, _title: string): void;
  deleteFlow(_id: string): void;
  duplicateFlow(_id: string): FlowRegistryEntry;
  migrateFromLegacyStorage(): void;
}