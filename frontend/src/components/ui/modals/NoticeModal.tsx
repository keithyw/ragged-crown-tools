'use client'

import { DialogTitle } from '@headlessui/react'
import { BaseModal, Button } from '@/components'

interface NoticeModalProps {
	isOpen: boolean
	title: string
	message: string
	onClose: () => void
}

// A message that has to be dismissed, for things the designer shouldn't miss.
export const NoticeModal = ({
	isOpen,
	title,
	message,
	onClose,
}: NoticeModalProps) => {
	return (
		<BaseModal isOpen={isOpen} onClose={onClose}>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				{title}
			</DialogTitle>
			<p className='mt-2 text-sm text-gray-500'>{message}</p>
			<div className='mt-4 flex justify-end'>
				<Button type='button' actionType='submit' onClick={onClose}>
					OK
				</Button>
			</div>
		</BaseModal>
	)
}
