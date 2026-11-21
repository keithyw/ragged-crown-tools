// The lists behind the weapon and armor unions in lib/types/gear.ts. Adding a
// weapon type is one line here and one in the union; the checks below fail
// tsc if a member of a union is missing from its list.
//
// The schema files import this one by a relative path (not '@/'), because the
// MCP runs them through tsx, which doesn't resolve '@/' (ARCHITECTURE.md 6.1).
import type {
	ArmorMaterial,
	ArmorGroup,
	ArmorMaterialCategory,
	ArmorType,
	Quality,
	WeaponGroup,
	WeaponMaterial,
	WeaponMaterialCategory,
	WeaponType,
} from '../types/gear'
import type { Die } from '../types/core'

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

// The groups a difficulty configuration keeps its material tables by
// ([Tools 25]). Every type in a group allows the same categories, so one default
// material per group always fits (a shield and a shirt can't share a table).
// A group is also what a designer adds to a zone: no jewelry group, no jewelry
// rolls. Spears, polearms and darts are metal because the tip is the part that
// counts. A whip, when it is added, takes leather (like the sling).
type GroupSpec<T, C> = {
	label: string
	types: OneOrMore<T>
	categories: OneOrMore<C>
}

export const WEAPON_GROUPS = {
	metal: {
		label: 'Metal weapons',
		types: [
			'sword',
			'dagger',
			'spear',
			'polearm',
			'axe',
			'mace',
			'flail',
			'fist', // claws and knuckles; bare fists are unarmed combat
			'hammer',
			'dart',
		],
		categories: ['metal'],
	},
	wood: {
		label: 'Wooden weapons',
		types: ['bow', 'crossbow', 'staff', 'club'],
		categories: ['wood'],
	},
	leather: {
		label: 'Leather weapons',
		types: ['sling'],
		categories: ['leather'],
	},
} as const satisfies Record<
	WeaponGroup,
	GroupSpec<WeaponType, WeaponMaterialCategory>
>
export const weaponGroupsComplete: AllListed<
	WeaponType,
	(typeof WEAPON_GROUPS)[WeaponGroup]['types']
> = true

// Body armor is the pieces that make up a suit; wrists, belts and cloaks are
// kept apart (bracers are not armor in some systems), and so are shields and
// jewelry. Wood only on shields, jewelry metal only. No metal body armor yet:
// the starting zone doesn't need it.
export const ARMOR_GROUPS = {
	body: {
		label: 'Body armor',
		types: ['head', 'chest', 'legs', 'hands', 'feet', 'shoulders'],
		categories: ['cloth', 'leather', 'fur'],
	},
	wrists: {
		label: 'Wrists',
		types: ['wrists'],
		categories: ['cloth', 'leather', 'fur'],
	},
	belt: {
		label: 'Belts',
		types: ['belt'],
		categories: ['cloth', 'leather'],
	},
	cloak: {
		label: 'Cloaks',
		types: ['cloak'],
		categories: ['cloth', 'leather', 'fur'],
	},
	shield: {
		label: 'Shields',
		types: ['shield'],
		categories: ['wood'],
	},
	jewelry: {
		label: 'Jewelry',
		types: ['neck', 'ring', 'earring', 'brooch'],
		categories: ['metal'],
	},
} as const satisfies Record<
	ArmorGroup,
	GroupSpec<ArmorType, ArmorMaterialCategory>
>
export const armorGroupsComplete: AllListed<
	ArmorType,
	(typeof ARMOR_GROUPS)[ArmorGroup]['types']
> = true

// Which categories each type may use, taken from its group so the two can't
// disagree. A type in two groups is a mistake and throws on load.
function categoriesByType<T extends string, C extends string>(
	groups: Record<string, GroupSpec<T, C>>,
) {
	const out = {} as Record<T, readonly C[]>
	for (const group of Object.values(groups)) {
		for (const type of group.types) {
			if (type in out) throw new Error(`${type} is in two material groups`)
			out[type] = group.categories
		}
	}
	return out
}

