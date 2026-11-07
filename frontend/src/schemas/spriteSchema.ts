import { z } from 'zod'
// Relative on purpose: the MCP runs schema files through tsx, which can't
// resolve a runtime `@/` import (ARCHITECTURE.md 6.1).
import {
	EGA_PALETTE,
	SPRITE_CATEGORIES,
	SPRITE_SIZE,
	SPRITE_STATUSES,
} from '../lib/types/sprite'

const paletteIndex = z
	.number()
	.int()
	.min(0)
	.max(EGA_PALETTE.length - 1)

// A sprite as stored (DATA-MODEL.md 1.2). No tags, on purpose.
export const spriteSchema = z.object({
	// Required, like the other defs: the edit hook needs one.
	id: z.string().trim().min(1, 'ID is required'),
	name: z.string().trim().min(1, 'Name is required'),
	category: z.enum(SPRITE_CATEGORIES, { error: 'Pick a category' }),
	background: z.union([z.literal('transparent'), paletteIndex]),
	pixels: z.array(paletteIndex.nullable()).length(SPRITE_SIZE * SPRITE_SIZE),
	// Optional so older sprites and the MCP's writes stay valid. The forms carry
	// both as hidden values so the full-replace PUT never drops them.
	status: z.enum(SPRITE_STATUSES).optional(),
	// An empty note is stored as absent.
	reviewNote: z
		.string()
		.optional()
		.transform((v) => v?.trim() || undefined),
})

export type SpriteFormData = z.infer<typeof spriteSchema>
