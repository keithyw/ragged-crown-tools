'use client'

import { useMemo, useState } from 'react'
import {
	Breadcrumbs,
	Button,
	NewMapModal,
	ServerErrorMessages,
	SpinnerSection,
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
	type ZoneGrid,
} from '@/lib/utils'

const CreateZonePage = () => {
	const [grid, setGrid] = useState<ZoneGrid | null>(null)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const { items: tiles, isLoading, error } = useCollection<TileDef>('tile_defs')

	const tilesById = useMemo(
		() => new Map(tiles.map((t) => [t._id, t])),
		[tiles],
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
						<ZoneMapGrid grid={grid} tilesById={tilesById} />
					) : (
						<div className='rounded border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500'>
							Draw a base map to get started. You choose the size and a default
							tile.
						</div>
					)}
				</section>
				<aside className='sticky top-4 rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
					<p className='text-sm text-gray-500'>
						Zone detail under construction.
					</p>
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
