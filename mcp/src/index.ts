import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { randomUUID } from 'node:crypto'
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
import {
	parseSpritePixels,
	spritePixelsToText,
} from '../../frontend/src/lib/utils/sprite'
import { spriteSchema } from '../../frontend/src/schemas/spriteSchema'
import { zoneSchema } from '../../frontend/src/schemas/zoneSchema'
import { zoneSpecSchema } from '../../frontend/src/schemas/zoneSpecSchema'
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
	'zone_specs',
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

// A sprite may be sent as `rows` (16 strings of 16 characters, 0-F or '.', the
// text form the sprite builder uses) instead of the 256-entry `pixels` array,
// which is easy to mistype. They are turned into `pixels` before validation,
// with the frontend's own parser.
function spriteFromRows(collection: string, doc: unknown) {
	if (collection !== 'sprites' || typeof doc !== 'object' || doc === null) {
		return doc
	}
	if (!('rows' in doc)) return doc

	const { rows, ...rest } = doc as Record<string, unknown>
	if ('pixels' in rest) {
		throw new Error('Invalid document:\n- rows: send rows or pixels, not both')
	}
	const text = Array.isArray(rows) ? rows.join('\n') : rows
	if (typeof text !== 'string') {
		throw new Error('Invalid document:\n- rows: expected 16 strings of 16')
	}
	const parsed = parseSpritePixels(text)
	if (!parsed.ok) throw new Error(`Invalid document:\n- rows: ${parsed.error}`)
	return { ...rest, pixels: parsed.pixels }
}

// A stored sprite is shown as its 16 text rows, not the 256-entry array.
const shown = (collection: string, stored: Record<string, unknown>) =>
	collection === 'sprites' && Array.isArray(stored.pixels)
		? {
				...stored,
				pixels: undefined,
				rows: spritePixelsToText(stored.pixels).split('\n'),
			}
		: stored

// Terrain `code`s of the API being written to: code -> _id, and back. A
// terrain def's two-letter code is its key in `terrainRows` (Trello [Infra 23],
// DATA-MODEL.md 1.3). Loaded per call: tile_defs is small and the sandbox and
// the real server can differ.
async function terrainCodes() {
	const defs: { _id: string; code?: string }[] = await (
		await apiGet('/collection/tile_defs')
	).json()
	const byCode = new Map<string, string>()
	const byId = new Map<string, string>()
	for (const d of defs) {
		if (!d.code) continue
		byCode.set(d.code, d._id)
		byId.set(d._id, d.code)
	}
	return { byCode, byId }
}

// A zone may be sent with `terrainRows` instead of the `terrain` array of 24
// character `_id`s: one string per row, each cell a terrain `code`
// (gr, sw, ...), spaces between cells optional. They are expanded into
// `terrain` before validation. A code no terrain def has is refused with its
// row and column (x, y as in a cell key).
async function zoneFromRows(collection: string, doc: unknown) {
	if (collection !== 'zones' || typeof doc !== 'object' || doc === null) {
		return doc
	}
	if (!('terrainRows' in doc)) return doc

	const { terrainRows, ...rest } = doc as Record<string, unknown>
	if ('terrain' in rest) {
		throw new Error(
			'Invalid document:\n- terrainRows: send terrainRows or terrain, not both',
		)
	}
	if (
		!Array.isArray(terrainRows) ||
		!terrainRows.every((r) => typeof r === 'string')
	) {
		throw new Error(
			'Invalid document:\n- terrainRows: expected an array of strings, one per row',
		)
	}

	const { byCode } = await terrainCodes()
	const problems: string[] = []
	const terrain: string[][] = []
	let width: number | undefined
	terrainRows.forEach((row: string, y) => {
		const compact = row.replace(/\s+/g, '').toLowerCase()
		if (compact.length === 0 || compact.length % 2 !== 0) {
			problems.push(
				`- terrainRows.${y}: needs two characters per cell, got ${compact.length}`,
			)
			return
		}
		const cells = compact.match(/../g) as string[]
		if (width !== undefined && cells.length !== width) {
			problems.push(
				`- terrainRows.${y}: ${cells.length} cells, but row 0 has ${width}`,
			)
		}
		width ??= cells.length
		terrain.push(
			cells.map((code, x) => {
				const _id = byCode.get(code)
				if (!_id && problems.length < 10) {
					problems.push(
						`- terrainRows.${y} (x=${x}): no terrain has the code '${code}'`,
					)
				}
				return _id ?? ''
			}),
		)
	})
	if (problems.length > 0) {
		throw new Error(`Invalid document:\n${problems.join('\n')}`)
	}
	return { ...rest, terrain }
}

