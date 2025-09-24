import { Template, TemplateType, TemplateCategory } from '../types';
import { invoiceProcessingTemplate } from './definitions/invoice-processing';
import { employeeOnboardingTemplate } from './definitions/employee-onboarding';
import { hrRecruitmentTemplate } from './definitions/hr-recruitment';
import { customerSupportAutomationTemplate } from './definitions/customer-support-automation';
import { feedbackAnalysisTemplate } from './definitions/feedback-analysis';
import { socialMediaContentTemplate } from './definitions/social-media-content';
import { blogGenerationTemplate } from './definitions/blog-generation';
import { financialReportingTemplate } from './definitions/financial-reporting';
import { predictiveAnalyticsTemplate } from './definitions/predictive-analytics';
import { iotDataProcessingTemplate } from './definitions/iot-data-processing';
import { patientTriageTemplate } from './definitions/patient-triage';
import { medicalDiagnosisTemplate } from './definitions/medical-diagnosis';
import { fraudDetectionTemplate } from './definitions/fraud-detection';
import { riskAssessmentTemplate } from './definitions/risk-assessment';
import { productRecommendationTemplate } from './definitions/product-recommendation';
import { inventoryOptimizationTemplate } from './definitions/inventory-optimization';

export const templateRegistry: Record<TemplateType, Template> = {
  'invoice-processing': invoiceProcessingTemplate,
  'employee-onboarding': employeeOnboardingTemplate,
  'hr-recruitment': hrRecruitmentTemplate,
  'customer-support-automation': customerSupportAutomationTemplate,
  'feedback-analysis': feedbackAnalysisTemplate,
  'social-media-content': socialMediaContentTemplate,
  'blog-generation': blogGenerationTemplate,
  'financial-reporting': financialReportingTemplate,
  'predictive-analytics': predictiveAnalyticsTemplate,
  'iot-data-processing': iotDataProcessingTemplate,
  'patient-triage': patientTriageTemplate,
  'medical-diagnosis': medicalDiagnosisTemplate,
  'fraud-detection': fraudDetectionTemplate,
  'risk-assessment': riskAssessmentTemplate,
  'product-recommendation': productRecommendationTemplate,
  'inventory-optimization': inventoryOptimizationTemplate,
};

export function getTemplate(templateType: TemplateType): Template {
  return templateRegistry[templateType];
}

export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return Object.values(templateRegistry).filter(template => template.category === category);
}

export function getFeaturedTemplates(): Template[] {
  // Show one template from different categories to demonstrate variety
  const allTemplates = Object.values(templateRegistry);
  const featuredTemplates: Template[] = [];

  // Get one from each category to showcase different icons
  const seenCategories = new Set<TemplateCategory>();

  for (const template of allTemplates) {
    if (!seenCategories.has(template.category) && featuredTemplates.length < 3) {
      featuredTemplates.push(template);
      seenCategories.add(template.category);
    }
  }

  // If we don't have 3 different categories, fill with business-automation
  if (featuredTemplates.length < 3) {
    const businessTemplates = getTemplatesByCategory('business-automation');
    for (const template of businessTemplates) {
      if (!featuredTemplates.includes(template) && featuredTemplates.length < 3) {
        featuredTemplates.push(template);
      }
    }
  }

  return featuredTemplates;
}
