import { z } from 'zod'
import { objectDefSchema } from './contentSchemas'

const wholeNumber = (label: string) =>
	z
		.number({ error: `${label} must be a number` })
		.int(`${label} must be a whole number`)
		.min(0, 'Cannot be negative')

// The object form: the stored object def, plus a required legacy id (the edit
// hook needs one) and the container as two inputs that default to 0.
// The transform turns the form's shape back into the stored one:
//   - capacity 0 means "not a container", so the container is left out
//   - moveCost only applies to spaces, so a solid object doesn't keep one
export const objectDefinitionSchema = objectDefSchema
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
	.transform(({ container, isSolid, moveCost, ...rest }) => ({
		...rest,
		isSolid,
		moveCost: isSolid ? undefined : moveCost,
		container: container && container.capacity > 0 ? container : undefined,
	}))

export type ObjectDefinitionFormData = z.infer<typeof objectDefinitionSchema>
