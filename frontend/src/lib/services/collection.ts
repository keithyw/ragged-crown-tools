import client from './client'

export interface SaveResponse {
	status: 'saved'
	id: string
}

export type StoredDoc<TData> = TData & { _id: string; updated_at: string }

// The first document that points at another one (GET /references/...).
// `id` is the user-facing label, absent when the referrer has none.
export interface Referrer {
	collection: string
	_id: string
	id?: string
	name: string
}

// Mirrors the backend's list params. Filters are equality matches; an array
// means "any of". Omit limit to get everything.
export interface CollectionQuery {
	filter?: Record<string, string | string[]>
	sort?: string // 'name' ascending, '-name' descending
	limit?: number
	offset?: number
}

interface CollectionService {
	create: <TData extends object>(
		collectionName: string,
		data: TData,
	) => Promise<StoredDoc<TData>>
	delete: (collectionName: string, id: string) => Promise<void>
	fetch: <TData extends object>(
		collectionName: string,
		query?: CollectionQuery,
	) => Promise<StoredDoc<TData>[]>
	findReferrer: (collectionName: string, id: string) => Promise<Referrer | null>
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
		query?: CollectionQuery,
	): Promise<StoredDoc<TData>[]> => {
		const res = await client.get<StoredDoc<TData>[]>(
			`/collection/${collectionName}`,
			{
				// Filter fields become top-level params. Axios skips undefined values.
				params: {
					...query?.filter,
					sort: query?.sort,
					limit: query?.limit,
					offset: query?.offset,
				},
				// Axios would send arrays as kind[]=a&kind[]=b; the backend wants
				// the param repeated: kind=a&kind=b.
				paramsSerializer: { indexes: null },
			},
		)
		return res.data
	},
	findReferrer: async (
		collectionName: string,
		id: string,
	): Promise<Referrer | null> => {
		const res = await client.get<{ referencedBy: Referrer | null }>(
			`/references/${collectionName}/${id}`,
		)
		return res.data.referencedBy
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
