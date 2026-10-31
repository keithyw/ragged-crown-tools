'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	PortalInspector,
	SpinnerSection,
	TileCard,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { PortalDef } from '@/lib/types'

const PortalDefinitionsPage = () => {
	const router = useRouter()
	const [selectedPortal, setSelectedPortal] =
		useState<StoredDoc<PortalDef> | null>(null)
	const {
		items: portals,
		isLoading,
		error,
		refresh,
	} = useCollection<PortalDef>('entities', { filter: { kind: 'portal' } })

	const deleteController = useDeleteRecord<StoredDoc<PortalDef>>({
		collectionName: 'entities',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Portals' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Portal Definitions' }]} />
			<CreateItemSection href={`${URLS.PORTAL_DEFINITIONS}/create`}>
				Create Portal Definition
			</CreateItemSection>
			{portals.length > 0 && (
				<div className='grid items-start gap-6 lg:grid-cols-[1fr_16rem]'>
					<div className='grid grid-cols-[repeat(auto-fill,7rem)] content-start gap-4'>
						{portals.map((p) => (
							<TileCard
								key={p._id}
								tile={p}
								selected={selectedPortal?._id === p._id}
								onSelect={() => setSelectedPortal(p)}
								onOpen={() =>
									router.push(`${URLS.PORTAL_DEFINITIONS}/${p._id}/edit`)
								}
							/>
						))}
					</div>

					<aside className='sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
						{selectedPortal ? (
							<PortalInspector
								portal={selectedPortal}
								onEdit={() =>
									router.push(
										`${URLS.PORTAL_DEFINITIONS}/${selectedPortal._id}/edit`,
									)
								}
								onDelete={() => {
									deleteController.openDeleteModal(selectedPortal)
									setSelectedPortal(null)
								}}
							/>
						) : (
							<p className='text-sm text-gray-500'>
								Select a portal to see its details.
							</p>
						)}
					</aside>
				</div>
			)}
			{portals.length === 0 && (
				<div className='w-full font-bold text-gray-900'>
					No Portal Definitions have been created yet. Click on{' '}
					<em>Create Portal Definition</em> to start generating new portal
					definitions.
				</div>
			)}
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Portal Def'
				message={`Are you sure you want to delete this portal?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default PortalDefinitionsPage
