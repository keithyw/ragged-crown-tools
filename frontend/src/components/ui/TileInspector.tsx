'use client'

import { Button, TileGlyph } from '@/components'
import { TileDef } from '@/lib/types'

interface TileInspectorProps {
	tile: TileDef
	// not sure if these need parameters like id
	onEdit: () => void
	onDelete: () => void
}

const TileDetails = ({
	description,
	val,
}: {
	description: string
	val: string
}) => (
	<div className='flex justify-between gap-3'>
		<dt className='text-gray-500'>{description}</dt>
		<dd className='text-right font-medium break-all'>{val}</dd>
	</div>
)

export const TileInspector = ({
	tile,
	onEdit,
	onDelete,
}: TileInspectorProps) => {
	// color: string
	// name: string
	// bg: string
	// moveCost: number
	// isWalkable?: boolean
	// isConsumable?: boolean
	// spriteCoords: Position
	// description?: string
	// encounterRate?: number
	// encounterTableKey?: string
	const details = [
		{ key: 'Color', val: tile.color },
		{ key: 'Background', val: tile.bg },
		{ key: 'Move Cost', val: tile.moveCost.toString() },
		{ key: 'Walkable', val: tile.isWalkable ? 'Yes' : 'No' },
		{ key: 'Consumable', val: tile.isConsumable ? 'Yes' : 'No' },
		{ key: 'Description', val: tile.description },
		{ key: 'Encounter Rate', val: tile.encounterRate?.toString() ?? '-' },
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<TileGlyph tile={tile} className='w-24' />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{tile.name}</div>
				<div className='text-xs text-gray-500'>{tile.id}</div>
			</div>
			<dl className='w-full space-y-1 text-sm'>
				{details.map((d) => (
					<TileDetails key={d.key} description={d.key} val={d.val as string} />
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
