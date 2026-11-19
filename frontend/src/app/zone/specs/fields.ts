import type { StoredDoc } from '@/lib/services'
import type { DifficultyConfig, FormField } from '@/lib/types'
import { MAX_ZONE_SIZE, MIN_ZONE_SIZE } from '@/lib/utils'
import type { ZoneSpecFormData } from '@/schemas'

const sizeAttrs = { min: MIN_ZONE_SIZE, max: MAX_ZONE_SIZE, step: 1 }

// Status isn't here: a new spec is always pending.
export const fields: FormField<ZoneSpecFormData>[] = [
	{
		name: 'name',
		label: 'Name',
		placeholder: 'Enter Name',
		required: true,
	},
	{
		name: 'id',
		label: 'ID',
		placeholder: 'Enter ID',
		required: true,
	},
	{
		name: 'width',
		label: 'Width',
		required: true,
		type: 'number',
		inputWidth: 'xs',
		inputAttrs: sizeAttrs,
	},
	{
		name: 'height',
		label: 'Height',
		required: true,
		type: 'number',
		inputWidth: 'xs',
		inputAttrs: sizeAttrs,
	},
	{
		// Its options are the difficulty configurations, filled in by the page.
		name: 'difficultyId',
		label: 'Difficulty',
		required: true,
		type: 'select',
		placeholder: 'Pick a difficulty',
	},
	{
		name: 'description',
		label: 'Description',
		required: true,
		type: 'textarea',
		textAreaAttrs: {
			rows: 14,
			placeholder:
				'The general idea of the zone, for the zone skill to work from',
		},
	},
]

// The designer can change it back when a spec needs to change.
export const editFields: FormField<ZoneSpecFormData>[] = [
	...fields,
	{
		name: 'status',
		label: 'Status',
		type: 'select',
		required: true,
		options: [
			{ value: 'pending', label: 'Pending' },
			{ value: 'processed', label: 'Processed' },
		],
	},
]

// Fills the difficulty select with the configurations that exist.
export const withDifficulties = (
	list: FormField<ZoneSpecFormData>[],
	difficulties: StoredDoc<DifficultyConfig>[],
): FormField<ZoneSpecFormData>[] =>
	list.map((f) =>
		f.name === 'difficultyId'
			? {
					...f,
					options: difficulties.map((d) => ({
						value: d._id,
						label: `${d.name} (level ${d.level})`,
					})),
				}
			: f,
	)
