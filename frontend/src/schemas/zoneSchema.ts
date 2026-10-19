import { z } from 'zod'
import type { Zone } from '@/lib/types'
import { positionSchema } from './contentSchemas'

// The zone the builder saves: details, terrain and starting position.
// `dimensions` is not stored (it is the terrain's size). `placements` and
// `edgeExits` are not edited by the builder yet.
//
// Kept free of object-level refinements so `.pick` works on it (zod 4 throws
// when picking from an object that has them); the cross-field check is below.
const zoneBaseSchema = z.object({
	id: z
		.string()
		.trim()
		.min(1, 'ID is required')
		.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'), // user generated for now
	name: z.string().trim().min(1, 'Name is required'),
	dangerLevel: z
		.number({ error: 'Danger level must be a number' })
		.int('Danger level must be a whole number')
		.min(0, 'Danger level cannot be negative')
		.max(10, 'Danger level is at most 10'),
	// Tile _ids, indexed [y][x]
	terrain: z
		.array(z.array(z.string().min(1)).min(1))
		.min(1, 'Draw a map first')
		.refine(
			(rows) => rows.every((r) => r.length === rows[0].length),
			'Every row of the map must be the same width',
		),
	startingPosition: positionSchema,
})

export const zoneSchema = zoneBaseSchema.superRefine((zone, ctx) => {
	const height = zone.terrain.length
	const width = zone.terrain[0]?.length ?? 0
	const { x, y } = zone.startingPosition
	if (x >= width || y >= height) {
		ctx.addIssue({
			code: 'custom',
			path: ['startingPosition'],
			message: 'The start position must be inside the map',
		})
	}
}) satisfies z.ZodType<Zone>

// The fields the details form edits.
export const zoneDetailsSchema = zoneBaseSchema.pick({
	id: true,
	name: true,
	dangerLevel: true,
})

export type ZoneDetailsFormData = z.infer<typeof zoneDetailsSchema>
