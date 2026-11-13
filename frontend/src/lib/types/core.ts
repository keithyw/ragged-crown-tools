// Primitives the other content types build on (DATA-MODEL.md).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5).

export interface Position {
	x: number
	y: number
}

export type Kind = 'terrain' | 'object' | 'item' | 'creature' | 'portal'

export interface Destination {
	zoneId: string // the target zone's _id
	pos?: Position // absent = the target zone's startingPosition
}
