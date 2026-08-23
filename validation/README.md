# Validation Tests Suite

This suite unifies what used to be separate, per-draft test collections 
`(tests/draft3/, tests/draft4/, tests/draft6/, tests/draft7/, tests/draft2019-09/, tests/draft2020-12/)` 
into a single set of files under `validation/tests/`, organized by keyword instead of by dialect. 

Each Test Case declares which dialect(s) it applies to using the `compatibility`field described below.

## Supported Dialects

Some keywords changed between dialects (for example, `id` became `$id` in draft-06, and `definitions` became `$defs` in 2019-09). 

To keep a single test file useful across as many dialects as possible, Test Case schemas in this suite avoid `$schema` 
so they aren't tied to one dialect, and instead use the `compatibility` field to declare which dialect(s) a given case is written for.

## Test Case Components

### description

A short description of what behavior the Test Case is covering.

### compatibility

The `compatibility` option allows you to set which dialects the Test Case is
compatible with.

Dialects are indicated by the number corresponding to their release. Date-based
releases use just the year. If this option isn't present, it means the Test Case
is compatible with any dialect.

If this option is present with a number, the number indicates the minimum
release the Test Case is compatible with. This example indicates that the Test
Case is compatible with draft-07 and up.

**Example**: `"compatibility": "7"`

You can use a `<=` operator to indicate that the Test Case is compatible with
releases less than or equal to the given release. This example indicates that
the Test Case is compatible with 2019-09 and under.

**Example**: `"compatibility": "<=2019"`

You can use comma-separated values to indicate multiple constraints if needed.
This example indicates that the Test Case is compatible with releases between
draft-06 and 2019-09.

**Example**: `"compatibility": "6,<=2019"`

For convenience, you can use the `=` operator to indicate a Test Case is only
compatible with a single release. This example indicates that the Test Case is
compatible only with 2020-12.

**Example**: `"compatibility": "=2020"`

This example indicates that the Test Case is compatible with draft-3 only, plus draft-7 through 2020-12.

**Example**: `"compatibility": "=3,7,<=2020"`

### schema

The schema that will serve as the subject for the tests. Whenever possible, this
schema shouldn't include `$schema` because Test Cases should be designed to work with as many releases as possible.

### externalSchemas

This allows you to define additional schemas that `schema` makes references to.
The value is an object where the keys are retrieval URIs and values are schemas.
Most external schemas aren't self identifying (using `id`/`$id`) and rely on the
retrieval URI for identification. This is done to increase the number of
dialects that the test is compatible with.  Because `id` changed to `$id` in
draft-06, if you use `$id`, the test becomes incompatible with draft-03/4 and in
most cases, that's not necessary.

### Specification

An optional list of references to the specification document(s) that define the behaviour under test. 

Each entry can reference a section of the JSON Schema specification or another relevant specification,
such as an RFC or ISO standard. It can also include a `quote` describing the part of the specification that motivates the Test Case. 

This helps trace a Test Case back to the specification.

### tests

A collection of Tests to run to verify the Test Case.

## Test Components

### description

A short description of what behaviour the individual test is covering.

### data

The instance to validate against `schema`.

### valid

Whether `data` is expected to be valid or invalid under `schema`.

## Legacy

Some keywords changed shape across dialects.

A `-legacy` file exists only where a keyword's underlying mechanism changed in a way `compatibility` alone can't express.

## Examples

#### Example: A Test Case with externalSchemas

From `anchor.json`, The schema references a remote document that would previously have lived under `remotes/`

```json
    {
            "description": "anchor within remote ref",
            "compatibility": "2019",
            "schema": {
                "$ref": "http://localhost:1234/locationIndependentIdentifier.json#foo"
            },
            "externalSchemas": {
                "http://localhost:1234/locationIndependentIdentifier.json": {
                    "$defs": {
                        "refToInteger": {
                            "$ref": "#foo"
                        },
                        "A": {
                            "$anchor": "foo",
                            "type": "integer"
                        }
                    }
                }
            },
            "tests": [
                {
                    "description": "remote anchor valid",
                    "data": 1,
                    "valid": true
                },
                {
                    "description": "remote anchor invalid",
                    "data": "a",
                    "valid": false
                }
            ]
        },
```

The key in `externalSchemas`(`http://localhost:1234/...`) is the retrieval URI the `$ref` resolves against.

The same Test Case is expressed for pre-`2019-09` dialects in `anchor-legacy.json`

## Running the Suite

To check every file in `validation/tests/`:

```bash
python validation/check_validation_suite.py
```
or, if `tox` is installed:

```bash
tox -e sanity
```

To check a single file:

```bash
python validation/check_validation_suite.py anchor.json
```
