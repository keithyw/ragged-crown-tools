// Primitives the other content types build on (DATA-MODEL.md).
// Shared with the game (imported there via @shared/types): types only, keep tools-only fields out
// (see ARCHITECTURE.md 5).

export interface Position {
	x: number
	y: number
}

export type Kind =
	'terrain' | 'object' | 'item' | 'weapon' | 'armor' | 'monster' | 'portal'

// The standard polyhedral dice, d4 to d100.
export type Die = 4 | 6 | 8 | 10 | 12 | 20 | 100

// A dice roll: `count` dice of `die` sides (3d6 is { count: 3, die: 6 }).
// Every dice field uses this shape (a weapon's damage, a monster's number
// appearing). Bonuses are not decided yet.
export interface RandomRoll {
	count: number
	die: Die
}

export type Destination =
	| {
			zoneId: string // the target zone's _id
			pos?: Position // absent = the target zone's startingPosition
	  }
	// Go back to where the player entered from (the engine remembers it at
	// runtime), so one shared interior can lead back to any building.
	| { back: true }
