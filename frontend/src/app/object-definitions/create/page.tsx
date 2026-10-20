'use client'

import { Controller, get } from 'react-hook-form'
import { CreateFormLayout, FormInput, InteractionsEditor } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { objectDefinitionSchema } from '@/schemas'
import { fields } from '@/app/object-definitions/fields'

const CreateObjectDefinitionPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'entities',
		schema: objectDefinitionSchema,
		defaultValues: {
			kind: 'object', // not a visible field, but submitted with the form
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			isSolid: true,
			moveCost: 1,
			container: { capacity: 0, maxDepth: 0 },
			description: '',
		},
		createFn: collectionService.create,
		redirectUrl: URLS.OBJECT_DEFINITIONS,
		successMessage: () => {
			return `Object Definition Created`
		},
	})
	return (
		<CreateFormLayout
			title='Create Object Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.OBJECT_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Object Definitions', href: URLS.OBJECT_DEFINITIONS },
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
			<Controller
				name='interactions'
				control={control}
				render={({ field }) => (
					<InteractionsEditor value={field.value} onChange={field.onChange} />
				)}
			/>
		</CreateFormLayout>
	)
}

export default CreateObjectDefinitionPage
