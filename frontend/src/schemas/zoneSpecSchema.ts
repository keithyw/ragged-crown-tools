import { z } from 'zod'
// Relative, and not the barrels, on purpose: the MCP runs schema files through
// tsx, which can't resolve a runtime `@/` import (ARCHITECTURE.md 6.1).
import { ZONE_SPEC_STATUSES, type ZoneSpec } from '../lib/types/zoneSpec'
import { MAX_ZONE_SIZE, MIN_ZONE_SIZE } from '../lib/utils/Zonegrid'

const sizeError = `Whole number from ${MIN_ZONE_SIZE} to ${MAX_ZONE_SIZE}`
const zoneSize = z
	.number({ error: sizeError })
	.int(sizeError)
	.min(MIN_ZONE_SIZE, sizeError)
	.max(MAX_ZONE_SIZE, sizeError)

// A request for a generated zone (DATA-MODEL.md 2.3). Deliberately small: a
// field is added when a real zone shows the need for it.
export const zoneSpecSchema = z.object({
	// Same rule as a zone's id, because the generated zone takes this one.
	id: z
		.string()
		.trim()
		.min(1, 'ID is required')
		.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'),
	name: z.string().trim().min(1, 'Name is required'),
	width: zoneSize,
	height: zoneSize,
	dangerLevel: z
		.number({ error: 'Danger level must be a number' })
		.int('Danger level must be a whole number')
		.min(0, 'Danger level cannot be negative')
		.max(10, 'Danger level is at most 10'),
	description: z.string().trim().min(1, 'Description is required'),
	status: z.enum(ZONE_SPEC_STATUSES).default('pending'),
}) satisfies z.ZodType<ZoneSpec>

export type ZoneSpecFormData = z.infer<typeof zoneSpecSchema>
