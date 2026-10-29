'use client'

import { TextareaInput } from '@/components'
import type { CustomValue } from '@/lib/types'
import { slotLabel, type CustomSlot } from '@/lib/utils'

interface CustomValueInputProps {
	id: string
	slot: CustomSlot
	value: CustomValue | undefined
	onChange: (value: CustomValue) => void
}

// The input for one custom slot on a placement, chosen by the slot's type, as
// FormInput does for a field. It edits the zone directly, so there is no form.
export const CustomValueInput = ({
	id,
	slot,
	value,
	onChange,
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
		default:
			return (
				<div className='mb-4 text-sm'>
					<div className='font-bold text-gray-700'>{slotLabel(slot)}</div>
					<div className='text-gray-500'>Not editable yet.</div>
				</div>
			)
	}
}
