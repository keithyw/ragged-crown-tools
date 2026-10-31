'use client'

import { useRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { DialogTitle } from '@headlessui/react'
import { BaseModal } from '@/components'
import { cn } from '@/lib/utils'

const confirmButtonVariants = cva(
	'focus:outline-non inline-flex justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm focus:ring-2 focus:ring-offset-2',
	{
		variants: {
			isDeleting: {
				false: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
				true: 'bg-red-400 cursor-not-allowed',
			},
			defaultVariants: {
				isDeleting: false,
			},
		},
	},
)

const cancelButtonVariants = cva(
	'just-center inline-flex rounded-md border border-transparent px-4 py-2 text-sm font-medium',
	{
		variants: {
			isDeleting: {
				false:
					'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
				true: 'bg-gray-300 text-gray-500 cursor-not-allowed',
			},
			defaultVariants: {
				isDeleting: false,
			},
		},
	},
)

interface ConfirmationModalProps
	extends
		VariantProps<typeof confirmButtonVariants>,
		VariantProps<typeof cancelButtonVariants> {
	isOpen: boolean
	title: string
	message: string
	confirmButtonText?: string
	cancelButtonText?: string
	// Shown in red under the message. With confirmDisabled it explains why.
	warning?: string | null
	confirmDisabled?: boolean
	onClose: () => void
	onConfirm: () => void
}

export const ConfirmationModal = ({
	isOpen,
	title,
	message,
	isDeleting,
	confirmButtonText = 'Confirm',
	cancelButtonText = 'Cancel',
	warning,
	confirmDisabled = false,
	onClose,
	onConfirm,
}: ConfirmationModalProps) => {
	const confirmButtonRef = useRef<HTMLButtonElement>(null)

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			initialFocusRef={confirmButtonRef}
		>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				{title}
			</DialogTitle>
			<div className='mt-2'>
				<p className='text-sm text-gray-500'>{message}</p>
				{warning && (
					<p className='mt-2 text-sm font-medium text-red-600'>{warning}</p>
				)}
			</div>
			<div className='mt-4 flex justify-end space-x-3'>
				<button
					type='button'
					className={cn(
						confirmButtonVariants({ isDeleting }),
						'disabled:cursor-not-allowed disabled:opacity-50',
					)}
					disabled={confirmDisabled}
					onClick={onConfirm}
					ref={confirmButtonRef}
				>
					{confirmButtonText}
				</button>
				<button
					type='button'
					className={cn(cancelButtonVariants({ isDeleting }))}
					onClick={onClose}
				>
					{cancelButtonText}
				</button>
			</div>
		</BaseModal>
	)
}
