import { Template } from '../types';

export const medicalDiagnosisTemplate: Template = {
  id: 'medical-diagnosis',
  name: 'AI Medical Diagnosis Assistant',
  description: 'AI-assisted medical diagnosis and treatment recommendations',
  category: 'healthcare',
  nodes: [
    {
      id: 'patient-symptoms',
      type: 'input',
      label: 'Patient Symptoms',
      description: 'Patient reported symptoms and medical history',
      x: 100,
      y: 250,
    },
    {
      id: 'medical-ai',
      type: 'agent',
      label: 'Medical AI Assistant',
      description: 'AI trained on medical knowledge and diagnostic protocols',
      x: 300,
      y: 250,
      config: {
        model: 'medical-llm',
        temperature: 0.1,
        max_tokens: 1000,
        system_prompt: 'Analyze patient symptoms and provide differential diagnosis suggestions.',
      },
    },
    {
      id: 'diagnosis-output',
      type: 'output',
      label: 'Diagnosis Suggestions',
      description: 'AI-generated diagnosis recommendations for medical review',
      x: 500,
      y: 250,
    },
  ],
  connections: [
    {
      source: 'patient-symptoms',
      target: 'medical-ai',
      sourceHandle: 'right',
      targetHandle: 'left',
    },
    {
      source: 'medical-ai',
      target: 'diagnosis-output',
      sourceHandle: 'right',
      targetHandle: 'left',
    },
  ],
};
