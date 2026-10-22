// Creates the unique index on the user-facing `id` for each collection.
// Run through the Makefile (make db-indexes / make sandbox-indexes), which
// pipes this file into mongosh inside the right container and database.
//
// Idempotent: re-running with the same definition does nothing. A failure on
// one collection (e.g. existing duplicate ids) is reported and the rest still
// run; the exit code is 1 if anything failed.
//
// KEEP IN SYNC with validCollections in backend/internal/collection/middleware.go
// (and the copy in mcp/src/index.ts). `events` is left out on purpose: it is
// reserved and unused. To run only some collections:
//   make db-indexes COLLECTIONS="new_thing other_thing"

const all = ['tile_defs', 'items', 'entities', 'zones']
const only = (process.env.RC_COLLECTIONS || '').split(' ').filter(Boolean)
const names = only.length > 0 ? only : all

let failed = 0
for (const name of names) {
	try {
		// Partial: documents with no string `id` are not indexed, so they
		// don't collide with each other as "null".
		db.getCollection(name).createIndex(
			{ id: 1 },
			{
				name: 'id_unique',
				unique: true,
				partialFilterExpression: { id: { $type: 'string' } },
			},
		)
		print(`ok      ${db.getName()}.${name}`)
	} catch (e) {
		failed++
		print(`FAILED  ${db.getName()}.${name}: ${e.message}`)
	}
}

quit(failed > 0 ? 1 : 0)
