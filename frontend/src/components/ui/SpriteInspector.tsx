'use client'

import { Button, SpriteImage, TileDetails } from '@/components'
import { EGA_PALETTE, type Sprite } from '@/lib/types'

interface SpriteInspectorProps {
	sprite: Sprite
	onEdit: () => void
	onDelete: () => void
	onSendForReview: () => void
}

const STATUS_LABELS = {
	review: 'Review',
	redo: 'Redo',
	approved: 'Approved',
}

export const SpriteInspector = ({
	sprite,
	onEdit,
	onDelete,
	onSendForReview,
}: SpriteInspectorProps) => {
	const details = [
		{
			key: 'Category',
			val: sprite.category.charAt(0).toUpperCase() + sprite.category.slice(1),
		},
		{
			key: 'Background',
			val:
				sprite.background === 'transparent'
					? 'Transparent'
					: EGA_PALETTE[sprite.background].name,
		},
		{
			key: 'Review status',
			val: sprite.status ? STATUS_LABELS[sprite.status] : 'None',
		},
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<SpriteImage art={sprite} scale={6} />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{sprite.name}</div>
				<div className='text-xs text-gray-500'>{sprite.id}</div>
			</div>
			<dl className='w-full space-y-1 text-sm'>
				{details.map((d) => (
					<TileDetails key={d.key} description={d.key} val={d.val} />
				))}
			</dl>
			<div className='flex w-full gap-2'>
				<Button actionType='edit' onClick={onEdit}>
					Edit
				</Button>
				<Button actionType='delete' onClick={onDelete}>
					Delete
				</Button>
			</div>
			<Button actionType='neutral' className='w-full' onClick={onSendForReview}>
				Send for review
			</Button>
		</div>
	)
}
