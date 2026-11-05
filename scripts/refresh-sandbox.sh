#!/usr/bin/env bash
# Rebuilds the SANDBOX database from the REAL one (ARCHITECTURE.md 6.2). Run
# through the Makefile, from the repo root:
#
#   make sandbox-refresh            dry run: prints what would be lost, changes nothing
#   make sandbox-refresh APPLY=1    backs up the real database, resets the sandbox
#                                   volume and restores the backup into it
#
# The only thing done to the real stack is the backup (a dump). The reset
# deletes the SANDBOX volume only, so anything that exists only in the sandbox
# is gone afterwards; the dry run lists it. It stops at the first failing step
# and says which. Re-running is safe: it starts from a fresh reset.
set -euo pipefail
cd "$(dirname "$0")/.."

apply=0
[ "${1:-}" = "--apply" ] && apply=1

REAL_DB="${REAL_DB:-ragged_crown}"
SANDBOX_DB="${SANDBOX_DB:-ragged_crown_sandbox}"
REAL_API_URL="${REAL_API_URL:-http://localhost:8080}"
SANDBOX_API_URL="${SANDBOX_API_URL:-http://localhost:8081}"
export REAL_API_URL SANDBOX_API_URL

# KEEP IN SYNC with scripts/ensure-indexes.js (and validCollections in
# backend/internal/collection/middleware.go, mcp/src/index.ts). `events` is
# left out: it is reserved and unused.
COLLECTIONS="tile_defs items entities zones sprites zone_specs"

step="checking the setup"
reset_done=0
finish() {
	code=$?
	[ "$code" -eq 0 ] && return
	echo "" >&2
	echo "Refresh stopped during: $step" >&2
	if [ "$reset_done" -eq 1 ]; then
		echo "The sandbox may be empty or partly restored. Run it again." >&2
	else
		echo "The sandbox was not changed." >&2
	fi
}
trap finish EXIT

running() { [ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null || true)" = "true" ]; }

[ -f .env.sandbox ] || { echo ".env.sandbox is missing (see ARCHITECTURE.md 6.0)"; exit 1; }
for c in rc_mongodb rc_mongodb_sandbox; do
	running "$c" || { echo "$c is not running (make docker-up / make sandbox-up)"; exit 1; }
done
[ "$REAL_API_URL" != "$SANDBOX_API_URL" ] || { echo "The real and sandbox API addresses are the same"; exit 1; }

step="comparing the two databases"
echo "== What a refresh does to the sandbox"
node scripts/compare-databases.mjs $COLLECTIONS
echo ""

if [ "$apply" -eq 0 ]; then
	echo "Dry run: nothing was changed. Run with APPLY=1 to refresh."
	exit 0
fi

step="backing up the real database"
echo "== 1/6 Backup of the real database"
archive="$(make -s db-backup | sed -n 's/^wrote //p')"
[ -s "$archive" ] || { echo "No backup file was written"; exit 1; }
echo "backup: $archive"

step="resetting the sandbox (make sandbox-reset)"
echo "== 2/6 Reset the sandbox volume"
make sandbox-reset
reset_done=1

step="starting the sandbox (make sandbox-up)"
echo "== 3/6 Start the sandbox and wait for MongoDB"
make sandbox-up
step="waiting for the sandbox MongoDB to become healthy"
for _ in $(seq 1 60); do
	[ "$(docker inspect -f '{{.State.Health.Status}}' rc_mongodb_sandbox)" = "healthy" ] && break
	sleep 2
done
[ "$(docker inspect -f '{{.State.Health.Status}}' rc_mongodb_sandbox)" = "healthy" ] \
	|| { echo "rc_mongodb_sandbox did not become healthy in 2 minutes"; exit 1; }

step="creating the indexes (make sandbox-indexes)"
echo "== 4/6 Indexes"
make sandbox-indexes

# The archive holds every database on the instance and names each namespace
# after the real one: include only the app database, and rename it, or the data
# lands in a stray `ragged_crown` database the sandbox API never reads.
step="restoring the backup into the sandbox"
echo "== 5/6 Restore"
docker exec -i rc_mongodb_sandbox mongorestore --archive --gzip \
	--nsInclude "$REAL_DB.*" --nsFrom "$REAL_DB.*" --nsTo "$SANDBOX_DB.*" \
	< "$archive"

step="checking the result"
echo "== 6/6 Check"
node scripts/compare-databases.mjs --verify $COLLECTIONS
for c in $COLLECTIONS; do
	has_index="$(docker exec rc_mongodb_sandbox mongosh --quiet "$SANDBOX_DB" \
		--eval "print(db.getCollection('$c').getIndexes().some(i => i.name === 'id_unique'))")"
	[ "$has_index" = "true" ] || { echo "$c has no id_unique index"; exit 1; }
done
echo "indexes: id_unique present on every collection"
echo ""
echo "Sandbox refreshed from $archive"
