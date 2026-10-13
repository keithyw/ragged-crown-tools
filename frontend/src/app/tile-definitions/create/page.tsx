'use client'

import { CreateFormLayout, FormInput } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { tileDefinitionSchema } from '@/schemas'
import { fields } from '@/app/tile-definitions/fields'

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
		successMessage: () => {
			return `Tile Definition Created`
		},
	})
	return (
		<CreateFormLayout
			title='Create Tile Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.TILE_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Tile Definitions', href: URLS.TILE_DEFINITIONS },
				{ label: 'Create' },
			]}
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
