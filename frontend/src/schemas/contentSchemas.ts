import { z } from 'zod'
import type {
	Action,
	CharacterStat,
	Condition,
	ContainerSpec,
	CreatureDef,
	Destination,
	Glyph,
	Interaction,
	InteractionType,
	ItemDef,
	Kind,
	ObjectDef,
	Placement,
	PortalDef,
	Position,
	TileDef,
} from '@/lib/types'

// Zod mirrors of the content model in lib/types/map.ts (DATA-MODEL.md).
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
	'creature',
	'portal',
]) satisfies z.ZodType<Kind>

export const positionSchema = z.object({
	x: z.number().int().min(0),
	y: z.number().int().min(0),
}) satisfies z.ZodType<Position>

export const destinationSchema = z.object({
	zoneId: z.string().min(1, 'Pick a zone'),
	pos: positionSchema.optional(),
}) satisfies z.ZodType<Destination>

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
const hasItemSchema = z
	.object({
		type: z.literal('HAS_ITEM'),
		custom: z.boolean().optional(),
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
			? { type: c.type, custom: true as const }
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
			? { type: a.type, custom: true as const }
			: { type: a.type, text: a.text ?? '' },
	)

const spawnSchema = z
	.object({
		type: z.literal('SPAWN'),
		custom: z.boolean().optional(),
		defKind: kindSchema.optional(),
		defId: z.string().optional(),
		quantity: amount.optional(),
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
	.transform((a) =>
		a.custom
			? { type: a.type, custom: true as const }
			: {
					type: a.type,
					defKind: a.defKind ?? ('item' as const),
					defId: a.defId ?? '',
					quantity: a.quantity,
				},
	)

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

// GIVE_ITEM and TAKE_ITEM are the same shape; either can be custom.
const itemActionSchema = <T extends 'GIVE_ITEM' | 'TAKE_ITEM'>(type: T) =>
	z
		.object({
			type: z.literal(type),
			custom: z.boolean().optional(),
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
				? { type: a.type, custom: true as const }
				: { type: a.type, itemId: a.itemId ?? '', amount: a.amount },
		)

export const actionSchema = z.discriminatedUnion('type', [
	showDialogSchema,
	itemActionSchema('GIVE_ITEM'),
	itemActionSchema('TAKE_ITEM'),
	z.object({ type: z.literal('GIVE_CURRENCY'), amount }),
	z.object({ type: z.literal('SET_FLAG'), flag: z.string().min(1) }),
	spawnSchema,
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

export const tileDefSchema = baseDefSchema.extend({
	kind: z.literal('terrain'),
	moveCost: z.number().min(0, 'Cannot be negative'),
	isWalkable: z.boolean().optional(),
	encounterRate: z.number().optional(),
	encounterTableKey: optionalText,
}) satisfies z.ZodType<TileDef>

export const objectDefSchema = baseDefSchema.extend({
	kind: z.literal('object'),
	isSolid: z.boolean(),
	moveCost: z.number().min(0, 'Cannot be negative').optional(),
	numberOfUses: z.number().int().min(1).optional(),
	container: containerSpecSchema.optional(),
	interactions: z.array(interactionSchema).optional(),
}) satisfies z.ZodType<ObjectDef>

export const itemDefSchema = baseDefSchema.extend({
	kind: z.literal('item'),
	stackable: z.boolean(),
	numberOfUses: z.number().int().min(1).optional(),
	container: containerSpecSchema.optional(),
	interactions: z.array(interactionSchema).optional(),
}) satisfies z.ZodType<ItemDef>

export const creatureDefSchema = baseDefSchema.extend({
	kind: z.literal('creature'),
}) satisfies z.ZodType<CreatureDef>

export const portalDefSchema = baseDefSchema.extend({
	kind: z.literal('portal'),
	twoWay: z.boolean(),
	interactions: z.array(interactionSchema).optional(),
}) satisfies z.ZodType<PortalDef>

export const defSchema = z.discriminatedUnion('kind', [
	tileDefSchema,
	objectDefSchema,
	itemDefSchema,
	creatureDefSchema,
	portalDefSchema,
])

// ---- Placements ----

// Recursive (contents), so it needs an explicit annotation instead of `satisfies`.
export const placementSchema: z.ZodType<Placement> = z.object({
	uid: z.string().min(1),
	defKind: kindSchema,
	defId: z.string().min(1),
	quantity: amount.optional(),
	interactions: z.array(interactionSchema).optional(),
	get contents() {
		return z.array(placementSchema).optional()
	},
	destination: destinationSchema.optional(),
})
