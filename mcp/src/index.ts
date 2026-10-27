import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
// The frontend's schemas, imported as they are (run through tsx, see
// ARCHITECTURE.md 6.1). Type-only `@/` imports inside them resolve via the
// `paths` entry in tsconfig.json.
import { defSchema } from '../../frontend/src/schemas/contentSchemas'
import { spriteSchema } from '../../frontend/src/schemas/spriteSchema'
import { zoneSchema } from '../../frontend/src/schemas/zoneSchema'

const API_URL = process.env.RC_API_URL ?? 'http://localhost:8080'

// Mirrors validCollections in backend/internal/collection/middleware.go
const COLLECTIONS = [
	'tile_defs',
	'items',
	'entities',
	'zones',
	'sprites',
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

// Which `kind`s may be stored in each collection (DATA-MODEL.md 1.3).
const KINDS_BY_COLLECTION: Partial<
	Record<(typeof COLLECTIONS)[number], string[]>
> = {
	tile_defs: ['terrain'],
	items: ['item'],
	entities: ['object', 'creature', 'portal'],
}

// Checks a document against the frontend's schema for its collection and
// returns the parsed copy, which is what gets sent: the same shape the
// frontend would save. Unknown keys are stripped silently (zod's default),
// which is a known boundary case. `events` is a placeholder with no schema.
function validate(collection: (typeof COLLECTIONS)[number], doc: unknown) {
	if (collection === 'events') return doc

	const allowed = KINDS_BY_COLLECTION[collection]
	const kind = (doc as { kind?: unknown } | null)?.kind
	if (allowed && typeof kind === 'string' && !allowed.includes(kind)) {
		throw new Error(
			`Invalid document: kind '${kind}' does not belong in ${collection} ` +
				`(expects ${allowed.join(', ')})`,
		)
	}

	const schema =
		collection === 'sprites' ? spriteSchema : allowed ? defSchema : zoneSchema
	const result = schema.safeParse(doc)
	if (!result.success) {
		const lines = result.error.issues.map(
			(i) => `- ${i.path.join('.') || '(document)'}: ${i.message}`,
		)
		throw new Error(`Invalid document:\n${lines.join('\n')}`)
	}
	return result.data
}

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

// POST only, for create_doc. Same error shape as apiGet.
async function apiPost(path: string, body: unknown) {
	let res: Response
	try {
		res = await fetch(`${API_URL}${path}`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
	} catch {
		throw new Error(`Cannot reach the API at ${API_URL}. Is it running?`)
	}
	if (!res.ok) {
		const err = await res.json().catch(() => null)
		throw new Error(`API ${res.status}: ${err?.error ?? res.statusText}`)
	}
	return res
}

// PUT only, for replace_doc. Same error shape as apiGet.
async function apiPut(path: string, body: unknown) {
	let res: Response
	try {
		res = await fetch(`${API_URL}${path}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
	} catch {
		throw new Error(`Cannot reach the API at ${API_URL}. Is it running?`)
	}
	if (!res.ok) {
		const err = await res.json().catch(() => null)
		throw new Error(`API ${res.status}: ${err?.error ?? res.statusText}`)
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

// Writes. Meant for the sandbox only: the dev server's copy of this tool is
// blocked by a deny rule in .claude/settings.json, not by anything in here.
server.registerTool(
	'create_doc',
	{
		description:
			'Create one document (POST /collection/{collection}). Create only: ' +
			'it never changes an existing document. The server generates _id and ' +
			'updated_at and ignores any _id in the body. The content is NOT ' +
			'validated; the backend stores whatever it is given. Sandbox only.',
		inputSchema: {
			collection,
			doc: z.record(z.string(), z.unknown()),
		},
		annotations: { readOnlyHint: false, destructiveHint: false },
	},
	async ({ collection, doc }) => {
		try {
			const res = await apiPost(
				`/collection/${collection}`,
				validate(collection, doc),
			)
			return ok(await res.json())
		} catch (e) {
			return fail((e as Error).message)
		}
	},
)

// Replaces a whole document. Sandbox only, same deny-rule gate as create_doc.
server.registerTool(
	'replace_doc',
	{
		description:
			'REPLACE a whole document (PUT /collection/{collection}/{_id}). Any ' +
			'field missing from doc is removed, so send the complete document, ' +
			'normally read with get_doc first and then edited. _id and updated_at ' +
			'in the body are ignored; the server keeps the _id and restamps ' +
			'updated_at. The content is NOT validated. Sandbox only.',
		inputSchema: {
			collection,
			_id: z.string().regex(/^[0-9a-f]{24}$/i, 'Expected 24 hex characters'),
			doc: z.record(z.string(), z.unknown()),
		},
		annotations: { readOnlyHint: false, destructiveHint: true },
	},
	async ({ collection, _id, doc }) => {
		try {
			const res = await apiPut(
				`/collection/${collection}/${_id}`,
				validate(collection, doc),
			)
			return ok(await res.json())
		} catch (e) {
			return fail((e as Error).message)
		}
	},
)

await server.connect(new StdioServerTransport())
