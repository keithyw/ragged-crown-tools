'use client'

import { useState } from 'react'
import { DialogTitle } from '@headlessui/react'
import {
	BaseModal,
	Button,
	CheckboxInput,
	ItemCombobox,
	SelectDropdown,
	TextareaInput,
	TextInput,
} from '@/components'
import type { PlaceableDef } from '@/hooks'
import type {
	Action,
	Condition,
	Interaction,
	InteractionType,
	Kind,
} from '@/lib/types'
import {
	ACTION_TYPES,
	CONDITION_TYPES,
	INTERACTION_TRIGGERS,
	parseNumberInput,
	summarizeCondition,
	type ActionField,
	type ActionTypeConfig,
} from '@/lib/utils'
import { interactionSchema } from '@/schemas'

const KIND_LABELS: Partial<Record<Kind, string>> = {
	item: 'Item',
	object: 'Object',
}

// One select value for a def: its kind and _id together.
const defKey = (kind: Kind, id: string) => `${kind}:${id}`

// The editor's own wording for a zod problem.
const issueText = (issue: { path: PropertyKey[]; message: string }) => {
	if (issue.path[0] === 'conditions' && typeof issue.path[1] === 'number') {
		const n = issue.path[1] + 1
		return issue.path[2] === 'itemId'
			? `Condition ${n}: choose an item`
			: `Condition ${n}: enter an amount of 1 or more`
	}
	if (
		issue.path[0] === 'actions' &&
		typeof issue.path[1] === 'number' &&
		issue.path[2] === 'itemId'
	) {
		return `Action ${issue.path[1] + 1}: choose an item`
	}
	if (
		issue.path[0] === 'actions' &&
		typeof issue.path[1] === 'number' &&
		issue.path[2] === 'attribute'
	) {
		return `Action ${issue.path[1] + 1}: choose a stat`
	}
	if (issue.message.includes('expected number')) {
		const field = issue.path[issue.path.length - 1]
		return issue.path[0] === 'actions' && typeof issue.path[1] === 'number'
			? `Action ${issue.path[1] + 1}: enter a number for ${String(field)}`
			: 'Enter a number'
	}
	if (issue.path[0] === 'actions' && typeof issue.path[1] === 'number') {
		return `Action ${issue.path[1] + 1}: ${issue.message}`
	}
	if (issue.path[0] === 'limit') return `Limit: ${issue.message}`
	return issue.message
}

interface InteractionFormProps {
	initial: Interaction
	defs: PlaceableDef[]
	defsLoading: boolean
	onClose: () => void
	onSave: (interaction: Interaction) => void
}

