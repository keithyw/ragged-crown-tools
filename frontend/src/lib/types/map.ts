// Zones and what is placed on them (DATA-MODEL.md 2 and 3).
// Shared with the game: copied by hand, so keep tools-only fields out
// (see ARCHITECTURE.md 5).

import type { Destination, Kind, Position } from './core'
import type { TileDef } from './defs'
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
	interactions?: Interaction[] // per-instance overrides, checked before the def's
	contents?: Placement[] // containers; depth-limited
	destination?: Destination // portals only
	customValues?: Record<string, CustomValue> // keyed by the def's slot ids
}

// A placement's value for one of its def's custom slots (DATA-MODEL.md 4.6):
// the def declares the slot, the placement fills it in. Every field may be
// blank, so unfinished work still saves; finding blanks is zone validation.
export type CustomValue =
	| { type: 'SHOW_DIALOG'; text?: string }
	| {
			type: 'GIVE_ITEM' | 'TAKE_ITEM' | 'HAS_ITEM'
			itemId?: string
			amount?: number
	  }
	| { type: 'SPAWN'; defKind?: Kind; defId?: string; quantity?: number }

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
	dangerLevel: number
	startingPosition?: Position
	terrain: string[][] // terrain def _ids, indexed [y][x]
	placements?: Partial<Record<CellKey, Placement[]>> // each cell bottom to top
	edgeExits?: Partial<Record<Direction, Destination>>
}
