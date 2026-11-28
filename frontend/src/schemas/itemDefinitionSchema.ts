import { z } from 'zod'
import { currencyIdProblem } from '../lib/constants/currency'
import { itemDefSchema } from './contentSchemas'

const wholeNumber = (label: string) =>
	z
		.number({ error: `${label} must be a number` })
		.int(`${label} must be a whole number`)
		.min(0, 'Cannot be negative')

// The item form: the stored item def, plus a required legacy id (the edit hook
// needs one) and the container as two inputs that default to 0. Same idea as
// the object form: capacity 0 means "not a container", so it is left out.
export const itemDefinitionSchema = itemDefSchema
	.extend({
		id: z
			.string()
			.trim()
			.min(1, 'ID is required')
			.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
		container: z
			.object({
				capacity: wholeNumber('Capacity'),
				maxDepth: wholeNumber('Depth'),
			})
			.optional(),
	})
	.superRefine((item, ctx) => {
		const why = item.isCurrency && currencyIdProblem(item.id)
		if (why) ctx.addIssue({ code: 'custom', path: ['id'], message: why })
	})
	// Typed as its own input, so the form keeps a plain boolean for the flags.
	.transform((item): typeof item => ({
		...item,
		// A flag that is off is left out ("absent = false"), not saved as false.
		isQuestItem: item.isQuestItem || undefined,
		isCurrency: item.isCurrency || undefined,
		container:
			item.container && item.container.capacity > 0
				? item.container
				: undefined,
	}))

export type ItemDefinitionFormData = z.infer<typeof itemDefinitionSchema>
