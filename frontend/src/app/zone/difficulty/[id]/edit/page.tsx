'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout, MaterialTableEditor } from '@/components'
import { useEditRecord } from '@/hooks'
import { ARMOR_GROUP_INFO, URLS, WEAPON_GROUP_INFO } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import type { DifficultyConfig } from '@/lib/types'
import {
	difficultyConfigSchema,
	type DifficultyConfigFormData,
} from '@/schemas'
import { defaultValues } from '@/app/zone/difficulty/defaults'
import { fields } from '@/app/zone/difficulty/fields'

const EditDifficultyConfigPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'difficulty_configs',
		id: params.id as string,
		defaultValues,
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: 'Failed to load the difficulty configuration',
		redirectUrl: URLS.ZONE_DIFFICULTY,
		schema: difficultyConfigSchema,
		// Every field is on the form, so the full-replace PUT loses nothing.
		handleFetchCallback: useCallback(
			(c: DifficultyConfig) => ({
				id: c.id,
				name: c.name,
				level: c.level,
				encounterChance: c.encounterChance,
				monsterIds: c.monsterIds ?? [],
				description: c.description ?? '',
				materials: c.materials,
			}),
			[],
		),
		transformData: async (data: DifficultyConfigFormData) => data,
	})

	return (
		<EditFormLayout
			item={editController.data as DifficultyConfigFormData}
			title='Edit Difficulty Configuration'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.ZONE_DIFFICULTY}
			breadcrumbs={[
				{ label: 'Difficulty', href: URLS.ZONE_DIFFICULTY },
				{ label: editController.data?.name ?? 'Edit' },
			]}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		>
			<MaterialTableEditor
				control={editController.control}
				kind='weapon'
				label='Weapon materials'
				groups={WEAPON_GROUP_INFO}
			/>
			<MaterialTableEditor
				control={editController.control}
				kind='armor'
				label='Armor materials'
				groups={ARMOR_GROUP_INFO}
			/>
		</EditFormLayout>
	)
}

export default EditDifficultyConfigPage
