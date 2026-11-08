'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
	Breadcrumbs,
	Button,
	DataTable,
	SpinnerSection,
	ZoneRedoModal,
} from '@/components'
import { useCollection } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { ReviewedZone, TableColumn } from '@/lib/types'
import { gridSize } from '@/lib/utils'

type StoredZone = StoredDoc<ReviewedZone>

const ZoneReviewPage = () => {
	// Zones waiting for the owner. `redo` ones are with Claude, so they are not
	// listed. The list is small, so paging is done here, not by the API.
	const {
		items: zones,
		isLoading,
		error,
		refresh,
	} = useCollection<ReviewedZone>('zones', {
		filter: { status: 'review' },
		sort: 'name',
	})
	const [checked, setChecked] = useState<Set<string>>(new Set())
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)
	const [isApproving, setIsApproving] = useState(false)
	const [redoTarget, setRedoTarget] = useState<StoredZone | null>(null)

	const rows = zones.slice((page - 1) * pageSize, page * pageSize)
	// Keep the page valid after approving the last rows of the final page.
	const lastPage = Math.max(1, Math.ceil(zones.length / pageSize))
	if (page > lastPage) setPage(lastPage)

	const toggle = (_id: string) =>
		setChecked((prev) => {
			const next = new Set(prev)
			if (!next.delete(_id)) next.add(_id)
			return next
		})

	const allChecked = rows.length > 0 && rows.every((z) => checked.has(z._id))
	const someChecked = rows.some((z) => checked.has(z._id))

	// Checks every row on this page, or clears them if all are already checked.
	const togglePage = () =>
		setChecked((prev) => {
			const next = new Set(prev)
			rows.forEach((z) => (allChecked ? next.delete(z._id) : next.add(z._id)))
			return next
		})

	const approve = async () => {
		const chosen = zones.filter((z) => checked.has(z._id))
		setIsApproving(true)
		// PUT replaces the whole document, so send it all with the new status.
		const results = await Promise.allSettled(
			chosen.map(({ _id, updated_at: _updated, ...zone }) => {
				void _updated
				return collectionService.put<ReviewedZone>('zones', _id, {
					...zone,
					status: 'approved',
				})
			}),
		)
		const failed = results.filter((r) => r.status === 'rejected').length
		if (failed > 0) {
			toast.error(`${failed} of ${chosen.length} could not be approved`)
		} else {
			toast.success(`Approved ${chosen.length}`)
		}
		setChecked(new Set())
		setIsApproving(false)
		refresh()
	}

	// Saves the note and queues the zone for Claude (whole-document PUT).
	const sendForRedo = async (note: string) => {
		if (!redoTarget) return
		const { _id, updated_at: _updated, ...zone } = redoTarget
		void _updated
		try {
			await collectionService.put<ReviewedZone>('zones', _id, {
				...zone,
				status: 'redo',
				reviewNote: note,
			})
		} catch {
			toast.error('Could not save the note')
			return
		}
		toast.success(`${zone.name} queued for redo`)
		setRedoTarget(null)
		refresh()
	}

	const columns: TableColumn<StoredZone>[] = [
		{
			header: (
				<label
					className='flex cursor-pointer items-center gap-2'
					title='Select all on this page'
				>
					<input
						type='checkbox'
						className='h-5 w-5 cursor-pointer'
						checked={allChecked}
						ref={(el) => {
							if (el) el.indeterminate = someChecked && !allChecked
						}}
						onChange={togglePage}
					/>
					All
				</label>
			),
			// The label fills the cell (cancelling its padding), so a click
			// anywhere in it toggles the box, and none reaches the row.
			stopRowClick: true,
			render: (z) => (
				<label className='-mx-6 -my-4 flex cursor-pointer items-center px-6 py-4'>
					<input
						type='checkbox'
						className='h-5 w-5 cursor-pointer'
						checked={checked.has(z._id)}
						onChange={() => toggle(z._id)}
						aria-label={`Select ${z.name}`}
					/>
				</label>
			),
		},
		{ header: 'Name', accessor: 'name' },
		{ header: 'ID', accessor: 'id' },
		{
			header: 'Size',
			render: (z) => {
				const { width, height } = gridSize(z.terrain)
				return `${width} x ${height}`
			},
		},
		{ header: 'Status', accessor: 'status' },
		{
			header: 'Zone',
			stopRowClick: true,
			render: (z) => (
				<Link
					href={`${URLS.ZONE}/${z._id}/edit`}
					className='text-blue-600 hover:underline'
				>
					Open zone
				</Link>
			),
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
			<Breadcrumbs
				items={[{ label: 'Zones', href: URLS.ZONE }, { label: 'Review' }]}
			/>
			<div className='mb-4 flex items-center justify-end gap-3'>
				<span className='text-sm text-gray-600'>{checked.size} selected</span>
				<Button
					actionType='neutral'
					type='button'
					onClick={() => setChecked(new Set())}
					disabled={checked.size === 0}
				>
					Clear
				</Button>
				<Button
					actionType='submit'
					type='button'
					onClick={approve}
					isLoading={isApproving}
					disabled={checked.size === 0}
				>
					Approve selected
				</Button>
			</div>
			<DataTable
				data={rows}
				columns={columns}
				rowKey='_id'
				emptyMessage='No zones are waiting for review.'
				currentPage={page}
				pageSize={pageSize}
				totalCount={zones.length}
				onPageChange={setPage}
				onPageSizeChange={setPageSize}
				onRowClick={setRedoTarget}
			/>
			{redoTarget && (
				<ZoneRedoModal
					key={redoTarget._id}
					zone={redoTarget}
					onSave={sendForRedo}
					onClose={() => setRedoTarget(null)}
				/>
			)}
		</>
	)
}

export default ZoneReviewPage
