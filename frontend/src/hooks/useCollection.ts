'use client'

import { useCallback, useEffect, useState } from 'react'
import { collectionService, type StoredDoc } from '@/lib/services'

export function useCollection<TData extends object>(collectionName: string) {
	const [items, setItems] = useState<StoredDoc<TData>[]>([])
	const [isLoading, setIsLoading] = useState<boolean>(false)
	const [error, setError] = useState<string | null>(null)

	const refresh = useCallback(async () => {
		setIsLoading(true)
		try {
			setItems(await collectionService.fetch<TData>(collectionName))
			setError(null)
		} catch {
			setError(`Failed to load ${collectionName}`)
		} finally {
			setIsLoading(false)
		}
	}, [collectionName])

	useEffect(() => {
		void refresh()
	}, [refresh])

	return { items, isLoading, error, refresh }
}
