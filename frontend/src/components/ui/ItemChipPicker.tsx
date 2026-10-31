'use client'

import { useState } from 'react'
import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/20/solid'
import { Chip, TextInput } from '@/components'
import type { PlaceableDef } from '@/hooks'
import { parseNumberInput } from '@/lib/utils'

// Rendering a long list would only slow the box down; typing narrows it.
const MAX_SUGGESTIONS = 50

export interface ItemAmount {
	itemId: string
	// NaN while the amount box is blank, so it never turns into 0 mid-edit.
	amount: number
}

interface ItemChipPickerProps {
	id: string
	label: string
	items: PlaceableDef[] // items only
	isLoading: boolean
	value: ItemAmount[]
	onChange: (next: ItemAmount[]) => void
}

// Picks any number of distinct items: type to find one, it becomes a chip, and
// the chip's X removes it. An item with a maxQuantity's chip carries an amount. It knows
// nothing about conditions or actions, so any "needs these items" field can use
// it.
export const ItemChipPicker = ({
	id,
	label,
	items,
	isLoading,
	value,
	onChange,
}: ItemChipPickerProps) => {
	const [query, setQuery] = useState('')
	const needle = query.trim().toLowerCase()
	const taken = new Set(value.map((v) => v.itemId))
	const matches = items.filter(
		(i) => !taken.has(i._id) && i.name.toLowerCase().includes(needle),
	)

	const setAmount = (itemId: string, raw: string) =>
		onChange(
			value.map((v) =>
				v.itemId === itemId ? { ...v, amount: parseNumberInput(raw) } : v,
			),
		)

	return (
		<div>
			<Combobox<PlaceableDef | null>
				value={null}
				onChange={(item) => {
					if (item) onChange([...value, { itemId: item._id, amount: 1 }])
				}}
				onClose={() => setQuery('')}
			>
				<ComboboxInput
					as={TextInput}
					id={id}
					label={label}
					placeholder={isLoading ? 'Loading...' : 'Type to find an item'}
					disabled={isLoading}
					autoComplete='off'
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setQuery(e.target.value)
					}
				/>
				<ComboboxOptions
					anchor='bottom start'
					className='z-50 max-h-60 w-(--input-width) overflow-auto rounded-md border border-gray-300 bg-white shadow-lg [--anchor-gap:4px]'
				>
					{matches.length === 0 ? (
						<div className='px-4 py-2 text-sm text-gray-500'>
							No matching items
						</div>
					) : (
						<>
							{matches.slice(0, MAX_SUGGESTIONS).map((item) => (
								<ComboboxOption
									key={item._id}
									value={item}
									className='cursor-pointer px-4 py-2 text-gray-700 data-focus:bg-blue-100'
								>
									{item.name}
								</ComboboxOption>
							))}
							{matches.length > MAX_SUGGESTIONS && (
								<div className='px-4 py-2 text-sm text-gray-500'>
									{matches.length - MAX_SUGGESTIONS} more, keep typing to narrow
									it down
								</div>
							)}
						</>
					)}
				</ComboboxOptions>
			</Combobox>

			<div className='mb-4 flex flex-wrap gap-2'>
				{value.length === 0 ? (
					<p className='text-sm text-gray-500'>None selected.</p>
				) : (
					value.map((v) => {
						const item = items.find((i) => i._id === v.itemId)
						const name = isLoading ? '...' : (item?.name ?? '(missing)')
						// An amount other than 1 is always shown, so stored data is
						// never hidden (a def that is gone or still loading).
						const showAmount = item?.maxQuantity !== undefined || v.amount !== 1
						return (
							<Chip key={v.itemId} chipType='primary' className='gap-1'>
								{name}
								{showAmount && (
									<>
										<span className='font-normal'>x</span>
										<input
											type='number'
											min={1}
											step={1}
											aria-label={`Amount of ${name}`}
											className='w-14 rounded border border-blue-200 bg-white px-1 text-sm font-normal'
											value={Number.isNaN(v.amount) ? '' : String(v.amount)}
											onChange={(e) => setAmount(v.itemId, e.target.value)}
										/>
									</>
								)}
								<button
									type='button'
									aria-label={`Remove ${name}`}
									className='ml-1 text-blue-600 hover:text-blue-900 focus:outline-none'
									onClick={() =>
										onChange(value.filter((x) => x.itemId !== v.itemId))
									}
								>
									<XMarkIcon className='h-3 w-3' />
								</button>
							</Chip>
						)
					})
				)}
			</div>
		</div>
	)
}
