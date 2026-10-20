'use client'

import { useCallback, useEffect, useState } from 'react'
import {
	collectionService,
	type CollectionQuery,
	type StoredDoc,
} from '@/lib/services'

// A result, tagged with the request that produced it.
interface Loaded<TData> {
	key: string
	items: StoredDoc<TData>[]
	error: string | null
}

export function useCollection<TData extends object>(
	collectionName: string,
	query?: CollectionQuery,
) {
	// The empty key never matches a request, so we start out loading.
	const [loaded, setLoaded] = useState<Loaded<TData>>({
		key: '',
		items: [],
		error: null,
	})
	const [reloads, setReloads] = useState(0)

	// The query is usually an object literal, which is a new object every
	// render. Depend on its serialized form so an unchanged query doesn't
	// refetch forever.
	const queryKey = JSON.stringify(query ?? null)

	// Names one request. Everything that should cause a fetch is part of it, so
	// "loading" is simply "the stored result isn't for the current request".
	// That way the effect never has to call setState before it awaits.
	const requestKey = `${collectionName}|${queryKey}|${reloads}`

	useEffect(() => {
		let cancelled = false
		const q = JSON.parse(queryKey) as CollectionQuery | null
		collectionService.fetch<TData>(collectionName, q ?? undefined).then(
			(items) => {
				if (!cancelled) setLoaded({ key: requestKey, items, error: null })
			},
			() => {
				if (!cancelled) {
					setLoaded((prev) => ({
						key: requestKey,
						items: prev.items,
						error: `Failed to load ${collectionName}`,
					}))
				}
			},
		)
		return () => {
			cancelled = true
		}
	}, [collectionName, queryKey, requestKey])

	// Fetch again: changing the key makes isLoading true until the new result.
	const refresh = useCallback(() => setReloads((n) => n + 1), [])

	const isCurrent = loaded.key === requestKey
	return {
		items: loaded.items,
		isLoading: !isCurrent,
		error: isCurrent ? loaded.error : null,
		refresh,
	}
}
