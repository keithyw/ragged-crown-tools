'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	SpinnerSection,
	TileCard,
	WeaponInspector,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { WeaponDef } from '@/lib/types'

const WeaponDefinitionsPage = () => {
	const router = useRouter()
	const [selected, setSelected] = useState<StoredDoc<WeaponDef> | null>(null)
	const {
		items: weaponDefs,
		isLoading,
		error,
		refresh,
	} = useCollection<WeaponDef>('items', { filter: { kind: 'weapon' } })

	const deleteController = useDeleteRecord<StoredDoc<WeaponDef>>({
		collectionName: 'items',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Weapons' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Weapon Definitions' }]} />
			<CreateItemSection href={`${URLS.WEAPON_DEFINITIONS}/create`}>
				Create Weapon Definition
			</CreateItemSection>
			{weaponDefs.length > 0 && (
				<div className='grid items-start gap-6 lg:grid-cols-[1fr_16rem]'>
					<div className='grid grid-cols-[repeat(auto-fill,7rem)] content-start gap-4'>
						{weaponDefs.map((d) => (
							<TileCard
								key={d._id}
								tile={d}
								selected={selected?._id === d._id}
								onSelect={() => setSelected(d)}
								onOpen={() =>
									router.push(`${URLS.WEAPON_DEFINITIONS}/${d._id}/edit`)
								}
							/>
						))}
					</div>

					<aside className='sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
						{selected ? (
							<WeaponInspector
								weapon={selected}
								onEdit={() =>
									router.push(`${URLS.WEAPON_DEFINITIONS}/${selected._id}/edit`)
								}
								onDelete={() => {
									deleteController.openDeleteModal(selected)
									setSelected(null)
								}}
							/>
						) : (
							<p className='text-sm text-gray-500'>
								Select a weapon to see its details.
							</p>
						)}
					</aside>
				</div>
			)}
			{weaponDefs.length === 0 && (
				<div className='w-full font-bold text-gray-900'>
					No Weapon Definitions have been created yet. Click on{' '}
					<em>Create Weapon Definition</em> to start generating new weapon
					definitions.
				</div>
			)}
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Weapon Def'
				message={`Are you sure you want to delete this weapon?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default WeaponDefinitionsPage
