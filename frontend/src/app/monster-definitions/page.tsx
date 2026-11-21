'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	SpinnerSection,
	TileCard,
	MonsterInspector,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { MonsterDef } from '@/lib/types'

const MonsterDefinitionsPage = () => {
	const router = useRouter()
	const [selected, setSelected] = useState<StoredDoc<MonsterDef> | null>(null)
	const {
		items: monsterDefs,
		isLoading,
		error,
		refresh,
	} = useCollection<MonsterDef>('monsters')

	const deleteController = useDeleteRecord<StoredDoc<MonsterDef>>({
		collectionName: 'monsters',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Monsters' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Monster Definitions' }]} />
			<CreateItemSection href={`${URLS.MONSTER_DEFINITIONS}/create`}>
				Create Monster Definition
			</CreateItemSection>
			{monsterDefs.length > 0 && (
				<div className='grid items-start gap-6 lg:grid-cols-[1fr_16rem]'>
					<div className='grid grid-cols-[repeat(auto-fill,7rem)] content-start gap-4'>
						{monsterDefs.map((d) => (
							<TileCard
								key={d._id}
								tile={d}
								selected={selected?._id === d._id}
								onSelect={() => setSelected(d)}
								onOpen={() =>
									router.push(`${URLS.MONSTER_DEFINITIONS}/${d._id}/edit`)
								}
							/>
						))}
					</div>

					<aside className='sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded border border-gray-200 bg-white p-4 text-gray-900 shadow'>
						{selected ? (
							<MonsterInspector
								monster={selected}
								onEdit={() =>
									router.push(
										`${URLS.MONSTER_DEFINITIONS}/${selected._id}/edit`,
									)
								}
								onDelete={() => {
									deleteController.openDeleteModal(selected)
									setSelected(null)
								}}
							/>
						) : (
							<p className='text-sm text-gray-500'>
								Select a monster to see its details.
							</p>
						)}
					</aside>
				</div>
			)}
			{monsterDefs.length === 0 && (
				<div className='w-full font-bold text-gray-900'>
					No Monster Definitions have been created yet. Click on{' '}
					<em>Create Monster Definition</em> to start generating new monster
					definitions.
				</div>
			)}
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Monster Def'
				message={`Are you sure you want to delete this monster?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default MonsterDefinitionsPage
