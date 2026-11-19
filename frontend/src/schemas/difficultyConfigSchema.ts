import { z } from 'zod'
// Relative, and not the barrels, on purpose: the MCP runs schema files through
// tsx, which can't resolve a runtime `@/` import (ARCHITECTURE.md 6.1).
import { ARMOR_GROUP_INFO, WEAPON_GROUP_INFO } from '../lib/constants/gear'
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
			default: z.string().refine(isMaterial, {
				error: `Default must be one of: ${materials.join(', ')}`,
			}),
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
						message: `'${key}' is not a material of the ${what} group`,
					})
				}
			}
		})
}

type TableSchema<M extends string> = ReturnType<typeof materialTable<M>>

// One optional table per group; a group left out is not used. Each table only
// accepts the materials of its group's categories.
function groupTables<G extends string, M extends string>(
	groups: Record<G, { categories: Record<string, readonly M[]> }>,
	what: string,
) {
	const shape = Object.fromEntries(
		Object.entries<{ categories: Record<string, readonly M[]> }>(groups).map(
			([group, info]) => [
				group,
				materialTable(
					Object.values(info.categories).flat(),
					`${what} ${group}`,
				).optional(),
			],
		),
	) as Record<G, z.ZodOptional<TableSchema<M>>>
	return z.object(shape)
}

export const difficultyConfigSchema = z.object({
	id: z
		.string()
		.trim()
		.min(1, 'ID is required')
		.regex(/^[A-Za-z0-9_-]+$/, 'Letters, numbers, - and _ only'),
	name: z.string().trim().min(1, 'Name is required'),
	level: z
		.number({ error: 'Level must be a number' })
		.int('Level must be a whole number')
		.min(0, 'Level cannot be negative'),
	description: z
		.string()
		.trim()
		.transform((v) => v || undefined)
		.optional(),
	materials: z.object({
		weapon: groupTables(WEAPON_GROUP_INFO, 'weapon'),
		armor: groupTables(ARMOR_GROUP_INFO, 'armor'),
	}),
}) satisfies z.ZodType<DifficultyConfig>

export type DifficultyConfigFormData = z.infer<typeof difficultyConfigSchema>
