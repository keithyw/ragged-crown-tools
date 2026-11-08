import type { Zone } from './map'

// Review state of a generated zone (ARCHITECTURE.md 6.4). Tools only, so it
// lives here and not in map.ts, which is copied to the game: the game reads a
// Zone and ignores these two fields. Absent on a zone drawn by hand. Same idea
// as the sprite's status.
// review: built by Claude, waiting for the owner. redo: the owner left a note
// and the zone is queued for Claude. approved: the owner is happy with it.
export const ZONE_STATUSES = ['review', 'redo', 'approved'] as const

export type ZoneStatus = (typeof ZONE_STATUSES)[number]

export type ReviewedZone = Zone & {
	status?: ZoneStatus
	// The owner's one current note for a redo, cleared once Claude has acted on
	// it. A redo needs one.
	reviewNote?: string
}
