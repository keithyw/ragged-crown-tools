import { glyphFields } from '@/components'
import type { FormField } from '@/lib/types'
import type { ObjectDefinitionFormData } from '@/schemas'

export const fields: FormField<ObjectDefinitionFormData>[] = [
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
		spriteCategory: 'object',
	},
	...glyphFields<ObjectDefinitionFormData>(),
	{
		name: 'isSolid',
		label: 'Is Solid (a space, such as a carpet, is not)',
		type: 'checkbox',
	},
	{
		name: 'moveCost',
		label: 'Move Cost (spaces only)',
		type: 'number',
		inputWidth: 'xs',
		inputAttrs: { min: 0, step: 1 },
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
