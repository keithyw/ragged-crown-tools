export interface Position {
	x: number
	y: number
}

// ---- Content model (DATA-MODEL.md) ----

export type Kind = 'terrain' | 'object' | 'item' | 'creature' | 'portal'

// What a thing looks like on the map. Composed into every def.
export interface Glyph {
	symbol: string // 1-2 characters
	color: string // Tailwind text-* class
	bg: string // Tailwind bg-* class
}

// _id is not declared here: it is server-generated and comes with the stored document.
export interface BaseDef {
	id?: string // legacy, display only
	kind: Kind
	name: string
	description?: string
	glyph: Glyph // the backfill when there is no sprite
	spriteId?: string // a sprite's _id; drawn instead of the glyph (DATA-MODEL.md 1.2)
}

export interface ContainerSpec {
	capacity: number
	maxDepth?: number // total nesting levels, counting itself; absent, 0 or 1 = no nesting
}

// Terrain. Stored in tile_defs.
export interface TileDef extends BaseDef {
	kind: 'terrain'
	moveCost: number
	isWalkable?: boolean
	encounterRate?: number
	encounterTableKey?: string
}

// Objects (isSolid) and spaces (!isSolid). Stored in entities.
export interface ObjectDef extends BaseDef {
	kind: 'object'
	isSolid: boolean
	moveCost?: number // spaces only; defaults to 1
	numberOfUses?: number // absent = unlimited
	container?: ContainerSpec
	interactions?: Interaction[]
}

// Things that go in the inventory. Stored in items.
// Category (weapon, armor, ...) is deferred: see DATA-MODEL.md, open questions.
export interface ItemDef extends BaseDef {
	kind: 'item'
	maxQuantity?: number // how many fit in one pile; absent = only one. Not numberOfUses
	numberOfUses?: number // absent = unlimited
	container?: ContainerSpec
	interactions?: Interaction[] // on USE
}

// Stub: used by random encounters, never placed on the map. Stored in entities.
export interface CreatureDef extends BaseDef {
	kind: 'creature'
}

// Always walkable; the destination is set per placement. Stored in entities.
export interface PortalDef extends BaseDef {
	kind: 'portal'
	twoWay: boolean // not used yet: every placement has one destination
	interactions?: Interaction[] // normally on WALK
}

export type Def = TileDef | ObjectDef | ItemDef | CreatureDef | PortalDef

export type Direction = 'north' | 'south' | 'east' | 'west'

export interface Destination {
	zoneId: string // the target zone's _id
	pos?: Position // absent = the target zone's startingPosition
}

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

// ---- End content model ----

export type InteractionType =
	| 'WALK'
	| 'TALK'
	| 'PICKUP'
	| 'DROP'
	| 'USE'
	| 'OPEN'
	| 'CLOSE'
	| 'BUMP_INTERACT'

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
