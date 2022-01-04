#!/bin/sh

export IMPLEMENTATION=${1}

echo "Running test suite with '${1}'"

docker-compose run test-suite

docker-compose logs --no-color > docker-compose.log
[[ -z "${failed:-}" ]] || exit 1