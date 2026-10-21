import type {
	Action,
	Condition,
	Interaction,
	InteractionType,
	Kind,
} from '@/lib/types'

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
	// 'def' picks an item or object and sets both defKind and defId (its key is
	// defId).
	// 'item' picks an item by name and sets its _id (its key is itemId).
	input: 'text' | 'textarea' | 'number' | 'def' | 'item'
	placeholder?: string
	// A blank value leaves the property out instead of storing it (numbers).
	optional?: boolean
	// Shown only when the chosen item is stackable (or the stored value isn't
	// 1, so stored data is never hidden).
	stackableOnly?: boolean
}

// What a summary needs to know beyond the action itself.
export interface SummaryContext {
	defName: (kind: Kind, id: string) => string
}

// For callers with no names to hand: show the id.
export const NO_NAMES: SummaryContext = { defName: (_kind, id) => id }

export interface ActionTypeConfig {
	type: Action['type']
	label: string
	fields: ActionField[]
	// Offers the "set per placement" checkbox (stores `custom`).
	customizable?: boolean
	blank: () => Action
	// A short phrase for the list ("change stamina by +10").
	summary: (action: Action, ctx: SummaryContext) => string
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
		customizable: true,
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
			if (a.custom) return 'show dialog (set per placement)'
			const text = a.text.replace(/\s+/g, ' ').trim()
			return `show "${text.length > 40 ? `${text.slice(0, 40)}...` : text}"`
		},
	},
	{
		type: 'SPAWN',
		label: 'Spawn (add to this cell)',
		customizable: true,
		fields: [
			{ key: 'defId', label: 'What to spawn', input: 'def' },
			{
				key: 'quantity',
				label: 'Quantity (blank = none)',
				input: 'number',
				optional: true,
			},
		],
		blank: () => ({ type: 'SPAWN', defKind: 'item', defId: '' }),
		summary: (a, ctx) =>
			a.type === 'SPAWN' && a.custom
				? 'spawn (set per placement)'
				: a.type === 'SPAWN'
					? `spawn ${ctx.defName(a.defKind, a.defId)}${a.quantity ? ` x${a.quantity}` : ''}`
					: '',
	},
	{
		type: 'TAKE_ITEM',
		label: 'Take item (from the player)',
		fields: [
			{ key: 'itemId', label: 'Item', input: 'item' },
			{ key: 'amount', label: 'Amount', input: 'number', stackableOnly: true },
		],
		blank: () => ({ type: 'TAKE_ITEM', itemId: '', amount: 1 }),
		summary: (a, ctx) =>
			a.type === 'TAKE_ITEM'
				? `take ${ctx.defName('item', a.itemId)}${a.amount && a.amount > 1 ? ` x${a.amount}` : ''}`
				: '',
	},
	{
		type: 'REMOVE_SELF',
		label: 'Remove this object',
		fields: [],
		blank: () => ({ type: 'REMOVE_SELF' }),
		summary: () => 'remove this object',
	},
]

export interface ConditionField {
	key: string // the property on the condition
	label: string
	// 'item' picks an item by name and sets its _id.
	input: 'item' | 'number'
	// Shown only when the chosen item is stackable (or the stored amount isn't
	// 1, so stored data is never hidden).
	stackableOnly?: boolean
}

export interface ConditionTypeConfig {
	type: Condition['type']
	label: string
	fields: ConditionField[]
	blank: () => Condition
}

// The condition types the editor can author, like ACTION_TYPES. The flag
// conditions aren't here yet: stored ones are kept as they are.
export const CONDITION_TYPES: ConditionTypeConfig[] = [
	{
		type: 'HAS_ITEM',
		label: 'Has item',
		fields: [
			{ key: 'itemId', label: 'Item', input: 'item' },
			{ key: 'amount', label: 'Amount', input: 'number', stackableOnly: true },
		],
		blank: () => ({ type: 'HAS_ITEM', itemId: '', amount: 1 }),
	},
]

export const summarizeAction = (
	action: Action,
	ctx: SummaryContext = NO_NAMES,
) =>
	ACTION_TYPES.find((t) => t.type === action.type)?.summary(action, ctx) ||
	action.type.toLowerCase().replaceAll('_', ' ')

// "has Castle Seal", "has Arrow x5".
export const summarizeCondition = (
	condition: Condition,
	ctx: SummaryContext = NO_NAMES,
) => {
	switch (condition.type) {
		case 'HAS_ITEM':
			return `has ${ctx.defName('item', condition.itemId)}${condition.amount > 1 ? ` x${condition.amount}` : ''}`
		case 'FLAG_SET':
			return `flag "${condition.flag}" is set`
		case 'FLAG_NOT_SET':
			return `flag "${condition.flag}" is not set`
	}
}

// "Bump, if has Castle Seal: show dialog", with the limit when there is one.
export const summarizeInteraction = (
	i: Interaction,
	ctx: SummaryContext = NO_NAMES,
) => {
	const trigger =
		INTERACTION_TRIGGERS.find((t) => t.value === i.on)?.label ?? i.on
	const requires = i.conditions?.length
		? `, if ${i.conditions.map((c) => summarizeCondition(c, ctx)).join(', ')}`
		: ''
	const what =
		i.actions.map((a) => summarizeAction(a, ctx)).join(', ') || 'nothing'
	const limit = i.limit
		? ` (${i.limit === 1 ? 'once' : `up to ${i.limit} times`})`
		: ''
	return `${trigger}${requires}: ${what}${limit}`
}

// A number input's text as a number. A blank stays NaN and never becomes 0, so
// that a lone "-" typed on the way to a negative number isn't rewritten as 0
// (the browser reports "" until the number is complete).
export const parseNumberInput = (raw: string) =>
	raw.trim() === '' ? NaN : Number(raw)

// A new interaction to start editing. Call it from an event handler, not
// during render, since it generates an id.
export const blankInteraction = (): Interaction => ({
	id: crypto.randomUUID(),
	on: 'BUMP_INTERACT',
	actions: [ACTION_TYPES[0].blank()],
})
