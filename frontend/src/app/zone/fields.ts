import type { FormField, Zone } from '@/lib/types'

// No validation yet, so the form type comes straight from Zone.
// Swap for a zod-inferred type once a zone schema exists.
export type ZoneDetailsFormData = Pick<Zone, 'id' | 'name' | 'dangerLevel'>

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
