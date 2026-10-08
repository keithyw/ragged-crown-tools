import client from './client'

export interface SaveResponse {
	status: 'saved'
	id: string
}

export type StoredDoc<TData> = TData & { _id: string; updated_at: string }

interface CollectionService {
	create: <TData extends object>(
		collectionName: string,
		id: string,
		data: TData,
	) => Promise<SaveResponse>
	fetch: <TData extends object>(
		collectionName: string,
	) => Promise<StoredDoc<TData>[]>
}

export const collectionService: CollectionService = {
	create: async <TData extends object>(
		collectionName: string,
		id: string,
		data: TData,
	): Promise<SaveResponse> => {
		const res = await client.post<SaveResponse>(
			`/collection/${collectionName}/${id}`,
			data,
		)
		return res.data
	},
	fetch: async <TData extends object>(
		collectionName: string,
	): Promise<StoredDoc<TData>[]> => {
		const res = await client.get<StoredDoc<TData>[]>(
			`/collection/${collectionName}`,
		)
		return res.data
	},
}