// Lives inside the modal, so it unmounts on close and its draft resets each
// time the modal opens. Not a <form>: this modal sits inside the object's own
// form, and a nested form's submit would also submit that one.
const InteractionForm = ({
	initial,
	defs,
	defsLoading,
	onClose,
	onSave,
}: InteractionFormProps) => {
	const [on, setOn] = useState<InteractionType>(initial.on)
	const [limit, setLimit] = useState(initial.limit ? String(initial.limit) : '')
	const [actions, setActions] = useState<Action[]>(initial.actions)
	const [conditions, setConditions] = useState<Condition[]>(
		initial.conditions ?? [],
	)
	const [hint, setHint] = useState(initial.hint ?? '')
	const [problems, setProblems] = useState<string[]>([])

	const setCondition = (index: number, next: Condition) =>
		setConditions((prev) => prev.map((c, i) => (i === index ? next : c)))

	const items = defs.filter((d) => d.kind === 'item')

	const setAction = (index: number, next: Action) =>
		setActions((prev) => prev.map((a, i) => (i === index ? next : a)))

	const setField = (index: number, field: ActionField, raw: string) => {
		const next = { ...actions[index] } as Record<string, unknown>
		if (field.input === 'number' && field.optional && raw.trim() === '') {
			delete next[field.key]
		} else {
			next[field.key] = field.input === 'number' ? parseNumberInput(raw) : raw
		}
		const config = ACTION_TYPES.find((t) => t.type === actions[index].type)
		const edited = next as unknown as Action
		setAction(index, config?.normalize ? config.normalize(edited) : edited)
	}

	// A custom action keeps no value (it is left to each placement), so
	// checking it drops the value and unchecking starts from a blank one.
	const setCustom = (
		index: number,
		config: ActionTypeConfig,
		custom: boolean,
	) =>
		setAction(
			index,
			custom ? ({ type: config.type, custom: true } as Action) : config.blank(),
		)

	// A def field sets both halves of the reference.
	const setDef = (index: number, key: string) => {
		const def = defs.find((d) => defKey(d.kind, d._id) === key)
		if (!def) return
		setAction(index, {
			...actions[index],
			defKind: def.kind,
			defId: def._id,
		} as Action)
	}

	const handleSave = () => {
		if (actions.length === 0) {
			setProblems(['Add at least one action.'])
			return
		}
		// `initial` carries the id. A hint only means something next to
		// conditions, so it goes with the last one.
		const result = interactionSchema.safeParse({
			...initial,
			on,
			conditions: conditions.length > 0 ? conditions : undefined,
			hint: conditions.length > 0 ? hint : undefined,
			actions,
			limit: limit === '' ? undefined : Number(limit),
		})
		if (!result.success) {
			setProblems(result.error.issues.map(issueText))
			return
		}
		onSave(result.data)
	}

	return (
		<div>
			<DialogTitle
				as='h3'
				className='text-lg leading-6 font-medium text-gray-900'
			>
				Interaction
			</DialogTitle>

			<div className='mt-4 flex flex-wrap gap-4'>
				<div className='min-w-40'>
					<SelectDropdown
						id='interaction-on'
						label='Trigger'
						options={INTERACTION_TRIGGERS}
						selectedValue={on}
						onSelect={(v) => v && setOn(v as InteractionType)}
					/>
				</div>
				<div>
					<TextInput
						id='interaction-limit'
						label='Limit (blank = unlimited)'
						type='number'
						inputWidth='sm'
						min={1}
						step={1}
						value={limit}
						onChange={(e) => setLimit(e.target.value)}
					/>
				</div>
			</div>

			<h4 className='mb-2 text-sm font-bold text-gray-700'>Conditions</h4>
			<p className='mb-2 text-xs text-gray-500'>
				All conditions must pass for the actions to run.
			</p>
			<div className='space-y-3'>
				{conditions.map((condition, i) => {
					const config = CONDITION_TYPES.find((t) => t.type === condition.type)
					// A type with no editor yet (a flag): shown, kept, removable.
					if (!config) {
						return (
							<div
								key={i}
								className='flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700'
							>
								<span>{summarizeCondition(condition)} (no editor yet)</span>
								<Button
									type='button'
									actionType='delete'
									onClick={() =>
										setConditions((prev) => prev.filter((_, idx) => idx !== i))
									}
								>
									Remove condition
								</Button>
							</div>
						)
					}
					const selectedItem =
						condition.type === 'HAS_ITEM' && !condition.custom
							? items.find((d) => d._id === condition.itemId)
							: undefined
					return (
						<div
							key={i}
							className='rounded border border-gray-200 bg-gray-50 p-3'
						>
							<SelectDropdown
								id={`condition-${i}-type`}
								label={`Condition ${i + 1}`}
								options={CONDITION_TYPES.map((t) => ({
									value: t.type,
									label: t.label,
								}))}
								selectedValue={condition.type}
								onSelect={(v) => {
									const next = CONDITION_TYPES.find((t) => t.type === v)
									if (next && next.type !== condition.type) {
										setCondition(i, next.blank())
									}
								}}
							/>
							{condition.type === 'HAS_ITEM' &&
								!condition.custom &&
								config.fields.map((field) => {
									const id = `condition-${i}-${field.key}`
									if (field.input === 'item') {
										return (
											<ItemCombobox
												key={field.key}
												id={id}
												label={field.label}
												items={items}
												isLoading={defsLoading}
												selectedId={condition.itemId}
												onSelect={(item) =>
													setCondition(i, { ...condition, itemId: item._id })
												}
											/>
										)
									}
									// Hidden unless it matters; a stored amount other than 1
									// is always shown.
									if (
										field.stackableOnly &&
										!selectedItem?.stackable &&
										condition.amount === 1
									) {
										return null
									}
									return (
										<TextInput
											key={field.key}
											id={id}
											label={field.label}
											type='number'
											inputWidth='sm'
											min={1}
											step={1}
											value={
												Number.isNaN(condition.amount)
													? ''
													: String(condition.amount)
											}
											onChange={(e) =>
												setCondition(i, {
													...condition,
													amount: parseNumberInput(e.target.value),
												})
											}
										/>
									)
								})}
							{config.customizable && (
								<CheckboxInput
									id={`condition-${i}-custom`}
									label='Set per placement (custom value)'
									checked={'custom' in condition && !!condition.custom}
									onChange={(e) =>
										setCondition(
											i,
											e.target.checked
												? ({ type: config.type, custom: true } as Condition)
												: config.blank(),
										)
									}
								/>
							)}
							<Button
								type='button'
								actionType='delete'
								onClick={() =>
									setConditions((prev) => prev.filter((_, idx) => idx !== i))
								}
							>
								Remove condition
							</Button>
						</div>
					)
				})}
			</div>
			<div className='mt-3 mb-4'>
				<Button
					type='button'
					actionType='neutral'
					onClick={() =>
						setConditions((prev) => [...prev, CONDITION_TYPES[0].blank()])
					}
				>
					Add condition
				</Button>
			</div>
			{conditions.length > 0 && (
				<TextareaInput
					id='interaction-hint'
					label='Hint (shown when the requirements are not met; blank = default)'
					placeholder='Halt. Only those with the castle seal may pass.'
					rows={2}
					value={hint}
					onChange={(e) => setHint(e.target.value)}
				/>
			)}

			<h4 className='mb-2 text-sm font-bold text-gray-700'>Actions</h4>
			<div className='space-y-3'>
				{actions.map((action, i) => {
					const config = ACTION_TYPES.find((t) => t.type === action.type)
					return (
						<div
							key={i}
							className='rounded border border-gray-200 bg-gray-50 p-3'
						>
							<SelectDropdown
								id={`action-${i}-type`}
								label={`Action ${i + 1}`}
								options={ACTION_TYPES.map((t) => ({
									value: t.type,
									label: t.label,
								}))}
								selectedValue={action.type}
								onSelect={(v) => {
									const next = ACTION_TYPES.find((t) => t.type === v)
									if (next) setAction(i, next.blank())
								}}
							/>
							{!('custom' in action && action.custom) &&
								config?.fields.map((field) => {
									const raw = (action as unknown as Record<string, unknown>)[
										field.key
									]
									const value =
										typeof raw === 'number'
											? Number.isNaN(raw)
												? ''
												: String(raw)
											: String(raw ?? '')
									const id = `action-${i}-${field.key}`
									if (field.visibleWhen && !field.visibleWhen(action)) {
										return null
									}
									if (field.input === 'select') {
										const current = String(raw ?? field.defaultValue ?? '')
										const known = field.options?.some(
											(o) => o.value === current,
										)
										return (
											<SelectDropdown
												key={field.key}
												id={id}
												label={field.label}
												placeholder='Choose...'
												options={field.options ?? []}
												selectedValue={known ? current : null}
												onSelect={(v) => v && setField(i, field, String(v))}
											/>
										)
									}
									if (field.input === 'item') {
										const a = action as { itemId: string }
										return (
											<ItemCombobox
												key={field.key}
												id={id}
												label={field.label}
												items={items}
												isLoading={defsLoading}
												selectedId={a.itemId}
												onSelect={(item) =>
													setAction(i, {
														...action,
														itemId: item._id,
													} as Action)
												}
											/>
										)
									}
									// Hidden unless it matters; a stored amount other than 1 is
									// always shown.
									if (
										field.stackableOnly &&
										raw === 1 &&
										!items.find(
											(d) => d._id === (action as { itemId?: string }).itemId,
										)?.stackable
									) {
										return null
									}
									if (field.input === 'def') {
										const a = action as { defKind: Kind; defId: string }
										return (
											<SelectDropdown
												key={field.key}
												id={id}
												label={field.label}
												placeholder={defsLoading ? 'Loading...' : 'Choose...'}
												disabled={defsLoading}
												options={defs.map((d) => ({
													value: defKey(d.kind, d._id),
													label: `${KIND_LABELS[d.kind] ?? d.kind}: ${d.name}`,
												}))}
												selectedValue={
													a.defId ? defKey(a.defKind, a.defId) : ''
												}
												onSelect={(v) => v && setDef(i, String(v))}
											/>
										)
									}
									return field.input === 'textarea' ? (
										<TextareaInput
											key={field.key}
											id={id}
											label={field.label}
											placeholder={field.placeholder}
											rows={3}
											value={value}
											onChange={(e) => setField(i, field, e.target.value)}
										/>
									) : (
										<TextInput
											key={field.key}
											id={id}
											label={field.label}
											type={field.input}
											placeholder={field.placeholder}
											value={value}
											onChange={(e) => setField(i, field, e.target.value)}
										/>
									)
								})}
							{config?.customizable && (
								<CheckboxInput
									id={`action-${i}-custom`}
									label='Set per placement (custom value)'
									checked={'custom' in action && !!action.custom}
									onChange={(e) => setCustom(i, config, e.target.checked)}
								/>
							)}
							<Button
								type='button'
								actionType='delete'
								onClick={() =>
									setActions((prev) => prev.filter((_, idx) => idx !== i))
								}
							>
								Remove action
							</Button>
						</div>
					)
				})}
			</div>
			<div className='mt-3'>
				<Button
					type='button'
					actionType='neutral'
					onClick={() =>
						setActions((prev) => [...prev, ACTION_TYPES[0].blank()])
					}
				>
					Add action
				</Button>
			</div>

			{problems.length > 0 && (
				<ul className='mt-4 list-disc pl-5 text-sm text-red-600'>
					{problems.map((p, i) => (
						<li key={i}>{p}</li>
					))}
				</ul>
			)}

			<div className='mt-6 flex justify-end space-x-3'>
				<Button type='button' actionType='neutral' onClick={onClose}>
					Cancel
				</Button>
				<Button type='button' actionType='submit' onClick={handleSave}>
					Save interaction
				</Button>
			</div>
		</div>
	)
}

interface InteractionModalProps {
	isOpen: boolean
	// The interaction to edit, or a blank one when adding.
	initial: Interaction | null
	defs: PlaceableDef[]
	defsLoading: boolean
	onClose: () => void
	onSave: (interaction: Interaction) => void
}

export const InteractionModal = ({
	isOpen,
	initial,
	defs,
	defsLoading,
	onClose,
	onSave,
}: InteractionModalProps) => (
	<BaseModal isOpen={isOpen} onClose={onClose} panelClassName='max-w-xl'>
		{initial && (
			<InteractionForm
				initial={initial}
				defs={defs}
				defsLoading={defsLoading}
				onClose={onClose}
				onSave={onSave}
			/>
		)}
	</BaseModal>
)
