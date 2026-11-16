import { glyphFields } from '@/components'
import { ARMOR_TYPES } from '@/lib/constants'
import type { FormField } from '@/lib/types'
import type { ArmorDefinitionFormData } from '@/schemas'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Armor-only fields are marked; the rest are the item core. Material, quality
// and construction style (chain, plate) are separate designs (Trello
// [Inventory 11], [13], [14]).
export const fields: FormField<ArmorDefinitionFormData>[] = [
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
		name: 'type',
		label: 'Type (where it is worn)',
		type: 'select',
		required: true,
		placeholder: 'Choose a type',
		options: ARMOR_TYPES.map((t) => ({ value: t, label: capitalize(t) })),
	},
	{
		name: 'spriteId',
		label: 'Sprite (replaces the glyph below when set)',
		type: 'sprite',
		spriteCategory: 'item',
	},
	...glyphFields<ArmorDefinitionFormData>(),
	{
		name: 'defenseValue',
		label: 'Defense value (0 to 100; 0 for plain clothes)',
		type: 'number',
		required: true,
		inputWidth: 'xs',
		inputAttrs: { min: 0, max: 100, step: 1 },
	},
	{
		name: 'weight',
		label: 'Weight (of one; up to 2 decimals, 0.3 is fine)',
		type: 'number',
		required: true,
		inputWidth: 'xs',
		inputAttrs: { min: 0, step: 0.01 },
	},
	{
		name: 'maxQuantity',
		label: 'Max Quantity (blank = only one)',
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
		name: 'description',
		label: 'Description',
		placeholder: 'Enter Description',
		type: 'textarea',
	},
]
