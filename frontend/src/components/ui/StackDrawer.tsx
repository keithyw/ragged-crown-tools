'use client'

import { useState } from 'react'
import {
	Button,
	ConfirmationModal,
	ReorderableList,
	SlideOverDrawer,
	TileGlyph,
} from '@/components'
import { type Glyph, type Placement, type Position } from '@/lib/types'
import { cellKey, defKey } from '@/lib/utils'

interface StackDrawerProps {
	isOpen: boolean
	cell: Position | null
	// Bottom to top, as stored.
	stack: Placement[]
	placedDefs: ReadonlyMap<string, { glyph: Glyph; name: string }>
	// Gets the cell's whole stack after an edit, bottom to top.
	onChange: (stack: Placement[]) => void
	onClose: () => void
}

// One cell's placements, top first. Rows are reordered by dragging or with the
// selected row's arrows, and the selected one can be deleted. Every edit goes
// straight to the zone through onChange.
export const StackDrawer = ({
	isOpen,
	cell,
	stack,
	placedDefs,
	onChange,
	onClose,
}: StackDrawerProps) => {
	const topFirst = [...stack].reverse()
	const [selectedUid, setSelectedUid] = useState<string | null>(null)
	const [isConfirmOpen, setIsConfirmOpen] = useState(false)
	// Opening another cell, or reopening this one, starts with nothing selected.
	const cellId = cell ? cellKey(cell.x, cell.y) : null
	const [shownCell, setShownCell] = useState(cellId)
	if (cellId !== shownCell) {
		setShownCell(cellId)
		setSelectedUid(null)
	}

	const selected = stack.find((p) => p.uid === selectedUid)
	const selectedName = selected
		? (placedDefs.get(defKey(selected.defKind, selected.defId))?.name ??
			'this placement')
		: ''

	const deleteSelected = () => {
		onChange(stack.filter((p) => p.uid !== selectedUid))
		setSelectedUid(null)
		setIsConfirmOpen(false)
	}

	return (
		<SlideOverDrawer
			title={cell ? `Stack at x ${cell.x}, y ${cell.y}` : 'Stack'}
			isOpen={isOpen}
			onClose={onClose}
			size='lg'
		>
			{topFirst.length === 0 ? (
				<p className='text-sm text-gray-500'>Nothing placed here.</p>
			) : (
				<>
					<ReorderableList
						items={topFirst}
						getKey={(p) => p.uid}
						onReorder={(items) => onChange([...items].reverse())}
						selectedKey={selectedUid}
						onSelect={setSelectedUid}
						renderItem={(p, idx) => {
							// A missing def gives undefined, which TileGlyph draws as "?".
							const def = placedDefs.get(defKey(p.defKind, p.defId))
							return (
								<div className='flex items-center gap-3'>
									<TileGlyph variant='cell' tile={def} />
									<div className='min-w-0 flex-1'>
										<div className='truncate text-sm font-medium text-gray-900'>
											{def?.name ?? 'Missing definition'}
										</div>
										<div className='text-xs text-gray-500'>
											{p.defKind}
											{p.quantity !== undefined && ` · x${p.quantity}`}
										</div>
									</div>
									{idx === 0 && (
										<span className='text-xs text-gray-500'>Top</span>
									)}
								</div>
							)
						}}
					/>
					<div className='mt-4'>
						<Button
							type='button'
							actionType='delete'
							disabled={!selected}
							onClick={() => setIsConfirmOpen(true)}
						>
							Delete
						</Button>
					</div>
				</>
			)}
			<ConfirmationModal
				isOpen={isConfirmOpen}
				title='Delete placement'
				message={`Delete ${selectedName} from this stack? Anything set on this placement (a custom message, contents, a destination) is deleted with it.`}
				confirmButtonText='Delete'
				// Nothing to wait for: the delete is in memory until Save Zone.
				isDeleting={false}
				onClose={() => setIsConfirmOpen(false)}
				onConfirm={deleteSelected}
			/>
		</SlideOverDrawer>
	)
}
