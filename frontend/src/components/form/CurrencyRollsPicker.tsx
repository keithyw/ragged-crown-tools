'use client'

import { useState } from 'react'
import {
	Button,
	InputErrorMessage,
	SelectDropdown,
	TextInput,
} from '@/components'
import { CURRENCIES, DICE } from '@/lib/constants'
import type { Currency, Die } from '@/lib/types'
import { parseNumberInput } from '@/lib/utils'

// One currency's inputs as they are being typed: either half may be blank.
interface RollDraft {
	count?: number
	die?: Die
}

type Rolls = Partial<Record<Currency, RollDraft>>

export type CurrencyRollErrors = Partial<
	Record<Currency, { count?: { message?: string }; die?: unknown }>
>

interface CurrencyRollsPickerProps {
	label: string
	value: Rolls
	onChange: (next: Rolls) => void
	errors?: CurrencyRollErrors
}

const nameOf = (c: Currency) => c.charAt(0).toUpperCase() + c.slice(1)

// Dice per currency ([Currency 8]). Choose a currency to edit its roll; the
// ones with a count are listed, and clicking one edits it. A blank count means
// none of that coin (the form schema drops it).
export const CurrencyRollsPicker = ({
	label,
	value,
	onChange,
	errors,
}: CurrencyRollsPickerProps) => {
	const [selected, setSelected] = useState<Currency | ''>('')
	const roll = selected ? value[selected] : undefined
	const filled = CURRENCIES.filter((c) => value[c]?.count !== undefined)
	const set = (currency: Currency, patch: RollDraft) => {
		const next = { ...value }
		const merged = { ...next[currency], ...patch }
		if (merged.count === undefined && merged.die === undefined) {
			delete next[currency]
		} else {
			next[currency] = merged
		}
		onChange(next)
	}

	return (
		<div className='mb-4'>
			<p className='mb-2 block text-sm font-bold text-gray-700'>{label}</p>
			{filled.length > 0 && (
				<div className='mb-2 flex flex-wrap gap-2'>
					{filled.map((c) => (
						<Button
							key={c}
							type='button'
							actionType={selected === c ? 'edit' : 'neutral'}
							onClick={() => setSelected(c)}
						>
							{`${value[c]!.count}d${value[c]!.die ?? '?'} ${c}`}
						</Button>
					))}
				</div>
			)}
			<SelectDropdown
				id='currency-roll-type'
				label='Currency'
				placeholder='Choose a currency'
				options={CURRENCIES.map((c) => ({ value: c, label: nameOf(c) }))}
				selectedValue={selected}
				onSelect={(v) => setSelected((v ?? '') as Currency | '')}
			/>
			{selected && (
				// Keyed so a half-typed number never carries over to another coin.
				<div key={selected} className='flex items-end gap-3'>
					<TextInput
						id={`currency-${selected}-count`}
						label='Number of dice (blank = none)'
						type='number'
						inputWidth='sm'
						min={1}
						step={1}
						value={roll?.count ?? ''}
						onChange={(e) => {
							const n = parseNumberInput(e.target.value)
							// The schema says what is wrong with a 0 or a fraction.
							set(selected, { count: Number.isNaN(n) ? undefined : n })
						}}
					/>
					<SelectDropdown
						id={`currency-${selected}-die`}
						label='Die'
						placeholder='Choose a die'
						options={DICE.map((d) => ({ value: d, label: `d${d}` }))}
						selectedValue={roll?.die ?? ''}
						onSelect={(v) => set(selected, { die: v as Die })}
					/>
					<div className='mb-4'>
						<Button
							type='button'
							actionType='delete'
							disabled={!roll}
							onClick={() =>
								set(selected, { count: undefined, die: undefined })
							}
						>
							Remove
						</Button>
					</div>
				</div>
			)}
			{CURRENCIES.map((c) => {
				const e = errors?.[c]
				if (!e) return null
				return (
					<InputErrorMessage
						key={c}
						errorMessage={`${nameOf(c)}: ${e.die ? 'choose a die' : e.count?.message}`}
					/>
				)
			})}
		</div>
	)
}
