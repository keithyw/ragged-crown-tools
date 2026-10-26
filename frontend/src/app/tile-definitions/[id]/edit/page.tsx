'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { EditFormLayout } from '@/components'
import { useEditRecord } from '@/hooks'
import { URLS } from '@/lib/constants'
import { collectionService } from '@/lib/services'
import { TileDef } from '@/lib/types'
import { tileDefinitionSchema, type TileDefinitionFormData } from '@/schemas'
import { fields } from '@/app/tile-definitions/fields'

const EditTileDefinitionPage = () => {
	const params = useParams()

	const editController = useEditRecord({
		collectionName: 'tile_defs',
		id: params.id as string,
		defaultValues: {
			kind: 'terrain',
			id: '',
			name: '',
			glyph: { symbol: '', color: '', bg: '' },
			moveCost: 1,
			isWalkable: true,
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: '',
		redirectUrl: '',
		schema: tileDefinitionSchema,
		// Everything the doc holds except _id/updated_at, so the full-replace
		// PUT keeps fields the form doesn't show (encounterTableKey).
		handleFetchCallback: useCallback(
			(t: TileDef) => ({
				kind: 'terrain' as const,
				id: t.id ?? '',
				name: t.name,
				description: t.description,
				glyph: t.glyph,
				spriteId: t.spriteId,
				moveCost: t.moveCost,
				isWalkable: t.isWalkable,
				encounterRate: t.encounterRate,
				encounterTableKey: t.encounterTableKey,
			}),
			[],
		),
		transformData: async (data: TileDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as TileDefinitionFormData}
			title='Edit Tile Definition'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.TILE_DEFINITIONS}
			breadcrumbs={[
				{ label: 'Tile Definitions', href: URLS.TILE_DEFINITIONS },
				{ label: editController.data?.name ?? 'Edit' },
			]}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		/>
	)
}

export default EditTileDefinitionPage
