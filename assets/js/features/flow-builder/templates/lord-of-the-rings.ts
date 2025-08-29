import { Template } from "./types";

export const lordOfTheRingsTemplate: Template = {
	id: "lotr",
	name: "Lord of the Rings",
	description: "Frodo, Gandalf & the Fellowship coordinate their quest",
	difficulty: "medium",
	category: "gaming",
	nodes: [
		// Inputs / Sensors
		{
			id: "ring-bearer",
			type: "input",
			label: "Ring Bearer",
			description: "Frodo receives the One Ring and mission",
			x: 100,
			y: 300,
		},
		{
			id: "council-elrond",
			type: "sensor",
			label: "Council of Elrond",
			description: "Strategic council decides the fellowship plan",
			x: 100,
			y: 450,
			config: {
				source_type: "pubsub",
				endpoint: "rivendell:council",
				filters: "ring matters",
			},
		},

		// Early party members
		{
			id: "frodo",
			type: "agent",
			label: "Frodo Baggins",
			description: "Ring bearer, leads the quest to Mount Doom",
			x: 360,
			y: 220,
			config: {
				model: "gpt-4",
				temperature: 0.3,
				max_tokens: 400,
				system_prompt: "Endure and lead with courage.",
			},
		},
		{
			id: "sam",
			type: "agent",
			label: "Samwise Gamgee",
			description: "Loyal companion, support and resilience",
			x: 360,
			y: 320,
			config: {
				model: "claude-3",
				temperature: 0.5,
				max_tokens: 350,
				system_prompt: "Support and protect Frodo at all costs.",
			},
		},
		{
			id: "merry",
			type: "agent",
			label: "Meriadoc Brandybuck",
			description: "Hobbit scout, diversion expert",
			x: 360,
			y: 420,
			config: {
				model: "llama-2",
				temperature: 0.7,
				max_tokens: 300,
				system_prompt: "Scout and create diversions.",
			},
		},
		{
			id: "pippin",
			type: "agent",
			label: "Peregrin Took",
			description: "Hobbit lookout, messenger",
			x: 360,
			y: 520,
			config: {
				model: "llama-2",
				temperature: 0.8,
				max_tokens: 300,
				system_prompt: "Act as lookout and messenger.",
			},
		},

		// Core fellowship
		{
			id: "gandalf",
			type: "agent",
			label: "Gandalf the Grey",
			description: "Wizard, guidance and protection",
			x: 600,
			y: 180,
			config: {
				model: "gpt-4",
				temperature: 0.2,
				max_tokens: 800,
				system_prompt: "Provide wisdom and magical protection.",
			},
		},
		{
			id: "aragorn",
			type: "agent",
			label: "Aragorn",
			description: "Ranger, leader and frontline fighter",
			x: 600,
			y: 280,
			config: {
				model: "gpt-4",
				temperature: 0.35,
				max_tokens: 600,
				system_prompt: "Lead and protect the fellowship.",
			},
		},
		{
			id: "legolas",
			type: "agent",
			label: "Legolas",
			description: "Elf archer, ranged support and agility",
			x: 600,
			y: 380,
			config: {
				model: "claude-3",
				temperature: 0.4,
				max_tokens: 450,
				system_prompt: "Provide ranged support and scouting.",
			},
		},
		{
			id: "gimli",
			type: "agent",
			label: "Gimli",
			description: "Dwarf warrior, tank and cave specialist",
			x: 600,
			y: 480,
			config: {
				model: "claude-3",
				temperature: 0.4,
				max_tokens: 450,
				system_prompt: "Hold the line and handle caves.",
			},
		},
		{
			id: "boromir",
			type: "agent",
			label: "Boromir",
			description: "Warrior of Gondor, defensive tactics",
			x: 600,
			y: 580,
			config: {
				model: "llama-2",
				temperature: 0.5,
				max_tokens: 500,
				system_prompt: "Defend and rally when needed.",
			},
		},

		// Skills / Tools
		{
			id: "sting",
			type: "skill",
			label: "Sting",
			description: "Elven blade that glows near orcs",
			x: 860,
			y: 160,
			config: { skill_type: "custom" },
		},
		{
			id: "anduril",
			type: "skill",
			label: "Andúril",
			description: "Reforged blade, leadership and morale",
			x: 860,
			y: 240,
			config: { skill_type: "custom" },
		},
		{
			id: "elven-cloak",
			type: "skill",
			label: "Elven Cloak",
			description: "Stealth and concealment",
			x: 860,
			y: 300,
			config: { skill_type: "custom" },
		},
		{
			id: "elven-bow",
			type: "skill",
			label: "Elven Bow",
			description: "Precise archery and long-range combat",
			x: 860,
			y: 370,
			config: { skill_type: "custom" },
		},
		{
			id: "dwarf-craft",
			type: "skill",
			label: "Dwarf Craft",
			description: "Stonework, cave navigation, durability",
			x: 860,
			y: 440,
			config: { skill_type: "custom" },
		},
		{
			id: "horn-gondor",
			type: "skill",
			label: "Horn of Gondor",
			description: "Signal for aid and regrouping",
			x: 860,
			y: 510,
			config: { skill_type: "custom" },
		},

		// Branching decisions
		{
			id: "path-choice",
			type: "decision",
			label: "Path Choice?",
			description: "Caradhras vs Mines of Moria",
			x: 1100,
			y: 300,
			config: {
				condition_type: "simple",
				condition: 'weather_safe ? "caradhras" : "moria"',
			},
		},
		{
			id: "moria-event",
			type: "decision",
			label: "Moria Encounter?",
			description: "Balrog, trolls, orcs",
			x: 1300,
			y: 180,
			config: {
				condition_type: "simple",
				condition: "encounter in [balrog,trolls,orcs]",
			},
		},
		{
			id: "caradhras-event",
			type: "decision",
			label: "Caradhras Storm?",
			description: "Blizzard and avalanche risk",
			x: 1300,
			y: 420,
			config: {
				condition_type: "simple",
				condition: "storm_severity > threshold",
			},
		},

		// Mid-quest outcomes / support
		{
			id: "lothlorien",
			type: "skill",
			label: "Lothlórien Aid",
			description: "Rest, gifts, guidance from Galadriel",
			x: 1500,
			y: 300,
			config: { skill_type: "custom" },
		},

		// Late decisions and outputs
		{
			id: "quest-success",
			type: "decision",
			label: "Quest Success?",
			description: "Do they progress toward Mordor?",
			x: 1700,
			y: 300,
			config: {
				condition_type: "simple",
				condition: "morale && supplies && path_clear",
			},
		},
		{
			id: "fellowship-report",
			type: "output",
			label: "Fellowship Report",
			description: "Quest status and next objectives",
			x: 1900,
			y: 300,
		},
	],
	connections: [
		// Setup
		{
			source: "ring-bearer",
			target: "frodo",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "council-elrond",
			target: "frodo",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "council-elrond",
			target: "sam",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "council-elrond",
			target: "merry",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "council-elrond",
			target: "pippin",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Council forms the fellowship
		{
			source: "council-elrond",
			target: "gandalf",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "council-elrond",
			target: "aragorn",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "council-elrond",
			target: "legolas",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "council-elrond",
			target: "gimli",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "council-elrond",
			target: "boromir",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Agents → skills
		{
			source: "frodo",
			target: "sting",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "aragorn",
			target: "anduril",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "legolas",
			target: "elven-bow",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "gimli",
			target: "dwarf-craft",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "legolas",
			target: "elven-cloak",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "boromir",
			target: "horn-gondor",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Skills / context → path decision
		{
			source: "sting",
			target: "path-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "anduril",
			target: "path-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "elven-cloak",
			target: "path-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "elven-bow",
			target: "path-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "dwarf-craft",
			target: "path-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "horn-gondor",
			target: "path-choice",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Branch: Caradhras or Moria
		{
			source: "path-choice",
			target: "moria-event",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "path-choice",
			target: "caradhras-event",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Branch results → Lothlórien support
		{
			source: "moria-event",
			target: "lothlorien",
			sourceHandle: "right",
			targetHandle: "left",
		},
		{
			source: "caradhras-event",
			target: "lothlorien",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Aid → progress check
		{
			source: "lothlorien",
			target: "quest-success",
			sourceHandle: "right",
			targetHandle: "left",
		},

		// Outcome → report
		{
			source: "quest-success",
			target: "fellowship-report",
			sourceHandle: "right",
			targetHandle: "left",
		},
	],
};
