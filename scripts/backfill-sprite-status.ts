// One-off: gives every sprite that has no review status one, in both the
// sandbox and the real database ([Sprite 17]). Usage, from the repo root:
//
//   make backfill-sprite-status                       dry run, writes nothing
//   make backfill-sprite-status STATUS=review         dry run with another value
//   make backfill-sprite-status APPLY=1               backs up, then writes
//
// Only sprites with NO status are touched; a sprite that already has one
// (review, redo, approved) is left alone. Each write is a whole-document PUT
// with the status added, since PUT replaces the document. A client of the two
// APIs over HTTP, like promote-sprites: it never connects to MongoDB.
//
// Run through tsx (like the MCP): the schema file is imported as it is.
import {
	SPRITE_STATUSES,
	type SpriteStatus,
} from '../frontend/src/lib/types/sprite'
import { spriteSchema } from '../frontend/src/schemas/spriteSchema'

const SANDBOX_URL = process.env.SANDBOX_API_URL ?? 'http://localhost:8081'
const REAL_URL = process.env.REAL_API_URL ?? 'http://localhost:8080'

type Stored = Record<string, unknown> & { _id: string }

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const status = (args.find((a) => !a.startsWith('--')) ??
	'approved') as SpriteStatus

const stop = (lines: string[]): never => {
	for (const line of lines) console.error(line)
	process.exit(1)
}

async function call(base: string, path: string, init: RequestInit = {}) {
	const res = await fetch(`${base}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json' },
	})
	if (!res.ok) {
		throw new Error(
			`${init.method ?? 'GET'} ${base}${path} failed: ${res.status} ${await res.text()}`,
		)
	}
	return res
}

const list = async (base: string) =>
	(await (await call(base, '/collection/sprites')).json()) as Stored[]

async function main() {
	if (!SPRITE_STATUSES.includes(status)) {
		stop([`STATUS must be one of ${SPRITE_STATUSES.join(', ')}.`])
	}
	if (new URL(SANDBOX_URL).origin === new URL(REAL_URL).origin) {
		stop([`The sandbox and real API are the same address. Refusing.`])
	}

	const sides = [
		{ name: 'sandbox', base: SANDBOX_URL },
		{ name: 'real', base: REAL_URL },
	]
	const todo: { side: string; base: string; doc: Stored }[] = []
	const problems: string[] = []

	for (const side of sides) {
		const docs = await list(side.base)
		const missing = docs.filter((d) => d.status === undefined)
		console.log(
			`${side.name}: ${docs.length} sprites, ${missing.length} without a status`,
		)
		for (const doc of missing) {
			// Validate first, so nothing is written for a sprite that wouldn't pass.
			const parsed = spriteSchema.safeParse({ ...doc, status })
			if (!parsed.success) {
				problems.push(`${side.name} ${String(doc.id)}: invalid`)
				continue
			}
			console.log(`  ${side.name.padEnd(8)} ${String(doc.id)} -> ${status}`)
			todo.push({ ...side, doc })
		}
	}
	if (problems.length > 0) {
		stop([
			'Nothing was written. Fix these first:',
			...problems.map((p) => `  ${p}`),
		])
	}

	if (!apply) {
		console.log(
			`Dry run: ${todo.length} sprite(s) would get "${status}". Nothing was written.`,
		)
		return
	}

	let written = 0
	for (const { side, base, doc } of todo) {
		const { _id, updated_at: _updated, ...rest } = doc
		void _updated
		try {
			await call(base, `/collection/sprites/${_id}`, {
				method: 'PUT',
				body: JSON.stringify(spriteSchema.parse({ ...rest, status })),
			})
			written += 1
		} catch (e) {
			// Safe to re-run: sprites already written have a status and are skipped.
			stop([
				`Stopped at ${side} ${String(doc.id)} after ${written} written: ${(e as Error).message}`,
			])
		}
	}
	console.log(`Wrote ${written} sprite(s).`)
}

main().catch((e) => stop([(e as Error).message]))
