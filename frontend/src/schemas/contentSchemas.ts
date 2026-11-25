import { z } from 'zod'
// Relative, not '@/': the MCP runs this file through tsx (ARCHITECTURE.md 6.1).
import {
	ARMOR_MATERIALS,
	ARMOR_TYPES,
	DICE,
	QUALITIES,
	WEAPON_MATERIALS,
	WEAPON_TYPES,
} from '../lib/constants/gear'
import { MONSTER_RARITIES } from '../lib/constants/monsters'
import type {
	Action,
	ArmorDef,
	CharacterStat,
	Condition,
	ContainerSpec,
	CustomValue,
	Destination,
	Glyph,
	Interaction,
	InteractionType,
	ItemDef,
	Kind,
	Material,
	MonsterDef,
	ObjectDef,
	Placement,
	PortalDef,
	Position,
	RandomRoll,
	TileDef,
	WeaponDef,
} from '@/lib/types'

// Zod mirrors of the content model in the shared types, lib/types/shared.ts (DATA-MODEL.md).
// Each `satisfies` makes tsc fail if a schema drifts from its type.
// Container depth needs the defs, so it is checked in lib/utils/containers.ts.

const optionalText = z
	.string()
	.trim()
	.transform((v) => v || undefined)
	.optional()

export const kindSchema = z.enum([
	'terrain',
	'object',
	'item',
	'weapon',
	'armor',
	'monster',
	'portal',
]) satisfies z.ZodType<Kind>

export const positionSchema = z.object({
	x: z.number().int().min(0),
	y: z.number().int().min(0),
}) satisfies z.ZodType<Position>

export const destinationSchema = z.union([
	z.object({
		zoneId: z.string().min(1, 'Pick a zone'),
		pos: positionSchema.optional(),
	}),
	z.object({ back: z.literal(true) }),
]) satisfies z.ZodType<Destination>

export const glyphSchema = z.object({
	symbol: z.string().min(1, 'Symbol is required').max(2, 'Max 2 characters'),
	color: z
		.string()
		.trim()
		.regex(/^text-\S+$/, 'Must be a Tailwind text-* class'),
	bg: z
		.string()
		.trim()
		.regex(/^bg-\S+$/, 'Must be a Tailwind bg-* class'),
}) satisfies z.ZodType<Glyph>

// ---- Interactions ----

export const interactionTypeSchema = z.enum([
	'WALK',
	'TALK',
	'PICKUP',
	'DROP',
	'USE',
	'OPEN',
	'CLOSE',
	'BUMP_INTERACT',
]) satisfies z.ZodType<InteractionType>

const amount = z.number().int().min(1)

// Like the custom actions below: a custom item check leaves the item and amount
// to each placement, so nothing but the flag is kept (DATA-MODEL.md 4.6).
//
// Every custom action or condition keeps its `slot` id, the key a placement's
// value is stored under. One saved before slots existed gets a new id here,
// so it is added the next time the def is saved.
const hasItemSchema = z
	.object({
		type: z.literal('HAS_ITEM'),
		custom: z.boolean().optional(),
		slot: z.string().min(1).optional(),
		itemId: z.string().optional(),
		amount: amount.optional(),
	})
	.superRefine((c, ctx) => {
		if (c.custom) return
		if (!c.itemId) {
			ctx.addIssue({
				code: 'custom',
				path: ['itemId'],
				message: 'Choose an item.',
			})
		}
		if (c.amount === undefined) {
			ctx.addIssue({
				code: 'custom',
				path: ['amount'],
				message: 'Enter an amount.',
			})
		}
	})
	.transform((c) =>
		c.custom
			? {
					type: c.type,
					custom: true as const,
					slot: c.slot ?? crypto.randomUUID(),
				}
			: { type: c.type, itemId: c.itemId ?? '', amount: c.amount ?? 1 },
	)

