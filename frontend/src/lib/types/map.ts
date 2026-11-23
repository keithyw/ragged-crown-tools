// Zones and what is placed on them (DATA-MODEL.md 2 and 3).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5).

import type { Destination, Kind, Position } from './core'
import type { TileDef } from './defs'
import type { Qualifiers } from './gear'
import type { Interaction } from './interactions'

export type Direction = 'north' | 'south' | 'east' | 'west'

// "x,y", x first, no spaces. Only build it with cellKey(x, y).
export type CellKey = `${number},${number}`

// One instance of a def on the map.
export interface Placement {
	uid: string // stable id for this instance (runtime state refers to it)
	defKind: Kind // with defId, a composite key: kind says which collection
	defId: string // the def's _id
	quantity?: number // items with a maxQuantity
	qualifiers?: Qualifiers // weapons and armor; blank = rolled on pickup
	interactions?: Interaction[] // per-instance overrides, checked before the def's
	contents?: Placement[] // containers; depth-limited
	destination?: Destination // portals only
	customValues?: Record<string, CustomValue> // keyed by the def's slot ids
}

// One monster group of an encounter ([Combat 7], [Combat 1]): a monster def
// and how many. A blank `count` is rolled from the def's numberAppearing (a
// unique monster is always one).
export interface EncounterGroup {
	defId: string // a monster def's _id
	count?: number
}

// A placement's value for one of its def's custom slots (DATA-MODEL.md 4.6):
// the def declares the slot, the placement fills it in. Every field may be
// blank, so unfinished work still saves; finding blanks is zone validation.
export type CustomValue =
	| { type: 'SHOW_DIALOG'; text?: string }
	| {
			type: 'TAKE_ITEM' | 'HAS_ITEM'
			itemId?: string
			amount?: number
	  }
	| {
			type: 'GIVE_ITEM'
			itemId?: string
			amount?: number
			qualifiers?: Qualifiers
	  }
	| {
			type: 'SPAWN'
			defKind?: Kind
			defId?: string
			quantity?: number
			qualifiers?: Qualifiers
	  }
	| {
			type: 'REMOVE_OBJECT'
			targetUid?: string // the uid of an object placement in this zone
	  }
	| {
			type: 'SPAWN_MONSTER'
			groups?: EncounterGroup[]
			showAs?: number // index into groups: whose sprite the barrier shows
			hideSprite?: boolean // absent = false; the barrier keeps its own look
	  }

export interface MoveResult {
	canMove: boolean
	nextPos: Position
	targetTile?: TileDef
	blockReason?: string
}

export interface Zone {
	id: string
	name: string
	dimensions?: { width: number; height: number }
	difficultyId: string // a difficulty configuration's _id; it holds the level ([Tools 26])
	startingPosition?: Position
	terrain: string[][] // terrain def _ids, indexed [y][x]
	placements?: Partial<Record<CellKey, Placement[]>> // each cell bottom to top
	edgeExits?: Partial<Record<Direction, Destination>>
}
