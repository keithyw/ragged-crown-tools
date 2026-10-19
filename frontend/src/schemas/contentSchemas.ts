import { z } from 'zod'
import type {
	Action,
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

export const conditionSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('HAS_ITEM'), itemId: z.string().min(1), amount }),
	z.object({ type: z.literal('FLAG_SET'), flag: z.string().min(1) }),
	z.object({ type: z.literal('FLAG_NOT_SET'), flag: z.string().min(1) }),
]) satisfies z.ZodType<Condition>

export const actionSchema = z.discriminatedUnion('type', [
	z.object({ type: z.literal('SHOW_DIALOG'), text: z.string().min(1) }),
	z.object({
		type: z.literal('GIVE_ITEM'),
		itemId: z.string().min(1),
		amount: amount.optional(),
	}),
	z.object({
		type: z.literal('TAKE_ITEM'),
		itemId: z.string().min(1),
		amount: amount.optional(),
	}),
	z.object({ type: z.literal('GIVE_XP'), amount }),
	z.object({ type: z.literal('GIVE_CURRENCY'), amount }),
	z.object({ type: z.literal('SET_FLAG'), flag: z.string().min(1) }),
	z.object({
		type: z.literal('SPAWN'),
		defKind: kindSchema,
		defId: z.string().min(1),
		quantity: amount.optional(),
	}),
	z.object({ type: z.literal('REMOVE_SELF') }),
	z.object({ type: z.literal('TELEPORT'), destination: destinationSchema }),
	z.object({ type: z.literal('PLAY_SOUND'), sound: z.string().min(1) }),
	z.object({
		type: z.literal('MODIFY_ATTRIBUTE'),
		attribute: z.string().min(1),
		amount: z.number().int(), // can be negative
	}),
]) satisfies z.ZodType<Action>

export const interactionSchema = z.object({
	id: z.string().min(1),
	on: interactionTypeSchema,
	conditions: z.array(conditionSchema).optional(),
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
