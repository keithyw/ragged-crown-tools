'use client'

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
import { TableColumn, TableRowAction, Zone } from '@/lib/types'
import { gridSize } from '@/lib/utils'

type StoredZone = StoredDoc<Zone>

const ZONE_COLUMNS: TableColumn<StoredZone>[] = [
	{ header: 'Name', accessor: 'name' },
	{ header: 'ID', accessor: 'id' },
	{
		header: 'Size',
		render: (z) => {
			const { width, height } = gridSize(z.terrain)
			return `${width} x ${height}`
		},
	},
	{ header: 'Danger Level', accessor: 'dangerLevel' },
]

const ZonePage = () => {
	const {
		items: zones,
		isLoading,
		error,
		refresh,
	} = useCollection<Zone>('zones', { sort: 'name' })

	const deleteController = useDeleteRecord<StoredZone>({
		collectionName: 'zones',
		deleteFn: collectionService.delete,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	// Edit joins this list with the edit route (Tools 8, phase 3).
	const actions: TableRowAction<StoredZone>[] = [
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
				columns={ZONE_COLUMNS}
				rowKey='_id'
				actions={actions}
				emptyMessage='No zones have been created yet. Click on Create New Zone to draw your first map.'
			/>
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
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
