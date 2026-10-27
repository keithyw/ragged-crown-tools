import { glyphFields } from '@/components'
import type { FormField } from '@/lib/types'
import type { PortalDefinitionFormData } from '@/schemas'

export const fields: FormField<PortalDefinitionFormData>[] = [
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
		spriteCategory: 'portal',
	},
	...glyphFields<PortalDefinitionFormData>(),
	{
		name: 'description',
		label: 'Description',
		placeholder: 'Enter Description',
		type: 'textarea',
	},
]
