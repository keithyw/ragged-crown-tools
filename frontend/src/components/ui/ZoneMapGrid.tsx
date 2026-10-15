'use client'

import { type StoredDoc } from '@/lib/services'
import { type TileDef } from '@/lib/types'
import { cn, type ZoneGrid } from '@/lib/utils'

const CELL_REM = 2.75

const MapCell = ({ tile }: { tile?: StoredDoc<TileDef> }) => (
	<span aria-hidden='true' className='f-11 flex h-11 bg-slate-950'>
		<span
			className={cn(
				'flex h-full w-full items-center justify-center font-mono text-xl',
				tile?.bg ?? 'bg-red-950/60',
				tile?.color ?? 'text-red-400',
			)}
		>
			{tile ? tile.symbol : '?'}
		</span>
	</span>
)

interface ZoneMapGridProps {
	grid: ZoneGrid
	tilesById: ReadonlyMap<string, StoredDoc<TileDef>>
}

export const ZoneMapGrid = ({ grid, tilesById }: ZoneMapGridProps) => {
	const width = grid[0]?.length ?? 0

	return (
		// slate-950 approximates the game's map panel, so translucent tile
		// backgrounds look the same here as they do in the game
		<div className='w-fit max-w-full overflow-auto rounded border border-slate-700'>
			<div
				role='img'
				aria-label={`Zone map, ${width} by ${grid.length} tiles`}
				className='grid w-max'
				style={{ gridTemplateColumns: `repeat(${width}, ${CELL_REM}rem)` }}
			>
				{grid.flatMap((row, y) =>
					row.map((tileId, x) => (
						<MapCell key={`${x},${y}`} tile={tilesById.get(tileId)} />
					)),
				)}
			</div>
		</div>
	)
}
