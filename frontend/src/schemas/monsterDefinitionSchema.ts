import { z } from 'zod'
import { monsterDefSchema } from './contentSchemas'

// The monster form: the stored monster def, plus a required legacy id (the
// edit hook needs one). The transform turns the form's shape back into the
// stored one: a flag that is off is left out ("absent = false"), not saved as
// false.
export const monsterDefinitionSchema = monsterDefSchema
	.extend({
		id: z
			.string()
			.trim()
			.min(1, 'ID is required')
			.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
	})
	// Typed as its own input, so the form keeps a plain boolean for the flag.
	.transform((m): typeof m => ({
		...m,
		isUnique: m.isUnique || undefined,
	}))

export type MonsterDefinitionFormData = z.infer<typeof monsterDefinitionSchema>
