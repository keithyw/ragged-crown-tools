// The lists behind the weapon and armor unions in lib/types/gear.ts. Adding a
// weapon type is one line here and one in the union; the checks below fail
// tsc if a member of a union is missing from its list.
//
// The schema files import this one by a relative path (not '@/'), because the
// MCP runs them through tsx, which doesn't resolve '@/' (ARCHITECTURE.md 6.1).
import type {
	ArmorMaterial,
	ArmorType,
	Die,
	Quality,
	WeaponMaterial,
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

export const WEAPON_MATERIALS = [
	'wood',
	'iron',
	'leather',
] as const satisfies readonly WeaponMaterial[]
export const weaponMaterialsComplete: AllListed<
	WeaponMaterial,
	typeof WEAPON_MATERIALS
> = true

export const ARMOR_MATERIALS = [
	'cloth',
	'leather',
	'fur',
	'wood',
	'copper',
] as const satisfies readonly ArmorMaterial[]
export const armorMaterialsComplete: AllListed<
	ArmorMaterial,
	typeof ARMOR_MATERIALS
> = true

// Which materials each type may use. Typing these as a Record over the type
// union makes tsc fail when a type is added without an entry here.
// Spears, polearms and darts are iron because the tip is the part that counts.
// A whip, when it is added, takes leather (like the sling).
export const WEAPON_MATERIALS_BY_TYPE = {
	sword: ['iron'],
	dagger: ['iron'],
	spear: ['iron'],
	polearm: ['iron'],
	bow: ['wood'],
	sling: ['leather'],
	crossbow: ['wood'],
	axe: ['iron'],
	mace: ['iron'],
	flail: ['iron'],
	staff: ['wood'],
	fist: ['iron'], // claws and knuckles; bare fists are unarmed combat
	hammer: ['iron'],
	club: ['wood'],
	dart: ['iron'],
} as const satisfies Record<WeaponType, readonly WeaponMaterial[]>

// Wood is allowed on shields only. Jewelry is metal only.
export const ARMOR_MATERIALS_BY_TYPE = {
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
	neck: ['copper'],
	ring: ['copper'],
	earring: ['copper'],
	brooch: ['copper'],
} as const satisfies Record<ArmorType, readonly ArmorMaterial[]>

export const DICE = [4, 6, 8, 10, 12, 20, 100] as const satisfies readonly Die[]
export const diceComplete: AllListed<Die, typeof DICE> = true
