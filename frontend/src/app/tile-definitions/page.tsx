'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	CreateItemSection,
	SpinnerSection,
	TileCard,
	TileInspector,
} from '@/components'
import { useCollection } from '@/hooks'
import { URLS } from '@/lib/constants'
import { TileDef } from '@/lib/types'

const TileDefinitionsPage = () => {
	const router = useRouter()
	const [selectedTile, setSelectedTile] = useState<
		(TileDef & { _id: string }) | null
	>(null)
	const { items: tiles, isLoading, error } = useCollection<TileDef>('tile_defs')

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Tiles' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<CreateItemSection href={`${URLS.TILE_DEFINITIONS}/create`}>
				Create Tile Definition
			</CreateItemSection>
			{tiles.length > 0 && (
				<div className='grid items-start gap-6 lg:grid-cols-[1fr_16rem]'>
					<div className='grid grid-cols-[repeat(auto-fill,7rem)] content-start gap-4'>
						{tiles.map((t) => (
							<TileCard
								key={t._id}
								tile={t}
								selected={selectedTile?._id === t._id}
								onSelect={() => setSelectedTile(t)}
								onOpen={() =>
									router.push(`${URLS.TILE_DEFINITIONS}/${t._id}/edit`)
								}
							/>
						))}
					</div>

					<aside className='sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
						{selectedTile ? (
							<TileInspector
								tile={selectedTile}
								onEdit={() =>
									router.push(
										`${URLS.TILE_DEFINITIONS}/${selectedTile._id}/edit`,
									)
								}
								onDelete={() => {}}
							/>
						) : (
							<p className='text-sm text-gray-500'>
								Select a tile to see its details.
							</p>
						)}
					</aside>
				</div>
			)}
			{tiles.length === 0 && (
				<div className='w-full font-bold text-gray-900'>
					No Tile Definitions have been created yet. Click on{' '}
					<em>Create Tile Definition</em> to start generating new tile
					definitions.
				</div>
			)}
		</>
	)
}

export default TileDefinitionsPage
