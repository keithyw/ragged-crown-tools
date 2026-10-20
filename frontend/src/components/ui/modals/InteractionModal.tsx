'use client'

import { useState } from 'react'
import { DialogTitle } from '@headlessui/react'
import {
	BaseModal,
	Button,
	SelectDropdown,
	TextareaInput,
	TextInput,
} from '@/components'
import type { Action, Interaction, InteractionType } from '@/lib/types'
import {
	ACTION_TYPES,
	INTERACTION_TRIGGERS,
	type ActionField,
} from '@/lib/utils'
import { interactionSchema } from '@/schemas'

// The editor's own wording for a zod problem.
const issueText = (issue: { path: PropertyKey[]; message: string }) => {
	if (issue.path[0] === 'actions' && typeof issue.path[1] === 'number') {
		return `Action ${issue.path[1] + 1}: ${issue.message}`
	}
	if (issue.path[0] === 'limit') return `Limit: ${issue.message}`
	return issue.message
}

interface InteractionFormProps {
	initial: Interaction
	onClose: () => void
	onSave: (interaction: Interaction) => void
}

// Lives inside the modal, so it unmounts on close and its draft resets each
// time the modal opens. Not a <form>: this modal sits inside the object's own
// form, and a nested form's submit would also submit that one.
const InteractionForm = ({
	initial,
	onClose,
	onSave,
}: InteractionFormProps) => {
	const [on, setOn] = useState<InteractionType>(initial.on)
	const [limit, setLimit] = useState(initial.limit ? String(initial.limit) : '')
	const [actions, setActions] = useState<Action[]>(initial.actions)
	const [problems, setProblems] = useState<string[]>([])

	const setAction = (index: number, next: Action) =>
		setActions((prev) => prev.map((a, i) => (i === index ? next : a)))

	const setField = (index: number, field: ActionField, raw: string) =>
		setAction(index, {
			...actions[index],
			[field.key]: field.input === 'number' ? Number(raw) : raw,
		} as Action)

	const handleSave = () => {
		if (actions.length === 0) {
			setProblems(['Add at least one action.'])
			return
		}
		// `initial` carries the id and any conditions, which this editor keeps
		// as they are.
		const result = interactionSchema.safeParse({
			...initial,
			on,
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
							{config?.fields.map((field) => {
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
	onClose: () => void
	onSave: (interaction: Interaction) => void
}

export const InteractionModal = ({
	isOpen,
	initial,
	onClose,
	onSave,
}: InteractionModalProps) => (
	<BaseModal isOpen={isOpen} onClose={onClose} panelClassName='max-w-xl'>
		{initial && (
			<InteractionForm initial={initial} onClose={onClose} onSave={onSave} />
		)}
	</BaseModal>
)
