import { Template, TemplateType } from './types';
import { assassinsCreedTemplate } from './assassins-creed';
import { lordOfTheRingsTemplate } from './lord-of-the-rings';
import { theWitcherTemplate } from './the-witcher';

export const templateRegistry: Record<TemplateType, Template> = {
  'assassins-creed': assassinsCreedTemplate,
  'lotr': lordOfTheRingsTemplate,
  'the-witcher': theWitcherTemplate,
};

export function getTemplate(templateType: TemplateType): Template {
  return templateRegistry[templateType];
}

export function getAllTemplates(): Template[] {
  return Object.values(templateRegistry);
}
