import { ICONS, NODE_COLORS, type IconName, type NodeColorType } from '../../../shared/constants';
import { Node, Edge } from 'reactflow';
import { AIFlowNode } from '../types';

// Flow Builder specific utilities

export const flowUtils = {
  calculateNodePosition: (index: number, column: number = 0): { x: number; y: number } => {
    const baseX = 100 + column * 200;
    const baseY = 100 + index * 150;
    return { x: baseX, y: baseY };
  },

  generateConnectionId: (source: string, target: string): string => {
    return `${source}-to-${target}`;
  },

  validateConnection: (_sourceType: string, _targetType: string): boolean => {
    // Add connection validation logic here
    return true;
  },

  getNodeIconComponent: (type: string) => {
    return ICONS[type as IconName] || ICONS.agent;
  },

  getNodeColor: (type: string): string => {
    return NODE_COLORS[type as NodeColorType] || '#6b7280';
  },
};

// GraphQL transformation utilities

/**
 * Transforms a ReactFlow node to GraphQL node format
 */
export function transformNodeToGraphQL(node: Node<AIFlowNode>) {
  const data = node.data;
  return {
    nodeId: data.id,
    type: data.type,
    positionX: node.position.x,
    positionY: node.position.y,
    width: data.width,
    height: data.height,
    data: JSON.stringify({
      label: data.label,
      description: data.description,
      config: data.config,
      color: data.color,
      borderColor: data.borderColor,
      borderWidth: data.borderWidth,
    }),
  };
}

/**
 * Transforms multiple ReactFlow nodes to GraphQL format
 */
export function transformNodesToGraphQL(nodes: Node<AIFlowNode>[]) {
  return nodes.map(transformNodeToGraphQL);
}

/**
 * Transforms a ReactFlow edge to GraphQL edge format
 */
export function transformEdgeToGraphQL(edge: Edge) {
  return {
    edgeId: edge.id,
    sourceNodeId: edge.source,
    targetNodeId: edge.target,
    sourceHandle: edge.sourceHandle || null,
    targetHandle: edge.targetHandle || null,
    edgeType: edge.type || 'default',
    animated: edge.animated || false,
    data: edge.data || null,
  };
}

/**
 * Transforms multiple ReactFlow edges to GraphQL format
 */
export function transformEdgesToGraphQL(edges: Edge[]) {
  return edges.map(transformEdgeToGraphQL);
}

/**
 * Safely parses node data JSON string from GraphQL API
 * Returns empty object if parsing fails or input is invalid
 */
export function parseNodeDataSafely(data: unknown): Record<string, unknown> {
  if (!data) {
    return {};
  }

  // If already an object, return it
  if (typeof data === 'object') {
    return data as Record<string, unknown>;
  }

  // If string, try to parse as JSON
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch (error) {
      console.warn('Failed to parse node data JSON:', error);
      return {};
    }
  }

  return {};
}

/**
 * Validates flow data from GraphQL API
 * Returns true if flow data is valid, false otherwise
 */
export function validateFlowData(flow: unknown): flow is {
  id: string;
  title: string;
  nodes?: unknown[];
  edges?: unknown[];
  version?: number;
  updatedAt?: string;
  insertedAt?: string;
  viewportX?: number;
  viewportY?: number;
  viewportZoom?: number;
} {
  if (!flow || typeof flow !== 'object') {
    return false;
  }

  const f = flow as Record<string, unknown>;

  // Required fields
  if (typeof f.id !== 'string' || !f.id) {
    console.error('Invalid flow data: missing or invalid id');
    return false;
  }

  if (typeof f.title !== 'string') {
    console.error('Invalid flow data: missing or invalid title');
    return false;
  }

  // Optional fields with type checks
  if (f.nodes !== undefined && !Array.isArray(f.nodes)) {
    console.error('Invalid flow data: nodes must be an array');
    return false;
  }

  if (f.edges !== undefined && !Array.isArray(f.edges)) {
    console.error('Invalid flow data: edges must be an array');
    return false;
  }

  if (f.version !== undefined && typeof f.version !== 'number') {
    console.error('Invalid flow data: version must be a number');
    return false;
  }

  return true;
}
