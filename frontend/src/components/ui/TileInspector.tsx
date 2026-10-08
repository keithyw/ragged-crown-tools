'use client'

import { Button, TileGlyph } from '@/components'
import { TileDef } from '@/lib/types'

interface TileInspectorProps {
	tile: TileDef
	// not sure if these need parameters like id
	onView: () => void
	onEdit: () => void
	onDelete: () => void
}

export const TileInspector = ({
	tile,
	onView,
	onEdit,
	onDelete,
}: TileInspectorProps) => {
	const TileDetails = ({
		description,
		val,
	}: {
		description: string
		val: string
	}) => (
		<dl className='w-full text-sm'>
			<dt>{description}</dt>
			<dd>{val}</dd>
		</dl>
	)

	const details = [
		{ key: 'Move Cost', val: tile.moveCost.toString() },
		{ key: 'Walkable', val: tile.isWalkable ? 'Yes' : 'No' },
		{ key: 'Encounter Rate', val: tile.encounterRate?.toString() },
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<TileGlyph tile={tile} className='w-24' />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{tile.name}</div>
				<div className='text-xs text-gray-500'>{tile.id}</div>
			</div>
			{details.map((d) => (
				<TileDetails key={d.key} description={d.key} val={d.val as string} />
			))}
			<div className='flex w-full gap-2'>
				<Button actionType='view' onClick={onView}>
					View
				</Button>
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
