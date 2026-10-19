'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout } from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { ItemDef } from '@/lib/types'
import { itemDefinitionSchema, type ItemDefinitionFormData } from '@/schemas'
import { fields } from '@/app/item-definitions/fields'

const EditItemDefinitionPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'items',
		id: params.id as string,
		defaultValues: {
			kind: 'item',
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			stackable: false,
			container: { capacity: 0, maxDepth: 0 },
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load item definition',
		redirectUrl: URLS.ITEM_DEFINITIONS,
		schema: itemDefinitionSchema,
		// Everything the doc holds except _id/updated_at, so the full-replace
		// PUT keeps fields the form doesn't show (interactions).
		handleFetchCallback: useCallback(
			(i: ItemDef) => ({
				kind: 'item' as const,
				id: i.id ?? '',
				name: i.name,
				description: i.description,
				glyph: i.glyph,
				stackable: i.stackable,
				numberOfUses: i.numberOfUses,
				container: {
					capacity: i.container?.capacity ?? 0,
					maxDepth: i.container?.maxDepth ?? 0,
				},
				interactions: i.interactions,
			}),
			[],
		),
		transformData: async (data: ItemDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as ItemDefinitionFormData}
			title='Edit Item Definition'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.ITEM_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Item Definitions', href: URLS.ITEM_DEFINITIONS },
				{ label: editController.data?.name ?? 'Edit' },
			]}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		>
			{/* TODO [Tools 6]: default interactions editor goes here (on USE) */}
			<p className='text-sm text-gray-500'>
				Default interactions: coming with the interaction editor.
			</p>
		</EditFormLayout>
	)
}

export default EditItemDefinitionPage