// Defs that can be placed, by their `id`: objects, portals and items (a
// creature isn't placed). `kind` becomes the placement's defKind.
async function placeableDefs() {
	const defs = new Map<string, { _id: string; kind: string }[]>()
	for (const c of ['entities', 'items']) {
		const list: { _id: string; id?: string; kind: string }[] = await (
			await apiGet(`/collection/${c}`)
		).json()
		for (const d of list) {
			if (!d.id || d.kind === 'creature') continue
			defs.set(d.id, [...(defs.get(d.id) ?? []), d])
		}
	}
	return defs
}

// "x,y" -> { x, y }, or null when it isn't one.
const cellCorner = (v: unknown) => {
	const m = typeof v === 'string' ? v.match(/^\s*(\d+)\s*,\s*(\d+)\s*$/) : null
	return m ? { x: Number(m[1]), y: Number(m[2]) } : null
}

// Every def a placement can point at, by `_id`: objects, portals and items
// (and creatures, so a wrongly placed one gets a kind message, not "missing").
async function defsById() {
	const byId = new Map<string, { id?: string; kind: string }>()
	for (const c of ['entities', 'items']) {
		const list: { _id: string; id?: string; kind: string }[] = await (
			await apiGet(`/collection/${c}`)
		).json()
		for (const d of list) byId.set(d._id, { id: d.id, kind: d.kind })
	}
	return byId
}

// replace_doc on a zone may send `changes` instead of the whole document
// (Trello [Infra 23]): the stored zone is read here, the changes applied, and
// the result goes through the same expansion and validation as a full
// document. Nothing in the backend changes; it still receives a full PUT.
//   - `add`: { "x,y": [placement, ...] } new placements on top of a cell's
//     stack. A placement with no `uid` gets one.
//   - `remove`: [{ from: "x,y", to?: "x,y", def?: id }] rectangle (to defaults
//     to from). With `def`, drops that def's placements from each cell's stack;
//     without, clears the cells. A remove that matches nothing is refused.
//   - `fills`: as in a full document, applied after `add`.
//   - any other top-level field overwrites the stored one; null deletes it
//     (`reviewNote: null`). `terrainRows` replaces the whole terrain.
// Order: remove, add, fills. Unchanged placements are never touched, so their
// `uid`s stay.
async function zoneFromChanges(
	stored: Record<string, unknown>,
	changes: Record<string, unknown>,
) {
	const problems: string[] = []
	const { add, remove, fills, ...fields } = changes
	for (const k of ['placements', 'terrain', '_id', 'updated_at']) {
		if (k in fields) {
			problems.push(
				k === 'placements'
					? '- placements: use add and remove in changes, not placements'
					: k === 'terrain'
						? '- terrain: use terrainRows in changes'
						: `- ${k}: not allowed in changes`,
			)
		}
	}

	const { _id, updated_at, ...merged } = stored
	void _id
	void updated_at
	for (const [k, v] of Object.entries(fields)) {
		if (v === null) delete merged[k]
		else merged[k] = v
	}
	if ('terrainRows' in fields) delete merged.terrain

	const placements: Record<string, Record<string, unknown>[]> = {}
	for (const [k, stack] of Object.entries(
		(merged.placements as Record<string, unknown[]> | undefined) ?? {},
	)) {
		placements[k] = [...stack] as Record<string, unknown>[]
	}

	if (remove !== undefined) {
		if (!Array.isArray(remove)) {
			problems.push('- remove: expected an array')
		} else {
			const defs = await placeableDefs()
			remove.forEach((r, i) => {
				const at = `remove.${i}`
				const rm = (r ?? {}) as Record<string, unknown>
				const a = cellCorner(rm.from)
				const b = rm.to === undefined ? a : cellCorner(rm.to)
				if (!a) problems.push(`- ${at}.from: expected "x,y"`)
				if (!b) problems.push(`- ${at}.to: expected "x,y"`)
				let ids: Set<string> | undefined
				if (rm.def !== undefined) {
					const found = defs.get(String(rm.def))
					if (!found) {
						problems.push(
							`- ${at}.def: no object, portal or item has the id '${String(rm.def)}'`,
						)
					} else {
						ids = new Set(found.map((d) => d._id))
					}
				}
				if (!a || !b || (rm.def !== undefined && !ids)) return
				let removed = 0
				for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y++) {
					for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x++) {
						const key = `${x},${y}`
						const stack = placements[key]
						if (!stack) continue
						const kept = ids
							? stack.filter((p) => !ids.has(String(p.defId)))
							: []
						removed += stack.length - kept.length
						if (kept.length > 0) placements[key] = kept
						else delete placements[key]
					}
				}
				if (removed === 0) problems.push(`- ${at}: nothing to remove there`)
			})
		}
	}

	if (add !== undefined) {
		if (typeof add !== 'object' || add === null || Array.isArray(add)) {
			problems.push('- add: expected an object keyed by "x,y"')
		} else {
			for (const [key, list] of Object.entries(add)) {
				if (!cellCorner(key) || !Array.isArray(list)) {
					problems.push(`- add.${key}: expected "x,y" -> array of placements`)
					continue
				}
				const stack = (placements[key] ??= [])
				for (const p of list as Record<string, unknown>[]) {
					stack.push({ uid: randomUUID(), ...p })
				}
			}
		}
	}

	if (problems.length > 0) {
		throw new Error(`Invalid changes:\n${problems.join('\n')}`)
	}
	return {
		...merged,
		placements,
		...(fills !== undefined ? { fills } : {}),
	}
}

