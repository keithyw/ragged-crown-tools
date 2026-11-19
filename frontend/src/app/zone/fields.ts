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
		// Its options are the difficulty configurations, filled in by ZoneBuilder.
		name: 'difficultyId',
		label: 'Difficulty',
		type: 'select',
		placeholder: 'Pick a difficulty',
	},
]
