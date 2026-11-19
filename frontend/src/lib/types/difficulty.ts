// Difficulty configurations: what a zone's random things draw from (DATA-MODEL.md 2,
// Trello [Tools 25]). A zone points at one by `_id` ([Tools 26]). Shared with the game
// (listed in shared.ts): types only. This iteration holds the material tables; the
// level number, encounter and drop tables come with later cards.

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
	// Weapons and armor have separate material lists ([Inventory 33]). A group
	// that isn't filled in isn't used by this configuration; what an item of a
	// missing group gets is the engine's decision ([Game 23]).
	materials: {
		weapon: Partial<Record<WeaponGroup, MaterialTable<WeaponMaterial>>>
		armor: Partial<Record<ArmorGroup, MaterialTable<ArmorMaterial>>>
	}
}
