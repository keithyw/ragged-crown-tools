'use client'

import { useCallback, useEffect, useState } from 'react'
import {
	collectionService,
	type CollectionQuery,
	type StoredDoc,
} from '@/lib/services'

export function useCollection<TData extends object>(
	collectionName: string,
	query?: CollectionQuery,
) {
	const [items, setItems] = useState<StoredDoc<TData>[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	// The query is usually an object literal, which is a new object every
	// render. Depend on its serialized form so an unchanged query doesn't
	// refetch forever.
	const queryKey = JSON.stringify(query ?? null)

	const refresh = useCallback(async () => {
		setIsLoading(true)
		try {
			const q = JSON.parse(queryKey) as CollectionQuery | null
			setItems(
				await collectionService.fetch<TData>(collectionName, q ?? undefined),
			)
			setError(null)
		} catch {
			setError(`Failed to load ${collectionName}`)
		} finally {
			setIsLoading(false)
		}
	}, [collectionName, queryKey])

	useEffect(() => {
		void refresh()
	}, [refresh])

	return { items, isLoading, error, refresh }
}
