import type { FormField } from '@/lib/types'
import type { DifficultyConfigFormData } from '@/schemas'

// The material tables aren't here: they are drawn by MaterialTableEditor.
export const fields: FormField<DifficultyConfigFormData>[] = [
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
		name: 'level',
		label: 'Level',
		required: true,
		type: 'number',
		inputWidth: 'sm',
		inputAttrs: { min: 0, step: 1 },
	},
	{
		name: 'description',
		label: 'Description',
		type: 'textarea',
		textAreaAttrs: {
			rows: 3,
			placeholder: 'Where this is used, e.g. the starting region',
		},
	},
]
