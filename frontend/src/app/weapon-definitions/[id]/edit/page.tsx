'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout } from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { WeaponDef } from '@/lib/types'
import {
	weaponDefinitionSchema,
	type WeaponDefinitionFormData,
} from '@/schemas'
import { fields } from '@/app/weapon-definitions/fields'

const EditWeaponDefinitionPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'items',
		id: params.id as string,
		defaultValues: {
			kind: 'weapon',
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			damage: { count: 1, die: 6 },
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load weapon definition',
		redirectUrl: URLS.WEAPON_DEFINITIONS,
		schema: weaponDefinitionSchema,
		// Everything the doc holds except _id/updated_at, so the full-replace
		// PUT keeps fields the form doesn't show (interactions).
		handleFetchCallback: useCallback(
			(w: WeaponDef) => ({
				kind: 'weapon' as const,
				id: w.id ?? '',
				name: w.name,
				description: w.description,
				glyph: w.glyph,
				spriteId: w.spriteId,
				type: w.type,
				damage: w.damage,
				isTwoHanded: w.isTwoHanded ?? false,
				isMissile: w.isMissile ?? false,
				isThrown: w.isThrown ?? false,
				weight: w.weight,
				maxQuantity: w.maxQuantity,
				numberOfUses: w.numberOfUses,
				isQuestItem: w.isQuestItem ?? false,
				interactions: w.interactions,
			}),
			[],
		),
		transformData: async (data: WeaponDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as WeaponDefinitionFormData}
			title='Edit Weapon Definition'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.WEAPON_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Weapon Definitions', href: URLS.WEAPON_DEFINITIONS },
				{ label: editController.data?.name ?? 'Edit' },
			]}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		/>
	)
}

export default EditWeaponDefinitionPage
