// Flow Builder specific constants

export const FLOW_BUILDER_CONFIG = {
  GRID_SIZE: 20,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 4,
  DEFAULT_VIEWPORT: { x: 0, y: 0, zoom: 1 },
} as const;

export const NODE_CATEGORIES = {
  INPUT: 'input',
  PROCESSING: 'processing', 
  OUTPUT: 'output',
  CONTROL: 'control',
} as const;

export const TEMPLATE_CATEGORIES = {
  GAMING: 'gaming',
  TECHNOLOGY: 'technology',
} as const;