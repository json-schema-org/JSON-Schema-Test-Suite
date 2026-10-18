#!/usr/bin/env python3
"""
Checker for the unified validation/ test suite.

Usage:
    python validation/check_validation_suite.py                  # check all files
    python validation/check_validation_suite.py default.json     # check one file

Mirrors the logic of bin/jsonschema_suite but targets the new
validation/ directory and understands the compatibility field.
"""

import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

try:
    import jsonschema.validators
    import referencing.jsonschema
except ImportError:
    jsonschema = None
    DIALECT_VALIDATORS = {}
    DIALECT_SPECIFICATIONS = {}
    SPECIFICATION_DIALECTS = {}
else:
    DIALECT_VALIDATORS = {
        "3":    jsonschema.validators.Draft3Validator,
        "4":    jsonschema.validators.Draft4Validator,
        "6":    jsonschema.validators.Draft6Validator,
        "7":    jsonschema.validators.Draft7Validator,
        "2019": jsonschema.validators.Draft201909Validator,
        "2020": jsonschema.validators.Draft202012Validator,
    }
    DIALECT_SPECIFICATIONS = {
        "3":    referencing.jsonschema.DRAFT3,
        "4":    referencing.jsonschema.DRAFT4,
        "6":    referencing.jsonschema.DRAFT6,
        "7":    referencing.jsonschema.DRAFT7,
        "2019": referencing.jsonschema.DRAFT201909,
        "2020": referencing.jsonschema.DRAFT202012,
    }
    SPECIFICATION_DIALECTS = {
        specification: dialect
        for dialect, specification in DIALECT_SPECIFICATIONS.items()
    }


ROOT_DIR = Path(__file__).parent
VALIDATION_DIR = ROOT_DIR / "tests"
VALIDATION_SCHEMA_PATH = ROOT_DIR / "validation-test-schema.json"

DIALECT_ORDER = ["3", "4", "6", "7", "2019", "2020"]

ALLOWED_SCHEMA_FILES = {
    'vocabulary.json',
    'format-assertion.json'
}

UNKNOWN_KEYWORD_TEST_FILES = {
    "non-schemas.json"
}

# These reference an external schema that uses a keyword its declared
# dialect doesn't have, to check that the keyword is ignored there. Only the
# listed keyword in the listed external schema is exempt.
UNKNOWN_KEYWORD_TEST_CASES = {
    ("cross-draft.json", "refs to historic drafts are processed as historic drafts (7)"): {
        ("http://localhost:1234/draft7/ignore-dependentRequired.json", "dependentRequired"),
    },
    ("cross-draft.json", "refs to historic drafts are processed as historic drafts (2019)"): {
        ("http://localhost:1234/draft2019-09/ignore-prefixItems.json", "prefixItems"),
    },
}


def dialect_applies(compatibility: str | None, target: int) -> bool:
    is_valid: bool = True

    for constraint in (compatibility.split(",") if compatibility else []):
        match = re.search(r"(?P<operator><=|>=|=)?(?P<version>\d+)", constraint)
        if not match:
            raise ValueError(f"Invalid compatibility string: {compatibility}")

        operator: str = match.group("operator") or ">="
        version: int = int(match.group("version"))

        if operator == ">=":
            is_valid = target >= version
        elif operator == "<=":
            is_valid = target <= version
        elif operator == "=":
            is_valid = target == version

        if target <= version:
            break

    return is_valid


def collect(directory: Path, filename_filter: str | None = None):
    """Yield all *.json paths under directory, optionally filtered by name."""
    for path in sorted(directory.rglob("*.json")):
        if filename_filter is None or path.name == filename_filter:
            yield path
            continue

        relative = path.relative_to(directory).as_posix()
        if relative == filename_filter.replace("\\", "/"):
            yield path


def load(path: Path):
    def reject_constant(token):
        raise ValueError(f"Invalid JSON numeric constant: {token}")

    return json.loads(path.read_text(encoding="utf-8"), parse_constant=reject_constant)


def load_cases(path: Path) -> list:
    suite = load(path)
    return suite["tests"] if isinstance(suite, dict) else suite


def schema_keywords(schema, specification):
    """
    Yield (dialect, keyword) for every keyword in schema and in each of its
    subschemas, using the dialect's specification to find where subschemas
    live. A schema that declares a recognized $schema is read with that
    dialect's rules; any other $schema keeps the enclosing dialect.
    """
    if not isinstance(schema, dict):
        return
    dialect_id = schema.get("$schema")
    if isinstance(dialect_id, str):
        specification = referencing.jsonschema.specification_with(
            dialect_id, default=specification,
        )
    dialect = SPECIFICATION_DIALECTS.get(specification)
    for keyword in schema:
        yield dialect, keyword
    for subschema in specification.subresources_of(schema):
        yield from schema_keywords(subschema, specification)


