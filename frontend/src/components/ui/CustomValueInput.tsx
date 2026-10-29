'use client'

import { ItemCombobox, TextareaInput, TextInput } from '@/components'
import type { PlaceableDef } from '@/hooks'
import type { CustomValue } from '@/lib/types'
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
			// Only a stackable item has an amount (DATA-MODEL.md 4.3). A stored
			// amount is still shown, so stored data is never hidden.
			const showAmount = item?.stackable || current?.amount !== undefined
			return (
				<div className='mb-4 rounded border border-gray-200 bg-gray-50 p-3'>
					<ItemCombobox
						id={id}
						label={slotLabel(slot)}
						items={items}
						isLoading={itemsLoading}
						selectedId={current?.itemId ?? ''}
						// A non-stackable item is always 1, so its amount is dropped.
						onSelect={(i) =>
							onChange({
								type,
								itemId: i._id,
								amount: i.stackable ? current?.amount : undefined,
							})
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
								onChange({
									type,
									itemId: current?.itemId,
									amount: Number.isInteger(n) && n >= 1 ? n : undefined,
								})
							}}
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
