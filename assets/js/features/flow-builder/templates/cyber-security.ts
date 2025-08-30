import { Template } from "../types";

export const cyberSecurityTemplate: Template = {
	id: "cyber-security",
	name: "Cyber Security",
	description: "Threat detection and incident response automation",
	category: "technology",
	nodes: [
		// Input Sources
		{
			id: "security-logs",
			type: "input",
			label: "Security Logs",
			description: "Ingest logs from firewalls, IDS/IPS, and endpoints",
			x: 100,
			y: 200,
		},
		{
			id: "threat-intel",
			type: "input",
			label: "Threat Intelligence",
			description: "External threat feeds and IOC sources",
			x: 100,
			y: 350,
		},
		{
			id: "vulnerability-scans",
			type: "input",
			label: "Vulnerability Scans",
			description: "Automated vulnerability assessment results",
			x: 100,
			y: 500,
		},

		// Detection Phase
		{
			id: "log-parser",
			type: "sensor",
			label: "Log Parser",
			description: "Parse and normalize security event logs",
			x: 300,
			y: 150,
			config: {
				source_type: "streaming",
				format: "json",
				filters: "security_events, auth_failures, network_anomalies",
			},
		},
		{
			id: "anomaly-detection",
			type: "skill",
			label: "Anomaly Detection",
			description: "ML-based behavioral analysis for threat detection",
			x: 300,
			y: 300,
			config: { skill_type: "ai_model", parameters: "ml_anomaly_detector" },
		},
		{
			id: "ioc-matching",
			type: "skill",
			label: "IOC Matching",
			description: "Match indicators against threat intelligence",
			x: 300,
			y: 450,
			config: {
				skill_type: "data_transform",
				parameters: "hash_lookup, ip_reputation, domain_analysis",
			},
		},

		// Threat Classification
		{
			id: "threat-scoring",
			type: "decision",
			label: "Threat Score?",
			description: "Calculate threat severity and priority",
			x: 500,
			y: 300,
			config: {
				condition_type: "javascript",
				condition: "calculateThreatScore(context)",
			},
		},

		// Security Team
		{
			id: "soc-analyst",
			type: "agent",
			label: "SOC Analyst",
			description: "Security operations center analyst for triage",
			x: 700,
			y: 100,
			config: {
				model: "gpt-4",
				temperature: 0.2,
				max_tokens: 800,
				system_prompt: "Analyze security incidents and provide detailed threat assessment.",
			},
		},
		{
			id: "incident-responder",
			type: "agent",
			label: "Incident Responder",
			description: "Lead incident response and containment efforts",
			x: 700,
			y: 250,
			config: {
				model: "claude-3",
				temperature: 0.1,
				max_tokens: 900,
				system_prompt: "Execute incident response procedures and coordinate containment.",
			},
		},
		{
			id: "forensics-expert",
			type: "agent",
			label: "Forensics Expert",
			description: "Digital forensics and evidence collection",
			x: 700,
			y: 400,
			config: {
				model: "claude-3",
				temperature: 0.15,
				max_tokens: 700,
				system_prompt: "Conduct digital forensics analysis and preserve evidence.",
			},
		},
		{
			id: "threat-hunter",
			type: "agent",
			label: "Threat Hunter",
			description: "Proactive threat hunting and investigation",
			x: 700,
			y: 550,
			config: {
				model: "llama-2",
				temperature: 0.3,
				max_tokens: 650,
				system_prompt: "Hunt for advanced persistent threats and hidden indicators.",
			},
		},

		// Investigation Skills
		{
			id: "malware-analysis",
			type: "skill",
			label: "Malware Analysis",
			description: "Static and dynamic malware analysis",
			x: 900,
			y: 150,
			config: { skill_type: "custom" },
		},
		{
			id: "network-forensics",
			type: "skill",
			label: "Network Forensics",
			description: "Analyze network traffic and packet captures",
			x: 900,
			y: 250,
			config: { skill_type: "custom" },
		},
		{
			id: "endpoint-analysis",
			type: "skill",
			label: "Endpoint Analysis",
			description: "Host-based forensics and artifact analysis",
			x: 900,
			y: 350,
			config: { skill_type: "custom" },
		},

		// Response Skills
		{
			id: "containment",
			type: "skill",
			label: "Containment",
			description: "Isolate infected systems and block threats",
			x: 1100,
			y: 150,
			config: { skill_type: "api_call", endpoint: "/security/isolate", method: "POST" },
		},
		{
			id: "threat-blocking",
			type: "skill",
			label: "Threat Blocking",
			description: "Update firewalls and security controls",
			x: 1100,
			y: 250,
			config: {
				skill_type: "api_call",
				endpoint: "/firewall/block",
				method: "POST",
			},
		},
		{
			id: "evidence-collection",
			type: "skill",
			label: "Evidence Collection",
			description: "Preserve digital evidence and create forensic images",
			x: 1100,
			y: 350,
			config: {
				skill_type: "file_operation",
				parameters: "forensic_imaging, hash_verification",
			},
		},
		{
			id: "ioc-enrichment",
			type: "skill",
			label: "IOC Enrichment",
			description: "Enrich indicators with threat intelligence",
			x: 1100,
			y: 450,
			config: {
				skill_type: "data_transform",
				parameters: "threat_intel_lookup, attribution_analysis",
			},
		},

		// Response Strategy
		{
			id: "response-strategy",
			type: "decision",
			label: "Response Strategy?",
			description: "Choose response approach based on threat severity",
			x: 1300,
			y: 300,
			config: {
				condition_type: "javascript",
				condition: "selectResponseStrategy(context)",
			},
		},

		// Response Actions
		{
			id: "automated-response",
			type: "skill",
			label: "Automated Response",
			description: "Execute automated containment and remediation",
			x: 1500,
			y: 150,
			config: { skill_type: "custom" },
		},
		{
			id: "manual-investigation",
			type: "skill",
			label: "Manual Investigation",
			description: "Deep dive analysis requiring human expertise",
			x: 1500,
			y: 350,
			config: { skill_type: "custom" },
		},
		{
			id: "escalation",
			type: "skill",
			label: "Escalation",
			description: "Escalate to senior analysts and external resources",
			x: 1500,
			y: 550,
			config: { skill_type: "custom" },
		},

		// Verification
		{
			id: "threat-eliminated",
			type: "decision",
			label: "Threat Eliminated?",
			description: "Verify successful threat remediation",
			x: 1700,
			y: 300,
			config: { condition_type: "simple", condition: "threat_active == false" },
		},

		// Post-Incident Activities
		{
			id: "incident-report",
			type: "skill",
			label: "Incident Report",
			description: "Generate comprehensive incident documentation",
			x: 1900,
			y: 150,
			config: {
				skill_type: "api_call",
				endpoint: "/incidents/report",
				method: "POST",
			},
		},
		{
			id: "lessons-learned",
			type: "skill",
			label: "Lessons Learned",
			description: "Analyze incident for security improvements",
			x: 1900,
			y: 350,
			config: {
				skill_type: "data_transform",
				parameters: "root_cause_analysis, recommendations",
			},
		},
		{
			id: "threat-intel-update",
			type: "skill",
			label: "Threat Intel Update",
			description: "Update threat intelligence with new IOCs",
			x: 1900,
			y: 550,
			config: {
				skill_type: "api_call",
				endpoint: "/threat-intel/update",
				method: "POST",
			},
		},

		// Final Output
		{
			id: "security-posture",
			type: "output",
			label: "Security Posture",
			description: "Updated security posture and defense readiness",
			x: 2100,
			y: 350,
		},
	],
	connections: [
		// Initial Detection
		{
			source: "security-logs",
			target: "log-parser",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-intel",
			target: "anomaly-detection",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "vulnerability-scans",
			target: "ioc-matching",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "log-parser",
			target: "threat-scoring",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "anomaly-detection",
			target: "threat-scoring",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "ioc-matching",
			target: "threat-scoring",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Threat Scoring to Team Assignment
		{
			source: "threat-scoring",
			target: "soc-analyst",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-scoring",
			target: "incident-responder",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-scoring",
			target: "forensics-expert",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-scoring",
			target: "threat-hunter",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Team to Investigation Skills
		{
			source: "soc-analyst",
			target: "malware-analysis",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "incident-responder",
			target: "network-forensics",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "forensics-expert",
			target: "endpoint-analysis",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Team to Response Skills
		{
			source: "incident-responder",
			target: "containment",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "soc-analyst",
			target: "threat-blocking",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "forensics-expert",
			target: "evidence-collection",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-hunter",
			target: "ioc-enrichment",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Skills to Response Strategy
		{
			source: "malware-analysis",
			target: "response-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "network-forensics",
			target: "response-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "endpoint-analysis",
			target: "response-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "containment",
			target: "response-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-blocking",
			target: "response-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "evidence-collection",
			target: "response-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "ioc-enrichment",
			target: "response-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Response Strategy to Actions
		{
			source: "response-strategy",
			target: "automated-response",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "response-strategy",
			target: "manual-investigation",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "response-strategy",
			target: "escalation",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Actions to Verification
		{
			source: "automated-response",
			target: "threat-eliminated",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "manual-investigation",
			target: "threat-eliminated",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "escalation",
			target: "threat-eliminated",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Verification to Post-Incident
		{
			source: "threat-eliminated",
			target: "incident-report",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-eliminated",
			target: "lessons-learned",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-eliminated",
			target: "threat-intel-update",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Post-Incident to Final Output
		{
			source: "incident-report",
			target: "security-posture",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "lessons-learned",
			target: "security-posture",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "threat-intel-update",
			target: "security-posture",
			sourceHandle: "right",
			targetHandle: "left",
		},
	],
};