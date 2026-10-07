import { z } from 'zod'

// missing fields for now:
// 	type: TileType
// 	spriteCoords: Position
// 	encounterTableKey?: string

const requiredNumber = (label: string) =>
	z.number({
		error: (iss) =>
			iss.input === undefined
				? `${label} is required`
				: `${label} must be a number`,
	})

const optionalText = z
	.string()
	.trim()
	.transform((v) => v || undefined)
	.optional()

export const tileDefinitionSchema = z.object({
	id: z
		.string()
		.trim()
		.min(1, 'ID is required')
		.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
	symbol: z.string().min(1, 'Symbol is required').max(2, 'Max 2 characters'),
	color: z
		.string()
		.trim()
		.regex(/^text-\S+$/, 'Must be a Tailwind text-* class'),
	name: z.string().trim().min(1, 'Name is required'),
	bg: z
		.string()
		.trim()
		.regex(/^bg-\S+$/, 'Must be a Tailwind bg-* class'),
	moveCost: requiredNumber('Move cost').min(0, 'Cannot be negative'),
	isWalkable: z.boolean().optional(),
	isConsumable: z.boolean().optional(),
	description: optionalText,
	encounterRate: z.number().optional(),
	// encounterRate: z.number().min(0).max(1, 'Must be between 0 and 1').optional(),
})

export type TileDefinitionFormData = z.infer<typeof tileDefinitionSchema>
