import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
// The frontend's schemas, imported as they are (run through tsx, see
// ARCHITECTURE.md 6.1). Type-only `@/` imports inside them resolve via the
// `paths` entry in tsconfig.json.
import {
	creatureDefSchema,
	defSchema,
	itemDefSchema,
	objectDefSchema,
	portalDefSchema,
	tileDefSchema,
} from '../../frontend/src/schemas/contentSchemas'
import { SPRITE_CATEGORIES } from '../../frontend/src/lib/types/sprite'
import { spriteSchema } from '../../frontend/src/schemas/spriteSchema'
import { zoneSchema } from '../../frontend/src/schemas/zoneSchema'
import {
	HUES,
	NEUTRALS,
	OPACITIES,
	SHADES,
	type ColorKind,
} from '../../frontend/src/lib/types/colorPalette'

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

// Warnings come as a second block, so the first stays the plain document.
const ok = (data: unknown, warnings: string[] = []): ToolResult => ({
	content: [
		{ type: 'text', text: JSON.stringify(data, null, 2) },
		...(warnings.length > 0
			? [
					{
						type: 'text' as const,
						text: `Warnings:\n${warnings.map((w) => `- ${w}`).join('\n')}`,
					},
				]
			: []),
	],
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

// The glyph classes the colour picker can produce, which are the only ones in
// the Tailwind safelist (ARCHITECTURE.md 4.4). Any other class renders
// uncoloured, in the game too.
const paletteClasses = (kind: ColorKind) =>
	new Set<string>([
		...NEUTRALS[kind],
		...HUES.flatMap((hue) =>
			SHADES[kind].flatMap((shade) =>
				OPACITIES[kind].map((opacity) => `${kind}-${hue}-${shade}${opacity}`),
			),
		),
	])
const PALETTE = { text: paletteClasses('text'), bg: paletteClasses('bg') }

// The top-level fields each kind of document has, to report keys that zod
// strips. Nested keys are not checked.
const DEF_SHAPES = {
	terrain: tileDefSchema.shape,
	object: objectDefSchema.shape,
	item: itemDefSchema.shape,
	creature: creatureDefSchema.shape,
	portal: portalDefSchema.shape,
}
const SERVER_FIELDS = new Set(['_id', 'updated_at'])

// Checks a document against the frontend's schema for its collection, plus two
// rules that only the forms enforce, and returns the parsed copy, which is
// what gets sent: the same shape the frontend would save.
//   - `create`: a def needs an `id` (the schema leaves it optional).
//   - a def's glyph classes must be in the palette.
// Unknown top-level keys are still stripped (zod's default), but come back as
// warnings. `events` is a placeholder with no schema.
function validate(
	collection: (typeof COLLECTIONS)[number],
	doc: unknown,
	{ create = false } = {},
) {
	if (collection === 'events') return { data: doc, warnings: [] as string[] }

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

	const data = result.data as {
		id?: string
		kind?: keyof typeof DEF_SHAPES
		glyph?: { color: string; bg: string }
	}
	const problems: string[] = []
	if (create && allowed && !data.id) {
		problems.push('- id: required when creating a def')
	}
	if (data.glyph) {
		for (const [field, kind] of [
			['color', 'text'],
			['bg', 'bg'],
		] as const) {
			if (!PALETTE[kind].has(data.glyph[field])) {
				problems.push(
					`- glyph.${field}: '${data.glyph[field]}' is not in the palette ` +
						`(frontend/src/lib/types/colorPalette.ts); it would render uncoloured`,
				)
			}
		}
	}
	if (problems.length > 0) {
		throw new Error(`Invalid document:\n${problems.join('\n')}`)
	}

	const [shape, what] =
		collection === 'sprites'
			? [spriteSchema.shape, 'a sprite']
			: collection === 'zones'
				? [zoneSchema.shape, 'a zone']
				: [DEF_SHAPES[data.kind!], `a ${data.kind} def`]
	const warnings = Object.keys((doc ?? {}) as object)
		.filter((k) => !(k in shape) && !SERVER_FIELDS.has(k))
		.map((k) => `'${k}' is not a field of ${what} and was dropped`)
	return { data: result.data, warnings }
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

// Which collection holds each kind of def, from KINDS_BY_COLLECTION.
const COLLECTION_BY_KIND = Object.fromEntries(
	Object.entries(KINDS_BY_COLLECTION).flatMap(([c, kinds]) =>
		(kinds ?? []).map((k) => [k, c]),
	),
) as Record<string, (typeof COLLECTIONS)[number]>

// One document by _id, or null when there is none (a malformed _id answers 400
// and an unknown one 404). Any other failure, such as the API being down, is
// thrown.
async function lookup(collection: string, _id: string) {
	try {
		return await (await apiGet(`/collection/${collection}/${_id}`)).json()
	} catch (e) {
		if (/^API (400|404):/.test((e as Error).message)) return null
		throw e
	}
}

type Loose = { type: string; itemId?: string; defKind?: string; defId?: string }

// A def's references to other documents must exist, as they always do through
// the UI's pickers: its sprite, the items its interactions check, give or take,
// and what they SPAWN. The parsed copy is checked, so a custom action or
// condition (which carries no value) has nothing to look up. Zones are not
// covered, and neither is TELEPORT's destination zone.
async function checkReferences(doc: unknown) {
	const def = doc as {
		kind?: string
		spriteId?: string
		interactions?: { conditions?: Loose[]; actions: Loose[] }[]
	}
	if (!def.kind || !(def.kind in COLLECTION_BY_KIND)) return

	const refs: {
		path: string
		collection: string
		_id: string
		what: string
		kind?: string
	}[] = []
	if (def.spriteId) {
		refs.push({
			path: 'spriteId',
			collection: 'sprites',
			_id: def.spriteId,
			what: 'sprite',
		})
	}
	def.interactions?.forEach((it, i) => {
		it.conditions?.forEach((c, j) => {
			if (c.type === 'HAS_ITEM' && c.itemId) {
				refs.push({
					path: `interactions.${i}.conditions.${j}.itemId`,
					collection: 'items',
					_id: c.itemId,
					what: 'item',
				})
			}
		})
		it.actions.forEach((a, j) => {
			const path = `interactions.${i}.actions.${j}`
			if ((a.type === 'GIVE_ITEM' || a.type === 'TAKE_ITEM') && a.itemId) {
				refs.push({
					path: `${path}.itemId`,
					collection: 'items',
					_id: a.itemId,
					what: 'item',
				})
			}
			if (a.type === 'SPAWN' && a.defKind && a.defId) {
				refs.push({
					path: `${path}.defId`,
					collection: COLLECTION_BY_KIND[a.defKind],
					_id: a.defId,
					what: `${a.defKind} def`,
					kind: a.defKind,
				})
			}
		})
	})

	// One lookup per distinct document.
	const found = new Map<string, Promise<Record<string, unknown> | null>>()
	const get = (collection: string, _id: string) => {
		const key = `${collection}/${_id}`
		if (!found.has(key)) found.set(key, lookup(collection, _id))
		return found.get(key)!
	}

	const problems: string[] = []
	await Promise.all(
		refs.map(async (r) => {
			const target = await get(r.collection, r._id)
			if (!target) {
				problems.push(
					`- ${r.path}: no ${r.what} with _id '${r._id}' in ${r.collection}`,
				)
			} else if (r.kind && target.kind !== r.kind) {
				problems.push(
					`- ${r.path}: '${target.id ?? r._id}' has kind '${target.kind}', not '${r.kind}'`,
				)
			} else if (
				r.collection === 'sprites' &&
				(SPRITE_CATEGORIES as readonly string[]).includes(def.kind!) &&
				target.category !== def.kind
			) {
				// The forms only offer sprites of the def's own category.
				problems.push(
					`- spriteId: sprite '${target.id ?? r._id}' is in category ` +
						`'${target.category}', but this is a ${def.kind} def`,
				)
			}
		}),
	)
	if (problems.length > 0) {
		problems.sort()
		throw new Error(`Invalid document:\n${problems.join('\n')}`)
	}
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

server.registerTool(
	'find_references',
	{
		description:
			'Find the first document that points at another one, by its Mongo ' +
			'_id (GET /references/{collection}/{_id}). Returns referencedBy: null ' +
			'or {collection, _id, id, name, cell?}. Only the first referrer is ' +
			'reported. null does NOT mean safe to delete: it means no referrer ' +
			'among the fields the backend knows about. Not covered: zone ' +
			'edgeExits and events.',
		inputSchema: {
			collection,
			_id: z.string().regex(/^[0-9a-f]{24}$/i, 'Expected 24 hex characters'),
		},
		annotations: { readOnlyHint: true },
	},
	async ({ collection, _id }) => {
		try {
			const res = await apiGet(`/references/${collection}/${_id}`)
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
			'updated_at and ignores any _id in the body. The document is ' +
			"validated with the frontend's schemas first, and a def must have an " +
			'id and glyph classes from the palette; problems come back as a ' +
			'list. A top-level key the schema does not have is dropped and ' +
			'reported as a warning. Sandbox only.',
		inputSchema: {
			collection,
			doc: z.record(z.string(), z.unknown()),
		},
		annotations: { readOnlyHint: false, destructiveHint: false },
	},
	async ({ collection, doc }) => {
		try {
			const { data, warnings } = validate(collection, doc, { create: true })
			await checkReferences(data)
			const res = await apiPost(`/collection/${collection}`, data)
			return ok(await res.json(), warnings)
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
			"updated_at. The document is validated with the frontend's schemas " +
			'first (a def needs glyph classes from the palette), and a ' +
			'top-level key the schema does not have is dropped and reported as ' +
			'a warning. Sandbox only.',
		inputSchema: {
			collection,
			_id: z.string().regex(/^[0-9a-f]{24}$/i, 'Expected 24 hex characters'),
			doc: z.record(z.string(), z.unknown()),
		},
		annotations: { readOnlyHint: false, destructiveHint: true },
	},
	async ({ collection, _id, doc }) => {
		try {
			const { data, warnings } = validate(collection, doc)
			await checkReferences(data)
			const res = await apiPut(`/collection/${collection}/${_id}`, data)
			return ok(await res.json(), warnings)
		} catch (e) {
			return fail((e as Error).message)
		}
	},
)

await server.connect(new StdioServerTransport())
