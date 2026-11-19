'use client'

import { get } from 'react-hook-form'
import { CreateFormLayout, FormInput, MaterialTableEditor } from '@/components'
import { useCreateRecord } from '@/hooks'
import { ARMOR_MATERIALS, URLS, WEAPON_MATERIALS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { difficultyConfigSchema } from '@/schemas'
import { defaultValues } from '@/app/zone/difficulty/defaults'
import { fields } from '@/app/zone/difficulty/fields'

const CreateDifficultyConfigPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'difficulty_configs',
		schema: difficultyConfigSchema,
		defaultValues,
		createFn: collectionService.create,
		redirectUrl: URLS.ZONE_DIFFICULTY,
		successMessage: () => 'Difficulty Configuration Created',
	})

	return (
		<CreateFormLayout
			title='Create Difficulty Configuration'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.ZONE_DIFFICULTY}
			breadcrumbs={[
				{ label: 'Difficulty', href: URLS.ZONE_DIFFICULTY },
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
			<MaterialTableEditor
				control={control}
				table='weapon'
				label='Weapon materials'
				categories={WEAPON_MATERIALS}
			/>
			<MaterialTableEditor
				control={control}
				table='armor'
				label='Armor materials'
				categories={ARMOR_MATERIALS}
			/>
		</CreateFormLayout>
	)
}

export default CreateDifficultyConfigPage
