'use client'

import {
	ItemCombobox,
	QualifierPicker,
	TextareaInput,
	TextInput,
} from '@/components'
import type { PlaceableDef } from '@/hooks'
import type { CustomValue, Qualifiers } from '@/lib/types'
import { parseNumberInput, slotLabel, type CustomSlot } from '@/lib/utils'

interface CustomValueInputProps {
	id: string
	slot: CustomSlot
	value: CustomValue | undefined
	onChange: (value: CustomValue) => void
	items: PlaceableDef[] // for item slots
	itemsLoading: boolean
}

// The input for one custom slot on a placement, chosen by the slot's type, as
// FormInput does for a field. It edits the zone directly, so there is no form.
export const CustomValueInput = ({
	id,
	slot,
	value,
	onChange,
	items,
	itemsLoading,
}: CustomValueInputProps) => {
	switch (slot.type) {
		case 'SHOW_DIALOG':
			return (
				<TextareaInput
					id={id}
					label={slotLabel(slot)}
					rows={3}
					placeholder='Blank for now is fine; it is saved as is.'
					value={value?.type === 'SHOW_DIALOG' ? (value.text ?? '') : ''}
					// An emptied box stores no text, not ''.
					onChange={(e) =>
						onChange({ type: 'SHOW_DIALOG', text: e.target.value || undefined })
					}
				/>
			)
		case 'GIVE_ITEM':
		case 'TAKE_ITEM':
		case 'HAS_ITEM': {
			const type = slot.type
			const current = value?.type === type ? value : undefined
			const item = items.find((i) => i._id === current?.itemId)
			// Only a given item can carry qualifiers; they stay through an amount
			// change and go when the item changes ([Inventory 30]).
			const currentQualifiers =
				current?.type === 'GIVE_ITEM' ? current.qualifiers : undefined
			const withQualifiers = (
				next: { itemId?: string; amount?: number },
				qualifiers: Qualifiers | undefined,
			): CustomValue =>
				type === 'GIVE_ITEM'
					? { type, ...next, ...(qualifiers && { qualifiers }) }
					: { type, ...next }
			// Only an item with a maxQuantity has an amount (DATA-MODEL.md 4.3). A stored
			// amount is still shown, so stored data is never hidden.
			const showAmount =
				item?.maxQuantity !== undefined || current?.amount !== undefined
			return (
				<div className='mb-4 rounded border border-gray-200 bg-gray-50 p-3'>
					<ItemCombobox
						id={id}
						label={slotLabel(slot)}
						items={items}
						isLoading={itemsLoading}
						selectedId={current?.itemId ?? ''}
						// A single-quantity item is always 1, so its amount is dropped.
						onSelect={(i) =>
							onChange(
								withQualifiers(
									{
										itemId: i._id,
										amount:
											i.maxQuantity !== undefined ? current?.amount : undefined,
									},
									undefined,
								),
							)
						}
					/>
					{showAmount && (
						<TextInput
							id={`${id}-amount`}
							label='Amount (blank = 1)'
							type='number'
							inputWidth='sm'
							min={1}
							step={1}
							value={current?.amount ?? ''}
							onChange={(e) => {
								const n = parseNumberInput(e.target.value)
								// Anything but a whole number of 1 or more is left blank, so
								// the zone can always be saved.
								onChange(
									withQualifiers(
										{
											itemId: current?.itemId,
											amount: Number.isInteger(n) && n >= 1 ? n : undefined,
										},
										currentQualifiers,
									),
								)
							}}
						/>
					)}
					{type === 'GIVE_ITEM' && (
						<QualifierPicker
							id={`${id}-qualifiers`}
							def={item}
							value={currentQualifiers}
							onChange={(q) =>
								onChange(
									withQualifiers(
										{ itemId: current?.itemId, amount: current?.amount },
										q,
									),
								)
							}
						/>
					)}
				</div>
			)
		}
		default:
			return (
				<div className='mb-4 text-sm'>
					<div className='font-bold text-gray-700'>{slotLabel(slot)}</div>
					<div className='text-gray-500'>Not editable yet.</div>
				</div>
			)
	}
}
