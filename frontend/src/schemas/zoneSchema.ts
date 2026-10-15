import { z } from 'zod'

export const zoneWizardSchema = z.object({
	name: z.string().trim().min(1, 'Name is required'),
	dangerLevel: z.number().int().min(0).max(10),
	width: z.number().int().min(1).max(64),
	height: z.number().int().min(1).max(64),
	defaultTileId: z.string().min(1, 'Pick a default tile'), // a tile's _id
})

// On finish, you strip width, height and defaultTileId and build the stored document:
// { name, dangerLevel, terrain: Array.from({ length: height }, () => Array(width).fill(defaultTileId)) }
