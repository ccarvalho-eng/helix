import { memo, useState } from 'react';
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
  Zap,
  Settings,
  Users,
  FileText,
  BarChart3,
  Heart,
  DollarSign,
  ShoppingCart,
  Gamepad2,
} from 'lucide-react';
import { useThemeContext } from '../../contexts/ThemeContext';
import { NodeConfig } from '../../../../shared/types';
import { TemplateType, getFeaturedTemplates } from '../../templates';
import { Template, AIFlowNode } from '../../types';

type ReactFlowAINode = AIFlowNode;

interface NodePaletteProps {
  onAddNode: (
    _type: ReactFlowAINode['type'],
    _customLabel?: string,
    _customDescription?: string,
    _defaultConfig?: NodeConfig
  ) => void;
  onAddTemplate: (_templateType: TemplateType) => void;
  onOpenTemplatesModal: () => void;
  onTemplateClick: (_template: Template) => void;
  isFlowReady: boolean;
}

export const NodePalette = memo(function NodePalette({
  onAddNode,
  onAddTemplate: _onAddTemplate,
  onOpenTemplatesModal,
  onTemplateClick,
  isFlowReady,
}: NodePaletteProps) {
  const { theme = 'light' } = useThemeContext() ?? { theme: 'light' };
  const [isTemplatesLinkHovered, setIsTemplatesLinkHovered] = useState(false);

  const nodeDefinitions = [
    // Core nodes
    {
      type: 'agent' as const,
      icon: Bot,
      label: 'Agent',
      color: '#0ea5e9',
      category: 'core' as const,
    },
    {
      type: 'sensor' as const,
      icon: Eye,
      label: 'Sensor',
      color: '#22c55e',
      category: 'core' as const,
    },
    {
      type: 'skill' as const,
      icon: Wrench,
      label: 'Skill',
      color: '#f59e0b',
      category: 'core' as const,
    },
    {
      type: 'memory' as const,
      icon: Brain,
      label: 'Memory',
      color: '#ec4899',
      category: 'core' as const,
    },
    // Logic nodes
    {
      type: 'decision' as const,
      icon: GitBranch,
      label: 'Decision',
      color: '#ef4444',
      category: 'logic' as const,
    },
    {
      type: 'loop' as const,
      icon: RotateCcw,
      label: 'Loop',
      color: '#8b5cf6',
      category: 'logic' as const,
    },
    {
      type: 'transform' as const,
      icon: RefreshCw,
      label: 'Transform',
      color: '#14b8a6',
      category: 'logic' as const,
    },
    // I/O nodes
    {
      type: 'input' as const,
      icon: ArrowLeft,
      label: 'Input',
      color: '#6366f1',
      category: 'io' as const,
    },
    {
      type: 'output' as const,
      icon: ArrowRight,
      label: 'Output',
      color: '#06b6d4',
      category: 'io' as const,
    },
    {
      type: 'api' as const,
      icon: Zap,
      label: 'API',
      color: '#f97316',
      category: 'io' as const,
    },
  ];

  const categoryLabels = {
    core: 'Core Agents',
    logic: 'Logic Control',
    io: 'Input/Output',
  };

  const categoryIcons = {
    core: Bot,
    logic: GitBranch,
    io: ArrowLeft,
  };

  const nodesByCategory = nodeDefinitions.reduce(
    (acc, node) => {
      if (!acc[node.category]) {
        acc[node.category] = [];
      }
      acc[node.category].push(node);
      return acc;
    },
    {} as Record<'core' | 'logic' | 'io', typeof nodeDefinitions>
  );

  const handleDragStart = (e: React.DragEvent, nodeType: ReactFlowAINode['type']) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'business-automation':
        return Settings;
      case 'customer-service':
        return Users;
      case 'content-creation':
        return FileText;
      case 'data-analysis':
        return BarChart3;
      case 'healthcare':
        return Heart;
      case 'finance':
        return DollarSign;
      case 'e-commerce':
        return ShoppingCart;
      case 'technology':
        return Settings;
      case 'gaming':
        return Gamepad2;
      default:
        return Settings;
    }
  };

  return (
    <div className='node-palette'>
      <div className='node-palette__header'>
        <h3 className='node-palette__title'>Node Palette</h3>
      </div>

      <div className='node-palette__content'>
        {Object.entries(categoryLabels).map(([category, label]) => {
          const nodes = nodesByCategory[category as 'core' | 'logic' | 'io'] || [];
          const CategoryIcon = categoryIcons[category as 'core' | 'logic' | 'io'];

          return (
            <div key={category} className='node-palette__section'>
              <div className='node-palette__section-header'>
                <CategoryIcon size={14} color='var(--flow-builder-text-muted)' />
                <h4 className='node-palette__section-title'>{label}</h4>
              </div>

              <div className='node-palette__nodes-grid'>
                {nodes.map(nodeDefinition => (
                  <div
                    key={nodeDefinition.type}
                    className={`node-palette__node ${!isFlowReady ? 'node-palette__node--disabled' : ''}`}
                    data-node-type={nodeDefinition.type}
                    data-testid={`node-palette-${nodeDefinition.type}`}
                    draggable={isFlowReady}
                    onDragStart={
                      isFlowReady ? e => handleDragStart(e, nodeDefinition.type) : undefined
                    }
                    onClick={isFlowReady ? () => onAddNode(nodeDefinition.type) : undefined}
                    title={isFlowReady ? undefined : 'Connecting to flow...'}
                  >
                    <div className='node-palette__node-icon'>
                      <nodeDefinition.icon size={16} color={nodeDefinition.color} />
                    </div>
                    <div className='node-palette__node-info'>
                      <div className='node-palette__node-label'>{nodeDefinition.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className='react-flow-node-palette__templates'>
        <h4 className='react-flow-node-palette__templates-title'>Templates</h4>
        {getFeaturedTemplates().map(t => (
          <div
            key={t.id}
            className='react-flow-node-palette__template'
            onClick={() => onTemplateClick(t)}
          >
            <div className='react-flow-node-palette__template-title react-flow-node-palette__template-title--with-icon'>
              {(() => {
                const IconComponent = getTemplateIcon(t.category);
                return (
                  <IconComponent size={16} className='react-flow-node-palette__template-icon' />
                );
              })()}
              {t.name}
            </div>
            <div className='react-flow-node-palette__template-description'>{t.description}</div>
          </div>
        ))}
        <div
          className='react-flow-node-palette__see-all-link'
          style={{
            marginTop: 12,
            padding: '8px 12px',
            fontSize: 14,
            color: isTemplatesLinkHovered
              ? theme === 'dark'
                ? 'var(--theme-syntax-green)'
                : '#374151'
              : theme === 'dark'
                ? 'var(--theme-text-secondary)'
                : '#6b7280',
            backgroundColor: isTemplatesLinkHovered
              ? theme === 'dark'
                ? 'var(--theme-bg-tertiary)'
                : '#f3f4f6'
              : 'transparent',
            textAlign: 'center',
            cursor: 'pointer',
            borderRadius: 6,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={() => setIsTemplatesLinkHovered(true)}
          onMouseLeave={() => setIsTemplatesLinkHovered(false)}
          onClick={onOpenTemplatesModal}
        >
          See all templates →
        </div>
      </div>
    </div>
  );
});
