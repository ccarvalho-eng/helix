// Application-wide constants

export const APP_CONFIG = {
  STORAGE_KEY: 'react-flow-ai-flow-builder-state',
  DEBOUNCE_DELAY: 300,
  ANIMATION_DURATION: 200,
} as const;

export const NODE_DEFAULTS = {
  agent: { width: 140, height: 80, color: '#f0f9ff', label: 'AI Agent' },
  sensor: { width: 120, height: 60, color: '#f0fdf4', label: 'Sensor' },
  skill: { width: 120, height: 60, color: '#fffbeb', label: 'Skill' },
  decision: { width: 100, height: 80, color: '#fef2f2', label: 'Decision' },
  input: { width: 100, height: 60, color: '#faf5ff', label: 'Input' },
  output: { width: 100, height: 60, color: '#f0fdfa', label: 'Output' },
  memory: { width: 120, height: 60, color: '#fdf2f8', label: 'Memory' },
  loop: { width: 100, height: 60, color: '#faf5ff', label: 'Loop' },
  transform: { width: 130, height: 60, color: '#f0fdfa', label: 'Transform' },
  api: { width: 100, height: 60, color: '#fff7ed', label: 'API' },
} as const;

export const THEME_CONFIG = {
  STORAGE_KEY: 'flow-builder-theme',
  DEFAULT_THEME: 'dark',
  THEMES: ['light', 'dark'] as const,
} as const;

// Re-export icon constants
export * from './icons';
