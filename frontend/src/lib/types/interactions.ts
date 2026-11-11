// Interactions: conditions, actions and when they fire (DATA-MODEL.md 4).
// Shared with the game: copied by hand, so keep tools-only fields out
// (see ARCHITECTURE.md 5).

import type { Destination, Kind } from './core'

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
	| { type: 'GIVE_ITEM'; itemId: string; amount?: number; custom?: never }
	| { type: 'GIVE_ITEM'; custom: true; slot: string }
	| { type: 'TAKE_ITEM'; itemId: string; amount?: number; custom?: never }
	| { type: 'TAKE_ITEM'; custom: true; slot: string }
	| { type: 'GIVE_CURRENCY'; amount: number }
	| { type: 'SET_FLAG'; flag: string }
	| {
			type: 'SPAWN'
			defKind: Kind
			defId: string
			quantity?: number
			custom?: never
	  }
	| { type: 'SPAWN'; custom: true; slot: string }
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