// A zone may be sent with `fills`: rectangles of one def, expanded into
// `placements` before validation (Trello [Infra 23]). Each fill is
// `{ def, from: "x,y", to: "x,y" }`, corners inclusive in any order, `def` the
// def's user-facing `id` (an object, portal or item). A fill adds one new
// placement, with a fresh `uid`, on the top of every cell it covers, after
// any explicit `placements`, in the order the fills are listed. Fills make new
// placements only: a redo keeps unchanged placements as full objects.
async function zoneFromFills(collection: string, doc: unknown) {
	if (collection !== 'zones' || typeof doc !== 'object' || doc === null) {
		return doc
	}
	if (!('fills' in doc)) return doc

	const { fills, ...rest } = doc as Record<string, unknown>
	const problems: string[] = []
	if (!Array.isArray(fills)) {
		throw new Error('Invalid document:\n- fills: expected an array')
	}

	const defs = await placeableDefs()

	const width = Array.isArray(rest.terrain)
		? ((rest.terrain[0] as unknown[] | undefined)?.length ?? 0)
		: undefined
	const height = Array.isArray(rest.terrain) ? rest.terrain.length : undefined
	const corner = cellCorner

	const placements: Record<string, Record<string, unknown>[]> = {}
	for (const [k, stack] of Object.entries(
		(rest.placements as Record<string, unknown[]> | undefined) ?? {},
	)) {
		placements[k] = [...stack] as Record<string, unknown>[]
	}

	fills.forEach((f, i) => {
		const at = `fills.${i}`
		const fill = (f ?? {}) as Record<string, unknown>
		const a = corner(fill.from)
		const b = corner(fill.to)
		const found = typeof fill.def === 'string' ? defs.get(fill.def) : undefined
		if (!found) {
			problems.push(
				`- ${at}.def: no object, portal or item has the id '${String(fill.def)}'`,
			)
		} else if (found.length > 1) {
			problems.push(
				`- ${at}.def: '${String(fill.def)}' matches more than one def`,
			)
		}
		if (!a) problems.push(`- ${at}.from: expected "x,y"`)
		if (!b) problems.push(`- ${at}.to: expected "x,y"`)
		if (!found || found.length !== 1 || !a || !b) return

		const x0 = Math.min(a.x, b.x)
		const x1 = Math.max(a.x, b.x)
		const y0 = Math.min(a.y, b.y)
		const y1 = Math.max(a.y, b.y)
		if (
			width !== undefined &&
			height !== undefined &&
			(x1 >= width || y1 >= height)
		) {
			problems.push(
				`- ${at}: ${x1},${y1} is outside the ${width}x${height} map`,
			)
			return
		}
		const { _id, kind } = found[0]
		for (let y = y0; y <= y1; y++) {
			for (let x = x0; x <= x1; x++) {
				const key = `${x},${y}`
				const stack = (placements[key] ??= [])
				if (stack[stack.length - 1]?.defId === _id) {
					if (problems.length < 10) {
						problems.push(
							`- ${at}: ${String(fill.def)} would sit directly on top of itself at ${key}`,
						)
					}
					continue
				}
				stack.push({ uid: randomUUID(), defKind: kind, defId: _id })
			}
		}
	})
	if (problems.length > 0) {
		throw new Error(`Invalid document:\n${problems.join('\n')}`)
	}
	return { ...rest, placements }
}

