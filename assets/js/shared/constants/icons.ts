// Centralized icon system using Lucide React
import {
  Bot,
  Eye,
  Wrench,
  GitBranch,
  ArrowLeft,
  ArrowRight,
  Circle,
  Zap,
  Cpu,
  Menu,
  Sliders,
  Shield,
  Settings,
  Gamepad2,
} from 'lucide-react';

export const ICONS = {
  // Node type icons
  agent: Bot,
  sensor: Eye,
  skill: Wrench,
  decision: GitBranch,
  input: ArrowLeft,
  output: ArrowRight,

  // UI icons
  circle: Circle,
  zap: Zap,
  cpu: Cpu,
  menu: Menu,
  sliders: Sliders,
  shield: Shield,
  settings: Settings,
  gamepad: Gamepad2,
} as const;

export const NODE_COLORS = {
  agent: '#0ea5e9',
  sensor: '#22c55e',
  skill: '#f59e0b',
  decision: '#ef4444',
  input: '#8b5cf6',
  output: '#06b6d4',
} as const;

export type IconName = keyof typeof ICONS;
export type NodeColorType = keyof typeof NODE_COLORS;
