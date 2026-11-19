'use client'

import { useState } from 'react'
import { Control, useController } from 'react-hook-form'
import type { DifficultyConfigFormData } from '@/schemas'

// What a freshly ticked material starts at; the designer edits it.
const STARTING_CHANCE = 10

interface Table {
	default: string
	chances: Record<string, number>
}

interface GroupInfo {
	label: string
	types: readonly string[]
	// Category -> its materials.
	categories: Readonly<Record<string, readonly string[]>>
}

interface MaterialTableEditorProps {
	control: Control<DifficultyConfigFormData>
	kind: 'weapon' | 'armor'
	label: string
	groups: Readonly<Record<string, GroupInfo>>
}

// The material tables of a difficulty configuration for weapons or armor
// ([Tools 25]), one group at a time (an accordion). A group is used when it has
// a table; a group with none isn't dropped by the zone. Within a group a
// material is allowed when it has a chance, and the default is chosen from
// every material of the group, ticked or not, since a zone may make something
// rare its default.
export const MaterialTableEditor = ({
	control,
	kind,
	label,
	groups,
}: MaterialTableEditorProps) => {
	const { field } = useController({ control, name: `materials.${kind}` })
	const tables = field.value as unknown as Record<string, Table | undefined>
	const [open, setOpen] = useState<string | null>(null)

	const setTable = (group: string, table: Table | undefined) => {
		const next = { ...tables }
		if (table) next[group] = table
		else delete next[group]
		field.onChange(next)
	}

	return (
		<fieldset className='rounded border border-gray-300 p-3'>
			<legend className='px-1 text-sm font-bold text-gray-700'>{label}</legend>
			<div className='divide-y divide-gray-200'>
				{Object.entries(groups).map(([group, info]) => {
					const table = tables[group]
					const isOpen = open === group
					const materials = Object.values(info.categories).flat()
					const setAllowed = (these: readonly string[], allowed: boolean) => {
						if (!table) return
						const chances = { ...table.chances }
						for (const m of these) {
							if (!allowed) delete chances[m]
							else if (!(m in chances)) chances[m] = STARTING_CHANCE
						}
						setTable(group, { ...table, chances })
					}
					return (
						<div key={group} className='py-1'>
							<button
								type='button'
								aria-expanded={isOpen}
								onClick={() => setOpen(isOpen ? null : group)}
								className='flex w-full items-center gap-3 py-1 text-left text-sm text-gray-900'
							>
								<span className='w-4'>{isOpen ? '▾' : '▸'}</span>
								<span className='font-bold'>{info.label}</span>
								<span className='text-xs text-gray-700'>
									{table
										? `${Object.keys(table.chances).length} allowed, default ${table.default}`
										: 'not used'}
								</span>
							</button>
							{isOpen && (
								<div className='space-y-3 pt-1 pb-2 pl-7'>
									<p className='text-xs text-gray-700'>
										Applies to: {info.types.join(', ')}
									</p>
									{!table ? (
										<button
											type='button'
											className='rounded border border-gray-400 px-2 py-0.5 text-sm text-gray-900'
											onClick={() =>
												setTable(group, { default: materials[0], chances: {} })
											}
										>
											Use this group
										</button>
									) : (
										<>
											{Object.entries(info.categories).map(
												([category, these]) => (
													<div key={category}>
														<div className='mb-1 flex items-center gap-3 text-xs text-gray-700 uppercase'>
															<span>{category}</span>
															<button
																type='button'
																className='underline'
																onClick={() => setAllowed(these, true)}
															>
																all
															</button>
															<button
																type='button'
																className='underline'
																onClick={() => setAllowed(these, false)}
															>
																none
															</button>
														</div>
														{these.map((m) => {
															const allowed = m in table.chances
															const id = `${kind}-${group}-${m}`
															return (
																<div
																	key={m}
																	className='flex items-center gap-3 py-0.5'
																>
																	<input
																		type='checkbox'
																		id={id}
																		checked={allowed}
																		onChange={(e) =>
																			setAllowed([m], e.target.checked)
																		}
																	/>
																	<label
																		htmlFor={id}
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
																		value={allowed ? table.chances[m] : ''}
																		onChange={(e) =>
																			setTable(group, {
																				...table,
																				chances: {
																					...table.chances,
																					[m]: Math.max(
																						0,
																						Math.trunc(Number(e.target.value)),
																					),
																				},
																			})
																		}
																		className='w-20 rounded border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-900 disabled:bg-gray-100'
																	/>
																	<label className='flex items-center gap-1 text-sm text-gray-800'>
																		<input
																			type='radio'
																			name={`${kind}-${group}-default`}
																			checked={table.default === m}
																			onChange={() =>
																				setTable(group, {
																					...table,
																					default: m,
																				})
																			}
																		/>
																		default
																	</label>
																</div>
															)
														})}
													</div>
												),
											)}
											<button
												type='button'
												className='text-xs text-gray-700 underline'
												onClick={() => setTable(group, undefined)}
											>
												Remove this group
											</button>
										</>
									)}
								</div>
							)}
						</div>
					)
				})}
			</div>
		</fieldset>
	)
}
