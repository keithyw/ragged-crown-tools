'use client'

import { useState } from 'react'
import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button, SpriteImage } from '@/components'
import { type Sprite } from '@/lib/types'

interface SpriteRedoModalProps {
	sprite: Sprite
	// Saves the note and queues the sprite for Claude. Resolves when done.
	onSave: (note: string) => Promise<void>
	onClose: () => void
}

// The sprite at a readable size and one field: what needs to change. Mounted
// only while a sprite is chosen (the caller keys it by `_id`), so the note
// always starts from that sprite's current one.
export const SpriteRedoModal = ({
	sprite,
	onSave,
	onClose,
}: SpriteRedoModalProps) => {
	const [note, setNote] = useState(sprite.reviewNote ?? '')
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
				{sprite.name}
				<span className='ml-2 text-xs text-gray-500'>{sprite.id}</span>
			</DialogTitle>
			<div className='mt-3 flex justify-center'>
				<SpriteImage art={sprite} scale={12} />
			</div>
			<label className='mt-4 block text-sm font-medium text-gray-700'>
				What needs to change?
				<textarea
					value={note}
					onChange={(e) => setNote(e.target.value)}
					rows={3}
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
