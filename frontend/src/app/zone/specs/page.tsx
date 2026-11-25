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
import { RANDOM_ENCOUNTER_LABELS, URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import {
	DifficultyConfig,
	TableColumn,
	TableRowAction,
	ZoneSpec,
} from '@/lib/types'

type StoredZoneSpec = StoredDoc<ZoneSpec>

const specColumns = (
	difficulties: StoredDoc<DifficultyConfig>[],
): TableColumn<StoredZoneSpec>[] => [
	{ header: 'Name', accessor: 'name' },
	{ header: 'ID', accessor: 'id' },
	{ header: 'Size', render: (s) => `${s.width} x ${s.height}` },
	{
		header: 'Difficulty',
		render: (s) => {
			const d = difficulties.find((c) => c._id === s.difficultyId)
			return d ? `${d.name} (level ${d.level})` : 'missing'
		},
	},
	{
		header: 'Encounters',
		render: (s) => RANDOM_ENCOUNTER_LABELS[s.randomEncounters ?? 'none'],
	},
	{ header: 'Status', accessor: 'status' },
]

const ZoneSpecsPage = () => {
	const router = useRouter()
	// It is a queue, and "pending" happens to sort before "processed".
	const {
		items: specs,
		isLoading,
		error,
		refresh,
	} = useCollection<ZoneSpec>('zone_specs', { sort: 'status' })

	const { items: difficulties } =
		useCollection<DifficultyConfig>('difficulty_configs')

	const deleteController = useDeleteRecord<StoredZoneSpec>({
		collectionName: 'zone_specs',
		deleteFn: collectionService.delete,
		referrerFn: collectionService.findReferrer,
		onSuccess: refresh,
		itemNameProp: 'name',
	})

	const actions: TableRowAction<StoredZoneSpec>[] = [
		{
			label: 'Edit',
			onClick: (s) => router.push(`${URLS.ZONE_SPECS}/${s._id}/edit`),
			actionType: 'edit',
		},
		{
			label: 'Delete',
			onClick: deleteController.openDeleteModal,
			actionType: 'delete',
		},
	]

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Zone Specs' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs items={[{ label: 'Zone Specs' }]} />
			<CreateItemSection href={`${URLS.ZONE_SPECS}/create`}>
				Create New Zone Spec
			</CreateItemSection>
			<DataTable
				data={specs}
				columns={specColumns(difficulties)}
				rowKey='_id'
				actions={actions}
				emptyMessage='No zone specs have been created yet. Click on Create New Zone Spec to request your first zone.'
			/>
			<ConfirmationModal
				isOpen={deleteController.isModalOpen}
				onClose={deleteController.closeDeleteModal}
				onConfirm={deleteController.handleDelete}
				warning={deleteController.blockedMessage}
				confirmDisabled={!deleteController.canDelete}
				title='Delete Zone Spec'
				message={`Are you sure you want to delete ${deleteController.deleteItem?.name ?? 'this zone spec'}?`}
				isDeleting={deleteController.isDeleting}
				confirmButtonText={
					deleteController.isDeleting ? 'Deleting...' : 'Delete'
				}
			/>
		</>
	)
}

export default ZoneSpecsPage
