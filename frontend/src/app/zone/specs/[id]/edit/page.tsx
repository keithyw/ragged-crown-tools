'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout } from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { ZoneSpec } from '@/lib/types'
import { MAX_ZONE_SIZE } from '@/lib/utils'
import { zoneSpecSchema, type ZoneSpecFormData } from '@/schemas'
import { editFields } from '@/app/zone/specs/fields'

const EditZoneSpecPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'zone_specs',
		id: params.id as string,
		defaultValues: {
			id: '',
			name: '',
			width: MAX_ZONE_SIZE,
			height: MAX_ZONE_SIZE,
			dangerLevel: 0,
			description: '',
			status: 'pending',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load the zone spec',
		redirectUrl: URLS.ZONE_SPECS,
		schema: zoneSpecSchema,
		// Every field is on the form, so the full-replace PUT loses nothing.
		handleFetchCallback: useCallback(
			(s: ZoneSpec) => ({
				id: s.id,
				name: s.name,
				width: s.width,
				height: s.height,
				dangerLevel: s.dangerLevel,
				description: s.description,
				status: s.status,
			}),
			[],
		),
		transformData: async (data: ZoneSpecFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as ZoneSpecFormData}
			title='Edit Zone Spec'
			fields={editFields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.ZONE_SPECS}
			breadcrumbs={[
				{ label: 'Zone Specs', href: URLS.ZONE_SPECS },
				{ label: editController.data?.name ?? 'Edit' },
			]}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		/>
	)
}

export default EditZoneSpecPage
