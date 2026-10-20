# JSON Schema Test Suite Release Checklist

Use this checklist for tasks that need to be completed just before or after a new version of the JSON Schema specification is released.

## Test directories

- [ ] Copy the tests from `tests/draft-next/` into a directory named for the new specification version.
- [ ] Update the `$schema` URIs in the copied test files to the official URI for the released specification.
- [ ] Update the `tests/latest` symbolic link to point to the new version directory.
- [ ] Copy the output tests from `output-tests/draft-next/` into a directory named for the new specification version, if applicable.
- [ ] Update the `$schema` URIs in the copied output test files to the official URI for the released specification.

## Documentation

- [ ] Update the root `README.md` to describe the new specification version and ensure the documented directory structure is accurate.
- [ ] Update `output-tests/README.md` to document the new output-test version.

## Test coverage and schemas

- [ ] Review cross-draft tests and update them where necessary for the new specification version.
- [ ] Review `test-schema.json` and update it if the new version requires changes.
- [ ] Review `output-test-schema.json` and update it if the new version requires changes.

## Validation

- [ ] Run `tox -e sanity` and resolve any failures.
- [ ] Review the diff to ensure only intended release-related changes are included.

## Automation

- [ ] Consider whether any repetitive release steps can be automated in `bin/jsonschema_suite`.