'use client'

import { get } from 'react-hook-form'
import { CreateFormLayout, FormInput } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { monsterDefinitionSchema } from '@/schemas'
import { fields } from '@/app/monster-definitions/fields'

const CreateMonsterDefinitionPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'monsters',
		schema: monsterDefinitionSchema,
		defaultValues: {
			kind: 'monster', // not a visible field, but submitted with the form
			id: '',
			name: '',
			// The backfill glyph, so a def can be saved before it has a sprite.
			glyph: { symbol: '??', color: 'text-white', bg: 'bg-black' },
			level: 0,
			defenseValue: 0,
			removalChance: 0,
			numberAppearing: { count: 1 },
			isUnique: false,
			description: '',
		},
		createFn: collectionService.create,
		redirectUrl: URLS.MONSTER_DEFINITIONS,
		successMessage: () => {
			return `Monster Definition Created`
		},
	})
	return (
		<CreateFormLayout
			title='Create Monster Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.MONSTER_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Monster Definitions', href: URLS.MONSTER_DEFINITIONS },
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

export default CreateMonsterDefinitionPage
