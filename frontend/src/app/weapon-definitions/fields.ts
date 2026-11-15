import { glyphFields } from '@/components'
import { DICE, WEAPON_TYPES } from '@/lib/constants'
import type { FormField } from '@/lib/types'
import type { WeaponDefinitionFormData } from '@/schemas'

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// Weapon-only fields are marked; the rest are the item core. Material, quality,
// ammo and damage types are separate designs (Trello [Inventory 13], [14]).
export const fields: FormField<WeaponDefinitionFormData>[] = [
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
		label: 'Type',
		type: 'select',
		required: true,
		placeholder: 'Choose a type',
		options: WEAPON_TYPES.map((t) => ({ value: t, label: capitalize(t) })),
	},
	{
		name: 'spriteId',
		label: 'Sprite (replaces the glyph below when set)',
		type: 'sprite',
		spriteCategory: 'item',
	},
	...glyphFields<WeaponDefinitionFormData>(),
	{
		name: 'damage.count',
		label: 'Damage: number of dice (1d8 is 1)',
		type: 'number',
		required: true,
		inputWidth: 'xs',
		inputAttrs: { min: 1, step: 1 },
	},
	{
		name: 'damage.die',
		label: 'Damage: die',
		type: 'select',
		required: true,
		placeholder: 'Choose a die',
		options: DICE.map((d) => ({ value: d, label: `d${d}` })),
	},
	{
		name: 'isTwoHanded',
		label: 'Two-handed',
		type: 'checkbox',
	},
	{
		name: 'isMissile',
		label: 'Missile (bows, slings, crossbows, ...)',
		type: 'checkbox',
	},
	{
		name: 'isThrown',
		label: 'Thrown (darts, throwing axes, ...)',
		type: 'checkbox',
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
		name: 'description',
		label: 'Description',
		placeholder: 'Enter Description',
		type: 'textarea',
	},
]
