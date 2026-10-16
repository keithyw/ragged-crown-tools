'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
	Breadcrumbs,
	Button,
	NewMapModal,
	ServerErrorMessages,
	SpinnerSection,
	TileCell,
	TilePickerModal,
	ZoneMapGrid,
	type NewMapValues,
} from '@/components'
import { useCollection } from '@/hooks'
import { URLS } from '@/lib/constants'
import type { TileDef } from '@/lib/types'
import {
	createGrid,
	gridSize,
	hasPaintedContent,
	paintCell,
	type ZoneGrid,
} from '@/lib/utils'

const CreateZonePage = () => {
	const [activeTileId, setActiveTileId] = useState<string | null>(null)
	const [grid, setGrid] = useState<ZoneGrid | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isPickerOpen, setIsPickerOpen] = useState(false)
	const { items: tiles, isLoading, error } = useCollection<TileDef>('tile_defs')

	const tilesById = useMemo(
		() => new Map(tiles.map((t) => [t._id, t])),
		[tiles],
	)

	const activeTile = activeTileId ? tilesById.get(activeTileId) : undefined

	useEffect(() => {
		if (!activeTileId || isPickerOpen) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setActiveTileId(null)
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [activeTileId, isPickerOpen])

	const handlePaint = useCallback(
		(x: number, y: number) => {
			if (!activeTileId) return
			setGrid((prev) => (prev ? paintCell(prev, x, y, activeTileId) : prev))
		},
		[activeTileId],
	)

	const handleDraw = ({ width, height, tileId }: NewMapValues) => {
		setGrid(createGrid(width, height, tileId))
		setIsModalOpen(false)
	}

	const sz = grid ? gridSize(grid) : null

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Tiles' />
	}

	if (error) {
		return <ServerErrorMessages message={error} />
	}

	return (
		<>
			<Breadcrumbs
				items={[{ label: 'Zones', href: URLS.ZONE }, { label: 'Create' }]}
			/>
			<div className='grid items-start gap-6 lg:grid-cols-[1fr_20rem]'>
				<section>
					<Button
						type='button'
						actionType='submit'
						onClick={() => setIsModalOpen(true)}
						className='mb-6'
					>
						{grid ? 'Redraw Map' : 'Draw Map'}
					</Button>
					{grid ? (
						<ZoneMapGrid
							grid={grid}
							tilesById={tilesById}
							onPaint={activeTileId ? handlePaint : undefined}
						/>
					) : (
						<div className='rounded border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500'>
							Draw a base map to get started. You choose the size and a default
							tile.
						</div>
					)}
				</section>
				<aside className='sticky top-4 space-y-4 rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
					<section>
						<h3 className='mb-2 text-sm font-bold text-gray-700'>Paint</h3>
						<div className='flex items-center gap-3'>
							{activeTile ? (
								<TileCell tile={activeTile} />
							) : (
								<span className='h-11 w-11 shrink-0 rounded border border-dashed border-gray-300' />
							)}
							<div className='min-w-0 text-sm'>
								{activeTile ? (
									<>
										<div className='truncate font-medium'>
											{activeTile.name}
										</div>
										<div className='truncate text-xs text-gray-500'>
											{activeTile.id}
										</div>
									</>
								) : (
									<span className='text-gray-500'>No tile selected</span>
								)}
							</div>
						</div>
						<div className='mt-3 flex gap-2'>
							<Button
								type='button'
								actionType='submit'
								disabled={!grid}
								onClick={() => setIsPickerOpen(true)}
							>
								{activeTile ? 'Change tile' : 'Choose tile'}
							</Button>
							{activeTile && (
								<Button
									type='button'
									actionType='neutral'
									onClick={() => setActiveTileId(null)}
								>
									Stop
								</Button>
							)}
						</div>
						<p className='mt-2 text-xs text-gray-500'>
							{activeTile
								? 'Click or drag on the map to paint. Esc to stop.'
								: grid
									? 'Choose a tile to start painting.'
									: 'Draw a map first.'}
						</p>
					</section>
					{sz && (
						<dl className='text-sm'>
							<div className='flex justify-between'>
								<dt className='text-gray-500'>Size</dt>
								<dd>
									{sz.width} x {sz.height}
								</dd>
							</div>
						</dl>
					)}
				</aside>
			</div>
			<TilePickerModal
				isOpen={isPickerOpen}
				tiles={tiles}
				selectedId={activeTileId}
				onClose={() => setIsPickerOpen(false)}
				onSelect={(t) => {
					setActiveTileId(t._id)
					setIsPickerOpen(false)
				}}
			/>

			<NewMapModal
				isOpen={isModalOpen}
				tiles={tiles}
				initial={
					grid && sz
						? { width: sz.width, height: sz.height, tileId: grid[0][0] }
						: undefined
				}
				replacesPaintedMap={grid ? hasPaintedContent(grid) : false}
				onClose={() => setIsModalOpen(false)}
				onSubmit={handleDraw}
			/>
		</>
	)
}

export default CreateZonePage
