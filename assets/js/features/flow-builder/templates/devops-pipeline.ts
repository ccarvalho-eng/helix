import { Template } from "./types";

export const devOpsPipelineTemplate: Template = {
	id: "devops-pipeline",
	name: "DevOps Pipeline",
	description: "CI/CD automation with testing, deployment, and monitoring",
	category: "technology",
	nodes: [
		// Source Control
		{
			id: "code-commit",
			type: "input",
			label: "Code Commit",
			description: "Developer commits code to version control",
			x: 100,
			y: 300,
		},
		{
			id: "pull-request",
			type: "input",
			label: "Pull Request",
			description: "Code review and merge requests",
			x: 100,
			y: 450,
		},

		// Build Trigger
		{
			id: "webhook-trigger",
			type: "sensor",
			label: "Webhook Trigger",
			description: "CI/CD pipeline triggered by repository events",
			x: 300,
			y: 250,
			config: {
				source_type: "webhook",
				events: "push, pull_request, tag",
			},
		},
		{
			id: "code-analysis",
			type: "skill",
			label: "Code Analysis",
			description: "Static code analysis and quality checks",
			x: 300,
			y: 400,
			config: { skill_type: "code_analysis", parameters: "sonarqube, eslint" },
		},
		{
			id: "dependency-scan",
			type: "skill",
			label: "Dependency Scan",
			description: "Security vulnerability scanning of dependencies",
			x: 300,
			y: 550,
			config: {
				skill_type: "security_scan",
				parameters: "npm_audit, snyk, dependabot",
			},
		},

		// Pipeline Decision
		{
			id: "pipeline-gate",
			type: "decision",
			label: "Pipeline Gate?",
			description: "Quality gates and branch protection rules",
			x: 500,
			y: 350,
			config: {
				condition_type: "javascript",
				condition: "checkQualityGates(context)",
			},
		},

		// DevOps Team
		{
			id: "build-engineer",
			type: "agent",
			label: "Build Engineer",
			description: "Manages build processes and artifact generation",
			x: 700,
			y: 150,
			config: {
				model: "gpt-4",
				temperature: 0.2,
				max_tokens: 700,
				system_prompt: "Optimize build processes and manage CI/CD pipelines.",
			},
		},
		{
			id: "qa-engineer",
			type: "agent",
			label: "QA Engineer",
			description: "Automated testing and quality assurance",
			x: 700,
			y: 300,
			config: {
				model: "claude-3",
				temperature: 0.25,
				max_tokens: 650,
				system_prompt: "Design and execute comprehensive testing strategies.",
			},
		},
		{
			id: "devops-engineer",
			type: "agent",
			label: "DevOps Engineer",
			description: "Infrastructure automation and deployment",
			x: 700,
			y: 450,
			config: {
				model: "claude-3",
				temperature: 0.3,
				max_tokens: 800,
				system_prompt: "Automate infrastructure and deployment processes.",
			},
		},
		{
			id: "sre",
			type: "agent",
			label: "SRE",
			description: "Site reliability and monitoring systems",
			x: 700,
			y: 600,
			config: {
				model: "llama-2",
				temperature: 0.2,
				max_tokens: 600,
				system_prompt: "Ensure system reliability and performance monitoring.",
			},
		},

		// Build & Test Skills
		{
			id: "unit-tests",
			type: "skill",
			label: "Unit Tests",
			description: "Automated unit test execution",
			x: 900,
			y: 100,
			config: { skill_type: "test_execution", framework: "jest, pytest" },
		},
		{
			id: "integration-tests",
			type: "skill",
			label: "Integration Tests",
			description: "API and service integration testing",
			x: 900,
			y: 200,
			config: { skill_type: "test_execution", framework: "postman, cypress" },
		},
		{
			id: "docker-build",
			type: "skill",
			label: "Docker Build",
			description: "Container image build and registry push",
			x: 900,
			y: 300,
			config: { skill_type: "container_build", registry: "docker_hub, ecr" },
		},
		{
			id: "security-scan",
			type: "skill",
			label: "Security Scan",
			description: "Container and application security scanning",
			x: 900,
			y: 400,
			config: { skill_type: "security_scan", tools: "trivy, clair" },
		},

		// Infrastructure Skills
		{
			id: "terraform-deploy",
			type: "skill",
			label: "Terraform Deploy",
			description: "Infrastructure as Code provisioning",
			x: 1100,
			y: 150,
			config: { skill_type: "iac_deploy", provider: "aws, azure, gcp" },
		},
		{
			id: "k8s-deploy",
			type: "skill",
			label: "K8s Deploy",
			description: "Kubernetes deployment and scaling",
			x: 1100,
			y: 250,
			config: { skill_type: "k8s_deploy", tool: "helm, kustomize" },
		},
		{
			id: "monitoring-setup",
			type: "skill",
			label: "Monitoring Setup",
			description: "Application and infrastructure monitoring",
			x: 1100,
			y: 350,
			config: { skill_type: "monitoring", tools: "prometheus, grafana, datadog" },
		},
		{
			id: "load-balancer",
			type: "skill",
			label: "Load Balancer",
			description: "Traffic routing and load distribution",
			x: 1100,
			y: 450,
			config: { skill_type: "networking", provider: "alb, nginx, envoy" },
		},

		// Deployment Strategy
		{
			id: "deployment-strategy",
			type: "decision",
			label: "Deployment Strategy?",
			description: "Choose deployment approach based on environment",
			x: 1300,
			y: 300,
			config: {
				condition_type: "javascript",
				condition: "selectDeploymentStrategy(context)",
			},
		},

		// Deployment Types
		{
			id: "blue-green",
			type: "skill",
			label: "Blue-Green Deploy",
			description: "Zero-downtime deployment with traffic switching",
			x: 1500,
			y: 150,
			config: { skill_type: "deployment", strategy: "blue_green" },
		},
		{
			id: "canary-deploy",
			type: "skill",
			label: "Canary Deploy",
			description: "Gradual rollout with monitoring",
			x: 1500,
			y: 300,
			config: { skill_type: "deployment", strategy: "canary" },
		},
		{
			id: "rolling-update",
			type: "skill",
			label: "Rolling Update",
			description: "Progressive instance replacement",
			x: 1500,
			y: 450,
			config: { skill_type: "deployment", strategy: "rolling" },
		},

		// Verification
		{
			id: "deployment-success",
			type: "decision",
			label: "Deployment Success?",
			description: "Health checks and deployment verification",
			x: 1700,
			y: 300,
			config: { condition_type: "simple", condition: "health_check == 'passing'" },
		},

		// Post-Deployment
		{
			id: "smoke-tests",
			type: "skill",
			label: "Smoke Tests",
			description: "Post-deployment verification tests",
			x: 1900,
			y: 150,
			config: { skill_type: "test_execution", type: "smoke_tests" },
		},
		{
			id: "performance-tests",
			type: "skill",
			label: "Performance Tests",
			description: "Load testing and performance validation",
			x: 1900,
			y: 300,
			config: { skill_type: "test_execution", tools: "jmeter, k6" },
		},
		{
			id: "rollback-plan",
			type: "skill",
			label: "Rollback Plan",
			description: "Automated rollback on deployment failure",
			x: 1900,
			y: 450,
			config: { skill_type: "rollback", automation: "true" },
		},

		// Final Output
		{
			id: "pipeline-report",
			type: "output",
			label: "Pipeline Report",
			description: "Deployment status and performance metrics",
			x: 2100,
			y: 300,
		},
	],
	connections: [
		// Source to Pipeline
		{
			source: "code-commit",
			target: "webhook-trigger",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "pull-request",
			target: "code-analysis",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "webhook-trigger",
			target: "dependency-scan",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "code-analysis",
			target: "pipeline-gate",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dependency-scan",
			target: "pipeline-gate",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Pipeline Gate to Team
		{
			source: "pipeline-gate",
			target: "build-engineer",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "pipeline-gate",
			target: "qa-engineer",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "pipeline-gate",
			target: "devops-engineer",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "pipeline-gate",
			target: "sre",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Team to Build & Test Skills
		{
			source: "build-engineer",
			target: "unit-tests",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "qa-engineer",
			target: "integration-tests",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "build-engineer",
			target: "docker-build",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "devops-engineer",
			target: "security-scan",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Team to Infrastructure Skills
		{
			source: "devops-engineer",
			target: "terraform-deploy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "devops-engineer",
			target: "k8s-deploy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "sre",
			target: "monitoring-setup",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "devops-engineer",
			target: "load-balancer",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Skills to Deployment Strategy
		{
			source: "unit-tests",
			target: "deployment-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "integration-tests",
			target: "deployment-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "docker-build",
			target: "deployment-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "security-scan",
			target: "deployment-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "terraform-deploy",
			target: "deployment-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "k8s-deploy",
			target: "deployment-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monitoring-setup",
			target: "deployment-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "load-balancer",
			target: "deployment-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Deployment Strategy to Types
		{
			source: "deployment-strategy",
			target: "blue-green",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "deployment-strategy",
			target: "canary-deploy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "deployment-strategy",
			target: "rolling-update",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Deployment to Verification
		{
			source: "blue-green",
			target: "deployment-success",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "canary-deploy",
			target: "deployment-success",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "rolling-update",
			target: "deployment-success",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Verification to Post-Deployment
		{
			source: "deployment-success",
			target: "smoke-tests",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "deployment-success",
			target: "performance-tests",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "deployment-success",
			target: "rollback-plan",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Post-Deployment to Final Output
		{
			source: "smoke-tests",
			target: "pipeline-report",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "performance-tests",
			target: "pipeline-report",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "rollback-plan",
			target: "pipeline-report",
			sourceHandle: "right",
			targetHandle: "left",
		},
	],
};