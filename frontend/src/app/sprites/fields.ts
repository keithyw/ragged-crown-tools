import type { FormField } from '@/lib/types'
import type { SpriteFormData } from '@/schemas'

// The sprite's details. The pixels and background are drawn in the editor.
export const fields: FormField<SpriteFormData>[] = [
	{
		name: 'name',
		label: 'Name',
		placeholder: 'Enter Name',
		required: true,
	},
	{
		name: 'id',
		label: 'ID',
		placeholder: 'Enter ID',
		required: true,
	},
	{
		name: 'category',
		label: 'Category',
		type: 'select',
		required: true,
		placeholder: 'Choose a category',
		options: [
			{ value: 'terrain', label: 'Terrain' },
			{ value: 'object', label: 'Object' },
			{ value: 'item', label: 'Item' },
			{ value: 'portal', label: 'Portal' },
		],
	},
]

// Edit page only: the create form doesn't offer it (a hand-drawn sprite is
// saved as approved).
export const statusField: FormField<SpriteFormData> = {
	name: 'status',
	label: 'Review status',
	type: 'select',
	placeholder: 'No status',
	options: [
		{ value: 'review', label: 'Review' },
		{ value: 'redo', label: 'Redo' },
		{ value: 'approved', label: 'Approved' },
	],
}
