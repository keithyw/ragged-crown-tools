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
	{
		name: 'spriteId',
		label: 'Sprite (replaces the glyph below when set)',
		type: 'sprite',
		spriteCategory: 'item',
	},
	...glyphFields<ItemDefinitionFormData>(),
	{
		name: 'maxQuantity',
		label: 'Max Quantity (blank = only one; "4 spears", 99 gold)',
		type: 'number',
		inputWidth: 'xs',
		inputAttrs: { min: 2, step: 1 },
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
