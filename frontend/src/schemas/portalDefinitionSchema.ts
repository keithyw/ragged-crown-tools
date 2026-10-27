import { z } from 'zod'
import { portalDefSchema } from './contentSchemas'

// The portal form: the stored portal def, plus a required legacy id (the edit
// hook needs one).
export const portalDefinitionSchema = portalDefSchema.extend({
	id: z
		.string()
		.trim()
		.min(1, 'ID is required')
		.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
})

export type PortalDefinitionFormData = z.infer<typeof portalDefinitionSchema>
