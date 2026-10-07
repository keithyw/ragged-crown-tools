import React, { forwardRef } from 'react'
import { Select } from '@headlessui/react'
import { OptionType } from '@/lib/types'

interface SelectDropdownProps {
	id?: string
	name?: string
	label: string
	options: OptionType[]
	selectedValue: number | string | null
	onBlur?: React.FocusEventHandler<HTMLSelectElement>
	onSelect: (value: number | string | null) => void
	disabled?: boolean
	placeholder?: string
}

export const SelectDropdown = forwardRef<
	HTMLSelectElement,
	SelectDropdownProps
>(
	(
		{
			id,
			name,
			label,
			options,
			selectedValue,
			onBlur,
			onSelect,
			disabled = false,
			placeholder = 'Select an option',
		},
		ref,
	) => {
		const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
			const v = event.target.value
			let newVal: number | string | null
			if (v === '') {
				newVal = null
			} else if (options.length > 0 && typeof options[0].value === 'number') {
				newVal = parseInt(v)
				if (isNaN(newVal)) {
					newVal = null
				}
			} else {
				newVal = v
			}
			onSelect(newVal)
		}

		return (
			<div className='mb-4'>
				<label
					htmlFor={id}
					className='mb-2 block text-sm font-bold text-gray-700'
				>
					{label}
				</label>
				<div className='relative'>
					<Select
						id={id}
						name={name}
						value={
							selectedValue !== null && selectedValue !== undefined
								? selectedValue
								: ''
						}
						onChange={handleChange}
						onBlur={onBlur}
						ref={ref}
						disabled={disabled}
						className='roudned-md block w-full border-gray-300 py-2 pr-10 pl-3 text-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-500 sm:text-sm'
					>
						<option value='' disabled>
							{placeholder}
						</option>
						{options.length === 0 ? (
							<option value='' disabled>
								No options available
							</option>
						) : (
							options.map((o) => (
								<option key={o.value} value={o.value}>
									{o.label}
								</option>
							))
						)}
					</Select>
				</div>
			</div>
		)
	},
)

SelectDropdown.displayName = 'SelectDropdown'
