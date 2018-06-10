TAG=json-schema-org/test-suite

build:
	docker build -t $(TAG) .

shell:
	docker run -v $(CURDIR):/src -it $(TAG)

init:
	docker run -v $(CURDIR):/src -it $(TAG) npm install

test:
	docker run -v $(CURDIR):/src -it $(TAG) tox && npm test
