// Centralized icon system using Lucide React
import {
  Bot,
  Eye,
  Wrench,
  GitBranch,
  ArrowLeft,
  ArrowRight,
  Brain,
  RotateCcw,
  RefreshCw,
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
  memory: Brain,
  loop: RotateCcw,
  transform: RefreshCw,
  api: Zap,

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
  input: '#6366f1',
  output: '#06b6d4',
  memory: '#ec4899',
  loop: '#8b5cf6',
  transform: '#14b8a6',
  api: '#f97316',
} as const;

export type IconName = keyof typeof ICONS;
export type NodeColorType = keyof typeof NODE_COLORS;
