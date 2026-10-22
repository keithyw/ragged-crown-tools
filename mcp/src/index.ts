import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

const API_URL = process.env.RC_API_URL ?? 'http://localhost:8080'

// Mirrors validCollections in backend/internal/collection/middleware.go
const COLLECTIONS = [
	'tile_defs',
	'items',
	'entities',
	'zones',
	'events',
] as const

const collection = z.enum(COLLECTIONS)

const server = new McpServer({ name: 'ragged-crown', version: '0.1.0' })

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: true }

const ok = (data: unknown): ToolResult => ({
	content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
})

const fail = (message: string): ToolResult => ({
	content: [{ type: 'text', text: message }],
	isError: true,
})

// GET only. The API answers errors as {"error": "..."}.
async function apiGet(path: string) {
	let res: Response
	try {
		res = await fetch(`${API_URL}${path}`)
	} catch {
		throw new Error(`Cannot reach the API at ${API_URL}. Is it running?`)
	}
	if (!res.ok) {
		const body = await res.json().catch(() => null)
		throw new Error(`API ${res.status}: ${body?.error ?? res.statusText}`)
	}
	return res
}

server.registerTool(
	'list_collection',
	{
		description:
			'List documents in a collection (GET /collection/{collection}). ' +
			'Filters are string equality on a field; give an array for "any of". ' +
			'Booleans and numbers cannot be filtered on. ' +
			'Sort is a field name, prefixed with - for descending.',
		inputSchema: {
			collection,
			filters: z
				.record(z.string(), z.union([z.string(), z.array(z.string())]))
				.optional(),
			sort: z.string().optional(),
			limit: z.number().int().min(1).max(1000).optional(),
			offset: z.number().int().min(0).optional(),
		},
		annotations: { readOnlyHint: true },
	},
	async ({ collection, filters, sort, limit, offset }) => {
		const params = new URLSearchParams()
		for (const [field, value] of Object.entries(filters ?? {})) {
			for (const v of Array.isArray(value) ? value : [value]) {
				params.append(field, v)
			}
		}
		if (sort) params.set('sort', sort)
		if (limit !== undefined) params.set('limit', String(limit))
		if (offset !== undefined) params.set('offset', String(offset))

		try {
			const query = params.size ? `?${params}` : ''
			const res = await apiGet(`/collection/${collection}${query}`)
			const items = await res.json()
			return ok({
				total: Number(res.headers.get('X-Total-Count')),
				returned: items.length,
				items,
			})
		} catch (e) {
			return fail((e as Error).message)
		}
	},
)

server.registerTool(
	'get_doc',
	{
		description:
			'Get one document by its Mongo _id (24-character hex), not the ' +
			'user-facing id like T001 (GET /collection/{collection}/{_id}).',
		inputSchema: {
			collection,
			_id: z.string().regex(/^[0-9a-f]{24}$/i, 'Expected 24 hex characters'),
		},
		annotations: { readOnlyHint: true },
	},
	async ({ collection, _id }) => {
		try {
			const res = await apiGet(`/collection/${collection}/${_id}`)
			return ok(await res.json())
		} catch (e) {
			return fail((e as Error).message)
		}
	},
)

await server.connect(new StdioServerTransport())
