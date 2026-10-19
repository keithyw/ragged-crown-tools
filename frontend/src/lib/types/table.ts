import type { ReactNode } from 'react'

export interface TableColumn<T> {
	header: string
	accessor?: keyof T
	render?: (row: T) => ReactNode
	sortable?: boolean
	sortField?: string // defaults to the accessor
}

export type TableRowActionType = 'view' | 'edit' | 'delete' | 'custom'

export interface TableRowAction<T> {
	label: string
	onClick: (row: T) => void
	actionType?: TableRowActionType // for the default icon
	icon?: ReactNode // explicit icon instead
	canDisplay?: (row: T) => boolean
}
