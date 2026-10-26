import { glyphFields } from '@/components'
import type { FormField } from '@/lib/types'
import type { TileDefinitionFormData } from '@/schemas'

export const fields: FormField<TileDefinitionFormData>[] = [
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
		spriteCategory: 'terrain',
	},
	...glyphFields<TileDefinitionFormData>(),
	{
		name: 'moveCost',
		label: 'Move Cost',
		placeholder: 'Enter Move Cost',
		required: true,
		type: 'number',
		inputAttrs: { min: 0, step: 1 },
	},
	{
		name: 'isWalkable',
		label: 'Is Walkable',
		placeholder: 'Enter Is Walkable',
		type: 'checkbox',
	},
	{
		name: 'description',
		label: 'Description',
		placeholder: 'Enter Description',
		type: 'textarea',
	},
	{
		name: 'encounterRate',
		label: 'Encounter Rate',
		placeholder: 'Enter Encounter Rate',
		type: 'number',
		inputAttrs: { min: 0, max: 1, step: 0.01 },
	},
]
