'use client'

import { useState } from 'react'
import { Button, SpriteImage, SpritePickerModal } from '@/components'
import { useCollection } from '@/hooks'
import { type Sprite, type SpriteCategory } from '@/lib/types'

interface SpritePickerProps {
	label: string
	// Only sprites of this category are offered.
	category: SpriteCategory
	// A sprite's _id, or nothing.
	value?: string
	onChange: (spriteId: string | undefined) => void
}

// Choose (or remove) the sprite a def draws instead of its glyph.
export const SpritePicker = ({
	label,
	category,
	value,
	onChange,
}: SpritePickerProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const { items: sprites, isLoading, error } = useCollection<Sprite>('sprites')
	const chosen = sprites.find((s) => s._id === value)

	return (
		<div className='mb-4'>
			<p className='mb-2 block text-sm font-bold text-gray-700'>{label}</p>
			<div className='flex items-center gap-3'>
				{chosen ? (
					<SpriteImage art={chosen} scale={3} />
				) : (
					<span className='h-12 w-12 shrink-0 rounded border border-dashed border-gray-300' />
				)}
				<div className='min-w-0 text-sm text-gray-700'>
					{chosen ? (
						<>
							<div className='truncate font-medium'>{chosen.name}</div>
							<div className='truncate text-xs text-gray-500'>{chosen.id}</div>
						</>
					) : value && !isLoading ? (
						<span className='text-red-600'>Sprite not found</span>
					) : (
						<span className='text-gray-500'>No sprite</span>
					)}
				</div>
			</div>
			<div className='mt-2 flex gap-2'>
				<Button
					type='button'
					actionType='neutral'
					disabled={isLoading || !!error}
					onClick={() => setIsOpen(true)}
				>
					{value ? 'Change sprite' : 'Choose sprite'}
				</Button>
				{value && (
					<Button
						type='button'
						actionType='neutral'
						onClick={() => onChange(undefined)}
					>
						Remove
					</Button>
				)}
			</div>
			{error && <p className='mt-1 text-sm text-red-600'>{error}</p>}
			<SpritePickerModal
				isOpen={isOpen}
				title={`Choose a ${category} sprite`}
				emptyMessage={`No ${category} sprites yet. Draw one on the Sprites page.`}
				sprites={sprites.filter((s) => s.category === category)}
				selectedId={value ?? null}
				onClose={() => setIsOpen(false)}
				onSelect={(s) => {
					onChange(s._id)
					setIsOpen(false)
				}}
			/>
		</div>
	)
}
