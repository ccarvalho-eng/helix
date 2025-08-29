import { Template } from "./types";

export const theWitcherTemplate: Template = {
	id: "the-witcher",
	name: "The Witcher",
	description:
		"Complex monster hunting with multiple paths and specialized witchers",
	difficulty: "advanced",
	category: "gaming",
	nodes: [
		// Input and Intelligence
		{
			id: "contract-board",
			type: "input",
			label: "Contract Board",
			description: "Receive monster hunting contract and intel",
			x: 100,
			y: 300,
		},
		{
			id: "local-rumors",
			type: "input",
			label: "Local Rumors",
			description: "Gather information from villagers and merchants",
			x: 100,
			y: 500,
		},

		// Investigation Phase
		{
			id: "witcher-senses",
			type: "sensor",
			label: "Witcher Senses",
			description: "Track monster trails and detect threats",
			x: 300,
			y: 200,
			config: {
				source_type: "polling",
				interval: 10,
				filters: "tracks, scents, sounds",
			},
		},
		{
			id: "bestiary-research",
			type: "skill",
			label: "Bestiary Research",
			description: "Study monster weaknesses and behavior",
			x: 300,
			y: 400,
			config: { skill_type: "data_transform", parameters: "classify_monster" },
		},
		{
			id: "evidence-analysis",
			type: "skill",
			label: "Evidence Analysis",
			description: "Analyze tracks, wounds, and remains",
			x: 300,
			y: 600,
			config: {
				skill_type: "data_transform",
				parameters: "blood_sample, claw_marks",
			},
		},

		// Monster Classification
		{
			id: "monster-type",
			type: "decision",
			label: "Monster Type?",
			description: "Classify the threat level and type",
			x: 500,
			y: 300,
			config: {
				condition_type: "javascript",
				condition: "determineMonsterType(context)",
			},
		},

		// Witcher Team - Different specializations
		{
			id: "geralt",
			type: "agent",
			label: "Geralt of Rivia",
			description: "White Wolf, master witcher and monster slayer",
			x: 700,
			y: 100,
			config: {
				model: "gpt-4",
				temperature: 0.35,
				max_tokens: 700,
				system_prompt: "Plan and execute optimal monster hunt tactics.",
			},
		},
		{
			id: "vesemir",
			type: "agent",
			label: "Vesemir",
			description: "Wolf School mentor, provides guidance and training",
			x: 700,
			y: 200,
			config: {
				model: "gpt-4",
				temperature: 0.25,
				max_tokens: 800,
				system_prompt: "Advise and optimize resource usage and training.",
			},
		},
		{
			id: "lambert",
			type: "agent",
			label: "Lambert",
			description: "Wolf School witcher, specializes in alchemy",
			x: 700,
			y: 300,
			config: {
				model: "claude-3",
				temperature: 0.55,
				max_tokens: 600,
				system_prompt: "Brew potions and craft bombs for specific monsters.",
			},
		},
		{
			id: "eskel",
			type: "agent",
			label: "Eskel",
			description: "Wolf School witcher, expert in signs and combat",
			x: 700,
			y: 400,
			config: {
				model: "claude-3",
				temperature: 0.45,
				max_tokens: 650,
				system_prompt: "Use signs and melee for controlled engagements.",
			},
		},
		{
			id: "coen",
			type: "agent",
			label: "Coen",
			description: "Griffin School witcher, master of signs and magic",
			x: 700,
			y: 500,
			config: {
				model: "llama-2",
				temperature: 0.5,
				max_tokens: 600,
				system_prompt: "Amplify magic strategies and support.",
			},
		},
		{
			id: "letho",
			type: "agent",
			label: "Letho",
			description: "Viper School witcher, stealth and assassination",
			x: 700,
			y: 600,
			config: {
				model: "llama-2",
				temperature: 0.6,
				max_tokens: 500,
				system_prompt: "Stealth kills and ambush planning.",
			},
		},

		// Combat Skills
		{
			id: "silver-sword",
			type: "skill",
			label: "Silver Sword",
			description: "Monster-slaying weapon and combat techniques",
			x: 900,
			y: 150,
			config: { skill_type: "custom" },
		},
		{
			id: "steel-sord",
			type: "skill",
			label: "Steel Sword",
			description: "Human and non-monster combat",
			x: 900,
			y: 250,
			config: { skill_type: "custom" },
		},
		{
			id: "crossbow",
			type: "skill",
			label: "Crossbow",
			description: "Ranged combat and flying monster hunting",
			x: 900,
			y: 350,
			config: { skill_type: "custom" },
		},

		// Magical Skills
		{
			id: "witcher-signs",
			type: "skill",
			label: "Witcher Signs",
			description: "Magical abilities: Igni, Aard, Quen, Yrden, Axii",
			x: 900,
			y: 450,
			config: { skill_type: "custom" },
		},
		{
			id: "griffin-magic",
			type: "skill",
			label: "Griffin Magic",
			description: "Enhanced magical abilities and spell casting",
			x: 900,
			y: 550,
			config: { skill_type: "custom" },
		},

		// Alchemy and Preparation
		{
			id: "alchemy-lab",
			type: "skill",
			label: "Alchemy Lab",
			description: "Potion brewing and bomb crafting",
			x: 1100,
			y: 200,
			config: { skill_type: "file_operation", parameters: "recipes.json" },
		},
		{
			id: "oil-preparation",
			type: "skill",
			label: "Oil Preparation",
			description: "Monster-specific oils for enhanced damage",
			x: 1100,
			y: 300,
			config: {
				skill_type: "data_transform",
				parameters: "oil: specter, necrophage, draconid",
			},
		},
		{
			id: "bomb-crafting",
			type: "skill",
			label: "Bomb Crafting",
			description: "Explosive devices for crowd control",
			x: 1100,
			y: 400,
			config: {
				skill_type: "data_transform",
				parameters: "grapeshot, dancing star",
			},
		},
		{
			id: "potion-brewing",
			type: "skill",
			label: "Potion Brewing",
			description: "Enhancement potions and healing",
			x: 1100,
			y: 500,
			config: {
				skill_type: "data_transform",
				parameters: "swallow, tawny owl",
			},
		},

		// Combat Strategy
		{
			id: "combat-strategy",
			type: "decision",
			label: "Combat Strategy?",
			description: "Choose approach: direct combat, stealth, or magic",
			x: 1300,
			y: 350,
			config: {
				condition_type: "javascript",
				condition: "chooseStrategy(context)",
			},
		},

		// Execution Paths
		{
			id: "direct-confrontation",
			type: "skill",
			label: "Direct Confrontation",
			description: "Face monster head-on with weapons",
			x: 1500,
			y: 200,
			config: { skill_type: "custom" },
		},
		{
			id: "stealth-approach",
			type: "skill",
			label: "Stealth Approach",
			description: "Sneak and ambush tactics",
			x: 1500,
			y: 400,
			config: { skill_type: "custom" },
		},
		{
			id: "magical-assault",
			type: "skill",
			label: "Magical Assault",
			description: "Overwhelm with signs and magic",
			x: 1500,
			y: 600,
			config: { skill_type: "custom" },
		},

		// Outcome Evaluation
		{
			id: "monster-eliminated",
			type: "decision",
			label: "Monster Eliminated?",
			description: "Evaluate if threat is neutralized",
			x: 1700,
			y: 350,
			config: { condition_type: "simple", condition: "hp <= 0" },
		},

		// Post-Hunt Activities
		{
			id: "loot-collection",
			type: "skill",
			label: "Loot Collection",
			description: "Gather monster parts and valuable items",
			x: 1900,
			y: 200,
			config: { skill_type: "file_operation", parameters: "inventory.json" },
		},
		{
			id: "contract-fulfillment",
			type: "skill",
			label: "Contract Fulfillment",
			description: "Complete paperwork and collect payment",
			x: 1900,
			y: 400,
			config: {
				skill_type: "api_call",
				endpoint: "/guild/contracts/complete",
				method: "POST",
			},
		},
		{
			id: "knowledge-update",
			type: "skill",
			label: "Knowledge Update",
			description: "Update bestiary with new findings",
			x: 1900,
			y: 600,
			config: {
				skill_type: "api_call",
				endpoint: "/bestiary/update",
				method: "POST",
			},
		},

		// Final Output
		{
			id: "hunt-report",
			type: "output",
			label: "Hunt Report",
			description: "Mission completion and payment collection",
			x: 2100,
			y: 400,
		},
	],
	connections: [
		// Initial Investigation
		{
			source: "contract-board",
			target: "witcher-senses",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "local-rumors",
			target: "bestiary-research",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "witcher-senses",
			target: "evidence-analysis",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "bestiary-research",
			target: "monster-type",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "evidence-analysis",
			target: "monster-type",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Monster Type → Witcher Assignment
		{
			source: "monster-type",
			target: "geralt",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monster-type",
			target: "vesemir",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monster-type",
			target: "lambert",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monster-type",
			target: "eskel",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monster-type",
			target: "coen",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monster-type",
			target: "letho",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Witchers → Combat Skills
		{
			source: "geralt",
			target: "silver-sword",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "vesemir",
			target: "silver-sword",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "eskel",
			target: "steel-sord",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "letho",
			target: "crossbow",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Witchers → Magical Skills
		{
			source: "geralt",
			target: "witcher-signs",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "eskel",
			target: "witcher-signs",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "coen",
			target: "griffin-magic",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Witchers → Alchemy Skills
		{
			source: "lambert",
			target: "alchemy-lab",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "vesemir",
			target: "oil-preparation",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "lambert",
			target: "bomb-crafting",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "vesemir",
			target: "potion-brewing",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Skills → Combat Strategy
		{
			source: "silver-sword",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "steel-sord",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "crossbow",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "witcher-signs",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "griffin-magic",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "alchemy-lab",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "oil-preparation",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "bomb-crafting",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "potion-brewing",
			target: "combat-strategy",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Combat Strategy → Execution Paths
		{
			source: "combat-strategy",
			target: "direct-confrontation",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "combat-strategy",
			target: "stealth-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "combat-strategy",
			target: "magical-assault",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Execution → Outcome
		{
			source: "direct-confrontation",
			target: "monster-eliminated",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "stealth-approach",
			target: "monster-eliminated",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "magical-assault",
			target: "monster-eliminated",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Outcome → Post-Hunt Activities
		{
			source: "monster-eliminated",
			target: "loot-collection",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monster-eliminated",
			target: "contract-fulfillment",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "monster-eliminated",
			target: "knowledge-update",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Post-Hunt → Final Report
		{
			source: "loot-collection",
			target: "hunt-report",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "contract-fulfillment",
			target: "hunt-report",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "knowledge-update",
			target: "hunt-report",
			sourceHandle: "right",
			targetHandle: "left",
		},
	],
};
