'use client'

import { SpriteImage } from '@/components'
import { type Sprite } from '@/lib/types'
import { cn } from '@/lib/utils'

interface SpriteCardProps {
	sprite: Sprite
	selected: boolean
	onSelect: () => void
	onOpen: () => void
}

export const SpriteCard = ({
	sprite,
	selected,
	onSelect,
	onOpen,
}: SpriteCardProps) => (
	<button
		type='button'
		onClick={onSelect}
		onDoubleClick={onOpen}
		aria-pressed={selected}
		className={cn(
			'flex w-28 flex-col items-center gap-1 rounded p-2 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none',
			selected && 'ring-2 ring-blue-500',
		)}
	>
		<SpriteImage art={sprite} scale={4} />
		<span
			className='max-w-full truncate text-sm text-gray-500'
			title={sprite.name}
		>
			{sprite.name}
		</span>
		<span
			className='max-w-full truncate text-xs text-gray-500'
			title={sprite.id}
		>
			{sprite.id}
		</span>
	</button>
)
