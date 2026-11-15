// The lists behind the weapon and armor unions in lib/types/gear.ts. Adding a
// weapon type is one line here and one in the union; the checks below fail
// tsc if a member of a union is missing from its list.
//
// The schema files import this one by a relative path (not '@/'), because the
// MCP runs them through tsx, which doesn't resolve '@/' (ARCHITECTURE.md 6.1).
import type { ArmorType, Die, WeaponType } from '../types/gear'

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

export const DICE = [4, 6, 8, 10, 12, 20, 100] as const satisfies readonly Die[]
export const diceComplete: AllListed<Die, typeof DICE> = true
