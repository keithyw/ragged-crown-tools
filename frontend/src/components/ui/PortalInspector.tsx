'use client'

import { Button, TileDetails, TileGlyph } from '@/components'
import { PortalDef } from '@/lib/types'

interface PortalInspectorProps {
	portal: PortalDef
	onEdit: () => void
	onDelete: () => void
}

export const PortalInspector = ({
	portal,
	onEdit,
	onDelete,
}: PortalInspectorProps) => {
	const details = [
		{ key: 'Direction', val: portal.twoWay ? 'Two way' : 'One way' },
		{ key: 'Color', val: portal.glyph.color },
		{ key: 'Background', val: portal.glyph.bg },
		{
			key: 'Interactions',
			val: portal.interactions?.length
				? String(portal.interactions.length)
				: 'None',
		},
		{ key: 'Description', val: portal.description ?? '-' },
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<TileGlyph tile={portal} className='w-24' />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{portal.name}</div>
				<div className='text-xs text-gray-500'>{portal.id}</div>
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
