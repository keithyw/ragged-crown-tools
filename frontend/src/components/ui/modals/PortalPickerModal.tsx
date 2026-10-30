'use client'

import { DefPickerModal } from '@/components'
import { type StoredDoc } from '@/lib/services'
import { type PortalDef } from '@/lib/types'

interface PortalPickerModalProps {
	isOpen: boolean
	portals: StoredDoc<PortalDef>[]
	selectedId: string | null
	onClose: () => void
	onSelect: (portal: StoredDoc<PortalDef>) => void
}

export const PortalPickerModal = ({
	isOpen,
	portals,
	selectedId,
	onClose,
	onSelect,
}: PortalPickerModalProps) => (
	<DefPickerModal
		isOpen={isOpen}
		title='Choose a portal'
		emptyMessage='No portal definitions yet. Create one under Portal Definitions.'
		defs={portals}
		selectedId={selectedId}
		onClose={onClose}
		onSelect={onSelect}
	/>
)
