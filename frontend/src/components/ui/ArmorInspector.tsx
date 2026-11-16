'use client'

import { Button, TileDetails, TileGlyph } from '@/components'
import { ArmorDef } from '@/lib/types'

interface ArmorInspectorProps {
	armor: ArmorDef
	onEdit: () => void
	onDelete: () => void
}

export const ArmorInspector = ({
	armor,
	onEdit,
	onDelete,
}: ArmorInspectorProps) => {
	const details = [
		{ key: 'Type', val: armor.type },
		{ key: 'Defense value', val: armor.defenseValue.toString() },
		{ key: 'Weight', val: armor.weight.toString() },
		{ key: 'Max quantity', val: armor.maxQuantity?.toString() ?? 'One' },
		{ key: 'Uses', val: armor.numberOfUses?.toString() ?? 'Unlimited' },
		{ key: 'Quest item', val: armor.isQuestItem ? 'Yes' : 'No' },
		{ key: 'Description', val: armor.description ?? '-' },
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<TileGlyph tile={armor} className='w-24' />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{armor.name}</div>
				<div className='text-xs text-gray-500'>{armor.id}</div>
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
