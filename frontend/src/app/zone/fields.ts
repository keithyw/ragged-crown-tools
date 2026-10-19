import type { FormField } from '@/lib/types'
import type { ZoneDetailsFormData } from '@/schemas'

export const detailFields: FormField<ZoneDetailsFormData>[] = [
	{
		name: 'id',
		label: 'ID',
		placeholder: 'Enter ID',
	},
	{
		name: 'name',
		label: 'Name',
		placeholder: 'Enter Name',
	},
	{
		name: 'dangerLevel',
		label: 'Danger Level',
		type: 'number',
		inputWidth: 'sm',
		inputAttrs: { min: 0, max: 10, step: 1 },
	},
]
