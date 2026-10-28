'use client'

import { useState } from 'react'
import { ReorderableList, SlideOverDrawer, TileGlyph } from '@/components'
import { type Glyph, type Placement, type Position } from '@/lib/types'
import { defKey } from '@/lib/utils'

interface StackDrawerProps {
	isOpen: boolean
	cell: Position | null
	// Bottom to top, as stored.
	stack: Placement[]
	placedDefs: ReadonlyMap<string, { glyph: Glyph; name: string }>
	onClose: () => void
}

// One cell's placements, top first. Rows can be dragged into a new order, but
// the order stays in the drawer: nothing is written back to the zone yet
// (Tools: Stack 3).
export const StackDrawer = ({
	isOpen,
	cell,
	stack,
	placedDefs,
	onClose,
}: StackDrawerProps) => {
	// Start again from the stored order whenever another stack is shown,
	// including when the same cell is reopened.
	const [order, setOrder] = useState(() => [...stack].reverse())
	const [selectedUid, setSelectedUid] = useState<string | null>(null)
	const [shownStack, setShownStack] = useState(stack)
	if (stack !== shownStack) {
		setShownStack(stack)
		setOrder([...stack].reverse())
		setSelectedUid(null)
	}

	return (
		<SlideOverDrawer
			title={cell ? `Stack at x ${cell.x}, y ${cell.y}` : 'Stack'}
			isOpen={isOpen}
			onClose={onClose}
			size='lg'
		>
			{order.length === 0 ? (
				<p className='text-sm text-gray-500'>Nothing placed here.</p>
			) : (
				<ReorderableList
					items={order}
					getKey={(p) => p.uid}
					onReorder={setOrder}
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
			)}
		</SlideOverDrawer>
	)
}
