import {
  Settings,
  Users,
  FileText,
  BarChart3,
  Heart,
  DollarSign,
  ShoppingCart,
  Gamepad2,
} from 'lucide-react';
import { Modal } from '../Modal';
import { TemplateType, getTemplatesByCategory } from '../../templates';

interface TemplateModalProps {
  isOpen: boolean;
  activeTab:
    | 'business-automation'
    | 'customer-service'
    | 'content-creation'
    | 'data-analysis'
    | 'healthcare'
    | 'finance'
    | 'e-commerce';
  onClose: () => void;
  onTabChange: (_tab: TemplateModalProps['activeTab']) => void;
  onAddTemplate: (_templateType: TemplateType) => void;
}

export function TemplateModal({
  isOpen,
  activeTab,
  onClose,
  onTabChange,
  onAddTemplate,
}: TemplateModalProps) {
  if (!isOpen) return null;

  const templateCategories = [
    { id: 'business-automation', name: 'Business Automation', icon: Settings },
    { id: 'customer-service', name: 'Customer Service', icon: Users },
    { id: 'content-creation', name: 'Content Creation', icon: FileText },
    { id: 'data-analysis', name: 'Data Analysis', icon: BarChart3 },
    { id: 'healthcare', name: 'Healthcare', icon: Heart },
    { id: 'finance', name: 'Finance', icon: DollarSign },
    { id: 'e-commerce', name: 'E-commerce', icon: ShoppingCart },
  ] as const;

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

  const templates = getTemplatesByCategory(activeTab);

  return (
    <Modal isOpen={isOpen} title='Browse Templates' onClose={onClose}>
      <div className='flow-builder__templates-content'>
        <div className='flow-builder__template-tabs'>
          {templateCategories.map(category => {
            const IconComponent = category.icon;
            return (
              <button
                key={category.id}
                className={`flow-builder__template-tab ${
                  activeTab === category.id ? 'flow-builder__template-tab--active' : ''
                }`}
                onClick={() => onTabChange(category.id)}
              >
                <IconComponent size={16} />
                {category.name}
              </button>
            );
          })}
        </div>

        <div className='flow-builder__template-grid'>
          {templates.map(template => {
            const IconComponent = getTemplateIcon(template.category);

            return (
              <div
                key={template.id}
                className='flow-builder__template-card'
                onClick={() => {
                  onAddTemplate(template.id as TemplateType);
                  onClose();
                }}
              >
                <div className='flow-builder__template-card-header'>
                  <h3 className='flow-builder__template-card-title flow-builder__template-card-title--with-icon'>
                    <IconComponent size={18} className='flow-builder__template-card-icon' />
                    {template.name}
                  </h3>
                </div>
                <p className='flow-builder__template-card-description'>{template.description}</p>
                <div className='flow-builder__template-card-stats'>
                  <span>{template.nodes.length} nodes</span>
                  <span>{template.connections.length} connections</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
