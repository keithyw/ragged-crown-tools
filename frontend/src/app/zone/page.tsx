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
import {
	DifficultyConfig,
	ReviewedZone,
	TableColumn,
	TableRowAction,
} from '@/lib/types'
import { gridSize } from '@/lib/utils'

type StoredZone = StoredDoc<ReviewedZone>

const zoneColumns = (
	difficulties: StoredDoc<DifficultyConfig>[],
): TableColumn<StoredZone>[] => [
	{ header: 'Name', accessor: 'name' },
	{ header: 'ID', accessor: 'id' },
	{
		header: 'Size',
		render: (z) => {
			const { width, height } = gridSize(z.terrain)
			return `${width} x ${height}`
		},
	},
	{
		header: 'Difficulty',
		render: (z) => {
			const d = difficulties.find((c) => c._id === z.difficultyId)
			return d ? `${d.name} (level ${d.level})` : 'missing'
		},
	},
	// Only generated zones have a review status.
	{ header: 'Status', render: (z) => z.status ?? '' },
]

const ZonePage = () => {
	const router = useRouter()
	const {
		items: zones,
		isLoading,
		error,
		refresh,
	} = useCollection<ReviewedZone>('zones', { sort: 'name' })

	const { items: difficulties } =
		useCollection<DifficultyConfig>('difficulty_configs')

	const deleteController = useDeleteRecord<StoredZone>({
		collectionName: 'zones',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	const actions: TableRowAction<StoredZone>[] = [
		{
			label: 'Edit',
			onClick: (z) => router.push(`${URLS.ZONE}/${z._id}/edit`),
			actionType: 'edit',
		},
		{
			label: 'Delete',
			onClick: deleteController.openDeleteModal,
			actionType: 'delete',
		},
	]

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Zones' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Zones' }]} />
			<CreateItemSection href={`${URLS.ZONE}/create`}>
				Create New Zone
			</CreateItemSection>
			<DataTable
				data={zones}
				columns={zoneColumns(difficulties)}
				rowKey='_id'
				actions={actions}
				emptyMessage='No zones have been created yet. Click on Create New Zone to draw your first map.'
			/>
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Zone'
				message={`Are you sure you want to delete ${deleteController.deleteItem?.name ?? 'this zone'}?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default ZonePage
