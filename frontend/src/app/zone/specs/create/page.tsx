'use client'

import { useEffect } from 'react'
import { get } from 'react-hook-form'
import { CreateFormLayout, FormInput } from '@/components'
import { useCreateRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { MAX_ZONE_SIZE } from '@/lib/utils'
import { zoneSpecSchema, type ZoneSpecFormData } from '@/schemas'
import { fields } from '@/app/zone/specs/fields'
import { clearDraft, loadDraft, saveDraft } from '@/app/zone/specs/draft'

const defaultValues: ZoneSpecFormData = {
	id: '',
	name: '',
	width: MAX_ZONE_SIZE,
	height: MAX_ZONE_SIZE,
	dangerLevel: 0,
	description: '',
	status: 'pending', // not a visible field, but submitted with the form
}

const CreateZoneSpecPage = () => {
	const {
		control,
		onSubmit,
		register,
		reset,
		watch,
		formState: { errors, isSubmitting },
	} = useCreateRecord({
		collectionName: 'zone_specs',
		schema: zoneSpecSchema,
		defaultValues,
		createFn: collectionService.create,
		redirectUrl: URLS.ZONE_SPECS,
		successMessage: () => {
			return `Zone Spec Created`
		},
		onSuccess: clearDraft,
	})

	// Restore an unsaved draft once, after mount (storage isn't there on the
	// server render), then keep it up to date as the form changes.
	useEffect(() => {
		const draft = loadDraft(defaultValues)
		if (draft) reset(draft)
		const subscription = watch((values) => saveDraft(values, defaultValues))
		return () => subscription.unsubscribe()
	}, [reset, watch])

	return (
		<CreateFormLayout
			title='Create Zone Spec'
			isSubmitting={isSubmitting}
			submitText='Create'
			submittingText='Creating...'
			cancelUrl={URLS.ZONE_SPECS}
			onCancel={clearDraft}
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
