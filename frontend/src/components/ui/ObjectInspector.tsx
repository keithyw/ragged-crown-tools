'use client'

import { Button, TileDetails, TileGlyph } from '@/components'
import { ObjectDef } from '@/lib/types'

interface ObjectInspectorProps {
	object: ObjectDef
	onEdit: () => void
	onDelete: () => void
}

export const ObjectInspector = ({
	object,
	onEdit,
	onDelete,
}: ObjectInspectorProps) => {
	const details = [
		{ key: 'Type', val: object.isSolid ? 'Solid object' : 'Space' },
		{ key: 'Color', val: object.glyph.color },
		{ key: 'Background', val: object.glyph.bg },
		// moveCost only applies to spaces
		...(object.isSolid
			? []
			: [{ key: 'Move Cost', val: (object.moveCost ?? 1).toString() }]),
		{ key: 'Uses', val: object.numberOfUses?.toString() ?? 'Unlimited' },
		{
			key: 'Container',
			val: object.container
				? `Capacity ${object.container.capacity}, depth ${object.container.maxDepth ?? 0}`
				: 'No',
		},
		{
			key: 'Interactions',
			val: object.interactions?.length
				? String(object.interactions.length)
				: 'None',
		},
		{ key: 'Description', val: object.description ?? '-' },
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<TileGlyph tile={object} className='w-24' />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{object.name}</div>
				<div className='text-xs text-gray-500'>{object.id}</div>
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
