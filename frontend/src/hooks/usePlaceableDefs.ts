'use client'

import { useCallback, useMemo } from 'react'
import { useCollection } from '@/hooks'
import type { ItemDef, Kind, ObjectDef } from '@/lib/types'

// An item or object that an interaction can point at (what a SPAWN adds).
export interface PlaceableDef {
	kind: Kind
	_id: string
	name: string
}

// Items and objects, with a lookup for names. Two small fetches.
export function usePlaceableDefs() {
	const items = useCollection<ItemDef>('items')
	const objects = useCollection<ObjectDef>('entities', {
		filter: { kind: 'object' },
	})
	const isLoading = items.isLoading || objects.isLoading

	const defs = useMemo<PlaceableDef[]>(
		() => [
			...items.items.map((d) => ({
				kind: 'item' as const,
				_id: d._id,
				name: d.name,
			})),
			...objects.items.map((d) => ({
				kind: 'object' as const,
				_id: d._id,
				name: d.name,
			})),
		],
		[items.items, objects.items],
	)

	// A def that no longer exists shows as "(missing)".
	const defName = useCallback(
		(kind: Kind, id: string) =>
			isLoading
				? '...'
				: (defs.find((d) => d.kind === kind && d._id === id)?.name ??
					'(missing)'),
		[defs, isLoading],
	)

	return { defs, isLoading, defName }
}