export const conditionSchema = z.discriminatedUnion('type', [
	hasItemSchema,
	z.object({ type: z.literal('FLAG_SET'), flag: z.string().min(1) }),
	z.object({ type: z.literal('FLAG_NOT_SET'), flag: z.string().min(1) }),
]) satisfies z.ZodType<Condition>

// A custom action leaves its value to each placement, so it is not validated
// and nothing but the flag is kept (DATA-MODEL.md 4.6). Otherwise the value is
// required and `custom` is dropped.
const showDialogSchema = z
	.object({
		type: z.literal('SHOW_DIALOG'),
		custom: z.boolean().optional(),
		slot: z.string().min(1).optional(),
		text: z.string().optional(),
	})
	.superRefine((a, ctx) => {
		if (!a.custom && !a.text) {
			ctx.addIssue({
				code: 'custom',
				path: ['text'],
				message: 'Dialog text is required.',
			})
		}
	})
	.transform((a) =>
		a.custom
			? {
					type: a.type,
					custom: true as const,
					slot: a.slot ?? crypto.randomUUID(),
				}
			: { type: a.type, text: a.text ?? '' },
	)

// Every material that exists, in either list.
const MATERIALS = [
	...new Set([
		...Object.values(WEAPON_MATERIALS).flat(),
		...Object.values(ARMOR_MATERIALS).flat(),
	]),
] as [Material, ...Material[]]

// The quality and material of one instance ([Inventory 28]). Only a value that
// is set is checked, and it has to be a real one; a field left out means "roll
// when picked up" and is not stored, nor is an empty `qualifiers`. Whether the
// material suits the item's type needs the def, so the editors and the MCP
// check that, not this schema.
export const qualifiersSchema = z
	.object({
		quality: z.enum(QUALITIES).optional(),
		material: z.enum(MATERIALS).optional(),
	})
	.transform((q) => (q.quality || q.material ? q : undefined))

const spawnSchema = z
	.object({
		type: z.literal('SPAWN'),
		custom: z.boolean().optional(),
		slot: z.string().min(1).optional(),
		defKind: kindSchema.optional(),
		defId: z.string().optional(),
		quantity: amount.optional(),
		qualifiers: qualifiersSchema.optional(),
	})
	.superRefine((a, ctx) => {
		if (!a.custom && (!a.defKind || !a.defId)) {
			ctx.addIssue({
				code: 'custom',
				path: ['defId'],
				message: 'Choose what to spawn.',
			})
		}
	})
	.transform((a): Extract<Action, { type: 'SPAWN' }> =>
		a.custom
			? {
					type: a.type,
					custom: true as const,
					slot: a.slot ?? crypto.randomUUID(),
				}
			: {
					type: a.type,
					defKind: a.defKind ?? ('item' as const),
					defId: a.defId ?? '',
					quantity: a.quantity,
					qualifiers: a.qualifiers,
				},
	)

// A barrier's set encounter: always custom, no value on the def ([Combat 7]).
const spawnMonsterSchema = z
	.object({
		type: z.literal('SPAWN_MONSTER'),
		custom: z.literal(true).optional(),
		slot: z.string().min(1).optional(),
	})
	.transform((a): Extract<Action, { type: 'SPAWN_MONSTER' }> => ({
		type: a.type,
		custom: true as const,
		slot: a.slot ?? crypto.randomUUID(),
	}))

// A random encounter space ([Combat 12]): always custom, no value on the def.
const randomEncounterSchema = z
	.object({
		type: z.literal('RANDOM_ENCOUNTER'),
		custom: z.literal(true).optional(),
		slot: z.string().min(1).optional(),
	})
	.transform((a): Extract<Action, { type: 'RANDOM_ENCOUNTER' }> => ({
		type: a.type,
		custom: true as const,
		slot: a.slot ?? crypto.randomUUID(),
	}))

// Removes another object in the zone: always custom, the target is picked on
// the placement.
const removeObjectSchema = z
	.object({
		type: z.literal('REMOVE_OBJECT'),
		custom: z.literal(true).optional(),
		slot: z.string().min(1).optional(),
	})
	.transform((a): Extract<Action, { type: 'REMOVE_OBJECT' }> => ({
		type: a.type,
		custom: true as const,
		slot: a.slot ?? crypto.randomUUID(),
	}))

