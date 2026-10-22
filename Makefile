build:
	docker-compose build

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

docker-restart:
	docker-compose down
	docker-compose up -d

rc-build:
	docker-compose up -d rc_tools

rc-down:
	docker-compose down rc_tools

rc-restart:
	docker-compose build rc_tools
	docker-compose up -d --no-deps rc_tools

# Backup of the REAL database (BSON archive, includes index definitions).
# Written outside the repo and outside the Docker volume. No pruning.
BACKUP_DIR ?= $(HOME)/databases/ragged-crown-tools

db-backup:
	mkdir -p $(BACKUP_DIR)
	f=$(BACKUP_DIR)/rc-$$(date +%Y%m%d-%H%M%S).archive.gz && \
	docker exec rc_mongodb mongodump --archive --gzip > $$f.partial && \
	mv $$f.partial $$f && echo "wrote $$f"

# Unique index on `id` per collection (idempotent, safe to re-run).
# Optional: COLLECTIONS="name1 name2" to run only those.
REAL_DB ?= ragged_crown
SANDBOX_DB ?= ragged_crown_sandbox

db-indexes:
	docker exec -i -e RC_COLLECTIONS="$(COLLECTIONS)" rc_mongodb mongosh --quiet $(REAL_DB) /dev/stdin < scripts/ensure-indexes.js

sandbox-indexes:
	docker exec -i -e RC_COLLECTIONS="$(COLLECTIONS)" rc_mongodb_sandbox mongosh --quiet $(SANDBOX_DB) /dev/stdin < scripts/ensure-indexes.js

# Sandbox stack: separate project, containers, volume and port (API on :8081)
SANDBOX = docker-compose -f docker-compose.sandbox.yml

sandbox-up:
	$(SANDBOX) up -d

sandbox-down:
	$(SANDBOX) down

sandbox-restart:
	$(SANDBOX) down
	$(SANDBOX) up -d

sandbox-rc-restart:
	$(SANDBOX) build rc_tools
	$(SANDBOX) up -d --no-deps rc_tools

# Destructive: deletes the SANDBOX database volume only
sandbox-reset:
	$(SANDBOX) down -v