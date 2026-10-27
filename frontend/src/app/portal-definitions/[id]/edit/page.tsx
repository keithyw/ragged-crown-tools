'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout } from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { PortalDef } from '@/lib/types'
import {
	portalDefinitionSchema,
	type PortalDefinitionFormData,
} from '@/schemas'
import { fields } from '@/app/portal-definitions/fields'

const EditPortalDefinitionPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'entities',
		id: params.id as string,
		defaultValues: {
			kind: 'portal',
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load portal definition',
		redirectUrl: URLS.PORTAL_DEFINITIONS,
		schema: portalDefinitionSchema,
		// Everything the doc holds except _id/updated_at, so the full-replace
		// PUT keeps every field.
		handleFetchCallback: useCallback(
			(p: PortalDef) => ({
				kind: 'portal' as const,
				id: p.id ?? '',
				name: p.name,
				description: p.description,
				glyph: p.glyph,
				spriteId: p.spriteId,
			}),
			[],
		),
		transformData: async (data: PortalDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as PortalDefinitionFormData}
			title='Edit Portal Definition'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.PORTAL_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Portal Definitions', href: URLS.PORTAL_DEFINITIONS },
				{ label: editController.data?.name ?? 'Edit' },
			]}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		/>
	)
}

export default EditPortalDefinitionPage
