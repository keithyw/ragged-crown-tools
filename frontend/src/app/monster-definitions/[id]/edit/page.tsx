'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout } from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { MonsterDef } from '@/lib/types'
import {
	monsterDefinitionSchema,
	type MonsterDefinitionFormData,
} from '@/schemas'
import { fields } from '@/app/monster-definitions/fields'

const EditMonsterDefinitionPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'monsters',
		id: params.id as string,
		defaultValues: {
			kind: 'monster',
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			level: 0,
			hp: 1,
			defenseValue: 0,
			removalChance: 0,
			damage: { count: 1, die: 4 },
			numberAppearing: { count: 1, die: 6 },
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load monster definition',
		redirectUrl: URLS.MONSTER_DEFINITIONS,
		schema: monsterDefinitionSchema,
		handleFetchCallback: useCallback(
			(m: MonsterDef) => ({
				kind: 'monster' as const,
				id: m.id ?? '',
				name: m.name,
				description: m.description,
				glyph: m.glyph,
				spriteId: m.spriteId,
				level: m.level,
				hp: m.hp,
				defenseValue: m.defenseValue,
				removalChance: m.removalChance,
				damage: m.damage,
				initiative: m.initiative,
				numberAppearing: m.numberAppearing,
				isUnique: m.isUnique ?? false,
			}),
			[],
		),
		transformData: async (data: MonsterDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as MonsterDefinitionFormData}
			title='Edit Monster Definition'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.MONSTER_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Monster Definitions', href: URLS.MONSTER_DEFINITIONS },
				{ label: editController.data?.name ?? 'Edit' },
			]}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		/>
	)
}

export default EditMonsterDefinitionPage
