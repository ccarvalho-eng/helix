import { Template } from "../types";

export const skyrimTemplate: Template = {
	id: "skyrim",
	name: "Skyrim",
	description: "Dragon hunting and Thu'um mastery with the Dragonborn",
	category: "gaming",
	nodes: [
		// Input and Intelligence
		{
			id: "dragon-sighting",
			type: "input",
			label: "Dragon Sighting",
			description: "Receive reports of dragon attacks and locations",
			x: 100,
			y: 300,
		},
		{
			id: "greybeard-summons",
			type: "input",
			label: "Greybeard Summons",
			description: "Receive call from High Hrothgar for Thu'um training",
			x: 100,
			y: 500,
		},

		// Investigation Phase
		{
			id: "dragon-tracking",
			type: "sensor",
			label: "Dragon Tracking",
			description: "Track dragon movements and behavior patterns",
			x: 300,
			y: 200,
			config: {
				source_type: "polling",
				interval: 15,
				filters: "wing_patterns, roar_frequency, flight_path",
			},
		},
		{
			id: "ancient-knowledge",
			type: "skill",
			label: "Ancient Knowledge",
			description: "Study dragon lore and Thu'um mechanics",
			x: 300,
			y: 400,
			config: { skill_type: "data_transform", parameters: "classify_dragon_type" },
		},
		{
			id: "word-wall-research",
			type: "skill",
			label: "Word Wall Research",
			description: "Decipher Dragon Claws and ancient texts",
			x: 300,
			y: 600,
			config: {
				skill_type: "data_transform",
				parameters: "dovahzul_translation, power_words",
			},
		},

		// Dragon Classification
		{
			id: "dragon-type",
			type: "decision",
			label: "Dragon Type?",
			description: "Classify dragon threat: Ancient, Elder, or Legendary",
			x: 500,
			y: 300,
			config: {
				condition_type: "javascript",
				condition: "classifyDragonThreat(context)",
			},
		},

		// The Dragonborn and Companions
		{
			id: "dragonborn",
			type: "agent",
			label: "Dragonborn",
			description: "The chosen one, master of Thu'um and dragon slaying",
			x: 700,
			y: 100,
			config: {
				model: "gpt-4",
				temperature: 0.4,
				max_tokens: 800,
				system_prompt: "Lead dragon hunts with Thu'um mastery and tactical planning.",
			},
		},
		{
			id: "lydia",
			type: "agent",
			label: "Lydia",
			description: "Housecarl of Whiterun, sworn shield and faithful companion",
			x: 700,
			y: 200,
			config: {
				model: "claude-3",
				temperature: 0.3,
				max_tokens: 600,
				system_prompt: "Provide steadfast protection and support in combat.",
			},
		},
		{
			id: "aela-the-huntress",
			type: "agent",
			label: "Aela the Huntress",
			description: "Companion archer with unmatched tracking skills",
			x: 700,
			y: 300,
			config: {
				model: "claude-3",
				temperature: 0.45,
				max_tokens: 650,
				system_prompt: "Track targets and provide ranged support with expertise.",
			},
		},
		{
			id: "faendal",
			type: "agent",
			label: "Faendal",
			description: "Bosmer archer and skilled hunter",
			x: 700,
			y: 400,
			config: {
				model: "llama-2",
				temperature: 0.4,
				max_tokens: 550,
				system_prompt: "Provide archery training and woodland expertise.",
			},
		},
		{
			id: "j-zargo",
			type: "agent",
			label: "J'zargo",
			description: "Khajiit mage from College of Winterhold",
			x: 700,
			y: 500,
			config: {
				model: "llama-2",
				temperature: 0.55,
				max_tokens: 600,
				system_prompt: "Cast destruction spells and magical support.",
			},
		},

		// Combat Skills
		{
			id: "dragonrend-shout",
			type: "skill",
			label: "Dragonrend Shout",
			description: "Force dragons to land with ancient Thu'um",
			x: 900,
			y: 150,
			config: { skill_type: "custom" },
		},
		{
			id: "fire-breath-shout",
			type: "skill",
			label: "Fire Breath Shout",
			description: "Breathe fire like a dragon - Yol Toor Shul",
			x: 900,
			y: 250,
			config: { skill_type: "custom" },
		},
		{
			id: "unrelenting-force",
			type: "skill",
			label: "Unrelenting Force",
			description: "The classic Thu'um - Fus Ro Dah!",
			x: 900,
			y: 350,
			config: { skill_type: "custom" },
		},

		// Combat Skills
		{
			id: "archery",
			type: "skill",
			label: "Archery",
			description: "Precise bow shots for dragon weak points",
			x: 900,
			y: 450,
			config: { skill_type: "custom" },
		},
		{
			id: "one-handed-combat",
			type: "skill",
			label: "One-Handed Combat",
			description: "Sword and shield combat mastery",
			x: 900,
			y: 550,
			config: { skill_type: "custom" },
		},
		{
			id: "two-handed-combat",
			type: "skill",
			label: "Two-Handed Combat",
			description: "Heavy weapons for maximum damage",
			x: 900,
			y: 650,
			config: { skill_type: "custom" },
		},

		// Magical Skills
		{
			id: "destruction-magic",
			type: "skill",
			label: "Destruction Magic",
			description: "Lightning, fire, and ice spells for dragon combat",
			x: 1100,
			y: 150,
			config: { skill_type: "custom" },
		},
		{
			id: "ward-spells",
			type: "skill",
			label: "Ward Spells",
			description: "Magical protection against dragon breath",
			x: 1100,
			y: 250,
			config: { skill_type: "custom" },
		},
		{
			id: "sneak-attacks",
			type: "skill",
			label: "Sneak Attacks",
			description: "Stealth and critical strike bonuses",
			x: 1100,
			y: 350,
			config: { skill_type: "custom" },
		},

		// Equipment and Preparation
		{
			id: "dragonbone-weapons",
			type: "skill",
			label: "Dragonbone Weapons",
			description: "Forge legendary weapons from dragon remains",
			x: 1300,
			y: 200,
			config: { skill_type: "file_operation", parameters: "smithing_recipes.json" },
		},
		{
			id: "dragon-armor",
			type: "skill",
			label: "Dragon Armor",
			description: "Craft protective armor from dragon scales",
			x: 1300,
			y: 300,
			config: {
				skill_type: "data_transform",
				parameters: "armor: dragonscale, dragonplate",
			},
		},
		{
			id: "resist-fire-potions",
			type: "skill",
			label: "Resist Fire Potions",
			description: "Alchemical protection against dragon breath",
			x: 1300,
			y: 400,
			config: {
				skill_type: "data_transform",
				parameters: "resist_fire, resist_frost",
			},
		},
		{
			id: "soul-trap",
			type: "skill",
			label: "Soul Trap",
			description: "Capture dragon souls for enchanting",
			x: 1300,
			y: 500,
			config: {
				skill_type: "data_transform",
				parameters: "soul_gems, dragon_souls",
			},
		},

		// Combat Strategy
		{
			id: "combat-approach",
			type: "decision",
			label: "Combat Approach?",
			description: "Choose strategy: Thu'um mastery, magic, or melee",
			x: 1300,
			y: 350,
			config: {
				condition_type: "javascript",
				condition: "chooseDragonStrategy(context)",
			},
		},

		// Execution Paths
		{
			id: "thu-um-mastery",
			type: "skill",
			label: "Thu'um Mastery",
			description: "Overwhelm with ancient dragon shouts",
			x: 1500,
			y: 200,
			config: { skill_type: "custom" },
		},
		{
			id: "magical-assault",
			type: "skill",
			label: "Magical Assault",
			description: "Combine destruction magic and wards",
			x: 1500,
			y: 400,
			config: { skill_type: "custom" },
		},
		{
			id: "legendary-combat",
			type: "skill",
			label: "Legendary Combat",
			description: "Melee with dragonbone weapons and heavy armor",
			x: 1500,
			y: 600,
			config: { skill_type: "custom" },
		},

		// Outcome Evaluation
		{
			id: "dragon-defeated",
			type: "decision",
			label: "Dragon Defeated?",
			description: "Confirm dragon elimination and soul absorption",
			x: 1700,
			y: 350,
			config: { condition_type: "simple", condition: "dragon_health <= 0" },
		},

		// Post-Battle Activities
		{
			id: "soul-absorption",
			type: "skill",
			label: "Soul Absorption",
			description: "Absorb dragon soul and learn new words",
			x: 1900,
			y: 200,
			config: { skill_type: "file_operation", parameters: "shouts_learned.json" },
		},
		{
			id: "dragon-harvesting",
			type: "skill",
			label: "Dragon Harvesting",
			description: "Collect scales, bones, and valuable materials",
			x: 1900,
			y: 400,
			config: {
				skill_type: "api_call",
				endpoint: "/inventory/dragon_materials",
				method: "POST",
			},
		},
		{
			id: "thu-um-training",
			type: "skill",
			label: "Thu'um Training",
			description: "Practice new shouts and unlock their power",
			x: 1900,
			y: 600,
			config: {
				skill_type: "api_call",
				endpoint: "/greybeards/training",
				method: "POST",
			},
		},

		// Final Output
		{
			id: "legend-grows",
			type: "output",
			label: "Legend Grows",
			description: "The Dragonborn's legend spreads across Skyrim",
			x: 2100,
			y: 400,
		},
	],
	connections: [
		// Initial Investigation
		{
			source: "dragon-sighting",
			target: "dragon-tracking",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "greybeard-summons",
			target: "ancient-knowledge",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-tracking",
			target: "word-wall-research",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "ancient-knowledge",
			target: "dragon-type",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "word-wall-research",
			target: "dragon-type",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Dragon Type → Character Assignment
		{
			source: "dragon-type",
			target: "dragonborn",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-type",
			target: "lydia",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-type",
			target: "aela-the-huntress",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-type",
			target: "faendal",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-type",
			target: "j-zargo",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Characters → Combat Skills
		{
			source: "dragonborn",
			target: "dragonrend-shout",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragonborn",
			target: "fire-breath-shout",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragonborn",
			target: "unrelenting-force",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "aela-the-huntress",
			target: "archery",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "faendal",
			target: "archery",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "lydia",
			target: "one-handed-combat",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "lydia",
			target: "two-handed-combat",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Characters → Magical Skills
		{
			source: "j-zargo",
			target: "destruction-magic",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragonborn",
			target: "ward-spells",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Characters → Equipment Skills
		{
			source: "lydia",
			target: "dragonbone-weapons",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragonborn",
			target: "dragon-armor",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "j-zargo",
			target: "resist-fire-potions",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragonborn",
			target: "soul-trap",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Skills → Combat Strategy
		{
			source: "dragonrend-shout",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "fire-breath-shout",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "unrelenting-force",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "archery",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "one-handed-combat",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "two-handed-combat",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "destruction-magic",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "ward-spells",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "sneak-attacks",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragonbone-weapons",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-armor",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "resist-fire-potions",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "soul-trap",
			target: "combat-approach",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Combat Strategy → Execution Paths
		{
			source: "combat-approach",
			target: "thu-um-mastery",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "combat-approach",
			target: "magical-assault",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "combat-approach",
			target: "legendary-combat",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Execution → Outcome
		{
			source: "thu-um-mastery",
			target: "dragon-defeated",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "magical-assault",
			target: "dragon-defeated",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "legendary-combat",
			target: "dragon-defeated",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Outcome → Post-Battle Activities
		{
			source: "dragon-defeated",
			target: "soul-absorption",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-defeated",
			target: "dragon-harvesting",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-defeated",
			target: "thu-um-training",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Post-Battle → Final Output
		{
			source: "soul-absorption",
			target: "legend-grows",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dragon-harvesting",
			target: "legend-grows",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "thu-um-training",
			target: "legend-grows",
			sourceHandle: "right",
			targetHandle: "left",
		},
	],
};