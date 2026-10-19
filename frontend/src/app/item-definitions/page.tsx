'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	ItemInspector,
	SpinnerSection,
	TileCard,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { ItemDef } from '@/lib/types'

const ItemDefinitionsPage = () => {
	const router = useRouter()
	const [selectedItem, setSelectedItem] = useState<StoredDoc<ItemDef> | null>(
		null,
	)
	const {
		items: itemDefs,
		isLoading,
		error,
		refresh,
	} = useCollection<ItemDef>('items')

	const deleteController = useDeleteRecord<StoredDoc<ItemDef>>({
		collectionName: 'items',
		deleteFn: collectionService.delete,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Items' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Item Definitions' }]} />
			<CreateItemSection href={`${URLS.ITEM_DEFINITIONS}/create`}>
				Create Item Definition
			</CreateItemSection>
			{itemDefs.length > 0 && (
				<div className='grid items-start gap-6 lg:grid-cols-[1fr_16rem]'>
					<div className='grid grid-cols-[repeat(auto-fill,7rem)] content-start gap-4'>
						{itemDefs.map((d) => (
							<TileCard
								key={d._id}
								tile={d}
								selected={selectedItem?._id === d._id}
								onSelect={() => setSelectedItem(d)}
								onOpen={() =>
									router.push(`${URLS.ITEM_DEFINITIONS}/${d._id}/edit`)
								}
							/>
						))}
					</div>

					<aside className='sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
						{selectedItem ? (
							<ItemInspector
								item={selectedItem}
								onEdit={() =>
									router.push(
										`${URLS.ITEM_DEFINITIONS}/${selectedItem._id}/edit`,
									)
								}
								onDelete={() => {
									deleteController.openDeleteModal(selectedItem)
									setSelectedItem(null)
								}}
							/>
						) : (
							<p className='text-sm text-gray-500'>
								Select an item to see its details.
							</p>
						)}
					</aside>
				</div>
			)}
			{itemDefs.length === 0 && (
				<div className='w-full font-bold text-gray-900'>
					No Item Definitions have been created yet. Click on{' '}
					<em>Create Item Definition</em> to start generating new item
					definitions.
				</div>
			)}
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				title='Delete Item Def'
				message={`Are you sure you want to delete this item?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default ItemDefinitionsPage
