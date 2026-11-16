import { z } from 'zod'
import { armorDefSchema } from './contentSchemas'

// The armor form: the stored armor def, plus a required legacy id (the edit
// hook needs one). The transform leaves a quest flag that is off out
// ("absent = false"), not saved as false.
export const armorDefinitionSchema = armorDefSchema
	.extend({
		id: z
			.string()
			.trim()
			.min(1, 'ID is required')
			.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
	})
	.transform((a): typeof a => ({
		...a,
		isQuestItem: a.isQuestItem || undefined,
	}))

export type ArmorDefinitionFormData = z.infer<typeof armorDefinitionSchema>
