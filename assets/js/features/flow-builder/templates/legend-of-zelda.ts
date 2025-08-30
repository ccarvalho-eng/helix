import { Template } from "../types";

export const legendOfZeldaTemplate: Template = {
	id: "zelda",
	name: "Legend of Zelda",
	description: "Link, Zelda & companions on a quest to save Hyrule",
	category: "gaming",
	nodes: [
		// Inputs / Sensors
		{
			id: "hyrule-crisis",
			type: "input",
			label: "Hyrule Crisis",
			description: "Ganondorf threatens the kingdom of Hyrule",
			x: 100,
			y: 300,
		},
		{
			id: "prophecy-sensor",
			type: "sensor",
			label: "Ancient Prophecy",
			description: "Monitors ancient texts for guidance",
			x: 100,
			y: 450,
			config: {
				source_type: "pubsub",
				endpoint: "hyrule:prophecies",
				filters: "triforce matters",
			},
		},

		// Heroes
		{
			id: "link",
			type: "agent",
			label: "Link",
			description: "Hero of Hyrule, brave and determined",
			x: 360,
			y: 200,
			config: {
				model: "gpt-4",
				temperature: 0.4,
				max_tokens: 500,
				system_prompt: "Be brave, help others, and never give up.",
			},
		},
		{
			id: "zelda",
			type: "agent",
			label: "Princess Zelda",
			description: "Wise princess with magical abilities",
			x: 360,
			y: 320,
			config: {
				model: "gpt-4",
				temperature: 0.3,
				max_tokens: 600,
				system_prompt: "Provide wisdom and magical guidance.",
			},
		},
		{
			id: "navi",
			type: "agent",
			label: "Navi",
			description: "Fairy companion providing guidance",
			x: 360,
			y: 440,
			config: {
				model: "claude-3",
				temperature: 0.6,
				max_tokens: 250,
				system_prompt: "Hey! Listen! Provide helpful hints and warnings.",
			},
		},

		// Allies
		{
			id: "impa",
			type: "agent",
			label: "Impa",
			description: "Sheikah warrior and Zelda's guardian",
			x: 600,
			y: 180,
			config: {
				model: "claude-3",
				temperature: 0.2,
				max_tokens: 400,
				system_prompt: "Protect the princess and provide tactical wisdom.",
			},
		},
		{
			id: "saria",
			type: "agent",
			label: "Saria",
			description: "Forest sage and childhood friend",
			x: 600,
			y: 280,
			config: {
				model: "llama-2",
				temperature: 0.7,
				max_tokens: 350,
				system_prompt: "Provide forest wisdom and emotional support.",
			},
		},
		{
			id: "epona",
			type: "agent",
			label: "Epona",
			description: "Loyal horse companion for travel",
			x: 600,
			y: 380,
			config: {
				model: "llama-2",
				temperature: 0.5,
				max_tokens: 200,
				system_prompt: "Provide swift transportation and loyal companionship.",
			},
		},

		// Skills / Items
		{
			id: "master-sword",
			type: "skill",
			label: "Master Sword",
			description: "Legendary blade that repels evil",
			x: 860,
			y: 160,
			config: { skill_type: "custom" },
		},
		{
			id: "hylian-shield",
			type: "skill",
			label: "Hylian Shield",
			description: "Unbreakable defense against attacks",
			x: 860,
			y: 230,
			config: { skill_type: "custom" },
		},
		{
			id: "triforce-wisdom",
			type: "skill",
			label: "Triforce of Wisdom",
			description: "Ancient power of knowledge and insight",
			x: 860,
			y: 300,
			config: { skill_type: "custom" },
		},
		{
			id: "kokiri-flute",
			type: "skill",
			label: "Ocarina of Time",
			description: "Magical instrument controlling time and space",
			x: 860,
			y: 370,
			config: { skill_type: "custom" },
		},
		{
			id: "hookshot",
			type: "skill",
			label: "Hookshot",
			description: "Tool for reaching distant places and combat",
			x: 860,
			y: 440,
			config: { skill_type: "custom" },
		},
		{
			id: "bow-arrows",
			type: "skill",
			label: "Hero's Bow",
			description: "Ranged weapon with various arrow types",
			x: 860,
			y: 510,
			config: { skill_type: "custom" },
		},

		// Decisions
		{
			id: "temple-choice",
			type: "decision",
			label: "Which Temple?",
			description: "Choose the next temple to cleanse",
			x: 1100,
			y: 280,
			config: {
				condition_type: "simple",
				condition: 'next_temple in ["forest", "fire", "water", "shadow", "spirit"]',
			},
		},
		{
			id: "dungeon-challenge",
			type: "decision",
			label: "Dungeon Challenge?",
			description: "Face puzzles, enemies, or boss",
			x: 1300,
			y: 180,
			config: {
				condition_type: "simple",
				condition: "challenge_type in [puzzle, combat, boss]",
			},
		},
		{
			id: "time-travel",
			type: "decision",
			label: "Time Travel?",
			description: "Use the Master Sword to travel through time",
			x: 1300,
			y: 380,
			config: {
				condition_type: "simple",
				condition: "need_adult_link && master_sword_available",
			},
		},

		// Support
		{
			id: "sage-guidance",
			type: "skill",
			label: "Sage Guidance",
			description: "Wisdom and power from awakened sages",
			x: 1500,
			y: 280,
			config: { skill_type: "custom" },
		},

		// Final outcomes
		{
			id: "ganondorf-battle",
			type: "decision",
			label: "Final Battle?",
			description: "Ready to face Ganondorf?",
			x: 1700,
			y: 280,
			config: {
				condition_type: "simple",
				condition: "all_temples_complete && triforce_power >= threshold",
			},
		},
		{
			id: "hyrule-saved",
			type: "output",
			label: "Hyrule Saved",
			description: "Peace restored to the kingdom",
			x: 1900,
			y: 280,
		},
	],
	connections: [
		// Setup
		{
			source: "hyrule-crisis",
			target: "link",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "prophecy-sensor",
			target: "zelda",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "prophecy-sensor",
			target: "link",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Team formation
		{
			source: "link",
			target: "navi",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "zelda",
			target: "impa",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Ally connections
		{
			source: "link",
			target: "saria",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "link",
			target: "epona",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Equipment connections
		{
			source: "link",
			target: "master-sword",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "link",
			target: "hylian-shield",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "link",
			target: "hookshot",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "link",
			target: "bow-arrows",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "zelda",
			target: "triforce-wisdom",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "saria",
			target: "kokiri-flute",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Skills to decision
		{
			source: "master-sword",
			target: "temple-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "hylian-shield",
			target: "temple-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "triforce-wisdom",
			target: "temple-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "kokiri-flute",
			target: "temple-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Temple choices
		{
			source: "temple-choice",
			target: "dungeon-challenge",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "temple-choice",
			target: "time-travel",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Challenge results
		{
			source: "dungeon-challenge",
			target: "sage-guidance",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "time-travel",
			target: "sage-guidance",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Final progression
		{
			source: "sage-guidance",
			target: "ganondorf-battle",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Victory
		{
			source: "ganondorf-battle",
			target: "hyrule-saved",
			sourceHandle: "right",
			targetHandle: "left",
		},
	],
};