'use client'

import { get } from 'react-hook-form'
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
			kind: 'terrain', // not a visible field, but submitted with the form
			id: '',
			name: '',
			// The backfill glyph, so a tile can be saved before it has a sprite.
			glyph: { symbol: '??', color: 'text-white', bg: 'bg-black' },
			moveCost: 1,
			isWalkable: true,
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
					errorMessage={get(errors, f.name)?.message}
				/>
			))}
		</CreateFormLayout>
	)
}

export default CreateTileDefinitionPage
