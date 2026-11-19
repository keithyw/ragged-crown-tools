'use client'

import { useRouter } from 'next/navigation'
import {
	Breadcrumbs,
	ConfirmationModal,
	CreateItemSection,
	DataTable,
	SpinnerSection,
} from '@/components'
import { useCollection, useDeleteRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { DifficultyConfig, TableColumn, TableRowAction } from '@/lib/types'

type StoredConfig = StoredDoc<DifficultyConfig>

const COLUMNS: TableColumn<StoredConfig>[] = [
	{ header: 'Name', accessor: 'name' },
	{ header: 'ID', accessor: 'id' },
	{ header: 'Level', accessor: 'level' },
	{
		header: 'Weapon groups',
		render: (c) => Object.keys(c.materials.weapon).join(', ') || 'none',
	},
	{
		header: 'Armor groups',
		render: (c) => Object.keys(c.materials.armor).join(', ') || 'none',
	},
]

const DifficultyConfigsPage = () => {
	const router = useRouter()
	const {
		items: configs,
		isLoading,
		error,
		refresh,
	} = useCollection<DifficultyConfig>('difficulty_configs', { sort: 'name' })

	const deleteController = useDeleteRecord<StoredConfig>({
		collectionName: 'difficulty_configs',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	const actions: TableRowAction<StoredConfig>[] = [
		{
			label: 'Edit',
			onClick: (c) => router.push(`${URLS.ZONE_DIFFICULTY}/${c._id}/edit`),
			actionType: 'edit',
		},
		{
			label: 'Delete',
			onClick: deleteController.openDeleteModal,
			actionType: 'delete',
		},
	]

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Difficulty' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Difficulty' }]} />
			<CreateItemSection href={`${URLS.ZONE_DIFFICULTY}/create`}>
				Create New Difficulty Configuration
			</CreateItemSection>
			<DataTable
				data={configs}
				columns={COLUMNS}
				rowKey='_id'
				actions={actions}
				emptyMessage='No difficulty configurations yet. Click on Create New Difficulty Configuration to choose which materials can show up.'
			/>
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Difficulty Configuration'
				message={`Are you sure you want to delete ${deleteController.deleteItem?.name ?? 'this configuration'}?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default DifficultyConfigsPage