export const characterStatSchema = z.enum([
	'strength',
	'dexterity',
	'intelligence',
	'wisdom',
	'personality',
	'speed',
	'constitution',
	'hp',
	'sp',
	'xp',
	'level',
]) satisfies z.ZodType<CharacterStat>

// `bar` only means something for hp and sp, so it is dropped for any other
// stat.
const modifyAttributeSchema = z
	.object({
		type: z.literal('MODIFY_ATTRIBUTE'),
		attribute: characterStatSchema,
		amount: z.number().int(), // can be negative
		bar: z.enum(['current', 'max']).optional(),
		target: z.enum(['character', 'party']).optional(),
	})
	.transform(({ bar, ...a }) =>
		a.attribute === 'hp' || a.attribute === 'sp' ? { ...a, bar } : a,
	)

// TAKE_ITEM; can be custom (GIVE_ITEM is giveItemSchema, below).
const itemActionSchema = <T extends 'TAKE_ITEM'>(type: T) =>
	z
		.object({
			type: z.literal(type),
			custom: z.boolean().optional(),
			slot: z.string().min(1).optional(),
			itemId: z.string().optional(),
			amount: amount.optional(),
		})
		.superRefine((a, ctx) => {
			if (!a.custom && !a.itemId) {
				ctx.addIssue({
					code: 'custom',
					path: ['itemId'],
					message: 'Choose an item.',
				})
			}
		})
		.transform((a) =>
			a.custom
				? {
						type: a.type,
						custom: true as const,
						slot: a.slot ?? crypto.randomUUID(),
					}
				: { type: a.type, itemId: a.itemId ?? '', amount: a.amount },
		)

// GIVE_ITEM hands over an instance, so it can say which one (weapons and armor).
// Same as itemActionSchema otherwise; kept apart so TAKE_ITEM doesn't get the field.
const giveItemSchema = z
	.object({
		type: z.literal('GIVE_ITEM'),
		custom: z.boolean().optional(),
		slot: z.string().min(1).optional(),
		itemId: z.string().optional(),
		amount: amount.optional(),
		qualifiers: qualifiersSchema.optional(),
	})
	.superRefine((a, ctx) => {
		if (!a.custom && !a.itemId) {
			ctx.addIssue({
				code: 'custom',
				path: ['itemId'],
				message: 'Choose an item.',
			})
		}
	})
	.transform((a): Extract<Action, { type: 'GIVE_ITEM' }> =>
		a.custom
			? {
					type: a.type,
					custom: true as const,
					slot: a.slot ?? crypto.randomUUID(),
				}
			: {
					type: a.type,
					itemId: a.itemId ?? '',
					amount: a.amount,
					qualifiers: a.qualifiers,
				},
	)

export const actionSchema = z.discriminatedUnion('type', [
	showDialogSchema,
	giveItemSchema,
	itemActionSchema('TAKE_ITEM'),
	z.object({ type: z.literal('GIVE_CURRENCY'), amount }),
	z.object({ type: z.literal('SET_FLAG'), flag: z.string().min(1) }),
	spawnSchema,
	spawnMonsterSchema,
	randomEncounterSchema,
	removeObjectSchema,
	z.object({ type: z.literal('REMOVE_SELF') }),
	z.object({ type: z.literal('TELEPORT'), destination: destinationSchema }),
	z.object({ type: z.literal('PLAY_SOUND'), sound: z.string().min(1) }),
	modifyAttributeSchema,
]) satisfies z.ZodType<Action>

export const interactionSchema = z.object({
	id: z.string().min(1),
	on: interactionTypeSchema,
	conditions: z.array(conditionSchema).optional(),
	hint: optionalText,
	actions: z.array(actionSchema),
	limit: z.number().int().min(1).optional(), // absent = unlimited
}) satisfies z.ZodType<Interaction>

// ---- Definitions ----

