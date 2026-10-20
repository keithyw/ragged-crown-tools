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
	glyph: Glyph
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
	stackable: boolean
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
	quantity?: number // stackable items
	interactions?: Interaction[] // per-instance overrides, checked before the def's
	contents?: Placement[] // containers; depth-limited
	destination?: Destination // portals only
}

export type Condition =
	| { type: 'HAS_ITEM'; itemId: string; amount: number }
	| { type: 'FLAG_SET'; flag: string }
	| { type: 'FLAG_NOT_SET'; flag: string }

// Fields beyond SPAWN and TELEPORT are provisional (DATA-MODEL.md 4.4).
// `custom: true` means the value is left to each placement (a custom NPC's
// dialog, a chest's contents), so the action carries no value fields at all
// (DATA-MODEL.md 4.6).
export type Action =
	| { type: 'SHOW_DIALOG'; text: string; custom?: never }
	| { type: 'SHOW_DIALOG'; custom: true }
	| { type: 'GIVE_ITEM'; itemId: string; amount?: number }
	| { type: 'TAKE_ITEM'; itemId: string; amount?: number }
	| { type: 'GIVE_XP'; amount: number }
	| { type: 'GIVE_CURRENCY'; amount: number }
	| { type: 'SET_FLAG'; flag: string }
	| {
			type: 'SPAWN'
			defKind: Kind
			defId: string
			quantity?: number
			custom?: never
	  }
	| { type: 'SPAWN'; custom: true }
	| { type: 'REMOVE_SELF' }
	| { type: 'TELEPORT'; destination: Destination }
	| { type: 'PLAY_SOUND'; sound: string }
	| { type: 'MODIFY_ATTRIBUTE'; attribute: string; amount: number }

export interface Interaction {
	id: string
	on: InteractionType
	conditions?: Condition[]
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
