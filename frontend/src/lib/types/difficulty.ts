// Difficulty configurations: what a zone's random things draw from (DATA-MODEL.md 2,
// Trello [Tools 25]). A zone points at one by `_id` ([Tools 26]). Shared with the game
// (listed in shared.ts): types only. Material tables, the level, and the
// monster pool and encounter chance for random encounters; drop tables come
// with a later card.

import type {
	ArmorGroup,
	ArmorMaterial,
	WeaponGroup,
	WeaponMaterial,
} from './gear'

// One material table, for one group of types (lib/types/gear.ts). `default` is
// what a roll gives when it lands outside every chance, so an answer always
// exists. A chance is a plain number with no total
// rule: adding a material never means re-balancing the others. How chances are
// combined is the engine's decision ([Game 23]).
export interface MaterialTable<M extends string> {
	default: M
	chances: Partial<Record<M, number>>
}

export interface DifficultyConfig {
	id: string // user-facing label; the promotion key, never a reference
	name: string
	description?: string
	// What the player sees as the zone's difficulty; a whole number, 0 or more,
	// no upper limit ([Tools 26]). It limits which monsters random encounters
	// can pick; whether a zone has random encounters at all is the zone's
	// `randomEncounters` (DATA-MODEL.md 2.5).
	level: number
	// For a zone set to `config` encounters ([Tools 27]): the percentage chance
	// (0 to 100) that a step starts a random encounter, and the monsters one
	// can draw from (monster `_id`s; never unique ones). Absent = none; odds
	// within the pool come from each monster's rarity.
	encounterChance?: number
	monsterIds?: string[]
	// Weapons and armor have separate material lists ([Inventory 33]). A group
	// that isn't filled in isn't used by this configuration; what an item of a
	// missing group gets is the engine's decision ([Game 23]).
	materials: {
		weapon: Partial<Record<WeaponGroup, MaterialTable<WeaponMaterial>>>
		armor: Partial<Record<ArmorGroup, MaterialTable<ArmorMaterial>>>
	}
}
