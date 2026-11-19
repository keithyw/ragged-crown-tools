'use client'

import { Control, useController } from 'react-hook-form'
import type { DifficultyConfigFormData } from '@/schemas'

// What a freshly ticked material starts at; the designer edits it.
const STARTING_CHANCE = 10

interface Table {
	default: string
	chances: Record<string, number>
}

interface MaterialTableEditorProps {
	control: Control<DifficultyConfigFormData>
	table: 'weapon' | 'armor'
	label: string
	// Category -> its materials (WEAPON_MATERIALS / ARMOR_MATERIALS).
	categories: Readonly<Record<string, readonly string[]>>
}

// One material table of a difficulty configuration ([Tools 25]). A material is
// allowed when it has a chance; the default is chosen from every material of
// the list, ticked or not, since a zone may make something rare its default.
export const MaterialTableEditor = ({
	control,
	table,
	label,
	categories,
}: MaterialTableEditorProps) => {
	const { field } = useController({ control, name: `materials.${table}` })
	const value = field.value as unknown as Table

	const update = (next: Partial<Table>) => field.onChange({ ...value, ...next })

	const setAllowed = (materials: readonly string[], allowed: boolean) => {
		const chances = { ...value.chances }
		for (const m of materials) {
			if (!allowed) delete chances[m]
			else if (!(m in chances)) chances[m] = STARTING_CHANCE
		}
		update({ chances })
	}

	return (
		<fieldset className='rounded border border-gray-300 p-3'>
			<legend className='px-1 text-sm font-bold text-gray-700'>{label}</legend>
			<div className='space-y-3'>
				{Object.entries(categories).map(([category, materials]) => (
					<div key={category}>
						<div className='mb-1 flex items-center gap-3 text-xs text-gray-700 uppercase'>
							<span>{category}</span>
							<button
								type='button'
								className='underline'
								onClick={() => setAllowed(materials, true)}
							>
								all
							</button>
							<button
								type='button'
								className='underline'
								onClick={() => setAllowed(materials, false)}
							>
								none
							</button>
						</div>
						{materials.map((m) => {
							const allowed = m in value.chances
							return (
								<div key={m} className='flex items-center gap-3 py-0.5'>
									<input
										type='checkbox'
										id={`${table}-${m}`}
										checked={allowed}
										onChange={(e) => setAllowed([m], e.target.checked)}
									/>
									<label
										htmlFor={`${table}-${m}`}
										className='w-28 text-sm text-gray-900'
									>
										{m}
									</label>
									<input
										type='number'
										min={0}
										step={1}
										aria-label={`${m} chance`}
										disabled={!allowed}
										value={allowed ? value.chances[m] : ''}
										onChange={(e) =>
											update({
												chances: {
													...value.chances,
													[m]: Math.max(0, Math.trunc(Number(e.target.value))),
												},
											})
										}
										className='w-20 rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-900 disabled:bg-gray-100'
									/>
									<label className='flex items-center gap-1 text-sm text-gray-800'>
										<input
											type='radio'
											name={`${table}-default`}
											checked={value.default === m}
											onChange={() => update({ default: m })}
										/>
										default
									</label>
								</div>
							)
						})}
					</div>
				))}
			</div>
		</fieldset>
	)
}
