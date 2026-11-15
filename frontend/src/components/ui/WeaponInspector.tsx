'use client'

import { Button, TileDetails, TileGlyph } from '@/components'
import { WeaponDef } from '@/lib/types'

interface WeaponInspectorProps {
	weapon: WeaponDef
	onEdit: () => void
	onDelete: () => void
}

export const WeaponInspector = ({
	weapon,
	onEdit,
	onDelete,
}: WeaponInspectorProps) => {
	const flags = [
		weapon.isTwoHanded && 'Two-handed',
		weapon.isMissile && 'Missile',
		weapon.isThrown && 'Thrown',
	].filter(Boolean)
	const details = [
		{ key: 'Type', val: weapon.type },
		{ key: 'Damage', val: `${weapon.damage.count}d${weapon.damage.die}` },
		{ key: 'Flags', val: flags.length > 0 ? flags.join(', ') : 'None' },
		{ key: 'Weight', val: weapon.weight.toString() },
		{ key: 'Max quantity', val: weapon.maxQuantity?.toString() ?? 'One' },
		{ key: 'Uses', val: weapon.numberOfUses?.toString() ?? 'Unlimited' },
		{ key: 'Description', val: weapon.description ?? '-' },
	]
	return (
		<div className='flex flex-col items-center gap-3'>
			<TileGlyph tile={weapon} className='w-24' />
			<div className='text-center'>
				<div className='font-bold text-gray-900'>{weapon.name}</div>
				<div className='text-xs text-gray-500'>{weapon.id}</div>
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
