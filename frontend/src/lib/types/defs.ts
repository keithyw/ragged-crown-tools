// Definitions: the reusable kinds of thing (DATA-MODEL.md 1).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5).

import type { Kind, RandomRoll } from './core'
import type { Currency } from './currency'
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
	encounterRate?: number // the chance an encounter happens on a step; what appears is decided elsewhere ([Combat 8])
}

// Objects (isSolid) and spaces (!isSolid). Stored in entities.
export interface ObjectDef extends BaseDef {
	kind: 'object'
	isSolid: boolean
	// absent = false. The game draws what is below it (the next thing in the
	// stack, or the terrain); the zone builder outlines it. Say, a random
	// encounter space that looks like the ground.
	isInvisible?: boolean
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
	isCurrency?: boolean // absent = false. `id` names the currency (DATA-MODEL.md 8)
	container?: ContainerSpec
}

// How common a monster is in random encounters, most common first
// (DATA-MODEL.md 1.3, [Monsters 10]). The weights are the game's.
export type MonsterRarity =
	'common' | 'uncommon' | 'scarce' | 'rare' | 'very rare' | 'ultra rare'

// Monsters (DATA-MODEL.md 1.3): solid, placed in a zone and bumped to fight,
// or spawned at runtime. No attributes and no gear. Stored in monsters.
export interface MonsterDef extends BaseDef {
	kind: 'monster'
	level: number // whole number, 0 or more
	hp: number // a set number, not dice
	defenseValue: number // whole number, 0 or more, no ceiling (as on armor)
	removalChance: number // 0 to 100: the chance it leaves after the party flees
	damage: RandomRoll // base damage when it hits, as on a weapon
	initiative?: number // base for the turn order, 1d6 is added each round; absent = 6
	xp: number // experience for beating it, a set whole number; no default
	rarity: MonsterRarity // how often it turns up in random encounters; no default
	numberAppearing: RandomRoll
	terrainIds?: string[] // terrain defs (_id) it can turn up on in the open world; absent = none
	isUnique?: boolean // absent = false. Only ever one; numberAppearing is ignored
	// What one of them carries, dice per currency; absent = none (DATA-MODEL.md 8)
	currency?: Partial<Record<Currency, RandomRoll>>
}

// Always walkable; the destination is set per placement. Stored in entities.
export interface PortalDef extends BaseDef {
	kind: 'portal'
	twoWay: boolean // not used yet: every placement has one destination
	interactions?: Interaction[] // normally on WALK
}

export type Def =
	TileDef | ObjectDef | ItemDef | WeaponDef | ArmorDef | MonsterDef | PortalDef