export const WEAPON_CATEGORIES_BY_TYPE: Record<
	WeaponType,
	readonly WeaponMaterialCategory[]
> = categoriesByType<WeaponType, WeaponMaterialCategory>(WEAPON_GROUPS)

export const ARMOR_CATEGORIES_BY_TYPE: Record<
	ArmorType,
	readonly ArmorMaterialCategory[]
> = categoriesByType<ArmorType, ArmorMaterialCategory>(ARMOR_GROUPS)

// The category a material belongs to, derived from the lists above and never
// stored ([Inventory 34]). Weapon and armor lists are separate because
// `leather` and `wood` sit in both. A material in two categories of one list
// is a mistake and throws on load.
function categoryLookup<C extends string, M extends string>(
	materials: Record<C, readonly M[]>,
) {
	const out = new Map<M, C>()
	for (const c of Object.keys(materials) as C[]) {
		for (const m of materials[c]) {
			if (out.has(m)) throw new Error(`${m} is in two material categories`)
			out.set(m, c)
		}
	}
	return (material: M): C | undefined => out.get(material)
}

export const weaponCategoryOf = categoryLookup<
	WeaponMaterialCategory,
	WeaponMaterial
>(WEAPON_MATERIALS)
export const armorCategoryOf = categoryLookup<
	ArmorMaterialCategory,
	ArmorMaterial
>(ARMOR_MATERIALS)

// What the configuration screen and its schema read: per group, its label, its
// types and the concrete materials of its categories.
function groupInfo<G extends string, C extends string, M extends string>(
	groups: Record<
		G,
		{ label: string; types: readonly string[]; categories: readonly C[] }
	>,
	materials: Record<C, readonly M[]>,
) {
	const out = {} as Record<
		G,
		{
			label: string
			types: readonly string[]
			categories: Record<string, readonly M[]>
		}
	>
	for (const g of Object.keys(groups) as G[]) {
		const { label, types, categories } = groups[g]
		out[g] = {
			label,
			types,
			categories: Object.fromEntries(categories.map((c) => [c, materials[c]])),
		}
	}
	return out
}

export const WEAPON_GROUP_INFO = groupInfo<
	WeaponGroup,
	WeaponMaterialCategory,
	WeaponMaterial
>(WEAPON_GROUPS, WEAPON_MATERIALS)
export const ARMOR_GROUP_INFO = groupInfo<
	ArmorGroup,
	ArmorMaterialCategory,
	ArmorMaterial
>(ARMOR_GROUPS, ARMOR_MATERIALS)

export const DICE = [4, 6, 8, 10, 12, 20, 100] as const satisfies readonly Die[]
export const diceComplete: AllListed<Die, typeof DICE> = true

// Whether a set quality or material may go with this def, or why not
// ([Skills 19]): only weapons and armor carry qualifiers, and a material must
// be one of the categories the type allows. The editors only offer what passes;
// the MCP, which has no pickers, calls this. A blank field has nothing to check.
export function qualifierProblem(
	def: { kind?: unknown; type?: unknown },
	qualifiers: { quality?: unknown; material?: unknown },
): string | undefined {
	if (def.kind !== 'weapon' && def.kind !== 'armor') {
		return `only weapons and armor carry qualifiers, and this def's kind is '${String(def.kind)}'`
	}
	if (qualifiers.material === undefined) return undefined
	const type = String(def.type)
	const categories: readonly string[] | undefined =
		def.kind === 'weapon'
			? WEAPON_CATEGORIES_BY_TYPE[type as WeaponType]
			: ARMOR_CATEGORIES_BY_TYPE[type as ArmorType]
	if (!categories) return undefined // an unknown type is the def's own problem
	const materials: readonly string[] = categories.flatMap((c) =>
		def.kind === 'weapon'
			? WEAPON_MATERIALS[c as WeaponMaterialCategory]
			: ARMOR_MATERIALS[c as ArmorMaterialCategory],
	)
	return materials.includes(String(qualifiers.material))
		? undefined
		: `material '${String(qualifiers.material)}' doesn't suit a ${type} (allowed: ${materials.join(', ')})`
}
