'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SpinnerSection, TileCard, TileInspector } from '@/components'
import { useCollection } from '@/hooks'
import { URLS } from '@/lib/constants'
import { TileDef } from '@/lib/types'

const TileDefinitionsPage = () => {
	const router = useRouter()
	// const [selectedId, setSelectedId] = useState<string | null>(null)
	const [selectedTile, setSelectedTile] = useState<TileDef | null>(null)
	const { items: tiles, isLoading, error } = useCollection<TileDef>('tile_defs')

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Tiles' />
	}

	if (error) {
		return <div>{error}</div>
	}
	return (
		<div className='grid grid-cols-[1fr-18rem] gap-6'>
			<div className='grid-cols-[repeat(auto-fill, 7rem)] grid content-start justify-start gap-4'>
				{tiles.map((t) => (
					<TileCard
						key={t._id}
						tile={t}
						selected={selectedTile?.id === t.id}
						onSelect={() => setSelectedTile(t)}
						onOpen={() => router.push(`${URLS.TILE_DEFINITIONS}/${t.id}/edit`)}
					/>
				))}
			</div>

			<aside className='rounded border bg-white p-4 shadow'>
				{selectedTile ? (
					<TileInspector
						tile={selectedTile}
						onView={() => router.push(``)}
						onEdit={() => router.push(``)}
						onDelete={() => {}}
					/>
				) : (
					<p className='text-sm text-gray-500'>
						Select a tile to see its details.
					</p>
				)}
			</aside>
		</div>
	)
}

export default TileDefinitionsPage
