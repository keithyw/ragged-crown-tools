'use client'

import { useMemo } from 'react'
import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button, TileCell } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type TileDef } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TilePickerModalProps {
	isOpen: boolean
	tiles: StoredDoc<TileDef>[]
	selectedId: string | null
	onClose: () => void
	onSelect: (tile: StoredDoc<TileDef>) => void
}

export const TilePickerModal = ({
	isOpen,
	tiles,
	selectedId,
	onClose,
	onSelect,
}: TilePickerModalProps) => {
	const sorted = useMemo(
		() => [...tiles].sort((a, b) => a.name.localeCompare(b.name)),
		[tiles],
	)

	return (
		<BaseModal isOpen={isOpen} onClose={onClose}>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				Choose a tile
			</DialogTitle>

			{sorted.length === 0 ? (
				<p className='mt-4 text-sm text-gray-500'>No tile definitions yet.</p>
			) : (
				<div className='mt-4 grid max-h-[60vh] grid-cols-[repeat(auto-fill,5rem)] justify-center gap-3 overflow-y-auto p-1'>
					{sorted.map((t) => (
						<button
							key={t._id}
							type='button'
							onClick={() => onSelect(t)}
							aria-pressed={t._id === selectedId}
							className={cn(
								'flex w-20 flex-col items-center gap-1 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
								t._id === selectedId && 'ring-2 ring-blue-500',
							)}
						>
							<TileCell tile={t} />
							<span className='w-full truncate text-center text-sm text-gray-700'>
								{t.name}
							</span>
							<span className='w-full truncate text-center text-xs text-gray-500'>
								{t.id}
							</span>
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
