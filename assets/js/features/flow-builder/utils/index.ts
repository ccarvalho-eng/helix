import { ICONS, NODE_COLORS, type IconName, type NodeColorType } from '../../../shared/constants';

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
