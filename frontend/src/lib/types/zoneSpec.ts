// A request for a generated zone (DATA-MODEL.md 2.3). Tools only, so it lives
// here and not in the shared types, which are copied to the game.
import type { RandomEncounters } from './map'

export const ZONE_SPEC_STATUSES = ['pending', 'processed'] as const

export type ZoneSpecStatus = (typeof ZONE_SPEC_STATUSES)[number]

export interface ZoneSpec {
	id: string // the zone generated from this spec takes the same id
	name: string
	width: number
	height: number
	difficultyId: string // a difficulty configuration's _id (Tools 26)
	randomEncounters?: RandomEncounters // as on a zone; absent = none (Tools 29)
	description: string // the pseudo prompt for the zone skill
	status: ZoneSpecStatus
}
