'use client'

import { CreateFormLayout, FormInput } from '@/components'
import { useCreateRecord } from '@/hooks/useCreateRecord'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { FormField } from '@/lib/types'
import { tileDefinitionSchema, type TileDefinitionFormData } from '@/schemas'

const fields: FormField<TileDefinitionFormData>[] = [
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

// symbol: z.string(),
// 	color: z.string(),
// 	name: z.string(),
// 	bg: z.string(),
// 	moveCost: z.number(),
// 	isWalkable: z.boolean().optional(),
// 	isConsumable: z.boolean().optional(),
// 	description: z.string().optional(),
// 	encounterRate: z.number().optional(),

const CreateTileDefinitionPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'tile_defs',
		schema: tileDefinitionSchema,
		defaultValues: {
			id: '',
			symbol: '',
			color: '',
			name: '',
			bg: '',
			moveCost: 1,
			isWalkable: true,
			isConsumable: false,
			description: '',
		},
		createFn: collectionService.create,
		redirectUrl: URLS.TILE_DEFINITIONS,
	})
	return (
		<CreateFormLayout
			title='Create Tile Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			handleSubmit={onSubmit}
		>
			{fields.map((f, idx) => (
				<FormInput
					key={idx}
					control={control}
					field={f}
					register={register}
					errorMessage={errors[f.name]?.message}
				/>
			))}
		</CreateFormLayout>
	)
}

export default CreateTileDefinitionPage
