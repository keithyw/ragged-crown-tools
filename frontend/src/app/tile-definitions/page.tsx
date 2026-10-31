'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	SpinnerSection,
	TileCard,
	TileInspector,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { TileDef } from '@/lib/types'

const TileDefinitionsPage = () => {
	const router = useRouter()
	const [selectedTile, setSelectedTile] = useState<
		(TileDef & { _id: string; updated_at: string }) | null
	>(null)
	const {
		items: tiles,
		isLoading,
		error,
		refresh,
	} = useCollection<TileDef>('tile_defs')

	const deleteController = useDeleteRecord<StoredDoc<TileDef>>({
		collectionName: 'tile_defs',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Tiles' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Tile Definitions' }]} />
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
								onDelete={() => {
									deleteController.openDeleteModal(selectedTile)
									setSelectedTile(null)
								}}
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
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Tile Def'
				message={`Are you sure you want to delete this tile?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default TileDefinitionsPage
