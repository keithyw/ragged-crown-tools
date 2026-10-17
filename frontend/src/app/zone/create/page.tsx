'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	Breadcrumbs,
	Button,
	FormInput,
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
import type { Position, TileDef } from '@/lib/types'
import {
	createGrid,
	gridSize,
	hasPaintedContent,
	paintCell,
	type ZoneGrid,
} from '@/lib/utils'
import { detailFields, type ZoneDetailsFormData } from '@/app/zone/fields'

// One tool at a time; a click on the map does exactly one thing.
type Tool = 'paint' | 'start'

const CreateZonePage = () => {
	const { register } = useForm<ZoneDetailsFormData>({
		defaultValues: { dangerLevel: 0 },
	})
	const [tool, setTool] = useState<Tool | null>(null)
	const [activeTileId, setActiveTileId] = useState<string | null>(null)
	const [startingPosition, setStartingPosition] = useState<Position>()
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
		if (!tool || isPickerOpen) return
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape') setTool(null)
		}
		window.addEventListener('keydown', onKeyDown)
		return () => window.removeEventListener('keydown', onKeyDown)
	}, [tool, isPickerOpen])

	const handleCell = useCallback(
		(x: number, y: number) => {
			if (tool === 'paint' && activeTileId) {
				setGrid((prev) => (prev ? paintCell(prev, x, y, activeTileId) : prev))
			} else if (tool === 'start') {
				// One-shot: pick a tile, then the tool turns off.
				setStartingPosition({ x, y })
				setTool(null)
			}
		},
		[tool, activeTileId],
	)

	const handleDraw = ({ width, height, tileId }: NewMapValues) => {
		setGrid(createGrid(width, height, tileId))
		// Keep the start only if it still fits on the redrawn map.
		setStartingPosition((p) =>
			p && p.x < width && p.y < height ? p : undefined,
		)
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
							startingPosition={startingPosition}
							onCellAction={tool ? handleCell : undefined}
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
						<h3 className='mb-2 text-sm font-bold text-gray-700'>Details</h3>
						{detailFields.map((field) => (
							<FormInput key={field.name} field={field} register={register} />
						))}
					</section>
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
							{tool === 'paint' ? (
								<Button
									type='button'
									actionType='neutral'
									onClick={() => setTool(null)}
								>
									Stop
								</Button>
							) : (
								activeTile && (
									<Button
										type='button'
										actionType='submit'
										onClick={() => setTool('paint')}
									>
										Paint
									</Button>
								)
							)}
						</div>
						<p className='mt-2 text-xs text-gray-500'>
							{tool === 'paint'
								? 'Click or drag on the map to paint. Esc to stop.'
								: !grid
									? 'Draw a map first.'
									: activeTile
										? 'Press Paint to continue with this tile.'
										: 'Choose a tile to start painting.'}
						</p>
					</section>
					<section>
						<h3 className='mb-2 text-sm font-bold text-gray-700'>
							Start Position
						</h3>
						<div className='mb-3 text-sm'>
							{startingPosition ? (
								<span>
									x {startingPosition.x}, y {startingPosition.y}
								</span>
							) : (
								<span className='text-gray-500'>Not set</span>
							)}
						</div>
						{tool === 'start' ? (
							<Button
								type='button'
								actionType='neutral'
								onClick={() => setTool(null)}
							>
								Cancel
							</Button>
						) : (
							<Button
								type='button'
								actionType='submit'
								disabled={!grid}
								onClick={() => setTool('start')}
							>
								{startingPosition ? 'Change start' : 'Choose start'}
							</Button>
						)}
						{tool === 'start' && (
							<p className='mt-2 text-xs text-gray-500'>
								Click a tile on the map to set the start. Esc to cancel.
							</p>
						)}
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
					setTool('paint')
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
