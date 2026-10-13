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
			id: '',
			symbol: '',
			color: '',
			name: '',
			bg: '',
			moveCost: 1,
			isWalkable: true,
			isConsumable: false,
			description: '',
		},
		getData: collectionService.get,
		updateData: collectionService.put,
		errorLoadingMessage: '',
		redirectUrl: '',
		schema: tileDefinitionSchema,
		handleFetchCallback: useCallback((t: TileDef) => {
			return {
				id: t.id,
				symbol: t.symbol,
				color: t.color,
				name: t.name,
				bg: t.bg,
				moveCost: t.moveCost,
				isWalkable: t.isWalkable,
				isConsumable: t.isConsumable,
				description: t.description,
				encounterRate: t.encounterRate,
			}
		}, []),
		transformData: async (data: TileDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={editController.data as TileDef}
			title='Edit Tile Definition'
			fields={fields}
			isLoading={editController.isLoading}
			isSubmitting={editController.isSubmitting}
			loadingError={editController.loadingError}
			cancelUrl={URLS.TILE_DEFINITIONS}
			handleSubmit={editController.onSubmit}
			register={editController.register}
			control={editController.control}
			errors={editController.fieldErrors}
		/>
	)
}

export default EditTileDefinitionPage
