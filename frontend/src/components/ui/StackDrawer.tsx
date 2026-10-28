'use client'

import { SlideOverDrawer, TileGlyph } from '@/components'
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

// Read-only view of one cell's placements, top first. Editing comes later
// (Tools 12).
export const StackDrawer = ({
	isOpen,
	cell,
	stack,
	placedDefs,
	onClose,
}: StackDrawerProps) => {
	const topFirst = [...stack].reverse()

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
				<ol className='space-y-2'>
					{topFirst.map((p, idx) => {
						// A missing def gives undefined, which TileGlyph draws as "?".
						const def = placedDefs.get(defKey(p.defKind, p.defId))
						return (
							<li
								key={p.uid}
								className='flex items-center gap-3 rounded border border-gray-200 p-2'
							>
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
							</li>
						)
					})}
				</ol>
			)}
		</SlideOverDrawer>
	)
}
