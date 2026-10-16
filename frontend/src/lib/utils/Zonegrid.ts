// A zone's terrain: rows of tile _ids, indexed grid[y][x] (same as the game).
export type ZoneGrid = string[][]

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