KNOWN = {
            "2020": {
                "$anchor",
                "$comment",
                "$defs",
                "$dynamicAnchor",
                "$dynamicRef",
                "$id",
                "$ref",
                "$schema",
                "$vocabulary",
                "additionalProperties",
                "allOf",
                "anyOf",
                "const",
                "contains",
                "contentEncoding",
                "contentMediaType",
                "contentSchema",
                "default",
                "dependencies",
                "dependentRequired",
                "dependentSchemas",
                "description",
                "else",
                "enum",
                "exclusiveMaximum",
                "exclusiveMinimum",
                "format",
                "if",
                "items",
                "maxContains",
                "maxItems",
                "maxLength",
                "maxProperties",
                "maximum",
                "minContains",
                "minItems",
                "minLength",
                "minProperties",
                "minimum",
                "multipleOf",
                "not",
                "oneOf",
                "pattern",
                "patternProperties",
                "prefixItems",
                "properties",
                "propertyNames",
                "required",
                "then",
                "title",
                "type",
                "unevaluatedItems",
                "unevaluatedProperties",
                "uniqueItems",
            },
            "2019": {
                "$anchor",
                "$comment",
                "$defs",
                "$id",
                "$recursiveAnchor",
                "$recursiveRef",
                "$ref",
                "$schema",
                "$vocabulary",
                "additionalItems",
                "additionalProperties",
                "allOf",
                "anyOf",
                "const",
                "contains",
                "contentEncoding",
                "contentMediaType",
                "contentSchema",
                "default",
                "dependencies",
                "dependentRequired",
                "dependentSchemas",
                "description",
                "else",
                "enum",
                "exclusiveMaximum",
                "exclusiveMinimum",
                "format",
                "if",
                "items",
                "maxContains",
                "maxItems",
                "maxLength",
                "maxProperties",
                "maximum",
                "minContains",
                "minItems",
                "minLength",
                "minProperties",
                "minimum",
                "multipleOf",
                "not",
                "oneOf",
                "pattern",
                "patternProperties",
                "properties",
                "propertyNames",
                "required",
                "then",
                "title",
                "type",
                "unevaluatedItems",
                "unevaluatedProperties",
                "uniqueItems",
            },
            "7": {
                "$comment",
                "$id",
                "$ref",
                "$schema",
                "additionalItems",
                "additionalProperties",
                "allOf",
                "anyOf",
                "const",
                "contains",
                "contentEncoding",
                "contentMediaType",
                "default",
                "definitions",
                "dependencies",
                "description",
                "else",
                "enum",
                "exclusiveMaximum",
                "exclusiveMinimum",
                "format",
                "if",
                "items",
                "maxItems",
                "maxLength",
                "maxProperties",
                "maximum",
                "minItems",
                "minLength",
                "minProperties",
                "minimum",
                "multipleOf",
                "not",
                "oneOf",
                "pattern",
                "patternProperties",
                "properties",
                "propertyNames",
                "required",
                "then",
                "title",
                "type",
                "uniqueItems",
            },
            "6": {
                "$comment",
                "$id",
                "$ref",
                "$schema",
                "additionalItems",
                "additionalProperties",
                "allOf",
                "anyOf",
                "const",
                "contains",
                "default",
                "definitions",
                "dependencies",
                "description",
                "enum",
                "exclusiveMaximum",
                "exclusiveMinimum",
                "format",
                "items",
                "maxItems",
                "maxLength",
                "maxProperties",
                "maximum",
                "minItems",
                "minLength",
                "minProperties",
                "minimum",
                "multipleOf",
                "not",
                "oneOf",
                "pattern",
                "patternProperties",
                "properties",
                "propertyNames",
                "required",
                "title",
                "type",
                "uniqueItems",
            },
            "4": {
                "$ref",
                "$schema",
                "additionalItems",
                "additionalProperties",
                "allOf",
                "anyOf",
                "default",
                "definitions",
                "dependencies",
                "description",
                "enum",
                "exclusiveMaximum",
                "exclusiveMinimum",
                "format",
                "id",
                "items",
                "maxItems",
                "maxLength",
                "maxProperties",
                "maximum",
                "minItems",
                "minLength",
                "minProperties",
                "minimum",
                "multipleOf",
                "not",
                "oneOf",
                "pattern",
                "patternProperties",
                "properties",
                "required",
                "title",
                "type",
                "uniqueItems",

                # Technically this is wrong, $comment doesn't exist in this
                # draft, but the point of this test is to detect mistakes by,
                # test authors, whereas the point of the $comment keyword is
                # to just standardize a place for a comment, so it's not a
                # mistake to use it in earlier drafts in tests per se.
                "$comment",
            },
            "3": {
                "$ref",
                "$schema",
                "additionalItems",
                "additionalProperties",
                "default",
                "definitions",
                "dependencies",
                "description",
                "disallow",
                "divisibleBy",
                "enum",
                "exclusiveMaximum",
                "exclusiveMinimum",
                "extends",
                "format",
                "id",
                "items",
                "maxItems",
                "maxLength",
                "maximum",
                "minItems",
                "minLength",
                "minimum",
                "pattern",
                "patternProperties",
                "properties",
                "required",
                "title",
                "type",
                "uniqueItems",
                # Technically this is wrong, $comment doesn't exist in this
                # draft, but the point of this test is to detect mistakes by,
                # test authors, whereas the point of the $comment keyword is
                # to just standardize a place for a comment, so it's not a
                # mistake to use it in earlier drafts in tests per se.
                "$comment",
            },
        }


