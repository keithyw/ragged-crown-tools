'use client'

import React, { Fragment } from 'react'
import {
	Menu,
	MenuButton,
	MenuItem,
	MenuItems,
	Transition,
} from '@headlessui/react'
import {
	Bars3Icon,
	EyeIcon,
	PencilIcon,
	TrashIcon,
} from '@heroicons/react/24/outline'
import type { TableRowAction, TableRowActionType } from '@/lib/types'

const ICON_MAP: Record<TableRowActionType, React.ReactNode> = {
	view: <EyeIcon className='mr-2 h-5 w-5' />,
	edit: <PencilIcon className='mr-2 h-5 w-5' />,
	delete: <TrashIcon className='mr-2 h-5 w-5 text-red-500' />,
	custom: null,
}

export function RowActionsMenu<T>({
	actions,
	row,
}: {
	actions: TableRowAction<T>[]
	row: T
}) {
	const [openUpwards, setOpenUpwards] = React.useState(false)
	const buttonRef = React.useRef<HTMLButtonElement>(null)

	// Near the bottom of the window, open the menu upwards so it isn't cut off.
	const handleOpen = () => {
		if (buttonRef.current) {
			const rect = buttonRef.current.getBoundingClientRect()
			const spaceBelow = window.innerHeight - rect.bottom
			const menuHeight = 240
			setOpenUpwards(spaceBelow < menuHeight)
		}
	}

	const visibleActions = actions.filter(
		(action) => !action.canDisplay || action.canDisplay(row),
	)

	if (visibleActions.length === 0) return null

	return (
		<Menu as='div' className='relative inline-block text-left'>
			<MenuButton
				ref={buttonRef}
				onClick={handleOpen}
				className='cursor-pointer rounded p-2 hover:bg-gray-100'
			>
				<Bars3Icon className='h-5 w-5' aria-hidden='true' />
				<span className='sr-only'>Open actions menu</span>
			</MenuButton>
			<Transition
				as={Fragment}
				enter='transition ease-out duration-100'
				enterFrom='transform opacity-0 scale-95'
				enterTo='transform opacity-100 scale-100'
				leave='transition ease-in duration-75'
				leaveFrom='transform opacity-100 scale-100'
				leaveTo='transform opacity-0 scale-95'
			>
				<MenuItems
					className={`absolute right-0 z-50 max-h-60 w-44 origin-top-right overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none ${openUpwards ? 'bottom-full mb-2' : 'mt-2'}`}
				>
					{visibleActions.map((action, idx) => (
						<MenuItem
							key={idx}
							as='button'
							className='flex w-full cursor-pointer items-center px-4 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-100 focus:outline-none data-focus:bg-gray-100'
							onClick={() => action.onClick(row)}
						>
							{action.icon ||
								(action.actionType && ICON_MAP[action.actionType])}
							{action.label}
						</MenuItem>
					))}
				</MenuItems>
			</Transition>
		</Menu>
	)
}
