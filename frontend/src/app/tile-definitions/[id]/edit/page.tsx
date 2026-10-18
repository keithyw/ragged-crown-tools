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
import { toTileDef, toTileForm } from '@/app/tile-definitions/toTileDef'

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
			description: '',
		},
		getData: collectionService.get,
		updateData: (collectionName, id, data) =>
			collectionService.put(collectionName, id, toTileDef(data)),
		errorLoadingMessage: '',
		redirectUrl: '',
		schema: tileDefinitionSchema,
		handleFetchCallback: useCallback((t: TileDef) => toTileForm(t), []),
		transformData: async (data: TileDefinitionFormData) => {
			return data
		},
	})

	return (
		<EditFormLayout
			item={
				(editController.data &&
					toTileForm(editController.data as TileDef)) as TileDefinitionFormData
			}
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
