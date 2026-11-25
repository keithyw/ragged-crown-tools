'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout } from '@/components'
import { useCollection, useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import type { DifficultyConfig, ZoneSpec } from '@/lib/types'
import { MAX_ZONE_SIZE } from '@/lib/utils'
import { zoneSpecSchema, type ZoneSpecFormData } from '@/schemas'
import { editFields, withDifficulties } from '@/app/zone/specs/fields'

const EditZoneSpecPage = () => {
	const params = useParams()
	const { items: difficulties } = useCollection<DifficultyConfig>(
		'difficulty_configs',
		{ sort: 'level' },
	)

	const editController = useEditRecord({
		collectionName: 'zone_specs',
		id: params.id as string,
		defaultValues: {
			id: '',
			name: '',
			width: MAX_ZONE_SIZE,
			height: MAX_ZONE_SIZE,
			difficultyId: '',
			randomEncounters: 'none',
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
				difficultyId: s.difficultyId,
				randomEncounters: s.randomEncounters ?? 'none',
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
			fields={withDifficulties(editFields, difficulties)}
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
