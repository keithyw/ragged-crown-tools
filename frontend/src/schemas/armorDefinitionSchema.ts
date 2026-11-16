import { z } from 'zod'
import { armorDefSchema } from './contentSchemas'

// The armor form: the stored armor def, plus a required legacy id (the edit
// hook needs one).
export const armorDefinitionSchema = armorDefSchema.extend({
	id: z
		.string()
		.trim()
		.min(1, 'ID is required')
		.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
})

export type ArmorDefinitionFormData = z.infer<typeof armorDefinitionSchema>
