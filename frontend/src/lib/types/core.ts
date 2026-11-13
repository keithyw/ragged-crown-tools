// Primitives the other content types build on (DATA-MODEL.md).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5).

export interface Position {
	x: number
	y: number
}

export type Kind = 'terrain' | 'object' | 'item' | 'creature' | 'portal'

export type Destination =
	| {
			zoneId: string // the target zone's _id
			pos?: Position // absent = the target zone's startingPosition
	  }
	// Go back to where the player entered from (the engine remembers it at
	// runtime), so one shared interior can lead back to any building.
	| { back: true }
