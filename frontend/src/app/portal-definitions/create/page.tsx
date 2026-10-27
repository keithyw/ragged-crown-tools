'use client'

import { Controller, get } from 'react-hook-form'
import { CreateFormLayout, FormInput, InteractionsEditor } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { portalDefinitionSchema } from '@/schemas'
import { fields } from '@/app/portal-definitions/fields'

const CreatePortalDefinitionPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'entities',
		schema: portalDefinitionSchema,
		defaultValues: {
			kind: 'portal', // not a visible field, but submitted with the form
			id: '',
			name: '',
			twoWay: false,
			// The backfill glyph, so a def can be saved before it has a sprite.
			glyph: { symbol: '??', color: 'text-white', bg: 'bg-black' },
			description: '',
		},
		createFn: collectionService.create,
		redirectUrl: URLS.PORTAL_DEFINITIONS,
		successMessage: () => {
			return `Portal Definition Created`
		},
	})
	return (
		<CreateFormLayout
			title='Create Portal Definition'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.PORTAL_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Portal Definitions', href: URLS.PORTAL_DEFINITIONS },
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
					<InteractionsEditor
						value={field.value}
						onChange={field.onChange}
						defaultTrigger='WALK'
					/>
				)}
			/>
		</CreateFormLayout>
	)
}

export default CreatePortalDefinitionPage
