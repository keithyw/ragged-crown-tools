'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Controller } from 'react-hook-form'
import { EditFormLayout, InteractionsEditor } from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { ObjectDef } from '@/lib/types'
import {
	objectDefinitionSchema,
	type ObjectDefinitionFormData,
} from '@/schemas'
import { fields } from '@/app/object-definitions/fields'

const EditObjectDefinitionPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'entities',
		id: params.id as string,
		defaultValues: {
			kind: 'object',
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			isSolid: true,
			moveCost: 1,
			container: { capacity: 0, maxDepth: 0 },
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load object definition',
		redirectUrl: URLS.OBJECT_DEFINITIONS,
		schema: objectDefinitionSchema,
		// Everything the doc holds except _id/updated_at, so the full-replace
		// PUT keeps fields the form doesn't show (interactions).
		handleFetchCallback: useCallback(
			(o: ObjectDef) => ({
				kind: 'object' as const,
				id: o.id ?? '',
				name: o.name,
				description: o.description,
				glyph: o.glyph,
				isSolid: o.isSolid,
				moveCost: o.moveCost ?? 1,
				numberOfUses: o.numberOfUses,
				container: {
					capacity: o.container?.capacity ?? 0,
					maxDepth: o.container?.maxDepth ?? 0,
				},
				interactions: o.interactions,
			}),
			[],
		),
		transformData: async (data: ObjectDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as ObjectDefinitionFormData}
			title='Edit Object Definition'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.OBJECT_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Object Definitions', href: URLS.OBJECT_DEFINITIONS },
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
					<InteractionsEditor value={field.value} onChange={field.onChange} />
				)}
			/>
		</EditFormLayout>
	)
}

export default EditObjectDefinitionPage
