'use client'

import { useMemo } from 'react'
import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button, TileCell } from '@/components'
import { type Glyph } from '@/lib/types'
import { cn } from '@/lib/utils'

// What a picker needs from a definition: a key, a label and a glyph to draw.
interface PickableDef {
	_id: string
	id?: string
	name: string
	glyph: Glyph
}

interface DefPickerModalProps<T extends PickableDef> {
	isOpen: boolean
	title: string
	emptyMessage: string
	defs: T[]
	selectedId: string | null
	onClose: () => void
	onSelect: (def: T) => void
	// An extra short line under the id, such as "Solid" or "Space". Nothing is
	// shown when it returns an empty string.
	tag?: (def: T) => string
}

// The grid-of-glyphs picker shared by tiles, objects and items.
export const DefPickerModal = <T extends PickableDef>({
	isOpen,
	title,
	emptyMessage,
	defs,
	selectedId,
	onClose,
	onSelect,
	tag,
}: DefPickerModalProps<T>) => {
	const sorted = useMemo(
		() => [...defs].sort((a, b) => a.name.localeCompare(b.name)),
		[defs],
	)

	return (
		<BaseModal isOpen={isOpen} onClose={onClose}>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				{title}
			</DialogTitle>

			{sorted.length === 0 ? (
				<p className='mt-4 text-sm text-gray-500'>{emptyMessage}</p>
			) : (
				<div className='mt-4 grid max-h-[60vh] grid-cols-[repeat(auto-fill,5rem)] justify-center gap-3 overflow-y-auto p-1'>
					{sorted.map((d) => (
						<button
							key={d._id}
							type='button'
							onClick={() => onSelect(d)}
							aria-pressed={d._id === selectedId}
							className={cn(
								'flex w-20 flex-col items-center gap-1 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
								d._id === selectedId && 'ring-2 ring-blue-500',
							)}
						>
							<TileCell tile={d} />
							<span className='w-full truncate text-center text-sm text-gray-700'>
								{d.name}
							</span>
							<span className='w-full truncate text-center text-xs text-gray-500'>
								{d.id}
							</span>
							{tag?.(d) && (
								<span className='w-full truncate text-center text-xs text-gray-500'>
									{tag(d)}
								</span>
							)}
						</button>
					))}
				</div>
			)}

			<div className='mt-4 flex justify-end'>
				<Button type='button' actionType='neutral' onClick={onClose}>
					Cancel
				</Button>
			</div>
		</BaseModal>
	)
}