export const containerSpecSchema = z.object({
	capacity: z.number().int().min(1),
	maxDepth: z.number().int().min(0).optional(),
}) satisfies z.ZodType<ContainerSpec>

const baseDefSchema = z.object({
	id: optionalText, // legacy, display only
	kind: kindSchema,
	name: z.string().trim().min(1, 'Name is required'),
	description: optionalText,
	glyph: glyphSchema,
	spriteId: optionalText, // a sprite's _id
})

// A terrain's short key for writing a zone's terrain as a grid (Trello
// [Terrain 1], [Infra 23]). Two lowercase letters or digits, unique per
// tile_defs (index `code_unique`). Tools only for now: not in the shared types.
const terrainCode = z
	.string()
	.trim()
	.toLowerCase()
	.transform((v) => v || undefined)
	.pipe(
		z
			.string()
			.regex(/^[a-z0-9]{2}$/, 'Two lowercase letters or digits')
			.optional(),
	)
	.optional()

export const tileDefSchema = baseDefSchema.extend({
	kind: z.literal('terrain'),
	code: terrainCode,
	moveCost: z.number().min(0, 'Cannot be negative'),
	isWalkable: z.boolean().optional(),
	encounterRate: z.number().optional(),
}) satisfies z.ZodType<TileDef>

export const objectDefSchema = baseDefSchema.extend({
	kind: z.literal('object'),
	isSolid: z.boolean(),
	isInvisible: z.boolean().optional(),
	moveCost: z.number().min(0, 'Cannot be negative').optional(),
	numberOfUses: z.number().int().min(1).optional(),
	container: containerSpecSchema.optional(),
	interactions: z.array(interactionSchema).optional(),
}) satisfies z.ZodType<ObjectDef>

// What items, weapons and armor all have (CarriedDef).
const carriedShape = {
	// Of one item. Rounded to 2 decimals here, so what is stored never has more.
	weight: z
		.number({ error: 'Weight must be a number' })
		.min(0, 'Cannot be negative')
		.transform((v) => Math.round(v * 100) / 100),
	maxQuantity: z
		.number()
		.int()
		.min(2, 'Leave blank for a single item, or enter 2 or more')
		.optional(),
	numberOfUses: z.number().int().min(1).optional(),
	isQuestItem: z.boolean().optional(),
	interactions: z.array(interactionSchema).optional(),
}

export const itemDefSchema = baseDefSchema.extend({
	kind: z.literal('item'),
	...carriedShape,
	container: containerSpecSchema.optional(),
}) satisfies z.ZodType<ItemDef>

// A dice roll (RandomRoll), the same shape wherever dice are stored.
export const randomRollSchema = z.object({
	count: z
		.number({ error: 'Count must be a number' })
		.int('Count must be a whole number')
		.min(1, 'At least 1'),
	die: z.literal(DICE),
}) satisfies z.ZodType<RandomRoll>

export const weaponDefSchema = baseDefSchema.extend({
	kind: z.literal('weapon'),
	...carriedShape,
	type: z.enum(WEAPON_TYPES),
	damage: randomRollSchema,
	isTwoHanded: z.boolean().optional(),
	isMissile: z.boolean().optional(),
	isThrown: z.boolean().optional(),
}) satisfies z.ZodType<WeaponDef>

export const armorDefSchema = baseDefSchema.extend({
	kind: z.literal('armor'),
	...carriedShape,
	type: z.enum(ARMOR_TYPES),
	defenseValue: z
		.number({ error: 'Defense value must be a number' })
		.int('Defense value must be a whole number')
		// No ceiling: a character's total defense can be high (owner, 2026-11-16).
		.min(0, 'Cannot be negative'),
}) satisfies z.ZodType<ArmorDef>

