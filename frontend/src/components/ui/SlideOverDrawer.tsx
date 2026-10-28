'use client'

import { Fragment, type ReactNode } from 'react'
import {
	Dialog,
	DialogPanel,
	DialogTitle,
	Transition,
	TransitionChild,
} from '@headlessui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Button } from '@/components'

// The panel's width. It sits against the window's right edge, so a wider
// panel reaches further over the page.
const panelVariants = cva('pointer-events-auto w-screen', {
	variants: {
		size: {
			sm: 'max-w-sm', // 24rem
			md: 'max-w-lg', // 32rem
			lg: 'max-w-3xl', // 48rem
		},
	},
	defaultVariants: {
		size: 'md',
	},
})

interface SlideOverDrawerProps extends VariantProps<typeof panelVariants> {
	title: string
	isOpen: boolean
	onClose: () => void
	children: ReactNode
	additionalButtons?: ReactNode
}

// Ported from pitch-in (shared/components/ui/SlideOverDrawer.tsx).
export const SlideOverDrawer = ({
	title,
	isOpen,
	onClose,
	children,
	additionalButtons,
	size,
}: SlideOverDrawerProps) => {
	return (
		<Transition as={Fragment} show={isOpen}>
			<Dialog as='div' className='relative z-50' onClose={onClose}>
				<TransitionChild
					as={Fragment}
					enter='ease-in-out duration-500'
					enterFrom='opacity-0'
					enterTo='opacity-100'
					leave='ease-in-out duration-500'
					leaveFrom='opacity-100'
					leaveTo='opacity-0'
				>
					{/* Light, so what's behind (the map) stays readable. */}
					<div className='fixed inset-0 bg-gray-500/25 transition-opacity' />
				</TransitionChild>
				<div className='fixed inset-0 overflow-hidden'>
					<div className='absolute inset-0 overflow-hidden'>
						<div className='pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10'>
							<TransitionChild
								as={Fragment}
								enter='transform transition ease-in-out duration-500 sm:duration-700'
								enterFrom='translate-x-full'
								enterTo='translate-x-0'
								leave='transform transition ease-in-out duration-500 sm:duration-700'
								leaveFrom='translate-x-0'
								leaveTo='translate-x-full'
							>
								<DialogPanel className={panelVariants({ size })}>
									<div className='flex h-full flex-col overflow-y-scroll bg-white shadow-xl'>
										<div className='px-4 py-6 sm:px-6'>
											<DialogTitle className='text-lg font-semibold text-gray-900'>
												{title}
											</DialogTitle>
										</div>
										<div className='flex-1 px-4 py-6 sm:px-6'>{children}</div>
										<div className='ml-3 flex h-7 items-center justify-end pr-4 pb-10'>
											<Button
												actionType='neutral'
												type='button'
												onClick={onClose}
											>
												Close
											</Button>
											{additionalButtons}
										</div>
									</div>
								</DialogPanel>
							</TransitionChild>
						</div>
					</div>
				</div>
			</Dialog>
		</Transition>
	)
}
