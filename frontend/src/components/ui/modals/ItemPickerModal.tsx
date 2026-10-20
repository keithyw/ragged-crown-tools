'use client'

import { DefPickerModal } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type ItemDef } from '@/lib/types'

interface ItemPickerModalProps {
	isOpen: boolean
	items: StoredDoc<ItemDef>[]
	selectedId: string | null
	onClose: () => void
	onSelect: (item: StoredDoc<ItemDef>) => void
}

export const ItemPickerModal = ({
	isOpen,
	items,
	selectedId,
	onClose,
	onSelect,
}: ItemPickerModalProps) => (
	<DefPickerModal
		isOpen={isOpen}
		title='Choose an item'
		emptyMessage='No item definitions yet. Create one under Item Definitions.'
		defs={items}
		selectedId={selectedId}
		onClose={onClose}
		onSelect={onSelect}
		tag={(i) => (i.stackable ? 'Stackable' : '')}
	/>
)
