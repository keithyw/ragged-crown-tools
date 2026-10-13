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
		name: 'symbol',
		label: 'Symbol',
		placeholder: 'Enter Symbol',
		required: true,
		inputWidth: 'xs',
		inputAttrs: { maxLength: 2 },
	},
	{
		name: 'color',
		label: 'Color',
		required: true,
		type: 'color',
		colorKind: 'text',
	},
	{
		name: 'name',
		label: 'Name',
		placeholder: 'Enter Name',
		required: true,
	},
	{
		name: 'bg',
		label: 'Background',
		required: true,
		type: 'color',
		colorKind: 'bg',
	},
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
		name: 'isConsumable',
		label: 'Is Consumable',
		placeholder: 'Enter Is Consumable',
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
