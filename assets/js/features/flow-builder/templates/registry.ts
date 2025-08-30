import { Template, TemplateType, TemplateCategory } from '../types';
import { assassinsCreedTemplate } from './assassins-creed';
import { lordOfTheRingsTemplate } from './lord-of-the-rings';
import { theWitcherTemplate } from './the-witcher';
import { legendOfZeldaTemplate } from './legend-of-zelda';
import { skyrimTemplate } from './skyrim';
import { cyberSecurityTemplate } from './cyber-security';
import { devOpsPipelineTemplate } from './devops-pipeline';
import { softwareAutomationTemplate } from './software-automation';

export const templateRegistry: Record<TemplateType, Template> = {
  'assassins-creed': assassinsCreedTemplate,
  lotr: lordOfTheRingsTemplate,
  'the-witcher': theWitcherTemplate,
  zelda: legendOfZeldaTemplate,
  skyrim: skyrimTemplate,
  'cyber-security': cyberSecurityTemplate,
  'devops-pipeline': devOpsPipelineTemplate,
  'software-automation': softwareAutomationTemplate,
};

export function getTemplate(templateType: TemplateType): Template {
  return templateRegistry[templateType];
}

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return Object.values(templateRegistry).filter(template => template.category === category);
}

export function getFeaturedTemplates(): Template[] {
  // Show technology templates on the main page
  return getTemplatesByCategory('technology');
}
