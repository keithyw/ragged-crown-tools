// Weapons and armor: item definitions with extra fields (DATA-MODEL.md).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5). The runtime lists of these values (and their order) live in
// lib/constants/gear.ts, which checks that it names every member of the unions below.

import type { CarriedDef } from './defs'

export type WeaponType =
	| 'sword'
	| 'dagger'
	| 'spear'
	| 'polearm'
	| 'bow'
	| 'sling'
	| 'crossbow'
	| 'axe'
	| 'mace'
	| 'flail'
	| 'staff'
	| 'fist'
	| 'hammer'
	| 'club'
	| 'dart'

// Where a piece is worn, which is what decides what a character can equip or
// replace. A shield is armor in the hand slot: it blocks a second weapon or a
// two-handed one in exchange for more defense (an equip rule, not a field).
export type ArmorType =
	| 'head'
	| 'chest'
	| 'legs'
	| 'hands'
	| 'wrists'
	| 'feet'
	| 'shoulders'
	| 'belt'
	| 'cloak'
	| 'shield'
	| 'neck'
	| 'ring'
	| 'earring'
	| 'brooch'

// How well a weapon or armor piece was made, lowest to highest. Instance data
// (carried by an action, a placement or an inventory entry), never on a def;
// the tools store only the name and the engine decides what each step does
// ([Inventory 13]). Normal is a quality like the others and can be rolled.
export type Quality = 'shoddy' | 'poor' | 'normal' | 'good' | 'superior'

// What a weapon or armor piece is made of ([Inventory 14], [Inventory 33]).
// Two lists, since a material belongs where it makes sense (no cloth swords,
// no glass armor). A category groups materials (wood, metal ...) and is what a
// type allows; the material is the concrete value an instance stores and a
// player sees ("superior oak staff"). Kept to what a farming village would
// have; they grow as content needs them. Which category holds which material,
// and which categories each type may use, is in lib/constants/gear.ts.
export type WeaponMaterialCategory = 'wood' | 'metal' | 'leather'
export type ArmorMaterialCategory =
	'cloth' | 'leather' | 'fur' | 'wood' | 'metal'
export type WeaponMaterial = 'wood' | 'iron' | 'leather'
export type ArmorMaterial = 'cloth' | 'leather' | 'fur' | 'wood' | 'copper'

// Types that share one material table in a difficulty configuration
// ([Tools 25]): every type in a group allows the same categories, so one
// default always fits. The grouping is the designer's choice of what a zone
// can drop (a starting zone has no jewelry). Which types are in which group is
// in lib/constants/gear.ts.
export type WeaponGroup = 'metal' | 'wood' | 'leather'
export type ArmorGroup =
	'body' | 'wrists' | 'belt' | 'cloak' | 'shield' | 'jewelry'

// Any material that exists. A value outside this union can't be written, so
// "a salt sword" is a type error. Whether a material suits one particular
// type (iron on a bow) needs the def, so it is checked where the def is known,
// against WEAPON_CATEGORIES_BY_TYPE / ARMOR_CATEGORIES_BY_TYPE (derived from the groups).
export type Material = WeaponMaterial | ArmorMaterial

// What an instance of a weapon or armor piece carries beyond its def. More
// fields come as they are designed ([Inventory 28]). Absent in authored data
// means "roll when picked up".
export interface Qualifiers {
	quality?: Quality
	material?: Material
}

// The standard polyhedral dice, d4 to d100.
export type Die = 4 | 6 | 8 | 10 | 12 | 20 | 100

// A base roll: `count` dice of `die` sides (1d8 is { count: 1, die: 8 }).
// Bonuses from material, quality, skill and magic are not decided yet.
export interface Damage {
	count: number
	die: Die
}

// Stored in items, told apart from plain items by `kind`.
export interface WeaponDef extends CarriedDef {
	kind: 'weapon'
	type: WeaponType
	damage: Damage
	// Absent = false. A bow is still flagged isMissile although its type implies it.
	isTwoHanded?: boolean
	isMissile?: boolean
	isThrown?: boolean
}

// Stored in items, told apart from plain items by `kind`.
export interface ArmorDef extends CarriedDef {
	kind: 'armor'
	type: ArmorType
	defenseValue: number // whole number, 0 or more, no ceiling; the form defaults it to 0
}
