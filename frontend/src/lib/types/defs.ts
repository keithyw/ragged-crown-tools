// Definitions: the reusable kinds of thing (DATA-MODEL.md 1).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5).

import type { Kind } from './core'
import type { Interaction } from './interactions'

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