export const monsterDefSchema = baseDefSchema.extend({
	kind: z.literal('monster'),
	level: z
		.number({ error: 'Level must be a number' })
		.int('Level must be a whole number')
		.min(0, 'Cannot be negative'),
	hp: z
		.number({ error: 'HP must be a number' })
		.int('HP must be a whole number')
		.min(1, 'At least 1'),
	defenseValue: z
		.number({ error: 'Defense value must be a number' })
		.int('Defense value must be a whole number')
		.min(0, 'Cannot be negative'),
	removalChance: z
		.number({ error: 'Removal chance must be a number' })
		.int('Removal chance must be a whole number')
		.min(0, 'Cannot be negative')
		.max(100, 'At most 100'),
	damage: randomRollSchema,
	// Absent reads as 6 in the game (owner, 2026-11-24).
	initiative: z
		.number({ error: 'Initiative must be a number' })
		.int('Initiative must be a whole number')
		.min(0, 'Cannot be negative')
		.optional(),
	// Required, no default: the scale depends on the monster and the zone
	// it lives in ([Monsters 8]).
	xp: z
		.number({ error: 'XP must be a number' })
		.int('XP must be a whole number')
		.min(0, 'Cannot be negative'),
	// Required, no default: every monster gets a deliberate tier ([Monsters 10]).
	rarity: z.enum(MONSTER_RARITIES, { error: 'Choose a rarity' }),
	numberAppearing: randomRollSchema,
	// An empty list is stored as absent, like the other optional fields
	// ([Monsters 11]). The MCP checks each one is a terrain that exists.
	terrainIds: z
		.array(z.string())
		.transform((v) => (v.length > 0 ? v : undefined))
		.optional(),
	isUnique: z.boolean().optional(),
}) satisfies z.ZodType<MonsterDef>

export const portalDefSchema = baseDefSchema.extend({
	kind: z.literal('portal'),
	twoWay: z.boolean(),
	interactions: z.array(interactionSchema).optional(),
}) satisfies z.ZodType<PortalDef>

export const defSchema = z.discriminatedUnion('kind', [
	tileDefSchema,
	objectDefSchema,
	itemDefSchema,
	weaponDefSchema,
	armorDefSchema,
	monsterDefSchema,
	portalDefSchema,
])

// ---- Placements ----

// The value a placement gives one of its def's custom slots. Every field is
// optional: a blank still saves, and zone validation reports it.
export const customValueSchema = z.union([
	z.object({ type: z.literal('SHOW_DIALOG'), text: z.string().optional() }),
	z.object({
		type: z.enum(['TAKE_ITEM', 'HAS_ITEM']),
		itemId: z.string().optional(),
		amount: amount.optional(),
	}),
	z.object({
		type: z.literal('GIVE_ITEM'),
		itemId: z.string().optional(),
		amount: amount.optional(),
		qualifiers: qualifiersSchema.optional(),
	}),
	z.object({
		type: z.literal('SPAWN'),
		defKind: kindSchema.optional(),
		defId: z.string().optional(),
		quantity: amount.optional(),
		qualifiers: qualifiersSchema.optional(),
	}),
	z.object({
		type: z.literal('REMOVE_OBJECT'),
		targetUid: z.string().min(1).optional(),
	}),
	z.object({
		type: z.literal('RANDOM_ENCOUNTER'),
		repeatable: z.boolean().optional(),
	}),
	z.object({
		type: z.literal('SPAWN_MONSTER'),
		groups: z
			.array(z.object({ defId: z.string().min(1), count: amount.optional() }))
			.optional(),
		showAs: z.number().int().min(0).optional(),
		hideSprite: z.boolean().optional(),
	}),
]) satisfies z.ZodType<CustomValue>

// Recursive (contents), so it needs an explicit annotation instead of `satisfies`.
export const placementSchema: z.ZodType<Placement> = z.object({
	uid: z.string().min(1),
	defKind: kindSchema,
	defId: z.string().min(1),
	quantity: amount.optional(),
	qualifiers: qualifiersSchema.optional(),
	interactions: z.array(interactionSchema).optional(),
	get contents() {
		return z.array(placementSchema).optional()
	},
	destination: destinationSchema.optional(),
	customValues: z.record(z.string().min(1), customValueSchema).optional(),
})
