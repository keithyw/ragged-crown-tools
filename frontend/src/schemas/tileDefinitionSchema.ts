import { z } from 'zod'
import { tileDefSchema } from './contentSchemas'

// missing fields for now:
// 	spriteCoords: Position
// 	encounterTableKey?: string

const requiredNumber = (label: string) =>
	z.number({
		error: (iss) =>
			iss.input === undefined
				? `${label} is required`
				: `${label} must be a number`,
	})

// The tile form: the stored terrain def, plus a required legacy id and the
// form's friendlier number message.
export const tileDefinitionSchema = tileDefSchema.extend({
	id: z
		.string()
		.trim()
		.min(1, 'ID is required')
		.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
	moveCost: requiredNumber('Move cost').min(0, 'Cannot be negative'),
	// encounterRate: z.number().min(0).max(1, 'Must be between 0 and 1').optional(),
})

export type TileDefinitionFormData = z.infer<typeof tileDefinitionSchema>
