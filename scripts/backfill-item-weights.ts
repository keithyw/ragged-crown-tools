// One-off: gives every item that has no `weight` one, in both the sandbox and
// the real database ([Inventory 12]). Usage, from the repo root:
//
//   make backfill-item-weights                dry run, writes nothing
//   make backfill-item-weights APPLY=1        backs up, then writes
//
// Weights come from the table below (agreed with the owner, 2026-11-14), keyed
// by the user-facing `id`. Only items with NO weight are touched. An item whose
// `id` is not in the table is reported and left alone. Each write is a
// whole-document PUT with the weight added, since PUT replaces the document.
// The stored doc is sent as it is, not parsed: `itemDefSchema` does not know
// `weight` yet and would strip it. A client of the two APIs over HTTP, like
// backfill-sprite-status: it never connects to MongoDB.
//
// Run through tsx (like the MCP).

const SANDBOX_URL = process.env.SANDBOX_API_URL ?? 'http://localhost:8081'
const REAL_URL = process.env.REAL_API_URL ?? 'http://localhost:8080'

// Per one item; a pile is weight x quantity. Pound-sized scale.
const WEIGHTS: Record<string, number> = {
	WOOLPANTS: 1,
	RAGGED_CLOTHES: 2,
	LONG_SWORD: 3,
	SPEAR: 4,
	TORCH: 1,
	ARROWS: 0.1,
	POUCH: 0.5,
	PARCHMENT: 0.1,
	TREASURE_KEY: 0.1,
	SEWELLS_KEY: 0.1,
	KINGS_MEDALLION: 0.5,
	GOBLIN_HEAD: 3,
	MUNZ: 0.01, // placeholder, currency is deferred
	BIG_PENIS: 20, // joke/test item, heavy on purpose
}

type Stored = Record<string, unknown> & { _id: string }

const apply = process.argv.slice(2).includes('--apply')

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
	(await (await call(base, '/collection/items')).json()) as Stored[]

async function main() {
	if (new URL(SANDBOX_URL).origin === new URL(REAL_URL).origin) {
		stop([`The sandbox and real API are the same address. Refusing.`])
	}

	const sides = [
		{ name: 'sandbox', base: SANDBOX_URL },
		{ name: 'real', base: REAL_URL },
	]
	const todo: { side: string; base: string; doc: Stored; weight: number }[] = []
	const unknown: string[] = []

	for (const side of sides) {
		const docs = await list(side.base)
		const missing = docs.filter((d) => d.weight === undefined)
		console.log(
			`${side.name}: ${docs.length} items, ${missing.length} without a weight`,
		)
		for (const doc of missing) {
			const id = String(doc.id)
			const weight = WEIGHTS[id]
			if (weight === undefined) {
				unknown.push(`${side.name} ${id} (${String(doc.name)})`)
				continue
			}
			console.log(`  ${side.name.padEnd(8)} ${id.padEnd(16)} -> ${weight}`)
			todo.push({ side: side.name, base: side.base, doc, weight })
		}
	}
	if (unknown.length > 0) {
		console.log('Not in the table, left alone:')
		for (const u of unknown) console.log(`  ${u}`)
	}

	if (!apply) {
		console.log(
			`Dry run: ${todo.length} item(s) would get a weight. Nothing was written.`,
		)
		return
	}

	let written = 0
	for (const { side, base, doc, weight } of todo) {
		const { _id, updated_at: _updated, ...rest } = doc
		void _updated
		try {
			await call(base, `/collection/items/${_id}`, {
				method: 'PUT',
				body: JSON.stringify({ ...rest, weight }),
			})
			written += 1
		} catch (e) {
			// Safe to re-run: items already written have a weight and are skipped.
			stop([
				`Stopped at ${side} ${String(doc.id)} after ${written} written: ${(e as Error).message}`,
			])
		}
	}
	console.log(`Wrote ${written} item(s).`)
}

main().catch((e) => stop([(e as Error).message]))
