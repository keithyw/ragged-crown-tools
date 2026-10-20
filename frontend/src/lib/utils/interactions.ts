import type { Action, Interaction, InteractionType } from '@/lib/types'

// What can start an interaction on an object or space. PICKUP and DROP are for
// items, so they are not offered here.
export const INTERACTION_TRIGGERS: { value: InteractionType; label: string }[] =
	[
		{ value: 'BUMP_INTERACT', label: 'Bump' },
		{ value: 'WALK', label: 'Walk onto' },
		{ value: 'TALK', label: 'Talk' },
		{ value: 'OPEN', label: 'Open' },
		{ value: 'CLOSE', label: 'Close' },
		{ value: 'USE', label: 'Use' },
	]

export interface ActionField {
	key: string // the property on the action
	label: string
	input: 'text' | 'textarea' | 'number'
	placeholder?: string
}

export interface ActionTypeConfig {
	type: Action['type']
	label: string
	fields: ActionField[]
	blank: () => Action
	// A short phrase for the list ("change stamina by +10").
	summary: (action: Action) => string
}

// The action types the editor can author, config-as-code like the form fields.
// A story adds an entry here to support a new type; the first one is the
// default for a new action.
export const ACTION_TYPES: ActionTypeConfig[] = [
	{
		type: 'MODIFY_ATTRIBUTE',
		label: 'Change an attribute',
		fields: [
			{
				key: 'attribute',
				label: 'Attribute',
				input: 'text',
				placeholder: 'stamina',
			},
			{ key: 'amount', label: 'Amount (negative to reduce)', input: 'number' },
		],
		blank: () => ({ type: 'MODIFY_ATTRIBUTE', attribute: '', amount: 0 }),
		summary: (a) =>
			a.type === 'MODIFY_ATTRIBUTE'
				? `change ${a.attribute || '?'} by ${a.amount > 0 ? '+' : ''}${a.amount}`
				: '',
	},
	{
		type: 'SHOW_DIALOG',
		label: 'Show dialog',
		fields: [
			{
				key: 'text',
				label: 'Dialog text',
				input: 'textarea',
				placeholder: 'Hello and welcome to town!',
			},
		],
		blank: () => ({ type: 'SHOW_DIALOG', text: '' }),
		// The start of the text, on one line.
		summary: (a) => {
			if (a.type !== 'SHOW_DIALOG') return ''
			const text = a.text.replace(/\s+/g, ' ').trim()
			return `show "${text.length > 40 ? `${text.slice(0, 40)}...` : text}"`
		},
	},
]

export const summarizeAction = (action: Action) =>
	ACTION_TYPES.find((t) => t.type === action.type)?.summary(action) ||
	action.type.toLowerCase().replaceAll('_', ' ')

// "Bump: change stamina by +10", with the limit when there is one.
export const summarizeInteraction = (i: Interaction) => {
	const trigger =
		INTERACTION_TRIGGERS.find((t) => t.value === i.on)?.label ?? i.on
	const what = i.actions.map(summarizeAction).join(', ') || 'nothing'
	const limit = i.limit
		? ` (${i.limit === 1 ? 'once' : `up to ${i.limit} times`})`
		: ''
	return `${trigger}: ${what}${limit}`
}

// A new interaction to start editing. Call it from an event handler, not
// during render, since it generates an id.
export const blankInteraction = (): Interaction => ({
	id: crypto.randomUUID(),
	on: 'BUMP_INTERACT',
	actions: [ACTION_TYPES[0].blank()],
})
