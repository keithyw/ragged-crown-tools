'use client'

import { useState } from 'react'
import {
	Combobox,
	ComboboxInput,
	ComboboxOption,
	ComboboxOptions,
} from '@headlessui/react'
import { SelectDropdown, TextInput } from '@/components'
import type { PlaceableDef } from '@/hooks'

// Rendering a long list would only slow the box down; typing narrows it.
const MAX_SUGGESTIONS = 50

const KIND_OPTIONS = [
	{ value: 'all', label: 'All' },
	{ value: 'item', label: 'Items' },
	{ value: 'weapon', label: 'Weapons' },
	{ value: 'armor', label: 'Armor' },
]

interface ItemComboboxProps {
	id: string
	label: string
	items: PlaceableDef[] // items, weapons and armor
	isLoading: boolean
	// The chosen item's _id, or '' for none.
	selectedId: string
	onSelect: (item: PlaceableDef) => void
}

// Picks one item by typing part of its name. Items are filtered in memory, and
// the list only opens once the user types.
export const ItemCombobox = ({
	id,
	label,
	items,
	isLoading,
	selectedId,
	onSelect,
}: ItemComboboxProps) => {
	const [query, setQuery] = useState('')
	const needle = query.trim().toLowerCase()
	const [kind, setKind] = useState('all')
	const matches = items.filter(
		(i) =>
			(kind === 'all' || i.kind === kind) &&
			i.name.toLowerCase().includes(needle),
	)
	const selected = items.find((i) => i._id === selectedId) ?? null

	return (
		<>
			<SelectDropdown
				id={`${id}-kind`}
				label={`${label}: type`}
				options={KIND_OPTIONS}
				selectedValue={kind}
				onSelect={(v) => setKind(String(v ?? 'all'))}
				placeholder='All'
			/>
			<Combobox<PlaceableDef | null>
				value={selected}
				onChange={(item) => item && onSelect(item)}
				onClose={() => setQuery('')}
			>
				<ComboboxInput
					as={TextInput}
					id={id}
					label={label}
					placeholder={
						isLoading
							? 'Loading...'
							: selectedId && !selected
								? '(missing) Type to choose another item'
								: 'Type to find an item'
					}
					disabled={isLoading}
					autoComplete='off'
					displayValue={(item: PlaceableDef | null) => item?.name ?? ''}
					onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
						setQuery(e.target.value)
					}
					onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
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
		</>
	)
}
