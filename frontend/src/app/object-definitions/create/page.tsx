'use client'

import { get } from 'react-hook-form'
import { CreateFormLayout, FormInput } from '@/components'
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
			{/* TODO [Tools 6]: default interactions editor goes here */}
			<p className='text-sm text-gray-500'>
				Default interactions: coming with the interaction editor.
			</p>
		</CreateFormLayout>
	)
}

export default CreateObjectDefinitionPage
