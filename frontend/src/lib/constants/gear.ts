// The lists behind the weapon and armor unions in lib/types/gear.ts. Adding a
// weapon type is one line here and one in the union; the checks below fail
// tsc if a member of a union is missing from its list.
//
// The schema files import this one by a relative path (not '@/'), because the
// MCP runs them through tsx, which doesn't resolve '@/' (ARCHITECTURE.md 6.1).
import type {
	ArmorMaterial,
	ArmorMaterialCategory,
	ArmorType,
	Die,
	Quality,
	WeaponMaterial,
	WeaponMaterialCategory,
	WeaponType,
} from '../types/gear'

type AllListed<U, L extends readonly U[]> = [Exclude<U, L[number]>] extends [
	never,
]
	? true
	: false

export const WEAPON_TYPES = [
	'sword',
	'dagger',
	'spear',
	'polearm',
	'bow',
	'sling',
	'crossbow',
	'axe',
	'mace',
	'flail',
	'staff',
	'fist',
	'hammer',
	'club',
	'dart',
] as const satisfies readonly WeaponType[]
export const weaponTypesComplete: AllListed<WeaponType, typeof WEAPON_TYPES> =
	true

export const ARMOR_TYPES = [
	'head',
	'chest',
	'legs',
	'hands',
	'wrists',
	'feet',
	'shoulders',
	'belt',
	'cloak',
	'shield',
	'neck',
	'ring',
	'earring',
	'brooch',
] as const satisfies readonly ArmorType[]
export const armorTypesComplete: AllListed<ArmorType, typeof ARMOR_TYPES> = true

// In order, lowest to highest: a picker shows them this way and a roll can
// index into it.
export const QUALITIES = [
	'shoddy',
	'poor',
	'normal',
	'good',
	'superior',
] as const satisfies readonly Quality[]
export const qualitiesComplete: AllListed<Quality, typeof QUALITIES> = true

// A list with at least one member, so a category or a type can't be empty.
type OneOrMore<T> = readonly [T, ...T[]]

// Categories and the concrete materials in each. A category's materials are
// what an instance can pick from; the player sees the material, never the
// category. A new wood or metal is one entry here and changes nothing below.
export const WEAPON_MATERIALS = {
	wood: ['wood'],
	metal: ['iron'],
	leather: ['leather'],
} as const satisfies Record<WeaponMaterialCategory, OneOrMore<WeaponMaterial>>
export const weaponMaterialsComplete: AllListed<
	WeaponMaterial,
	(typeof WEAPON_MATERIALS)[WeaponMaterialCategory]
> = true

export const ARMOR_MATERIALS = {
	cloth: ['cloth'],
	leather: ['leather'],
	fur: ['fur'],
	wood: ['wood'],
	metal: ['copper'],
} as const satisfies Record<ArmorMaterialCategory, OneOrMore<ArmorMaterial>>
export const armorMaterialsComplete: AllListed<
	ArmorMaterial,
	(typeof ARMOR_MATERIALS)[ArmorMaterialCategory]
> = true

// Which categories each type may use, at least one. Typing these as a Record
// over the type union makes tsc fail when a type is added without an entry.
// Spears, polearms and darts are metal because the tip is the part that counts.
// A whip, when it is added, takes leather (like the sling).
export const WEAPON_CATEGORIES_BY_TYPE = {
	sword: ['metal'],
	dagger: ['metal'],
	spear: ['metal'],
	polearm: ['metal'],
	bow: ['wood'],
	sling: ['leather'],
	crossbow: ['wood'],
	axe: ['metal'],
	mace: ['metal'],
	flail: ['metal'],
	staff: ['wood'],
	fist: ['metal'], // claws and knuckles; bare fists are unarmed combat
	hammer: ['metal'],
	club: ['wood'],
	dart: ['metal'],
} as const satisfies Record<WeaponType, OneOrMore<WeaponMaterialCategory>>

// What is allowed depends on the slot: wood only on shields, jewelry metal only.
export const ARMOR_CATEGORIES_BY_TYPE = {
	head: ['cloth', 'leather', 'fur'],
	chest: ['cloth', 'leather', 'fur'],
	legs: ['cloth', 'leather', 'fur'],
	hands: ['cloth', 'leather', 'fur'],
	wrists: ['cloth', 'leather', 'fur'],
	feet: ['cloth', 'leather', 'fur'],
	shoulders: ['cloth', 'leather', 'fur'],
	belt: ['cloth', 'leather'],
	cloak: ['cloth', 'leather', 'fur'],
	shield: ['wood'],
	neck: ['metal'],
	ring: ['metal'],
	earring: ['metal'],
	brooch: ['metal'],
} as const satisfies Record<ArmorType, OneOrMore<ArmorMaterialCategory>>

export const DICE = [4, 6, 8, 10, 12, 20, 100] as const satisfies readonly Die[]
export const diceComplete: AllListed<Die, typeof DICE> = true
