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