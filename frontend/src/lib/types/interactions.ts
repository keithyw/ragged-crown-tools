// Interactions: conditions, actions and when they fire (DATA-MODEL.md 4).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5).

import type { Destination, Kind } from './core'
import type { Qualifiers } from './gear'

export type Condition =
	| { type: 'HAS_ITEM'; itemId: string; amount: number; custom?: never }
	| { type: 'HAS_ITEM'; custom: true; slot: string }
	| { type: 'FLAG_SET'; flag: string }
	| { type: 'FLAG_NOT_SET'; flag: string }

// The numeric stats of a character that MODIFY_ATTRIBUTE can change
// (DATA-MODEL.md 4.4). Mirrors the game's PlayerCharacter, plus xp, which the
// game doesn't have yet.
export type CharacterStat =
	| 'strength'
	| 'dexterity'
	| 'intelligence'
	| 'wisdom'
	| 'personality'
	| 'speed'
	| 'constitution'
	| 'hp'
	| 'sp'
	| 'xp'
	| 'level'
export type StatBar = 'current' | 'max'
export type StatTarget = 'character' | 'party'

// Fields beyond SPAWN and TELEPORT are provisional (DATA-MODEL.md 4.4).
// `custom: true` means the value is left to each placement (a custom NPC's
// dialog, a chest's contents), so the action carries no value fields at all
// (DATA-MODEL.md 4.6). Its `slot` is a stable id that the placement's
// customValues are keyed by. Defs stored before slots existed lack it until
// their next save, so code reading stored defs checks for it.
export type Action =
	| { type: 'SHOW_DIALOG'; text: string; custom?: never }
	| { type: 'SHOW_DIALOG'; custom: true; slot: string }
	| {
			type: 'GIVE_ITEM'
			itemId: string
			amount?: number
			qualifiers?: Qualifiers // weapons and armor; blank = rolled on pickup
			chance?: number // 0-100, percent per trigger; absent = always gives
			giveLimit?: number // times it may give; absent = unlimited
			custom?: never
	  }
	| { type: 'GIVE_ITEM'; custom: true; slot: string }
	| { type: 'TAKE_ITEM'; itemId: string; amount?: number; custom?: never }
	| { type: 'TAKE_ITEM'; custom: true; slot: string }
	| { type: 'SET_FLAG'; flag: string }
	| {
			type: 'SPAWN'
			defKind: Kind
			defId: string
			quantity?: number
			qualifiers?: Qualifiers // weapons and armor; blank = rolled on pickup
			custom?: never
	  }
	| { type: 'SPAWN'; custom: true; slot: string }
	// A barrier's set encounter ([Combat 7]). Always custom: the groups, which
	// one to show and whether to hide it are filled in per placement.
	| { type: 'SPAWN_MONSTER'; custom: true; slot: string }
	// A random encounter space ([Combat 12]): rolls the zone's difficulty
	// configuration's chance and pool. Always custom: whether it repeats is
	// filled in per placement.
	| { type: 'RANDOM_ENCOUNTER'; custom: true; slot: string }
	// Removes another object from this zone (the quest giver clears the trees).
	// Always custom: the target is picked on the placement.
	| { type: 'REMOVE_OBJECT'; custom: true; slot: string }
	// Pays the player ([Currency 6]). Always custom: which currencies, how much
	// of each and who receives are filled in per placement.
	| { type: 'GIVE_CURRENCY'; custom: true; slot: string }
	| { type: 'REMOVE_SELF' }
	| { type: 'TELEPORT'; destination: Destination }
	| { type: 'PLAY_SOUND'; sound: string }
	| {
			type: 'MODIFY_ATTRIBUTE'
			attribute: CharacterStat
			amount: number // negative allowed
			bar?: StatBar // hp and sp only; absent = current
			target?: StatTarget // absent = character
	  }

export interface Interaction {
	id: string
	on: InteractionType
	conditions?: Condition[]
	hint?: string // shown when the conditions fail (DATA-MODEL.md 4.7)
	actions: Action[]
	limit?: number // times it can run; absent = unlimited, 1 = once
}

export type InteractionType =
	| 'WALK'
	| 'TALK'
	| 'PICKUP'
	| 'DROP'
	| 'USE'
	| 'OPEN'
	| 'CLOSE'
	| 'BUMP_INTERACT'
