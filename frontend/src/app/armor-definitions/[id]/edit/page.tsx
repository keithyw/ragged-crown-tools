'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout } from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { ArmorDef } from '@/lib/types'
import { armorDefinitionSchema, type ArmorDefinitionFormData } from '@/schemas'
import { fields } from '@/app/armor-definitions/fields'

const EditArmorDefinitionPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'items',
		id: params.id as string,
		defaultValues: {
			kind: 'armor',
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			defenseValue: 0,
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load armor definition',
		redirectUrl: URLS.ARMOR_DEFINITIONS,
		schema: armorDefinitionSchema,
		// Everything the doc holds except _id/updated_at, so the full-replace
		// PUT keeps fields the form doesn't show (interactions).
		handleFetchCallback: useCallback(
			(a: ArmorDef) => ({
				kind: 'armor' as const,
				id: a.id ?? '',
				name: a.name,
				description: a.description,
				glyph: a.glyph,
				spriteId: a.spriteId,
				type: a.type,
				defenseValue: a.defenseValue,
				weight: a.weight,
				maxQuantity: a.maxQuantity,
				numberOfUses: a.numberOfUses,
				isQuestItem: a.isQuestItem ?? false,
				interactions: a.interactions,
			}),
			[],
		),
		transformData: async (data: ArmorDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as ArmorDefinitionFormData}
			title='Edit Armor Definition'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.ARMOR_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Armor Definitions', href: URLS.ARMOR_DEFINITIONS },
				{ label: editController.data?.name ?? 'Edit' },
			]}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		/>
	)
}

export default EditArmorDefinitionPage
