'use client'

import { useState } from 'react'
import {
	Button,
	ItemCombobox,
	QualifierPicker,
	SelectDropdown,
	TextInput,
} from '@/components'
import type { PlaceableDef } from '@/hooks'
import type { GiveEntry } from '@/lib/types'
import { parseNumberInput, RECEIVERS, summarizeGive } from '@/lib/utils'

interface GiveItemListProps {
	id: string
	entries: GiveEntry[]
	onChange: (next: GiveEntry[]) => void
	items: PlaceableDef[] // items, weapons and armor
	itemsLoading: boolean
}

// The items of one give ([Interactions 18]), for the interaction editor and the
// stack drawer: a list, and one form for the chosen entry. With none chosen the
// form adds an item. Edits go straight to the list.
export const GiveItemList = ({
	id,
	entries,
	onChange,
	items,
	itemsLoading,
}: GiveItemListProps) => {
	const [selected, setSelected] = useState<number | null>(null)
	const entry = selected === null ? undefined : entries[selected]
	const item = items.find((i) => i._id === entry?.itemId)

	// Every entry saved from here has a uid, which its give limit is counted by.
	const save = (next: GiveEntry[]) =>
		onChange(next.map((e) => (e.uid ? e : { ...e, uid: crypto.randomUUID() })))

	// A property set to undefined is removed, so it isn't stored.
	const edit = (patch: Partial<GiveEntry>) => {
		if (!entry) return
		const merged: Record<string, unknown> = { ...entry, ...patch }
		for (const key of Object.keys(merged)) {
			if (merged[key] === undefined) delete merged[key]
		}
		save(
			entries.map((e, i) =>
				i === selected ? (merged as unknown as GiveEntry) : e,
			),
		)
	}

	// A typed number is kept only when it is a whole number in range.
	const whole = (raw: string, min: number, max = Infinity) => {
		const n = parseNumberInput(raw)
		return Number.isInteger(n) && n >= min && n <= max ? n : undefined
	}

	const names = {
		defName: (_kind: string, itemId: string) =>
			items.find((i) => i._id === itemId)?.name ??
			(itemsLoading ? '...' : '(missing)'),
	}

	return (
		<div>
			{entries.length === 0 ? (
				<p className='mb-2 text-sm text-gray-500'>No items yet.</p>
			) : (
				<div className='mb-2 flex flex-wrap gap-2'>
					{entries.map((e, i) => (
						<Button
							key={e.uid ?? i}
							type='button'
							actionType={selected === i ? 'edit' : 'neutral'}
							onClick={() => setSelected(i)}
						>
							{summarizeGive(e, names)}
						</Button>
					))}
				</div>
			)}
			{entry ? (
				// Keyed so a half-typed search never carries over to another entry.
				<div key={entry.uid ?? selected}>
					<ItemCombobox
						id={`${id}-item`}
						label='Item'
						items={items}
						isLoading={itemsLoading}
						selectedId={entry.itemId}
						// Qualifiers belong to the item they were set for, and a
						// single-quantity item has no amount.
						onSelect={(i) =>
							edit({
								itemId: i._id,
								amount: i.maxQuantity !== undefined ? entry.amount : undefined,
								qualifiers: undefined,
							})
						}
					/>
					{/* Only an item with a maxQuantity has an amount (DATA-MODEL.md
					4.3). A stored one is still shown. */}
					{(item?.maxQuantity !== undefined || entry.amount !== undefined) && (
						<TextInput
							id={`${id}-amount`}
							label='Amount (blank = 1)'
							type='number'
							inputWidth='sm'
							min={1}
							step={1}
							value={entry.amount ?? ''}
							onChange={(e) => edit({ amount: whole(e.target.value, 1) })}
						/>
					)}
					<QualifierPicker
						id={`${id}-qualifiers`}
						def={item}
						value={entry.qualifiers}
						onChange={(qualifiers) => edit({ qualifiers })}
					/>
					<TextInput
						id={`${id}-chance`}
						label='Chance % (blank = always)'
						type='number'
						inputWidth='sm'
						min={0}
						max={100}
						step={1}
						value={entry.chance ?? ''}
						onChange={(e) => edit({ chance: whole(e.target.value, 0, 100) })}
					/>
					<TextInput
						id={`${id}-give-limit`}
						label='Times it can give (blank = unlimited)'
						type='number'
						inputWidth='sm'
						min={1}
						step={1}
						value={entry.giveLimit ?? ''}
						onChange={(e) => edit({ giveLimit: whole(e.target.value, 1) })}
					/>
					<SelectDropdown
						id={`${id}-target`}
						label='Who receives'
						options={RECEIVERS}
						selectedValue={entry.target ?? 'character'}
						// 'character' is what absent means, so it isn't stored.
						onSelect={(v) =>
							edit({ target: v === 'party' ? 'party' : undefined })
						}
					/>
					<div className='mb-4 flex gap-2'>
						<Button
							type='button'
							actionType='neutral'
							onClick={() => setSelected(null)}
						>
							Add another item
						</Button>
						<Button
							type='button'
							actionType='delete'
							onClick={() => {
								save(entries.filter((_, i) => i !== selected))
								setSelected(null)
							}}
						>
							Remove item
						</Button>
					</div>
				</div>
			) : (
				<ItemCombobox
					key={`new-${entries.length}`}
					id={`${id}-new`}
					label='Add an item'
					items={items}
					isLoading={itemsLoading}
					selectedId=''
					onSelect={(i) => {
						save([...entries, { itemId: i._id }])
						setSelected(entries.length)
					}}
				/>
			)}
		</div>
	)
}
