'use client'

import React from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'
import { RowActionsMenu, SpinnerSection } from '@/components'
import type { TableColumn, TableRowAction } from '@/lib/types'

interface DataTableProps<T> {
	data: T[]
	columns: TableColumn<T>[]
	rowKey: keyof T
	actions?: TableRowAction<T>[]
	emptyMessage?: string

	// pagination (the pager only shows when onPageChange is given)
	currentPage?: number
	pageSize?: number
	totalCount?: number
	onPageChange?: (page: number) => void
	onPageSizeChange?: (size: number) => void
	pageSizes?: number[]
	isLoadingRows?: boolean

	// sorting (headers are only clickable when onSort is given)
	onSort?: (field: string) => void
	currentSortField?: string
	currentSortDirection?: 'asc' | 'desc'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DataTableComponent<T extends Record<string, any>>({
	data,
	columns,
	rowKey,
	actions,
	emptyMessage = 'No data available',

	// pagination props
	currentPage = 1,
	pageSize = 10,
	totalCount = 0,
	onPageChange,
	onPageSizeChange,
	pageSizes = [10, 25, 50, 100],
	isLoadingRows = false,

	// sorting props
	onSort,
	currentSortField,
	currentSortDirection,
}: DataTableProps<T>) {
	const totalColumns = columns.length + (actions && actions.length > 0 ? 1 : 0)
	// At least one page, so an empty table reads "Page 1 of 1".
	const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

	const handlePreviousPage = () => {
		if (onPageChange && currentPage > 1) {
			onPageChange(currentPage - 1)
		}
	}

	const handleNextPage = () => {
		if (onPageChange && currentPage < totalPages) {
			onPageChange(currentPage + 1)
		}
	}

	const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		if (onPageSizeChange) {
			onPageSizeChange(Number(e.target.value))
			void onPageChange?.(1)
		}
	}

	return (
		<div className='shadow-md sm:rounded-lg'>
			{onPageChange && (
				<div className='flex items-center justify-end rounded-t-lg border-b bg-white p-4'>
					<div className='flex items-center space-x-4'>
						<span className='text-sm text-gray-700'>Items per page:</span>
						<select
							value={pageSize}
							onChange={handlePageSizeChange}
							className='block w-20 rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none'
						>
							{pageSizes.map((s) => (
								<option key={s} value={s}>
									{s}
								</option>
							))}
						</select>
						<span className='text-sm text-gray-700'>
							Page {currentPage} of {totalPages}
						</span>
						<button
							onClick={handlePreviousPage}
							disabled={currentPage <= 1}
							className='cursor-pointer rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50'
						>
							Previous
						</button>
						<button
							onClick={handleNextPage}
							disabled={currentPage >= totalPages}
							className='cursor-pointer rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-blue-600 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50'
						>
							Next
						</button>
					</div>
				</div>
			)}
			<table className='w-full text-left text-sm text-gray-500'>
				<thead className='bg-gray-50 text-xs text-gray-700 uppercase'>
					<tr>
						{columns.map((col, idx) => (
							<th
								scope='col'
								className={`px-6 py-3 ${col.sortable ? 'cursor-pointer' : ''}`}
								key={col.header || idx}
								onClick={() => {
									if (col.sortable && (col.sortField || col.accessor)) {
										if (onSort) {
											onSort(col.sortField || (col.accessor as string))
										}
									}
								}}
							>
								{col.sortable && onSort ? (
									<span className='flex items-center gap-1 focus:outline-none'>
										{col.header}
										{currentSortField ===
											(col.sortField ||
												(col.accessor ? String(col.accessor) : '')) &&
											(currentSortDirection === 'asc' ? (
												<ChevronUpIcon className='h-4 w-4 text-gray-500' />
											) : (
												<ChevronDownIcon className='h-4 w-4 text-gray-500' />
											))}
									</span>
								) : (
									col.header
								)}
							</th>
						))}
						{actions && actions.length > 0 && (
							<th scope='col' className='px-6 py-3 text-right'>
								<span>Actions</span>
							</th>
						)}
					</tr>
				</thead>
				<tbody>
					{isLoadingRows ? (
						<tr>
							<td colSpan={totalColumns} className='py-8 text-center'>
								<SpinnerSection spinnerMessage='Loading data...' />
							</td>
						</tr>
					) : data && data.length > 0 ? (
						data.map((row) => (
							<tr
								key={String(row[rowKey])}
								className='border-b bg-white hover:bg-gray-50'
							>
								{columns.map((col, colIndex) => (
									<td
										className='px-6 py-4'
										key={String(row[rowKey]) + '-' + colIndex}
									>
										{col.render
											? col.render(row)
											: col.accessor
												? row[col.accessor as keyof T]
												: null}
									</td>
								))}
								{actions && actions.length > 0 && (
									<td className='px-6 py-4 text-right whitespace-nowrap'>
										<RowActionsMenu actions={actions} row={row} />
									</td>
								)}
							</tr>
						))
					) : (
						<tr>
							<td
								colSpan={totalColumns}
								className='bg-white py-8 text-center text-gray-500'
							>
								{emptyMessage}
							</td>
						</tr>
					)}
				</tbody>
			</table>
		</div>
	)
}

export const DataTable = React.memo(
	DataTableComponent,
) as typeof DataTableComponent
