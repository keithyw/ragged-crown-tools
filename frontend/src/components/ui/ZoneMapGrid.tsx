'use client'

import { useRef } from 'react'
import { TileCell } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type Position, type TileDef } from '@/lib/types'
import { cellKey, cn, type ZoneGrid } from '@/lib/utils'

const CELL_REM = 2.75

const cellAt = (e: React.PointerEvent<HTMLElement>) => {
	const el = document
		.elementFromPoint(e.clientX, e.clientY)
		?.closest<HTMLElement>('[data-x]')
	if (!el || !e.currentTarget.contains(el)) return null
	return { x: Number(el.dataset.x), y: Number(el.dataset.y) }
}

interface ZoneMapGridProps {
	grid: ZoneGrid
	tilesById: ReadonlyMap<string, StoredDoc<TileDef>>
	startingPosition?: Position
	onCellAction?: (x: number, y: number) => void
}

export const ZoneMapGrid = ({
	grid,
	tilesById,
	startingPosition,
	onCellAction,
}: ZoneMapGridProps) => {
	const width = grid[0]?.length ?? 0
	// this is cool. huh huh. shutup beavis!
	const isStroking = useRef(false)
	const lastCell = useRef<string | null>(null)

	const paintAt = (e: React.PointerEvent<HTMLElement>) => {
		const cell = cellAt(e)
		if (!cell || !onCellAction) return
		const key = cellKey(cell.x, cell.y)
		if (key === lastCell.current) return
		lastCell.current = key
		onCellAction(cell.x, cell.y)
	}

	const endStroke = () => {
		isStroking.current = false
		lastCell.current = null
	}

	return (
		<div className='w-fit max-w-full overflow-auto rounded border border-slate-700'>
			<div
				role='img'
				aria-label={`Zone map, ${width} by ${grid.length} tiles`}
				className={cn(
					'grid w-max',
					onCellAction && 'cursor-crosshair touch-none select-none',
				)}
				style={{ gridTemplateColumns: `repeat(${width}, ${CELL_REM}rem)` }}
				onPointerDown={(e) => {
					if (!onCellAction || e.button !== 0) return
					isStroking.current = true
					paintAt(e)
				}}
				onPointerMove={(e) => {
					if (isStroking.current) paintAt(e)
				}}
				onPointerUp={endStroke}
				onPointerLeave={endStroke}
				onPointerCancel={endStroke}
			>
				{grid.flatMap((row, y) =>
					row.map((tileId, x) => (
						<TileCell
							key={cellKey(x, y)}
							data-x={x}
							data-y={y}
							tile={tilesById.get(tileId)}
							className={cn(
								startingPosition?.x === x &&
									startingPosition?.y === y &&
									'outline-2 -outline-offset-2 outline-sky-400',
								onCellAction &&
									'hover:outline-2 hover:-outline-offset-2 hover:outline-amber-300',
							)}
						/>
					)),
				)}
			</div>
		</div>
	)
}