// A stored zone is shown with `terrainRows` (codes) in place of the `terrain`
// array, when every cell's terrain has a code. Otherwise as stored.
async function shownZone(collection: string, stored: Record<string, unknown>) {
	if (collection !== 'zones') return stored
	let shownDoc = stored
	if (Array.isArray(stored.terrain)) {
		const { byId } = await terrainCodes()
		const rows: string[] = []
		let all = true
		for (const row of stored.terrain as unknown[]) {
			const codes = Array.isArray(row)
				? row.map((_id) => byId.get(String(_id)))
				: [undefined]
			if (codes.some((c) => c === undefined)) {
				all = false
				break
			}
			rows.push(codes.join(' '))
		}
		if (all) shownDoc = { ...shownDoc, terrain: undefined, terrainRows: rows }
	}
	if (stored.placements && typeof stored.placements === 'object') {
		const defs = await defsById()
		const view: Record<string, string[]> = {}
		for (const [cell, stack] of Object.entries(
			stored.placements as Record<string, Record<string, unknown>[]>,
		)) {
			view[cell] = stack.map((p) => {
				const name = defs.get(String(p.defId))?.id ?? `?${String(p.defId)}`
				// Anything beyond the def itself is flagged, so a one-off isn't
				// mistaken for a plain placement.
				const extra = [
					'contents',
					'destination',
					'customValues',
					'interactions',
					'quantity',
				]
					.filter((k) => p[k] !== undefined)
					.map((k) =>
						k === 'contents'
							? `contents x${(p.contents as unknown[]).length}`
							: k,
					)
				return extra.length > 0 ? `${name} (${extra.join(', ')})` : name
			})
		}
		shownDoc = { ...shownDoc, placements: undefined, placementsByDef: view }
	}
	return shownDoc
}

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

	// Anything not named here would be checked as a zone.
	const schema =
		collection === 'sprites'
			? spriteSchema
			: collection === 'zone_specs'
				? zoneSpecSchema
				: allowed
					? defSchema
					: zoneSchema
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
			: collection === 'zone_specs'
				? [zoneSpecSchema.shape, 'a zone spec']
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

