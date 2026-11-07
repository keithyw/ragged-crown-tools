import type { ReactNode } from 'react'

export interface TableColumn<T> {
	// Usually text; a node lets the header hold a control (a select-all box).
	header: ReactNode
	accessor?: keyof T
	render?: (row: T) => ReactNode
	sortable?: boolean
	sortField?: string // defaults to the accessor
	// Clicks in this column's cells don't reach the table's onRowClick.
	stopRowClick?: boolean
}

export type TableRowActionType = 'view' | 'edit' | 'delete' | 'custom'

export interface TableRowAction<T> {
	label: string
	onClick: (row: T) => void
	actionType?: TableRowActionType // for the default icon
	icon?: ReactNode // explicit icon instead
	canDisplay?: (row: T) => boolean
}
