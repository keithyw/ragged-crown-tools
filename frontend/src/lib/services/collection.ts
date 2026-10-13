import client from './client'

export interface SaveResponse {
	status: 'saved'
	id: string
}

export type StoredDoc<TData> = TData & { _id: string; updated_at: string }

interface CollectionService {
	create: <TData extends object>(
		collectionName: string,
		data: TData,
	) => Promise<StoredDoc<TData>>
	delete: (collectionName: string, id: string) => Promise<void>
	fetch: <TData extends object>(
		collectionName: string,
	) => Promise<StoredDoc<TData>[]>
	get: <TData extends object>(
		collectionName: string,
		id: string,
	) => Promise<StoredDoc<TData>>
	put: <TData extends object>(
		collectionName: string,
		id: string,
		data: TData,
	) => Promise<StoredDoc<TData>>
}

export const collectionService: CollectionService = {
	create: async <TData extends object>(
		collectionName: string,
		data: TData,
	): Promise<StoredDoc<TData>> => {
		const res = await client.post<StoredDoc<TData>>(
			`/collection/${collectionName}`,
			data,
		)
		return res.data
	},
	delete: async (collectionName: string, id: string): Promise<void> => {
		await client.delete(`/collection/${collectionName}/${id}`)
	},
	fetch: async <TData extends object>(
		collectionName: string,
	): Promise<StoredDoc<TData>[]> => {
		const res = await client.get<StoredDoc<TData>[]>(
			`/collection/${collectionName}`,
		)
		return res.data
	},
	get: async <TData extends object>(
		collectionName: string,
		id: string,
	): Promise<StoredDoc<TData>> => {
		const res = await client.get<StoredDoc<TData>>(
			`/collection/${collectionName}/${id}`,
		)
		return res.data
	},
	put: async <TData extends object>(
		collectionName: string,
		id: string,
		data: Partial<TData>,
	): Promise<StoredDoc<TData>> => {
		const res = await client.put<StoredDoc<TData>>(
			`/collection/${collectionName}/${id}`,
			data,
		)
		return res.data
	},
}
