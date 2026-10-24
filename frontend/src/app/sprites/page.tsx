'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	SpinnerSection,
	SpriteCard,
	SpriteInspector,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { Sprite } from '@/lib/types'

const SpritesPage = () => {
	const router = useRouter()
	const [selectedSprite, setSelectedSprite] =
		useState<StoredDoc<Sprite> | null>(null)
	const {
		items: sprites,
		isLoading,
		error,
		refresh,
	} = useCollection<Sprite>('sprites')

	const deleteController = useDeleteRecord<StoredDoc<Sprite>>({
		collectionName: 'sprites',
		deleteFn: collectionService.delete,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Sprites' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Sprites' }]} />
			<CreateItemSection href={`${URLS.SPRITES}/create`}>
				Create Sprite
			</CreateItemSection>
			{sprites.length > 0 && (
				<div className='grid items-start gap-6 lg:grid-cols-[1fr_16rem]'>
					<div className='grid grid-cols-[repeat(auto-fill,7rem)] content-start gap-4'>
						{sprites.map((s) => (
							<SpriteCard
								key={s._id}
								sprite={s}
								selected={selectedSprite?._id === s._id}
								onSelect={() => setSelectedSprite(s)}
								onOpen={() => router.push(`${URLS.SPRITES}/${s._id}/edit`)}
							/>
						))}
					</div>

					<aside className='sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
						{selectedSprite ? (
							<SpriteInspector
								sprite={selectedSprite}
								onEdit={() =>
									router.push(`${URLS.SPRITES}/${selectedSprite._id}/edit`)
								}
								onDelete={() => {
									deleteController.openDeleteModal(selectedSprite)
									setSelectedSprite(null)
								}}
							/>
						) : (
							<p className='text-sm text-gray-500'>
								Select a sprite to see its details.
							</p>
						)}
					</aside>
				</div>
			)}
			{sprites.length === 0 && (
				<div className='w-full font-bold text-gray-900'>
					No sprites have been created yet. Click on <em>Create Sprite</em> to
					start drawing.
				</div>
			)}
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				title='Delete Sprite'
				message={`Are you sure you want to delete this sprite?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default SpritesPage
