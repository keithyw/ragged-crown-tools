'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Controller } from 'react-hook-form'
import { EditFormLayout, InteractionsEditor } from '@/components'
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
			twoWay: false,
			glyph: { symbol: '', color: '', bg: '' },
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load portal definition',
		redirectUrl: URLS.PORTAL_DEFINITIONS,
		schema: portalDefinitionSchema,
		// Everything the doc holds except _id/updated_at, so the full-replace
		// PUT keeps fields the form doesn't show.
		handleFetchCallback: useCallback(
			(p: PortalDef) => ({
				kind: 'portal' as const,
				id: p.id ?? '',
				name: p.name,
				description: p.description,
				glyph: p.glyph,
				spriteId: p.spriteId,
				twoWay: p.twoWay ?? false,
				interactions: p.interactions,
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
		>
			<Controller
				name='interactions'
				control={editController.control}
				render={({ field }) => (
					<InteractionsEditor
						value={field.value}
						onChange={field.onChange}
						defaultTrigger='WALK'
					/>
				)}
			/>
		</EditFormLayout>
	)
}

export default EditPortalDefinitionPage
