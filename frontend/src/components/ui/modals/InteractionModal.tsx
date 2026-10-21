'use client'

import { useState } from 'react'
import { DialogTitle } from '@headlessui/react'
import {
	BaseModal,
	Button,
	CheckboxInput,
	ItemChipPicker,
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
	INTERACTION_TRIGGERS,
	parseNumberInput,
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
		return `Required item ${issue.path[1] + 1}: enter an amount of 1 or more`
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

	// Each chip is one HAS_ITEM condition. Any other condition type has no
	// editor yet, so it is carried through as it is.
	const requiredItems = conditions.flatMap((c) =>
		c.type === 'HAS_ITEM' ? [{ itemId: c.itemId, amount: c.amount }] : [],
	)
	const setRequiredItems = (next: { itemId: string; amount: number }[]) =>
		setConditions((prev) => [
			...prev.filter((c) => c.type !== 'HAS_ITEM'),
			...next.map((n): Condition => ({ type: 'HAS_ITEM', ...n })),
		])

	const setAction = (index: number, next: Action) =>
		setActions((prev) => prev.map((a, i) => (i === index ? next : a)))

	const setField = (index: number, field: ActionField, raw: string) => {
		const next = { ...actions[index] } as Record<string, unknown>
		if (field.input === 'number' && field.optional && raw.trim() === '') {
			delete next[field.key]
		} else {
			next[field.key] = field.input === 'number' ? parseNumberInput(raw) : raw
		}
		setAction(index, next as unknown as Action)
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
			<ItemChipPicker
				id='interaction-required-items'
				label='Requires items (all must be carried)'
				items={defs.filter((d) => d.kind === 'item')}
				isLoading={defsLoading}
				value={requiredItems}
				onChange={setRequiredItems}
			/>
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
