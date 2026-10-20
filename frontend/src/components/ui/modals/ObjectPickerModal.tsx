'use client'

import { DefPickerModal } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type ObjectDef } from '@/lib/types'

interface ObjectPickerModalProps {
	isOpen: boolean
	objects: StoredDoc<ObjectDef>[]
	selectedId: string | null
	onClose: () => void
	onSelect: (object: StoredDoc<ObjectDef>) => void
}

export const ObjectPickerModal = ({
	isOpen,
	objects,
	selectedId,
	onClose,
	onSelect,
}: ObjectPickerModalProps) => (
	<DefPickerModal
		isOpen={isOpen}
		title='Choose an object'
		emptyMessage='No object definitions yet. Create one under Object Definitions.'
		defs={objects}
		selectedId={selectedId}
		onClose={onClose}
		onSelect={onSelect}
		tag={(o) => (o.isSolid ? 'Solid' : 'Space')}
	/>
)
