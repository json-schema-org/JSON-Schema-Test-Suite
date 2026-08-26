# JSON Schema Test Suite

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](https://github.com/json-schema-org/.github/blob/main/CODE_OF_CONDUCT.md)
[![Project Status: Active – The project has reached a stable, usable state and is being actively developed.](https://www.repostatus.org/badges/latest/active.svg)](https://www.repostatus.org/#active)
[![Financial Contributors on Open Collective](https://opencollective.com/json-schema/all/badge.svg?label=financial+contributors)](https://opencollective.com/json-schema)

[![DOI](https://zenodo.org/badge/5952934.svg)](https://zenodo.org/badge/latestdoi/5952934)

This repository contains a set of JSON objects that implementers of JSON Schema
libraries can use to test their implementations.

It is meant to be language agnostic and should require only a JSON parser. The
conversion of the JSON objects into tests within a specific language and test
framework of choice is left to be done by the implementation author.

The recommended workflow of this test suite is to clone the `main` branch of
this repository as a `git submodule` or `git subtree`. The `main` branch is
always stable.

## Test Suites

This repository contains multiple test suites, each focusing on a different
aspect of JSON Schema implementations:

- [**Validation**](./validation/) - Tests for JSON Schema validation behavior.
  This is the primary test suite covering all released versions of the JSON Schema
  specification.
- [**Annotations**](./annotations/) - Tests for annotation collection behavior
  across JSON Schema implementations.
- [**Output**](./output-tests/) - Tests for output format generation in
  accordance with the specification.

## Contributing

If you see something missing or incorrect, a pull request is most welcome!

This repository is maintained by the JSON Schema organization, and is governed
by the JSON Schema steering committee.
