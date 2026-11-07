'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import {
	Breadcrumbs,
	Button,
	DataTable,
	SpinnerSection,
	SpriteImage,
	SpriteRedoModal,
} from '@/components'
import { useCollection } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService, StoredDoc } from '@/lib/services'
import { Sprite, TableColumn } from '@/lib/types'

type StoredSprite = StoredDoc<Sprite>

const SpritesReviewPage = () => {
	// Sprites waiting for the owner. `redo` ones are with Claude, so they are
	// not listed. The list is small, so paging is done here, not by the API.
	const {
		items: sprites,
		isLoading,
		error,
		refresh,
	} = useCollection<Sprite>('sprites', {
		filter: { status: 'review' },
		sort: 'name',
	})
	const [checked, setChecked] = useState<Set<string>>(new Set())
	const [page, setPage] = useState(1)
	const [pageSize, setPageSize] = useState(10)
	const [isApproving, setIsApproving] = useState(false)
	const [redoTarget, setRedoTarget] = useState<StoredSprite | null>(null)

	const rows = sprites.slice((page - 1) * pageSize, page * pageSize)
	// Keep the page valid after approving the last rows of the final page.
	const lastPage = Math.max(1, Math.ceil(sprites.length / pageSize))
	if (page > lastPage) setPage(lastPage)

	const toggle = (_id: string) =>
		setChecked((prev) => {
			const next = new Set(prev)
			if (!next.delete(_id)) next.add(_id)
			return next
		})

	const allChecked = rows.length > 0 && rows.every((s) => checked.has(s._id))
	const someChecked = rows.some((s) => checked.has(s._id))

	// Checks every row on this page, or clears them if all are already checked.
	const togglePage = () =>
		setChecked((prev) => {
			const next = new Set(prev)
			rows.forEach((s) => (allChecked ? next.delete(s._id) : next.add(s._id)))
			return next
		})

	const approve = async () => {
		const chosen = sprites.filter((s) => checked.has(s._id))
		setIsApproving(true)
		// PUT replaces the whole document, so send it all with the new status.
		const results = await Promise.allSettled(
			chosen.map(({ _id, updated_at: _updated, ...sprite }) => {
				void _updated
				return collectionService.put<Sprite>('sprites', _id, {
					...sprite,
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

	// Saves the note and queues the sprite for Claude (whole-document PUT).
	const sendForRedo = async (note: string) => {
		if (!redoTarget) return
		const { _id, updated_at: _updated, ...sprite } = redoTarget
		void _updated
		try {
			await collectionService.put<Sprite>('sprites', _id, {
				...sprite,
				status: 'redo',
				reviewNote: note,
			})
		} catch {
			toast.error('Could not save the note')
			return
		}
		toast.success(`${sprite.name} queued for redo`)
		setRedoTarget(null)
		refresh()
	}

	const columns: TableColumn<StoredSprite>[] = [
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
			render: (s) => (
				<label className='-mx-6 -my-4 flex cursor-pointer items-center px-6 py-4'>
					<input
						type='checkbox'
						className='h-5 w-5 cursor-pointer'
						checked={checked.has(s._id)}
						onChange={() => toggle(s._id)}
						aria-label={`Select ${s.name}`}
					/>
				</label>
			),
		},
		{
			header: 'Sprite',
			render: (s) => <SpriteImage art={s} scale={3} />,
		},
		{ header: 'Name', accessor: 'name' },
		{ header: 'ID', accessor: 'id' },
		{ header: 'Category', accessor: 'category' },
	]

	if (isLoading) {
		return <SpinnerSection spinnerMessage='Loading Sprites' />
	}

	if (error) {
		return <div>{error}</div>
	}

	return (
		<>
			<Breadcrumbs
				items={[{ label: 'Sprites', href: URLS.SPRITES }, { label: 'Review' }]}
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
				emptyMessage='No sprites are waiting for review.'
				currentPage={page}
				pageSize={pageSize}
				totalCount={sprites.length}
				onPageChange={setPage}
				onPageSizeChange={setPageSize}
				onRowClick={setRedoTarget}
			/>
			{redoTarget && (
				<SpriteRedoModal
					key={redoTarget._id}
					sprite={redoTarget}
					onSave={sendForRedo}
					onClose={() => setRedoTarget(null)}
				/>
			)}
		</>
	)
}

export default SpritesReviewPage
