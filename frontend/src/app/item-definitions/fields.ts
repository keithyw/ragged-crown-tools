import { glyphFields } from '@/components'
import type { FormField } from '@/lib/types'
import type { ItemDefinitionFormData } from '@/schemas'

// Bare minimum for now. Category and item stats are deferred until the
// inventory design settles (DATA-MODEL.md, open questions).
export const fields: FormField<ItemDefinitionFormData>[] = [
	{
		name: 'id',
		label: 'ID',
		placeholder: 'Enter ID',
		required: true,
	},
	{
		name: 'name',
		label: 'Name',
		placeholder: 'Enter Name',
		required: true,
	},
	...glyphFields<ItemDefinitionFormData>(),
	{
		name: 'stackable',
		label: 'Is Stackable (shown as "4 spears", not four rows)',
		type: 'checkbox',
	},
	{
		name: 'numberOfUses',
		label: 'Number of Uses (blank = unlimited)',
		type: 'number',
		inputWidth: 'xs',
		inputAttrs: { min: 1, step: 1 },
	},
	{
		name: 'container.capacity',
		label: 'Container Capacity (0 = not a container)',
		type: 'number',
		inputWidth: 'xs',
		inputAttrs: { min: 0, step: 1 },
	},
	{
		name: 'container.maxDepth',
		label: 'Container Depth (0 or 1 = no nested containers)',
		type: 'number',
		inputWidth: 'xs',
		inputAttrs: { min: 0, step: 1 },
	},
	{
		name: 'description',
		label: 'Description',
		placeholder: 'Enter Description',
		type: 'textarea',
	},
]
