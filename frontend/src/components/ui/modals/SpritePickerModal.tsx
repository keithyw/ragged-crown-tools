'use client'

import { useMemo } from 'react'
import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button, SpriteImage } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type Sprite } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SpritePickerModalProps {
	isOpen: boolean
	title: string
	emptyMessage: string
	sprites: StoredDoc<Sprite>[]
	selectedId: string | null
	onClose: () => void
	onSelect: (sprite: StoredDoc<Sprite>) => void
}

// The grid-of-sprites picker, like DefPickerModal.
export const SpritePickerModal = ({
	isOpen,
	title,
	emptyMessage,
	sprites,
	selectedId,
	onClose,
	onSelect,
}: SpritePickerModalProps) => {
	const sorted = useMemo(
		() => [...sprites].sort((a, b) => a.name.localeCompare(b.name)),
		[sprites],
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
					{sorted.map((s) => (
						<button
							key={s._id}
							type='button'
							onClick={() => onSelect(s)}
							aria-pressed={s._id === selectedId}
							className={cn(
								'flex w-20 flex-col items-center gap-1 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
								s._id === selectedId && 'ring-2 ring-blue-500',
							)}
						>
							<SpriteImage art={s} scale={3} />
							<span className='w-full truncate text-center text-sm text-gray-700'>
								{s.name}
							</span>
							<span className='w-full truncate text-center text-xs text-gray-500'>
								{s.id}
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
