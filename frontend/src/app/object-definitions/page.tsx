'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	ObjectInspector,
	SpinnerSection,
	TileCard,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { ObjectDef } from '@/lib/types'

const ObjectDefinitionsPage = () => {
	const router = useRouter()
	const [selectedObject, setSelectedObject] =
		useState<StoredDoc<ObjectDef> | null>(null)
	const {
		items: objects,
		isLoading,
		error,
		refresh,
	} = useCollection<ObjectDef>('entities', { filter: { kind: 'object' } })

	const deleteController = useDeleteRecord<StoredDoc<ObjectDef>>({
		collectionName: 'entities',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Objects' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Object Definitions' }]} />
			<CreateItemSection href={`${URLS.OBJECT_DEFINITIONS}/create`}>
				Create Object Definition
			</CreateItemSection>
			{objects.length > 0 && (
				<div className='grid items-start gap-6 lg:grid-cols-[1fr_16rem]'>
					<div className='grid grid-cols-[repeat(auto-fill,7rem)] content-start gap-4'>
						{objects.map((o) => (
							<TileCard
								key={o._id}
								tile={o}
								selected={selectedObject?._id === o._id}
								onSelect={() => setSelectedObject(o)}
								onOpen={() =>
									router.push(`${URLS.OBJECT_DEFINITIONS}/${o._id}/edit`)
								}
							/>
						))}
					</div>

					<aside className='sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
						{selectedObject ? (
							<ObjectInspector
								object={selectedObject}
								onEdit={() =>
									router.push(
										`${URLS.OBJECT_DEFINITIONS}/${selectedObject._id}/edit`,
									)
								}
								onDelete={() => {
									deleteController.openDeleteModal(selectedObject)
									setSelectedObject(null)
								}}
							/>
						) : (
							<p className='text-sm text-gray-500'>
								Select an object to see its details.
							</p>
						)}
					</aside>
				</div>
			)}
			{objects.length === 0 && (
				<div className='w-full font-bold text-gray-900'>
					No Object Definitions have been created yet. Click on{' '}
					<em>Create Object Definition</em> to start generating new object
					definitions.
				</div>
			)}
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Object Def'
				message={`Are you sure you want to delete this object?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default ObjectDefinitionsPage
