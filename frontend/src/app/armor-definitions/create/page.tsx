'use client'

import { get } from 'react-hook-form'
import { CreateFormLayout, FormInput } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { armorDefinitionSchema } from '@/schemas'
import { fields } from '@/app/armor-definitions/fields'

const CreateArmorDefinitionPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'items',
		schema: armorDefinitionSchema,
		defaultValues: {
			kind: 'armor', // not a visible field, but submitted with the form
			id: '',
			name: '',
			// The backfill glyph, so a def can be saved before it has a sprite.
			glyph: { symbol: '??', color: 'text-white', bg: 'bg-black' },
			defenseValue: 0, // plain clothes defend nothing
			description: '',
		},
		createFn: collectionService.create,
		redirectUrl: URLS.ARMOR_DEFINITIONS,
		successMessage: () => {
			return `Armor Definition Created`
		},
	})
	return (
		<CreateFormLayout
			title='Create Armor Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.ARMOR_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Armor Definitions', href: URLS.ARMOR_DEFINITIONS },
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

export default CreateArmorDefinitionPage
