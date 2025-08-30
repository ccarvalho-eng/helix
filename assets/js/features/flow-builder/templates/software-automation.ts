import { Template } from "../types";

export const softwareAutomationTemplate: Template = {
	id: "software-automation",
	name: "Software Automation",
	description: "End-to-end software development lifecycle automation",
	category: "technology",
	nodes: [
		// Requirements Input
		{
			id: "user-stories",
			type: "input",
			label: "User Stories",
			description: "Product requirements and user story backlog",
			x: 100,
			y: 250,
		},
		{
			id: "api-specs",
			type: "input",
			label: "API Specs",
			description: "OpenAPI/Swagger specifications and contracts",
			x: 100,
			y: 400,
		},
		{
			id: "design-mockups",
			type: "input",
			label: "Design Mockups",
			description: "UI/UX designs and wireframes",
			x: 100,
			y: 550,
		},

		// Analysis Phase
		{
			id: "requirements-parser",
			type: "sensor",
			label: "Requirements Parser",
			description: "Extract and analyze development requirements",
			x: 300,
			y: 200,
			config: {
				source_type: "document_analysis",
				formats: "markdown, confluence, figma",
			},
		},
		{
			id: "architecture-analysis",
			type: "skill",
			label: "Architecture Analysis",
			description: "System design and technical architecture planning",
			x: 300,
			y: 350,
			config: { skill_type: "system_design", parameters: "microservices, patterns" },
		},
		{
			id: "dependency-mapping",
			type: "skill",
			label: "Dependency Mapping",
			description: "Map system dependencies and integrations",
			x: 300,
			y: 500,
			config: {
				skill_type: "data_transform",
				parameters: "service_mesh, api_dependencies",
			},
		},

		// Planning Decision
		{
			id: "development-scope",
			type: "decision",
			label: "Development Scope?",
			description: "Determine automation complexity and approach",
			x: 500,
			y: 350,
			config: {
				condition_type: "javascript",
				condition: "assessDevelopmentScope(context)",
			},
		},

		// Development Team
		{
			id: "tech-lead",
			type: "agent",
			label: "Tech Lead",
			description: "Technical leadership and architecture decisions",
			x: 700,
			y: 100,
			config: {
				model: "gpt-4",
				temperature: 0.25,
				max_tokens: 900,
				system_prompt: "Lead technical architecture and code review processes.",
			},
		},
		{
			id: "full-stack-dev",
			type: "agent",
			label: "Full Stack Developer",
			description: "Frontend and backend development automation",
			x: 700,
			y: 250,
			config: {
				model: "claude-3",
				temperature: 0.3,
				max_tokens: 800,
				system_prompt: "Generate full-stack code and implement features.",
			},
		},
		{
			id: "test-automation-engineer",
			type: "agent",
			label: "Test Automation Engineer",
			description: "Automated testing strategy and implementation",
			x: 700,
			y: 400,
			config: {
				model: "claude-3",
				temperature: 0.2,
				max_tokens: 700,
				system_prompt: "Design and implement comprehensive test automation.",
			},
		},
		{
			id: "devops-automation",
			type: "agent",
			label: "DevOps Automation",
			description: "CI/CD pipeline and infrastructure automation",
			x: 700,
			y: 550,
			config: {
				model: "llama-2",
				temperature: 0.25,
				max_tokens: 650,
				system_prompt: "Automate deployment and infrastructure provisioning.",
			},
		},

		// Code Generation Skills
		{
			id: "code-scaffolding",
			type: "skill",
			label: "Code Scaffolding",
			description: "Generate project structure and boilerplate code",
			x: 900,
			y: 100,
			config: { skill_type: "code_generation", framework: "react, express, spring" },
		},
		{
			id: "api-generation",
			type: "skill",
			label: "API Generation",
			description: "Auto-generate REST APIs from specifications",
			x: 900,
			y: 200,
			config: { skill_type: "code_generation", type: "openapi_codegen" },
		},
		{
			id: "database-schema",
			type: "skill",
			label: "Database Schema",
			description: "Generate database schemas and migrations",
			x: 900,
			y: 300,
			config: { skill_type: "code_generation", type: "orm_migrations" },
		},
		{
			id: "ui-components",
			type: "skill",
			label: "UI Components",
			description: "Generate reusable UI components from designs",
			x: 900,
			y: 400,
			config: { skill_type: "code_generation", framework: "react, vue, angular" },
		},

		// Testing & Quality Skills
		{
			id: "test-generation",
			type: "skill",
			label: "Test Generation",
			description: "Auto-generate unit and integration tests",
			x: 1100,
			y: 150,
			config: { skill_type: "test_generation", framework: "jest, pytest, junit" },
		},
		{
			id: "code-review-bot",
			type: "skill",
			label: "Code Review Bot",
			description: "Automated code review and quality analysis",
			x: 1100,
			y: 250,
			config: { skill_type: "code_analysis", tools: "eslint, sonarqube, codeclimate" },
		},
		{
			id: "documentation-gen",
			type: "skill",
			label: "Documentation Gen",
			description: "Auto-generate API docs and code documentation",
			x: 1100,
			y: 350,
			config: { skill_type: "doc_generation", format: "swagger, jsdoc, sphinx" },
		},
		{
			id: "performance-tests",
			type: "skill",
			label: "Performance Tests",
			description: "Automated performance and load testing",
			x: 1100,
			y: 450,
			config: { skill_type: "performance_testing", tools: "k6, jmeter, artillery" },
		},

		// Automation Strategy
		{
			id: "automation-level",
			type: "decision",
			label: "Automation Level?",
			description: "Determine level of automation for deployment",
			x: 1300,
			y: 300,
			config: {
				condition_type: "javascript",
				condition: "selectAutomationLevel(context)",
			},
		},

		// Automation Approaches
		{
			id: "full-automation",
			type: "skill",
			label: "Full Automation",
			description: "Complete end-to-end automation pipeline",
			x: 1500,
			y: 150,
			config: { skill_type: "pipeline_automation", level: "full" },
		},
		{
			id: "semi-automation",
			type: "skill",
			label: "Semi Automation",
			description: "Partial automation with manual checkpoints",
			x: 1500,
			y: 300,
			config: { skill_type: "pipeline_automation", level: "semi" },
		},
		{
			id: "manual-review",
			type: "skill",
			label: "Manual Review",
			description: "Human oversight with automated assistance",
			x: 1500,
			y: 450,
			config: { skill_type: "manual_process", assistance: "automated" },
		},

		// Quality Check
		{
			id: "quality-gates",
			type: "decision",
			label: "Quality Gates?",
			description: "Verify code quality and test coverage",
			x: 1700,
			y: 300,
			config: { condition_type: "simple", condition: "coverage >= 80 && quality_gate == 'passed'" },
		},

		// Delivery Activities
		{
			id: "feature-flag",
			type: "skill",
			label: "Feature Flags",
			description: "Dynamic feature toggles and A/B testing",
			x: 1900,
			y: 150,
			config: { skill_type: "feature_management", provider: "launchdarkly, unleash" },
		},
		{
			id: "release-automation",
			type: "skill",
			label: "Release Automation",
			description: "Automated release notes and version management",
			x: 1900,
			y: 300,
			config: { skill_type: "release_management", tools: "semantic-release, conventional-commits" },
		},
		{
			id: "monitoring-alerts",
			type: "skill",
			label: "Monitoring & Alerts",
			description: "Application monitoring and alerting setup",
			x: 1900,
			y: 450,
			config: { skill_type: "observability", tools: "datadog, newrelic, sentry" },
		},

		// Final Output
		{
			id: "deployment-ready",
			type: "output",
			label: "Deployment Ready",
			description: "Production-ready application with full automation",
			x: 2100,
			y: 300,
		},
	],
	connections: [
		// Requirements to Analysis
		{
			source: "user-stories",
			target: "requirements-parser",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "api-specs",
			target: "architecture-analysis",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "design-mockups",
			target: "dependency-mapping",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "requirements-parser",
			target: "development-scope",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "architecture-analysis",
			target: "development-scope",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dependency-mapping",
			target: "development-scope",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Development Scope to Team
		{
			source: "development-scope",
			target: "tech-lead",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "development-scope",
			target: "full-stack-dev",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "development-scope",
			target: "test-automation-engineer",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "development-scope",
			target: "devops-automation",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Team to Code Generation
		{
			source: "tech-lead",
			target: "code-scaffolding",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "full-stack-dev",
			target: "api-generation",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "full-stack-dev",
			target: "database-schema",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "full-stack-dev",
			target: "ui-components",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Team to Testing & Quality
		{
			source: "test-automation-engineer",
			target: "test-generation",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "tech-lead",
			target: "code-review-bot",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "full-stack-dev",
			target: "documentation-gen",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "test-automation-engineer",
			target: "performance-tests",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Skills to Automation Strategy
		{
			source: "code-scaffolding",
			target: "automation-level",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "api-generation",
			target: "automation-level",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "database-schema",
			target: "automation-level",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "ui-components",
			target: "automation-level",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "test-generation",
			target: "automation-level",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "code-review-bot",
			target: "automation-level",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "documentation-gen",
			target: "automation-level",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "performance-tests",
			target: "automation-level",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Automation Level to Approaches
		{
			source: "automation-level",
			target: "full-automation",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "automation-level",
			target: "semi-automation",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "automation-level",
			target: "manual-review",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Approaches to Quality Gates
		{
			source: "full-automation",
			target: "quality-gates",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "semi-automation",
			target: "quality-gates",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "manual-review",
			target: "quality-gates",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Quality Gates to Delivery
		{
			source: "quality-gates",
			target: "feature-flag",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "quality-gates",
			target: "release-automation",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "quality-gates",
			target: "monitoring-alerts",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Delivery to Final Output
		{
			source: "feature-flag",
			target: "deployment-ready",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "release-automation",
			target: "deployment-ready",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monitoring-alerts",
			target: "deployment-ready",
			sourceHandle: "right",
			targetHandle: "left",
		},
	],
};