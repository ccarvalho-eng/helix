import { Template, TemplateType } from './types';
import { assassinsCreedTemplate } from './assassins-creed';
import { lordOfTheRingsTemplate } from './lord-of-the-rings';
import { theWitcherTemplate } from './the-witcher';
import { legendOfZeldaTemplate } from './legend-of-zelda';

export const templateRegistry: Record<TemplateType, Template> = {
  'assassins-creed': assassinsCreedTemplate,
  'lotr': lordOfTheRingsTemplate,
  'the-witcher': theWitcherTemplate,
  'zelda': legendOfZeldaTemplate,
};

export function getTemplate(templateType: TemplateType): Template {
  return templateRegistry[templateType];
}

export function getAllTemplates(): Template[] {
  return Object.values(templateRegistry);
}

export function getFeaturedTemplates(): Template[] {
  // Only show these templates in the main sidebar
  return [
    templateRegistry['assassins-creed'],
    templateRegistry['lotr'],
    templateRegistry['the-witcher'],
  ];
}
