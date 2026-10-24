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
		label: 'ID (optional)',
		placeholder: 'Enter ID',
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