// A zone's placements must point at real defs of the kind they say: the
// `defId` of every placement, contents included, as the builder's pickers
// guarantee; and no def directly on top of itself in a stack. Not covered: a portal's destination zone, a placement's own
// interactions.
async function checkZonePlacements(collection: string, doc: unknown) {
	if (collection !== 'zones') return
	const placements = (doc as { placements?: Record<string, Loose2[]> })
		.placements
	if (!placements) return

	const defs = await defsById()
	const problems: string[] = []
	const visit = (list: Loose2[], path: string) => {
		list.forEach((p, i) => {
			const at = `${path}.${i}`
			const def = defs.get(p.defId)
			if (!def) {
				problems.push(`- ${at}.defId: no def with _id '${p.defId}'`)
			} else if (def.kind !== p.defKind) {
				problems.push(
					`- ${at}: '${def.id ?? p.defId}' has kind '${def.kind}', not '${p.defKind}'`,
				)
			}
			if (p.contents) visit(p.contents, `${at}.contents`)
		})
	}
	for (const [cell, stack] of Object.entries(placements)) {
		visit(stack, `placements.${cell}`)
		// The same def can't sit directly on top of itself (DATA-MODEL 3);
		// several of one item are one placement with a quantity.
		stack.forEach((p, i) => {
			if (i > 0 && p.defId === stack[i - 1].defId) {
				problems.push(
					`- placements.${cell}: '${defs.get(p.defId)?.id ?? p.defId}' is directly on top of itself (positions ${i - 1} and ${i})`,
				)
			}
		})
	}
	if (problems.length > 0) {
		throw new Error(
			`Invalid document:\n${problems.slice(0, 10).join('\n')}` +
				(problems.length > 10 ? `\n(and ${problems.length - 10} more)` : ''),
		)
	}
}
type Loose2 = {
	defKind: string
	defId: string
	contents?: Loose2[]
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
			'reported as a warning. For a sprite, send rows (16 strings of 16 ' +
			'characters, 0-F or ".") instead of pixels; the reply shows rows. ' +
			'For a zone, send terrainRows instead of terrain: one string per row, ' +
			'each cell a terrain def code (gr, sw, ...), spaces between cells ' +
			'optional; the reply shows terrainRows. A zone may also carry fills: ' +
			'[{ def, from: "x,y", to: "x,y" }], rectangles of one def (its id), ' +
			'each cell getting a new placement on top, after any placements. Sandbox only.',
		inputSchema: {
			collection,
			doc: z.record(z.string(), z.unknown()),
		},
		annotations: { readOnlyHint: false, destructiveHint: false },
	},
	async ({ collection, doc }) => {
		try {
			const { data, warnings } = validate(
				collection,
				await zoneFromFills(
					collection,
					await zoneFromRows(collection, spriteFromRows(collection, doc)),
				),
				{ create: true },
			)
			await checkReferences(data)
			await checkZonePlacements(collection, data)
			const res = await apiPost(`/collection/${collection}`, data)
			return ok(
				await shownZone(collection, shown(collection, await res.json())),
				warnings,
			)
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
			'a warning. For a sprite, send rows (16 strings of 16 characters, ' +
			'0-F or ".") instead of pixels; the reply shows rows. For a zone, send ' +
			'terrainRows (one string per row of terrain def codes, gr sw ...) ' +
			'instead of terrain; the reply shows terrainRows. A zone may also ' +
			'carry fills: [{ def, from: "x,y", to: "x,y" }], rectangles of one ' +
			'def (its id), each cell getting a new placement on top. For a zone, ' +
			'send changes instead of doc to change it without resending it: ' +
			'{ add: { "x,y": [placement] }, remove: [{ from, to?, def? }], ' +
			'fills, and any top-level field to overwrite (null deletes it, ' +
			'terrainRows replaces the terrain) }. Applied as remove, add, ' +
			'fills; unchanged placements keep their uid. The reply shows ' +
			'placements by def id (placementsByDef), without uids. Sandbox only.',
		inputSchema: {
			collection,
			_id: z.string().regex(/^[0-9a-f]{24}$/i, 'Expected 24 hex characters'),
			doc: z.record(z.string(), z.unknown()).optional(),
			changes: z.record(z.string(), z.unknown()).optional(),
		},
		annotations: { readOnlyHint: false, destructiveHint: true },
	},
	async ({ collection, _id, doc, changes }) => {
		try {
			if ((doc === undefined) === (changes === undefined)) {
				return fail('Send doc (the whole document) or changes, not both.')
			}
			if (changes !== undefined && collection !== 'zones') {
				return fail('changes is only supported for zones.')
			}
			const full =
				changes !== undefined
					? await zoneFromChanges(
							await (await apiGet(`/collection/zones/${_id}`)).json(),
							changes,
						)
					: doc
			const { data, warnings } = validate(
				collection,
				await zoneFromFills(
					collection,
					await zoneFromRows(collection, spriteFromRows(collection, full)),
				),
			)
			await checkReferences(data)
			await checkZonePlacements(collection, data)
			const res = await apiPut(`/collection/${collection}/${_id}`, data)
			return ok(
				await shownZone(collection, shown(collection, await res.json())),
				warnings,
			)
		} catch (e) {
			return fail((e as Error).message)
		}
	},
)

await server.connect(new StdioServerTransport())
