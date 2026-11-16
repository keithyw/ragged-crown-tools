'use client'

import { get } from 'react-hook-form'
import { CreateFormLayout, FormInput } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { weaponDefinitionSchema } from '@/schemas'
import { fields } from '@/app/weapon-definitions/fields'

const CreateWeaponDefinitionPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'items',
		schema: weaponDefinitionSchema,
		defaultValues: {
			kind: 'weapon', // not a visible field, but submitted with the form
			id: '',
			name: '',
			// The backfill glyph, so a def can be saved before it has a sprite.
			glyph: { symbol: '??', color: 'text-white', bg: 'bg-black' },
			damage: { count: 1 },
			isTwoHanded: false,
			isMissile: false,
			isThrown: false,
			isQuestItem: false,
			description: '',
		},
		createFn: collectionService.create,
		redirectUrl: URLS.WEAPON_DEFINITIONS,
		successMessage: () => {
			return `Weapon Definition Created`
		},
	})
	return (
		<CreateFormLayout
			title='Create Weapon Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.WEAPON_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Weapon Definitions', href: URLS.WEAPON_DEFINITIONS },
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

export default CreateWeaponDefinitionPage
