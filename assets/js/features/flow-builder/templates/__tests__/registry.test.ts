import { describe, it, expect } from '@jest/globals';
import {
  templateRegistry,
  getTemplate,
  getTemplatesByCategory,
  getFeaturedTemplates,
} from '../registry';
import { TemplateType, TemplateCategory } from '../../types';

describe('Template Registry', () => {
  describe('templateRegistry', () => {
    it('should contain all expected template types', () => {
      const expectedTemplates: TemplateType[] = [
        'invoice-processing',
        'employee-onboarding',
        'hr-recruitment',
        'customer-support-automation',
        'feedback-analysis',
        'social-media-content',
        'blog-generation',
        'financial-reporting',
        'predictive-analytics',
        'iot-data-processing',
        'patient-triage',
        'medical-diagnosis',
        'fraud-detection',
        'risk-assessment',
        'product-recommendation',
        'inventory-optimization',
      ];

      expectedTemplates.forEach(templateType => {
        expect(templateRegistry[templateType]).toBeDefined();
        expect(templateRegistry[templateType].id).toBe(templateType);
      });
    });

    it('should have valid template structure for all templates', () => {
      Object.values(templateRegistry).forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('nodes');
        expect(template).toHaveProperty('connections');

        expect(typeof template.id).toBe('string');
        expect(typeof template.name).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(typeof template.category).toBe('string');
        expect(Array.isArray(template.nodes)).toBe(true);
        expect(Array.isArray(template.connections)).toBe(true);
      });
    });
  });

  describe('getTemplate', () => {
    it('should return the correct template for a given type', () => {
      const template = getTemplate('invoice-processing');
      expect(template).toBeDefined();
      expect(template.id).toBe('invoice-processing');
      expect(template.name).toBe('Invoice Processing Automation');
    });

    it('should return template for all supported types', () => {
      const templateTypes: TemplateType[] = [
        'employee-onboarding',
        'hr-recruitment',
        'customer-support-automation',
      ];

      templateTypes.forEach(type => {
        const template = getTemplate(type);
        expect(template).toBeDefined();
        expect(template.id).toBe(type);
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return templates for business-automation category', () => {
      const templates = getTemplatesByCategory('business-automation');
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      templates.forEach(template => {
        expect(template.category).toBe('business-automation');
      });
    });

    it('should return templates for each category', () => {
      const categories: TemplateCategory[] = [
        'business-automation',
        'customer-service',
        'content-creation',
        'data-analysis',
        'healthcare',
        'finance',
        'e-commerce',
      ];

      categories.forEach(category => {
        const templates = getTemplatesByCategory(category);
        expect(Array.isArray(templates)).toBe(true);
        expect(templates.length).toBeGreaterThan(0);

        templates.forEach(template => {
          expect(template.category).toBe(category);
        });
      });
    });

    it('should return empty array for non-existent category', () => {
      const templates = getTemplatesByCategory('non-existent' as TemplateCategory);
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBe(0);
    });
  });

  describe('getFeaturedTemplates', () => {
    it('should return business automation templates', () => {
      const featured = getFeaturedTemplates();
      expect(Array.isArray(featured)).toBe(true);
      expect(featured.length).toBeGreaterThan(0);

      featured.forEach(template => {
        expect(template.category).toBe('business-automation');
      });
    });

    it('should return the same as getTemplatesByCategory for business-automation', () => {
      const featured = getFeaturedTemplates();
      const businessTemplates = getTemplatesByCategory('business-automation');

      expect(featured).toEqual(businessTemplates);
    });
  });

  describe('Template Node Coverage', () => {
    it('should use all available node types across templates', () => {
      const expectedNodeTypes = [
        'input',
        'output',
        'skill',
        'agent',
        'decision',
        'sensor',
        'memory',
        'transform',
        'api',
        'loop',
      ];

      const allTemplates = Object.values(templateRegistry);
      const usedNodeTypes = new Set<string>();

      allTemplates.forEach(template => {
        template.nodes.forEach(node => {
          usedNodeTypes.add(node.type);
        });
      });

      expectedNodeTypes.forEach(nodeType => {
        expect(usedNodeTypes.has(nodeType)).toBe(true);
      });
    });

    it('should have realistic node and connection counts', () => {
      Object.values(templateRegistry).forEach(template => {
        expect(template.nodes.length).toBeGreaterThanOrEqual(3);
        expect(template.nodes.length).toBeLessThanOrEqual(20);
        expect(template.connections.length).toBeGreaterThanOrEqual(2);
        expect(template.connections.length).toBeLessThanOrEqual(30);
      });
    });
  });
});
