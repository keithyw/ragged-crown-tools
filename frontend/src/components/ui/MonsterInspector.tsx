'use client'

import { Button, TileDetails, TileGlyph } from '@/components'
import { MonsterDef } from '@/lib/types'

interface MonsterInspectorProps {
	monster: MonsterDef
	onEdit: () => void
	onDelete: () => void
}

export const MonsterInspector = ({
	monster,
	onEdit,
	onDelete,
}: MonsterInspectorProps) => {
	const details = [
		{ key: 'Level', val: monster.level.toString() },
		{ key: 'HP', val: monster.hp.toString() },
		{ key: 'Defense', val: monster.defenseValue.toString() },
		{ key: 'Damage', val: `${monster.damage.count}d${monster.damage.die}` },
		{ key: 'Initiative', val: (monster.initiative ?? 6).toString() },
		{ key: 'Removal chance', val: `${monster.removalChance}%` },
		{
			key: 'Number appearing',
			val: monster.isUnique
				? 'One (unique)'
				: `${monster.numberAppearing.count}d${monster.numberAppearing.die}`,
		},
		{ key: 'Description', val: monster.description ?? '-' },
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<TileGlyph tile={monster} className='w-24' />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{monster.name}</div>
				<div className='text-xs text-gray-500'>{monster.id}</div>
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
