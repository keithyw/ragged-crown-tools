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