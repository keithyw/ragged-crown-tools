import { z } from 'zod'
// Relative, and not the barrels, on purpose: the MCP runs schema files through
// tsx, which can't resolve a runtime `@/` import (ARCHITECTURE.md 6.1).
import { ARMOR_MATERIALS, WEAPON_MATERIALS } from '../lib/constants/gear'
import type { DifficultyConfig } from '../lib/types/difficulty'

// A table over one material list. Keys of `chances` and the default must be
// materials of that list; a chance is a whole number, 0 or more, and the
// chances have no sum rule ([Tools 25]).
function materialTable<M extends string>(
	materials: readonly M[],
	what: string,
) {
	const isMaterial = (m: string): m is M =>
		(materials as readonly string[]).includes(m)
	return z
		.object({
			default: z
				.string()
				.refine(isMaterial, { error: `Default must be a ${what} material` }),
			chances: z.record(
				z.string(),
				z
					.number({ error: 'Chance must be a number' })
					.int('Chance must be a whole number')
					.min(0, 'Chance cannot be negative'),
			),
		})
		.superRefine((table, ctx) => {
			for (const key of Object.keys(table.chances)) {
				if (!isMaterial(key)) {
					ctx.addIssue({
						code: 'custom',
						path: ['chances', key],
						message: `'${key}' is not a ${what} material`,
					})
				}
			}
		})
}

export const difficultyConfigSchema = z.object({
	id: z
		.string()
		.trim()
		.min(1, 'ID is required')
		.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'),
	name: z.string().trim().min(1, 'Name is required'),
	description: z
		.string()
		.trim()
		.transform((v) => v || undefined)
		.optional(),
	materials: z.object({
		weapon: materialTable(Object.values(WEAPON_MATERIALS).flat(), 'weapon'),
		armor: materialTable(Object.values(ARMOR_MATERIALS).flat(), 'armor'),
	}),
}) satisfies z.ZodType<DifficultyConfig>

export type DifficultyConfigFormData = z.infer<typeof difficultyConfigSchema>
