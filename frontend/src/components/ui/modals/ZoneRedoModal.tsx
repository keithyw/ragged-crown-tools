'use client'

import { useState } from 'react'
import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button } from '@/components'
import { type ReviewedZone } from '@/lib/types'

interface ZoneRedoModalProps {
	zone: Pick<ReviewedZone, 'name' | 'id' | 'reviewNote'>
	// Saves the note and queues the zone for Claude. Resolves when done.
	onSave: (note: string) => Promise<void>
	onClose: () => void
}

// A zone and one field: what needs to change in it. Mounted only while a zone
// is chosen (the caller keys it), so the note always starts from that zone's
// current one.
export const ZoneRedoModal = ({
	zone,
	onSave,
	onClose,
}: ZoneRedoModalProps) => {
	const [note, setNote] = useState(zone.reviewNote ?? '')
	const [isSaving, setIsSaving] = useState(false)

	const save = async () => {
		setIsSaving(true)
		try {
			await onSave(note.trim())
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<BaseModal isOpen onClose={onClose}>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				{zone.name}
				<span className='ml-2 text-xs text-gray-500'>{zone.id}</span>
			</DialogTitle>
			<label className='mt-4 block text-sm font-medium text-gray-700'>
				What needs to change in the zone?
				<textarea
					value={note}
					onChange={(e) => setNote(e.target.value)}
					rows={4}
					autoFocus
					className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none'
				/>
			</label>
			<div className='mt-4 flex justify-end space-x-3'>
				<Button
					actionType='neutral'
					type='button'
					onClick={onClose}
					disabled={isSaving}
				>
					Cancel
				</Button>
				<Button
					actionType='submit'
					type='button'
					onClick={save}
					isLoading={isSaving}
					disabled={note.trim() === ''}
				>
					Send for redo
				</Button>
			</div>
		</BaseModal>
	)
}
