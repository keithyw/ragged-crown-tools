import { RANDOM_ENCOUNTER_LABELS, RANDOM_ENCOUNTERS } from '@/lib/constants'
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
	{
		name: 'randomEncounters',
		label: 'Random encounters',
		type: 'select',
		options: RANDOM_ENCOUNTERS.map((v) => ({
			value: v,
			label: RANDOM_ENCOUNTER_LABELS[v],
		})),
	},
]
