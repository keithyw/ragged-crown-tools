import type { CellKey, Kind, Placement } from '@/lib/types'

// A zone's terrain: rows of tile _ids, indexed grid[y][x] (same as the game).
export type ZoneGrid = string[][]

// The one way to build a placements key, so "x, y" / "y,x" drift can't happen.
export const cellKey = (x: number, y: number): CellKey => `${x},${y}`

// Key for a placed def: kind and _id together, like Placement's composite key.
export const defKey = (kind: Kind, id: string) => `${kind}:${id}`

// What a zone holds on top of its terrain: a stack per cell, bottom to top.
export type Placements = Partial<Record<CellKey, Placement[]>>

// The same def can't go directly on top of itself (no wall on a wall). A
// different def can (a chest on a table), and there is no limit on height.
export const canPlaceOnTop = (
	placements: Placements | undefined,
	key: CellKey,
	defKind: Kind,
	defId: string,
) => {
	const top = placements?.[key]?.at(-1)
	return !(top && top.defKind === defKind && top.defId === defId)
}

// Placements whose cell is still inside a width x height map; the rest are
// dropped. Returns the same object when nothing is dropped, and undefined when
// nothing is left (a zone with no placements has no placements key at all).
export const placementsWithin = (
	placements: Placements | undefined,
	width: number,
	height: number,
): Placements | undefined => {
	const keys = Object.keys(placements ?? {}) as CellKey[]
	const kept = keys.filter((key) => {
		const [x, y] = key.split(',').map(Number)
		return x < width && y < height
	})
	if (kept.length === 0) return undefined
	if (kept.length === keys.length) return placements
	return Object.fromEntries(kept.map((key) => [key, placements?.[key]]))
}

// Returns new placements with `p` on top of the cell's stack. Only that cell's
// array is copied.
export const pushPlacement = (
	placements: Placements | undefined,
	key: CellKey,
	p: Placement,
): Placements => ({ ...placements, [key]: [...(placements?.[key] ?? []), p] })

export const MIN_ZONE_SIZE = 1
export const MAX_ZONE_SIZE = 16 // hard-coded for now; raise when it gets in the way

export const createGrid = (
	width: number,
	height: number,
	tileId: string,
): ZoneGrid =>
	// Array.from gives every row its own array, so editing one cell later
	// can't change a whole column.
	Array.from({ length: height }, () => Array<string>(width).fill(tileId))

export const gridSize = (grid: ZoneGrid) => ({
	width: grid[0]?.length ?? 0,
	height: grid.length,
})

// True once the grid holds more than one distinct tile, meaning someone has
// painted on it. A freshly drawn, untouched grid doesn't need a confirmation.
export const hasPaintedContent = (grid: ZoneGrid) =>
	new Set(grid.flat()).size > 1

// Returns a new grid with one cell changed. Only the touched row is copied.
// If the cell already holds that tile it returns the SAME grid, so React's
// setState bails out and dragging across painted cells causes no re-renders.
export const paintCell = (
	grid: ZoneGrid,
	x: number,
	y: number,
	tileId: string,
): ZoneGrid => {
	if (grid[y]?.[x] === undefined || grid[y][x] === tileId) return grid
	const row = grid[y].slice()
	row[x] = tileId
	const next = grid.slice()
	next[y] = row
	return next
}