class JSONLoadingChecks(unittest.TestCase):
    def test_rejects_non_json_constants(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "invalid.json"
            for token in ("NaN", "Infinity", "-Infinity"):
                with self.subTest(token=token):
                    path.write_text('{"data": [' + token + ']}', encoding="utf-8")
                    with self.assertRaises(ValueError):
                        load(path)

    def test_accepts_strings_and_large_numbers(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "valid.json"
            for text in (
                '["NaN", "Infinity", "-Infinity"]',
                "[1e400]",
                "[123456789012345678901234567890]",
            ):
                with self.subTest(text=text):
                    path.write_text(text, encoding="utf-8")
                    load(path)


@unittest.skipIf(jsonschema is None, "jsonschema library not installed")
class SchemaKeywordsChecks(unittest.TestCase):
    def test_finds_keywords_in_nested_subschemas(self):
        schema = {
            "properties": {"foo": {"minimun": 1}},
            "items": {"prefixItems": [{"maximun": 2}]},
            "$defs": {"unused": {"typo": True}},
        }
        keywords = {
            keyword for _, keyword in
            schema_keywords(schema, DIALECT_SPECIFICATIONS["2020"])
        }
        self.assertLessEqual(
            {"minimun", "prefixItems", "maximun", "typo"}, keywords
        )

    def test_ignores_values_that_are_not_schemas(self):
        schema = {"enum": [{"typo": 1}], "const": {"typo": 2}}
        keywords = {
            keyword for _, keyword in
            schema_keywords(schema, DIALECT_SPECIFICATIONS["2020"])
        }
        self.assertEqual(keywords, {"enum", "const"})

    def test_reads_an_embedded_schema_with_its_own_dialect(self):
        schema = {
            "$defs": {
                "embedded": {
                    "$id": "https://example.com/embedded",
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "prefixItems": [],
                },
            },
        }
        found = set(schema_keywords(schema, DIALECT_SPECIFICATIONS["2019"]))
        self.assertIn(("2019", "$defs"), found)
        self.assertIn(("2020", "prefixItems"), found)

    def test_keeps_the_dialect_for_an_unrecognized_schema(self):
        schema = {"$schema": "https://example.com/custom", "minimum": 1}
        found = set(schema_keywords(schema, DIALECT_SPECIFICATIONS["2019"]))
        self.assertEqual(found, {("2019", "$schema"), ("2019", "minimum")})


class ValidationSuiteChecks(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.file_filter = getattr(cls, "_file_filter", None)
        cls.test_files = list(collect(VALIDATION_DIR, cls.file_filter))
        if not cls.test_files:
            raise AssertionError(
                f"No files found in {VALIDATION_DIR}"
                + (f" matching {cls.file_filter}" if cls.file_filter else "")
            )
        print(f"\nChecking {len(cls.test_files)} file(s) in {VALIDATION_DIR}")

        if VALIDATION_SCHEMA_PATH.exists():
            cls.validation_schema = load(VALIDATION_SCHEMA_PATH)
        else:
            cls.validation_schema = None
            print(
                f"  WARNING: {VALIDATION_SCHEMA_PATH.name} not found — "
                "test_suites_are_valid will be skipped"
            )

    def test_files_are_valid_json(self):
        """
        All files contain valid JSON.
        """
        for path in self.test_files:
            with self.subTest(path=path.name):
                try:
                    load_cases(path)
                except ValueError as e:
                    self.fail(f"{path.name} is not valid JSON: {e}")

    @unittest.skipIf(jsonschema is None, "jsonschema library not installed")
    def test_suites_are_valid(self):

        Validator = jsonschema.validators.validator_for(self.validation_schema)
        validator = Validator(self.validation_schema)
        for path in self.test_files:
            with self.subTest(path=path.name):
                try:
                    validator.validate(load(path))
                except jsonschema.ValidationError as e:
                    self.fail(
                        f"{path.name} does not conform to "
                        f"validation-test-schema.json:\n{e.message}"
                    )

    @unittest.skipIf(jsonschema is None, "jsonschema library not installed")
    def test_all_schemas_are_valid(self):
        """
        Each test case schema must be valid under the metaschema of every
        dialect its compatibility field covers.
        """
        for path in self.test_files:
            for case in load_cases(path):
                compat = case.get("compatibility", "")
                if compat == "9999":
                    continue
                schema = case.get("schema", {})
                applicable = [
                    d for d in DIALECT_ORDER if dialect_applies(compat, int(d))
                ]
                for dialect in applicable:
                    if dialect not in DIALECT_VALIDATORS:
                        continue
                    Validator = DIALECT_VALIDATORS[dialect]
                    # Valid (optional test) schemas contain regexes which
                    # aren't valid Python regexes, so skip checking it
                    format_checker = getattr(Validator, "FORMAT_CHECKER", None)
                    if format_checker is not None:
                        format_checker.checkers.pop("regex", None)

                    with self.subTest(
                        file=path.name,
                        case=case.get("description"),
                        dialect=dialect,
                    ):
                        try:
                            Validator.check_schema(schema)
                        except jsonschema.SchemaError as e:
                            self.fail(
                                f"Schema is invalid under release {dialect} "
                                f"metaschema:\n{e.message}"
                            )

                for uri, external_schema in case.get("externalSchemas", {}).items():
                    if isinstance(external_schema, bool):
                        continue

                    if "$schema" in external_schema:
                        Validator = jsonschema.validators.validator_for(external_schema)

                        try:
                            Validator.check_schema(external_schema)
                        except jsonschema.SchemaError as e:
                            self.fail(
                                f"External schema {uri!r} is invalid:\n{e.message}"
                            )
                    else:
                        for dialect in applicable:
                            if dialect not in DIALECT_VALIDATORS:
                                continue

                            Validator = DIALECT_VALIDATORS[dialect]

                            try:
                                Validator.check_schema(external_schema)
                            except jsonschema.SchemaError as e:
                                self.fail(
                                    f"External schema {uri!r} is invalid under "
                                    f"release {dialect}:\n{e.message}"
                                )

    @unittest.skipIf(jsonschema is None, "jsonschema library not installed")
    def test_schemas_do_not_use_unknown_keywords(self):
        """
        Test case schemas must not use keywords that didn't exist in the
        minimum dialect their compatibility field allows.

        For example, a case with compatibility "4" must not use `prefixItems`
        (a draft 2020 keyword). This catches accidental keyword leakage across
        drafts.

        Every subschema is checked, not only the ones an implementation would
        evaluate against a particular instance, and so are external schemas.
        A schema that declares its own $schema is checked against that
        dialect.

        Mirrors test_arbitrary_schemas_do_not_use_unknown_keywords in
        bin/jsonschema_suite, adapted for compatibility-based dialect selection.
        """
        for path in self.test_files:
            if path.name in UNKNOWN_KEYWORD_TEST_FILES:
                continue

            for case in load_cases(path):
                if "unknown keyword" in case.get("description", ""):
                    continue
                allowed = UNKNOWN_KEYWORD_TEST_CASES.get(
                    (path.name, case.get("description")), set(),
                )

                compat = case.get("compatibility", "")
                if compat == "9999":
                    continue
                schemas = [
                    (None, case.get("schema", {})),
                    *case.get("externalSchemas", {}).items(),
                ]

                applicable = [
                    d for d in DIALECT_ORDER if dialect_applies(compat, int(d))
                ]

                for dialect in applicable:
                    if dialect not in DIALECT_SPECIFICATIONS:
                        continue
                    specification = DIALECT_SPECIFICATIONS[dialect]

                    with self.subTest(
                        file=path.name,
                        case=case.get("description"),
                        dialect=dialect,
                    ):
                        unknown = sorted({
                            f"{keyword} (release {release})"
                            for uri, schema in schemas
                            for release, keyword in schema_keywords(
                                schema, specification,
                            )
                            if release and keyword not in KNOWN[release]
                            and (uri, keyword) not in allowed
                        })
                        if unknown:
                            self.fail(
                                f"{unknown} are not known keywords when the "
                                f"case is read as release {dialect}. "
                                f"Either the compatibility field is too broad, "
                                f"the keyword is a typo, or it needs adding to "
                                f"the KNOWN allowlist in the checker."
                            )

    def test_compatibility_syntax_is_valid(self):
        for path in self.test_files:
            for i, case in enumerate(load_cases(path)):
                compat = case.get("compatibility", "")
                with self.subTest(file=path.name, case=case.get("description", i)):
                    try:
                        dialect_applies(compat, 9999)
                    except ValueError as e:
                        self.fail(str(e))

    def test_each_case_applies_to_at_least_one_dialect(self):
        for path in self.test_files:
            for case in load_cases(path):
                compat = case.get("compatibility", "")
                if compat == "9999":
                    continue
                with self.subTest(file=path.name, case=case.get("description")):
                    matches = [d for d in DIALECT_ORDER if dialect_applies(compat, int(d))]
                    self.assertTrue(
                        matches,
                        f"compatibility={compat!r} matches no dialect — "
                        f"this test case would never run"
                    )

    def test_no_schema_keyword_in_schemas(self):
        """
        Per migration rules: $schema must be stripped from all test case
        schemas so they stay compatible with as many dialects as possible.
        """

        for path in self.test_files:

            allow_schema = path.name in ALLOWED_SCHEMA_FILES

            for case in load_cases(path):
                with self.subTest(file=path.name, case=case.get("description")):
                    schema = case.get("schema", {})

                    if isinstance(schema, bool):
                        continue

                    if allow_schema:
                        continue

                    self.assertNotIn(
                        "$schema",
                        schema,
                        "Test case schema must not contain $schema — "
                        "remove it so the test stays dialect-agnostic",
                    )

    def test_case_descriptions_unique_per_file(self):
        for path in self.test_files:
            cases = load_cases(path)
            descs = [c["description"] for c in cases]
            with self.subTest(file=path.name):
                self.assertEqual(
                    len(descs), len(set(descs)),
                    f"Duplicate case descriptions in {path.name}"
                )

    def test_test_descriptions_unique_per_case(self):
        for path in self.test_files:
            for case in load_cases(path):
                descs = [t["description"] for t in case.get("tests", [])]
                with self.subTest(file=path.name, case=case.get("description")):
                    self.assertEqual(
                        len(descs), len(set(descs)),
                        f"Duplicate test descriptions in case '{case.get('description')}'"
                    )

    def test_descriptions_do_not_use_modal_verbs(self):
        for path in self.test_files:
            for case in load_cases(path):
                all_descs = [case["description"]] + [
                    t["description"] for t in case.get("tests", [])
                ]
                for desc in all_descs:
                    with self.subTest(file=path.name, desc=desc):
                        self.assertNotRegex(desc, r"\bshould\b")
                        self.assertNotRegex(desc, r"(?i)\btest(s)? that\b")

    def test_zzz_summary(self):
        """
        Print a compatibility coverage summary (runs last due to zzz_).
        """
        total_cases = 0
        for path in self.test_files:
            cases = load_cases(path)
            total_cases += len(cases)
            coverage = {d: 0 for d in DIALECT_ORDER}
            for case in cases:
                compat = case.get("compatibility", "")
                for d in DIALECT_ORDER:
                    if dialect_applies(compat, int(d)):
                        coverage[d] += 1
            print(f"\n  {path.name}: {len(cases)} case(s)")
            print(f"    Coverage by dialect: {coverage}")
        print(f"\n  Total cases checked: {total_cases}")


if __name__ == "__main__":
    # Optional: pass a filename to check just one file
    #   python check_validation_suite.py default.json
    if len(sys.argv) > 1 and sys.argv[1].endswith(".json"):
        ValidationSuiteChecks._file_filter = sys.argv[1]
        sys.argv.pop(1)

    unittest.main(verbosity=2)
