'use client'

import { useMemo } from 'react'
import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button, TileCell } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type ObjectDef } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ObjectPickerModalProps {
	isOpen: boolean
	objects: StoredDoc<ObjectDef>[]
	selectedId: string | null
	onClose: () => void
	onSelect: (object: StoredDoc<ObjectDef>) => void
}

// Same idea as TilePickerModal, for objects and spaces. A copy for now (rule of
// three): the items picker in Tools 10 is the third, when one should be shared.
export const ObjectPickerModal = ({
	isOpen,
	objects,
	selectedId,
	onClose,
	onSelect,
}: ObjectPickerModalProps) => {
	const sorted = useMemo(
		() => [...objects].sort((a, b) => a.name.localeCompare(b.name)),
		[objects],
	)

	return (
		<BaseModal isOpen={isOpen} onClose={onClose}>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				Choose an object
			</DialogTitle>

			{sorted.length === 0 ? (
				<p className='mt-4 text-sm text-gray-500'>
					No object definitions yet. Create one under Object Definitions.
				</p>
			) : (
				<div className='mt-4 grid max-h-[60vh] grid-cols-[repeat(auto-fill,5rem)] justify-center gap-3 overflow-y-auto p-1'>
					{sorted.map((o) => (
						<button
							key={o._id}
							type='button'
							onClick={() => onSelect(o)}
							aria-pressed={o._id === selectedId}
							className={cn(
								'flex w-20 flex-col items-center gap-1 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
								o._id === selectedId && 'ring-2 ring-blue-500',
							)}
						>
							<TileCell tile={o} />
							<span className='w-full truncate text-center text-sm text-gray-700'>
								{o.name}
							</span>
							<span className='w-full truncate text-center text-xs text-gray-500'>
								{o.id}
							</span>
							<span className='w-full truncate text-center text-xs text-gray-500'>
								{o.isSolid ? 'Solid' : 'Space'}
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
