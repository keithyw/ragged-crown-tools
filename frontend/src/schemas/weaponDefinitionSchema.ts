import { z } from 'zod'
import { weaponDefSchema } from './contentSchemas'

// The weapon form: the stored weapon def, plus a required legacy id (the edit
// hook needs one). The transform turns the form's shape back into the stored
// one: a flag that is off is left out ("absent = false"), not saved as false.
export const weaponDefinitionSchema = weaponDefSchema
	.extend({
		id: z
			.string()
			.trim()
			.min(1, 'ID is required')
			.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
	})
	// Typed as its own input, so the form keeps plain booleans for the flags.
	.transform((w): typeof w => ({
		...w,
		isTwoHanded: w.isTwoHanded || undefined,
		isMissile: w.isMissile || undefined,
		isThrown: w.isThrown || undefined,
		isQuestItem: w.isQuestItem || undefined,
	}))

export type WeaponDefinitionFormData = z.infer<typeof weaponDefinitionSchema>
