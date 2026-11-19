'use client'

import { useCallback, useMemo } from 'react'
import { useCollection } from '@/hooks'
import type { ItemDef, Kind, ObjectDef } from '@/lib/types'

// An item or object that an interaction can point at (what a SPAWN adds).
export interface PlaceableDef {
	kind: Kind
	_id: string
	name: string
	maxQuantity?: number // items only
	gearType?: string // a weapon's or armor's `type`
}

// Give, take and has-item actions store only an _id and ask for 'item', but the
// def may be a weapon or armor, so 'item' matches all three carried kinds.
const matchesKind = (defKind: Kind, wanted: Kind) =>
	wanted === 'item'
		? defKind === 'item' || defKind === 'weapon' || defKind === 'armor'
		: defKind === wanted

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
				// The items collection also holds weapons and armor.
				kind: d.kind as Kind,
				_id: d._id,
				name: d.name,
				maxQuantity: d.maxQuantity,
				gearType: 'type' in d ? String(d.type) : undefined,
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
				: (defs.find((d) => matchesKind(d.kind, kind) && d._id === id)?.name ??
					'(missing)'),
		[defs, isLoading],
	)

	return { defs, isLoading, defName }
}
