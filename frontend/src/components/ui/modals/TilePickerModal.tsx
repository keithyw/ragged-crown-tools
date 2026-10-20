'use client'

import { DefPickerModal } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type TileDef } from '@/lib/types'

interface TilePickerModalProps {
	isOpen: boolean
	tiles: StoredDoc<TileDef>[]
	selectedId: string | null
	onClose: () => void
	onSelect: (tile: StoredDoc<TileDef>) => void
}

export const TilePickerModal = ({
	isOpen,
	tiles,
	selectedId,
	onClose,
	onSelect,
}: TilePickerModalProps) => (
	<DefPickerModal
		isOpen={isOpen}
		title='Choose a tile'
		emptyMessage='No tile definitions yet.'
		defs={tiles}
		selectedId={selectedId}
		onClose={onClose}
		onSelect={onSelect}
	/>
)
