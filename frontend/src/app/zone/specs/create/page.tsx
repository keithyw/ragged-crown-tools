'use client'

import { get } from 'react-hook-form'
import { CreateFormLayout, FormInput } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { MAX_ZONE_SIZE } from '@/lib/utils'
import { zoneSpecSchema } from '@/schemas'
import { fields } from '@/app/zone/specs/fields'

const CreateZoneSpecPage = () => {
	const {
		control,
		onSubmit,
		register,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'zone_specs',
		schema: zoneSpecSchema,
		defaultValues: {
			id: '',
			name: '',
			width: MAX_ZONE_SIZE,
			height: MAX_ZONE_SIZE,
			dangerLevel: 0,
			description: '',
			status: 'pending', // not a visible field, but submitted with the form
		},
		createFn: collectionService.create,
		redirectUrl: URLS.ZONE_SPECS,
		successMessage: () => {
			return `Zone Spec Created`
		},
	})
	return (
		<CreateFormLayout
			title='Create Zone Spec'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.ZONE_SPECS}
			breadcrumbs={[
				{ label: 'Zone Specs', href: URLS.ZONE_SPECS },
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

export default CreateZoneSpecPage
