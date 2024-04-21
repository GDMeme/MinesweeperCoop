IMAGE=minesweeper-coop:v1.0
PORT=10000

default:
	echo default
build: clean
	docker image rm $$(docker images | grep minesweeper-coop | head -2 | tail -1 | awk '{print $$3}') || \
	echo "no image found"
	docker build -t $(IMAGE) .
clean:
	docker container prune -f
	docker image prune -f
run: build
	docker run --detach --publish $(PORT):$(PORT) $(IMAGE)
stop:
	@docker stop $$(docker ps | grep minesweeper-coop | head -2 | tail -1 | awk '{print $$1}')
deploy: build run
