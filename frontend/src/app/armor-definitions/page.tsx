'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	ArmorInspector,
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	SpinnerSection,
	TileCard,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { ArmorDef } from '@/lib/types'

const ArmorDefinitionsPage = () => {
	const router = useRouter()
	const [selected, setSelected] = useState<StoredDoc<ArmorDef> | null>(null)
	const {
		items: armorDefs,
		isLoading,
		error,
		refresh,
	} = useCollection<ArmorDef>('items', { filter: { kind: 'armor' } })

	const deleteController = useDeleteRecord<StoredDoc<ArmorDef>>({
		collectionName: 'items',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Armor' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Armor Definitions' }]} />
			<CreateItemSection href={`${URLS.ARMOR_DEFINITIONS}/create`}>
				Create Armor Definition
			</CreateItemSection>
			{armorDefs.length > 0 && (
				<div className='grid items-start gap-6 lg:grid-cols-[1fr_16rem]'>
					<div className='grid grid-cols-[repeat(auto-fill,7rem)] content-start gap-4'>
						{armorDefs.map((d) => (
							<TileCard
								key={d._id}
								tile={d}
								selected={selected?._id === d._id}
								onSelect={() => setSelected(d)}
								onOpen={() =>
									router.push(`${URLS.ARMOR_DEFINITIONS}/${d._id}/edit`)
								}
							/>
						))}
					</div>

					<aside className='sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
						{selected ? (
							<ArmorInspector
								armor={selected}
								onEdit={() =>
									router.push(`${URLS.ARMOR_DEFINITIONS}/${selected._id}/edit`)
								}
								onDelete={() => {
									deleteController.openDeleteModal(selected)
									setSelected(null)
								}}
							/>
						) : (
							<p className='text-sm text-gray-500'>
								Select an armor piece to see its details.
							</p>
						)}
					</aside>
				</div>
			)}
			{armorDefs.length === 0 && (
				<div className='w-full font-bold text-gray-900'>
					No Armor Definitions have been created yet. Click on{' '}
					<em>Create Armor Definition</em> to start generating new armor
					definitions.
				</div>
			)}
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Armor Def'
				message={`Are you sure you want to delete this armor?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default ArmorDefinitionsPage
