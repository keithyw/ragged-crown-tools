// Definitions: the reusable kinds of thing (DATA-MODEL.md 1).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5).

import type { Kind, RandomRoll } from './core'
import type { ArmorDef, WeaponDef } from './gear'
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

// What every thing the player can carry has: items, weapons and armor extend it.
export interface CarriedDef extends BaseDef {
	weight: number // the base weight of one; a pile is weight x quantity. At most 2 decimals
	maxQuantity?: number // how many fit in one pile; absent = only one. Not numberOfUses
	numberOfUses?: number // absent = unlimited
	isQuestItem?: boolean // absent = false. The game protects it from being dropped or deleted by accident
	interactions?: Interaction[] // on USE
}

// Things that go in the inventory. Stored in items.
// Weapons and armor (gear.ts) are stored there too, told apart by `kind`.
export interface ItemDef extends CarriedDef {
	kind: 'item'
	container?: ContainerSpec
}

// Monsters (DATA-MODEL.md 1.3): solid, placed in a zone and bumped to fight,
// or spawned at runtime. No attributes and no gear. Stored in monsters.
export interface MonsterDef extends BaseDef {
	kind: 'monster'
	level: number // whole number, 0 or more
	hp: number // a set number, not dice
	defenseValue: number // whole number, 0 or more, no ceiling (as on armor)
	removalChance: number // 0 to 100: the chance it leaves after the party flees
	numberAppearing: RandomRoll
	isUnique?: boolean // absent = false. Only ever one; numberAppearing is ignored
}

// Always walkable; the destination is set per placement. Stored in entities.
export interface PortalDef extends BaseDef {
	kind: 'portal'
	twoWay: boolean // not used yet: every placement has one destination
	interactions?: Interaction[] // normally on WALK
}

export type Def =
	TileDef | ObjectDef | ItemDef | WeaponDef | ArmorDef | MonsterDef | PortalDef
