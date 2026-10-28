'use client'

import { useState, type ReactNode } from 'react'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/20/solid'
import { GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReorderableListProps<T> {
	items: T[]
	getKey: (item: T) => string
	renderItem: (item: T, index: number) => ReactNode
	// Gets the whole list in its new order.
	onReorder: (items: T[]) => void
	// The highlighted row. Its arrows move it one place.
	selectedKey: string | null
	onSelect: (key: string) => void
}

// Moves the item at `from` to `to`, shifting the ones in between.
const move = <T,>(list: T[], from: number, to: number) => {
	const next = [...list]
	const [item] = next.splice(from, 1)
	next.splice(to, 0, item)
	return next
}

// A short vertical list reordered by dragging a row's grip, or with the
// selected row's up/down arrows. Uses the browser's native drag and drop, so
// it's meant for a mouse on desktop.
export const ReorderableList = <T,>({
	items,
	getKey,
	renderItem,
	onReorder,
	selectedKey,
	onSelect,
}: ReorderableListProps<T>) => {
	const [dragFrom, setDragFrom] = useState<number | null>(null)
	const [dragOver, setDragOver] = useState<number | null>(null)
	// The row whose grip is held down. Only that row is draggable, so a drag
	// can't start from the rest of the row.
	const [armed, setArmed] = useState<number | null>(null)

	const endDrag = () => {
		setDragFrom(null)
		setDragOver(null)
		setArmed(null)
	}

	return (
		<ol className='space-y-2'>
			{items.map((item, idx) => {
				const key = getKey(item)
				const isSelected = key === selectedKey
				const arrows = [
					{ label: 'Move up', Icon: ChevronUpIcon, to: idx - 1 },
					{ label: 'Move down', Icon: ChevronDownIcon, to: idx + 1 },
				]
				return (
					<li
						key={key}
						draggable={armed === idx}
						onClick={() => onSelect(key)}
						onDragStart={(e) => {
							e.dataTransfer.effectAllowed = 'move'
							// Firefox won't start a drag without some data set.
							e.dataTransfer.setData('text/plain', String(idx))
							setDragFrom(idx)
						}}
						onDragOver={(e) => {
							// Only rows of this list are drop targets.
							if (dragFrom === null) return
							e.preventDefault()
							e.dataTransfer.dropEffect = 'move'
							setDragOver(idx)
						}}
						onDrop={(e) => {
							e.preventDefault()
							if (dragFrom !== null && dragFrom !== idx) {
								onReorder(move(items, dragFrom, idx))
							}
							endDrag()
						}}
						onDragEnd={endDrag}
						className={cn(
							'flex cursor-pointer items-center gap-3 rounded border border-gray-200 bg-white p-2',
							isSelected && 'border-blue-500 bg-blue-50',
							dragFrom === idx && 'opacity-50',
							dragOver === idx && dragFrom !== idx && 'ring-2 ring-blue-500',
						)}
					>
						<span
							title='Drag to reorder'
							onPointerDown={() => setArmed(idx)}
							onPointerUp={() => setArmed(null)}
							className='cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing'
						>
							<GripVertical className='size-5' aria-hidden />
						</span>
						<div className='min-w-0 flex-1'>{renderItem(item, idx)}</div>
						{isSelected && (
							<div className='flex gap-1'>
								{arrows.map(({ label, Icon, to }) => (
									<button
										key={label}
										type='button'
										aria-label={label}
										title={label}
										disabled={to < 0 || to >= items.length}
										onClick={() => onReorder(move(items, idx, to))}
										className='rounded p-1 text-gray-600 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'
									>
										<Icon className='size-5' aria-hidden />
									</button>
								))}
							</div>
						)}
					</li>
				)
			})}
		</ol>
	)
}
