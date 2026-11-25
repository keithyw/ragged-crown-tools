// The values behind `RandomEncounters` (lib/types/map.ts, DATA-MODEL.md 2.5):
// where a zone's random encounters come from. In the order a select shows
// them. `none` is also what an absent field means.
//
// The schema files import this one by a relative path (not '@/'), because the
// MCP runs them through tsx (ARCHITECTURE.md 6.1).
import type { RandomEncounters } from '../types/map'

type AllListed<U, L extends readonly U[]> = [Exclude<U, L[number]>] extends [
	never,
]
	? true
	: false

export const RANDOM_ENCOUNTERS = [
	'none',
	'terrain',
	'config',
] as const satisfies readonly RandomEncounters[]
export const randomEncountersComplete: AllListed<
	RandomEncounters,
	typeof RANDOM_ENCOUNTERS
> = true

export const RANDOM_ENCOUNTER_LABELS: Record<RandomEncounters, string> = {
	none: 'None',
	terrain: 'Terrain (open world)',
	config: 'Difficulty configuration',
}
