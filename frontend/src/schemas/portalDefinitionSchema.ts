import { z } from 'zod'
import { portalDefSchema } from './contentSchemas'

// The portal form: the stored portal def, plus a required legacy id (the edit
// hook needs one). An empty interactions list is left out.
export const portalDefinitionSchema = portalDefSchema
	.extend({
		id: z
			.string()
			.trim()
			.min(1, 'ID is required')
			.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
	})
	.transform(({ interactions, ...rest }) => ({
		...rest,
		// No interactions is saved as no key, not an empty array.
		interactions: interactions?.length ? interactions : undefined,
	}))

export type PortalDefinitionFormData = z.infer<typeof portalDefinitionSchema>
