'use client'

import {
	Button,
	CheckboxInput,
	ItemCombobox,
	QualifierPicker,
	SelectDropdown,
	TextareaInput,
	TextInput,
} from '@/components'
import type { PlaceableDef } from '@/hooks'
import type { StoredDoc } from '@/lib/services'
import type {
	CustomValue,
	EncounterGroup,
	Kind,
	MonsterDef,
	Qualifiers,
} from '@/lib/types'
import {
	defKey,
	parseNumberInput,
	slotLabel,
	type CustomSlot,
} from '@/lib/utils'

interface CustomValueInputProps {
	id: string
	slot: CustomSlot
	value: CustomValue | undefined
	onChange: (value: CustomValue) => void
	items: PlaceableDef[] // for item slots
	spawnChoices: PlaceableDef[] // for SPAWN slots
	monsters: StoredDoc<MonsterDef>[] // for SPAWN_MONSTER slots
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
	spawnChoices,
	monsters,
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
		case 'SPAWN': {
			const current = value?.type === 'SPAWN' ? value : undefined
			const def = spawnChoices.find(
				(d) => d.kind === current?.defKind && d._id === current?.defId,
			)
			const make = (
				next: { defKind?: Kind; defId?: string; quantity?: number },
				qualifiers: Qualifiers | undefined,
			): CustomValue => ({
				type: 'SPAWN',
				...next,
				...(qualifiers && { qualifiers }),
			})
			// The quantity only matters for an item that piles; a stored one is still
			// shown.
			const showQuantity =
				def?.maxQuantity !== undefined || current?.quantity !== undefined
			return (
				<div className='mb-4 rounded border border-gray-200 bg-gray-50 p-3'>
					<SelectDropdown
						id={id}
						label={slotLabel(slot)}
						placeholder={itemsLoading ? 'Loading...' : 'Choose...'}
						disabled={itemsLoading}
						options={spawnChoices.map((d) => ({
							value: defKey(d.kind, d._id),
							label: `${d.kind}: ${d.name}`,
						}))}
						selectedValue={def ? defKey(def.kind, def._id) : ''}
						// A different def drops the qualifiers, which belong to the old one.
						onSelect={(v) => {
							const next = spawnChoices.find((d) => defKey(d.kind, d._id) === v)
							if (!next) return
							onChange(
								make(
									{
										defKind: next.kind,
										defId: next._id,
										quantity:
											next.maxQuantity !== undefined
												? current?.quantity
												: undefined,
									},
									undefined,
								),
							)
						}}
					/>
					{showQuantity && (
						<TextInput
							id={`${id}-quantity`}
							label='Quantity (blank = 1)'
							type='number'
							inputWidth='sm'
							min={1}
							step={1}
							value={current?.quantity ?? ''}
							onChange={(e) => {
								const n = parseNumberInput(e.target.value)
								onChange(
									make(
										{
											defKind: current?.defKind,
											defId: current?.defId,
											quantity: Number.isInteger(n) && n >= 1 ? n : undefined,
										},
										current?.qualifiers,
									),
								)
							}}
						/>
					)}
					<QualifierPicker
						id={`${id}-qualifiers`}
						def={def}
						value={current?.qualifiers}
						onChange={(q) =>
							onChange(
								make(
									{
										defKind: current?.defKind,
										defId: current?.defId,
										quantity: current?.quantity,
									},
									q,
								),
							)
						}
					/>
				</div>
			)
		}
		case 'SPAWN_MONSTER': {
			const current = value?.type === 'SPAWN_MONSTER' ? value : undefined
			const groups = current?.groups ?? []
			// An empty list, an unset "show as" and a false checkbox are not stored.
			const make = (next: {
				groups?: EncounterGroup[]
				showAs?: number
				hideSprite?: boolean
			}): CustomValue => ({
				type: 'SPAWN_MONSTER',
				...(next.groups?.length && { groups: next.groups }),
				...(next.groups?.length &&
					next.showAs !== undefined && { showAs: next.showAs }),
				...(next.hideSprite && { hideSprite: true }),
			})
			const nameOf = (defId: string) =>
				monsters.find((m) => m._id === defId)?.name ?? '(missing)'
			const setGroups = (next: EncounterGroup[], showAs = current?.showAs) =>
				onChange(
					make({
						groups: next,
						showAs:
							showAs !== undefined && showAs < next.length ? showAs : undefined,
						hideSprite: current?.hideSprite,
					}),
				)
			return (
				<div className='mb-4 rounded border border-gray-200 bg-gray-50 p-3'>
					<div className='mb-2 font-bold text-gray-700'>{slotLabel(slot)}</div>
					{groups.length === 0 && (
						<p className='mb-2 text-sm text-gray-500'>
							No monsters yet. A blank encounter is saved as is.
						</p>
					)}
					{groups.map((g, idx) => (
						<div key={idx} className='mb-2 flex items-end gap-2'>
							<SelectDropdown
								id={`${id}-group-${idx}`}
								label={`Group ${idx + 1}`}
								placeholder={
									itemsLoading ? 'Loading...' : 'Choose a monster...'
								}
								disabled={itemsLoading}
								options={monsters.map((m) => ({
									value: m._id,
									label: m.name,
								}))}
								selectedValue={g.defId}
								onSelect={(v) =>
									setGroups(
										groups.map((x, j) =>
											j === idx ? { defId: String(v), count: x.count } : x,
										),
									)
								}
							/>
							<TextInput
								id={`${id}-group-${idx}-count`}
								label='Count (blank = roll)'
								type='number'
								inputWidth='sm'
								min={1}
								step={1}
								value={g.count ?? ''}
								onChange={(e) => {
									const n = parseNumberInput(e.target.value)
									setGroups(
										groups.map((x, j) =>
											j === idx
												? {
														defId: x.defId,
														...(Number.isInteger(n) && n >= 1 && { count: n }),
													}
												: x,
										),
									)
								}}
							/>
							<Button
								actionType='delete'
								onClick={() => {
									const showAs = current?.showAs
									setGroups(
										groups.filter((_, j) => j !== idx),
										showAs === undefined || showAs === idx
											? undefined
											: showAs > idx
												? showAs - 1
												: showAs,
									)
								}}
							>
								Remove
							</Button>
						</div>
					))}
					<Button
						actionType='neutral'
						onClick={() => setGroups([...groups, { defId: '' }])}
					>
						Add group
					</Button>
					{groups.length > 0 && (
						<SelectDropdown
							id={`${id}-show-as`}
							label='Show as (whose sprite the barrier shows)'
							placeholder='The barrier keeps its own look'
							options={groups.map((g, idx) => ({
								value: String(idx),
								label: `Group ${idx + 1}: ${g.defId ? nameOf(g.defId) : '(none)'}`,
							}))}
							selectedValue={
								current?.showAs !== undefined ? String(current.showAs) : ''
							}
							onSelect={(v) =>
								setGroups(groups, v === '' ? undefined : Number(v))
							}
						/>
					)}
					<CheckboxInput
						id={`${id}-hide`}
						label='Hide the sprite (a surprise encounter)'
						checked={!!current?.hideSprite}
						onChange={(e) =>
							onChange(
								make({
									groups: current?.groups,
									showAs: current?.showAs,
									hideSprite: e.target.checked,
								}),
							)
						}
					/>
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
