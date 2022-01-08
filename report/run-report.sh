#!/bin/sh

export IMPLEMENTATION=${1}

echo "Running test suite with '${1}'"

docker image rm test-run -f

docker build -t test-run --build-arg IMPLEMENTATION=${1} .

docker create --name test-run test-run

docker-compose run test-suite

# docker-compose logs --no-color > docker-compose.log
# [[ -z "${failed:-}" ]] || exit 1