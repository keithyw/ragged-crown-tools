'use client'

import { useState } from 'react'
import { Button, DefPickerModal } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type ArmorDef, type ItemDef, type WeaponDef } from '@/lib/types'

type Carried = ItemDef | WeaponDef | ArmorDef

const FILTERS = [
	{ value: 'all', label: 'All' },
	{ value: 'item', label: 'Items' },
	{ value: 'weapon', label: 'Weapons' },
	{ value: 'armor', label: 'Armor' },
]

interface ItemPickerModalProps {
	isOpen: boolean
	items: StoredDoc<Carried>[]
	selectedId: string | null
	onClose: () => void
	onSelect: (item: StoredDoc<Carried>) => void
}

export const ItemPickerModal = ({
	isOpen,
	items,
	selectedId,
	onClose,
	onSelect,
}: ItemPickerModalProps) => {
	const [kind, setKind] = useState('all')
	return (
		<DefPickerModal
			isOpen={isOpen}
			title='Choose an item'
			emptyMessage='Nothing here. Create one under Item, Weapon or Armor Definitions.'
			defs={kind === 'all' ? items : items.filter((i) => i.kind === kind)}
			selectedId={selectedId}
			onClose={onClose}
			onSelect={onSelect}
			tag={(i) => (i.maxQuantity !== undefined ? `Up to ${i.maxQuantity}` : '')}
			header={
				<div className='mt-3 flex gap-2'>
					{FILTERS.map((f) => (
						<Button
							key={f.value}
							type='button'
							actionType={kind === f.value ? 'edit' : 'neutral'}
							onClick={() => setKind(f.value)}
						>
							{f.label}
						</Button>
					))}
				</div>
			}
		/>
	)
}
