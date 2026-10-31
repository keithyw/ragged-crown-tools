'use client'

import { Button, TileDetails, TileGlyph } from '@/components'
import { ItemDef } from '@/lib/types'

interface ItemInspectorProps {
	item: ItemDef
	onEdit: () => void
	onDelete: () => void
}

export const ItemInspector = ({
	item,
	onEdit,
	onDelete,
}: ItemInspectorProps) => {
	const details = [
		{ key: 'Max quantity', val: item.maxQuantity?.toString() ?? 'One' },
		{ key: 'Color', val: item.glyph.color },
		{ key: 'Background', val: item.glyph.bg },
		{ key: 'Uses', val: item.numberOfUses?.toString() ?? 'Unlimited' },
		{
			key: 'Container',
			val: item.container
				? `Capacity ${item.container.capacity}, depth ${item.container.maxDepth ?? 0}`
				: 'No',
		},
		{ key: 'Description', val: item.description ?? '-' },
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<TileGlyph tile={item} className='w-24' />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{item.name}</div>
				<div className='text-xs text-gray-500'>{item.id}</div>
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
		</div>
	)
}
