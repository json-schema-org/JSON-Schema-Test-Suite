#!/usr/bin/env python3
# Annotation Test Harness — runs the official JSON Schema annotation tests
# against jschon and reports PASS/FAIL per assertion.
#
# Usage: python annotation_harness.py [--verbose]
# Exit:  0 = all pass, 1 = any fail

import json
import sys
from pathlib import Path

from jschon import JSON, Catalog, JSONSchema, create_catalog

# ---- Config ----

DIALECT = "2020-12"
DIALECT_NUMBER = 2020
METASCHEMA_URI = "https://json-schema.org/draft/2020-12/schema"
ANNOTATIONS_DIR = Path(__file__).resolve().parent / "annotations" / "tests"

# Maps compatibility strings to sortable version numbers
DIALECT_MAP = {
    "3": 3, "4": 4, "6": 6, "7": 7,
    "2019": 2019, "2020": 2020,
}


# ---- Loader ----
# Single responsibility: read test files from disk, nothing else.

def load_test_files(directory: Path) -> list[dict]:
    """Parses every .json file in annotations/tests/ into structured dicts."""
    files = []
    for path in sorted(directory.glob("*.json")):
        with open(path, encoding="utf-8") as f:
            data = json.load(f)
        files.append({
            "filename": path.name,
            "description": data.get("description", path.stem),
            "suite": data.get("suite", []),
        })
    return files


# ---- Filter ----
# Decides whether a test case applies to our target dialect.
# Keeps filtering logic isolated from the rest of the pipeline.

def parse_compatibility(compat_str: str | None, dialect_num: int) -> bool:
    """Returns True if the test case should run for our dialect.

    Supports: "7" (>=), "<=2019", "=2020", and comma-separated combos.
    None means always compatible.
    """
    if compat_str is None:
        return True

    for constraint in compat_str.split(","):
        constraint = constraint.strip()
        if constraint.startswith("<="):
            version = DIALECT_MAP.get(constraint[2:])
            if version is None or dialect_num > version:
                return False
        elif constraint.startswith("="):
            version = DIALECT_MAP.get(constraint[1:])
            if version is None or dialect_num != version:
                return False
        else:
            version = DIALECT_MAP.get(constraint)
            if version is None or dialect_num < version:
                return False
    return True


# ---- Compiler ----
# Builds a JSONSchema object the validator can use.
# Handles the quirk that test-suite schemas omit $schema for portability,
# but jschon requires it — so we inject it here.

def compile_schema(
    catalog: Catalog, schema_data, external_schemas: dict | None = None
) -> JSONSchema:
    """Creates a JSONSchema, injecting $schema and registering externals."""

    # Register any referenced external schemas first
    if external_schemas:
        for uri, ext_schema in external_schemas.items():
            if isinstance(ext_schema, dict):
                ext_copy = dict(ext_schema)
                if "$schema" not in ext_copy:
                    ext_copy["$schema"] = METASCHEMA_URI
                JSONSchema(ext_copy, uri=uri)
            else:
                JSONSchema(ext_schema, uri=uri)  # boolean schema

    # Boolean schemas (true/false) don't take $schema
    if isinstance(schema_data, bool):
        return JSONSchema(schema_data)

    # Inject $schema when missing so jschon knows which dialect to use
    schema_copy = dict(schema_data)
    if "$schema" not in schema_copy:
        schema_copy["$schema"] = METASCHEMA_URI

    return JSONSchema(schema_copy)


# ---- Evaluator ----
# Runs the schema against an instance and returns raw output.
# Kept thin on purpose — one job, no side effects.

def evaluate_instance(schema: JSONSchema, instance) -> dict:
    """Evaluates instance against schema, returns jschon's basic output."""
    result = schema.evaluate(JSON(instance))
    return result.output("basic")


# ---- Normalizer ----
# Transforms jschon's output shape into the format the test suite expects.
# This is the hardest part — jschon uses absoluteKeywordLocation (a full URI),
# while the suite expects plain fragment pointers like "#/properties/foo".

def extract_keyword(keyword_location: str) -> str:
    """Grabs the keyword name from the end of a keywordLocation path.
    "/properties/foo/title" -> "title"
    """
    return keyword_location.rsplit("/", 1)[-1]


def normalize_schema_location(abs_keyword_location: str) -> str:
    """Converts absoluteKeywordLocation to a schema fragment pointer.

    "urn:uuid:xxx#/properties/foo/title" -> "#/properties/foo"
    "urn:uuid:xxx#/title"                -> "#"

    Key insight: we use absoluteKeywordLocation (not keywordLocation)
    because it correctly resolves $ref to the actual $defs location.
    """
    if "#" not in abs_keyword_location:
        return "#"

    fragment = abs_keyword_location.split("#", 1)[1]

    # Single-segment fragment like "/title" means root schema
    if "/" not in fragment or fragment.count("/") == 1:
        return "#"

    # Strip the trailing keyword to get the schema location
    parent = fragment.rsplit("/", 1)[0]
    return "#" + parent


# Applicator keywords that emit their own bookkeeping annotations
# (e.g. "properties" emits which property names matched). The test
# suite doesn't check for these, so we skip them.
_APPLICATOR_KEYWORDS = frozenset({
    "properties", "patternProperties", "additionalProperties",
    "items", "prefixItems", "contains",
    "if", "unevaluatedProperties", "unevaluatedItems",
})


def normalize_annotations(output: dict) -> dict:
    """Reshapes jschon output into {(instanceLoc, keyword): {schemaLoc: value}}.

    This is the shape the test suite assertions expect.
    """
    result = {}

    for ann in output.get("annotations", []):
        instance_loc = ann.get("instanceLocation", "")
        keyword_loc = ann.get("keywordLocation", "")
        abs_keyword_loc = ann.get("absoluteKeywordLocation", "")
        value = ann.get("annotation")

        keyword = extract_keyword(keyword_loc)

        # Skip applicator bookkeeping (list of matched props, bool flags)
        if keyword in _APPLICATOR_KEYWORDS and isinstance(value, (list, bool)):
            continue

        schema_loc = normalize_schema_location(abs_keyword_loc)

        key = (instance_loc, keyword)
        if key not in result:
            result[key] = {}
        result[key][schema_loc] = value

    return result


# ---- Asserter ----
# Compares expected vs actual annotations. Open/closed: easy to extend
# with new comparison modes without touching existing logic.

def deep_equal(expected, actual) -> bool:
    """Recursive equality that handles dicts, lists, and JSON primitives."""
    if type(expected) is not type(actual):
        # JSON doesn't distinguish int/float
        if isinstance(expected, (int, float)) and isinstance(actual, (int, float)):
            return expected == actual
        return False
    if isinstance(expected, dict):
        if set(expected.keys()) != set(actual.keys()):
            return False
        return all(deep_equal(expected[k], actual[k]) for k in expected)
    if isinstance(expected, list):
        if len(expected) != len(actual):
            return False
        return all(deep_equal(e, a) for e, a in zip(expected, actual, strict=False))
    return expected == actual


def check_assertion(normalized: dict, assertion: dict) -> tuple[bool, str]:
    """Checks one assertion. Returns (passed, failure_message)."""
    location = assertion["location"]
    keyword = assertion["keyword"]
    expected = assertion["expected"]

    actual = normalized.get((location, keyword), {})

    # Empty expected = annotation must NOT exist here
    if expected == {}:
        if not actual:
            return True, ""
        return False, (
            f"Expected NO annotations at '{location}' for '{keyword}', "
            f"but got: {json.dumps(actual)}"
        )

    # Non-empty expected = must match exactly
    if deep_equal(expected, actual):
        return True, ""
    return False, (
        f"Mismatch at '{location}' for '{keyword}':\n"
        f"         Expected: {json.dumps(expected, sort_keys=True)}\n"
        f"         Got:      {json.dumps(actual, sort_keys=True)}"
    )


# ---- Reporter ----
# Single responsibility: format and print results.
# Knows nothing about schemas or assertions — just tallies.

class Reporter:
    """Collects pass/fail counts and prints a human-readable report."""

    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.total_pass = 0
        self.total_fail = 0
        self.total_skip = 0

    def file_header(self, filename: str):
        print(f"\n--- {filename} ---")

    def skip(self, description: str, reason: str):
        self.total_skip += 1
        if self.verbose:
            print(f"  [SKIP] {description} ({reason})")

    def test_case(
        self, description: str, passed: int, failed: int, failures: list[str]
    ):
        total = passed + failed
        if failed == 0:
            print(f"  [PASS] {description} ({passed}/{total} assertions passed)")
        else:
            print(f"  [FAIL] {description} ({passed}/{total} assertions passed)")
            for msg in failures:
                print(f"         {msg}")
        self.total_pass += passed
        self.total_fail += failed

    def error(self, description: str, err: str):
        print(f"  [ERROR] {description}: {err}")
        self.total_fail += 1

    def summary(self):
        total = self.total_pass + self.total_fail
        print(f"\n{'=' * 60}")
        print(f"RESULTS: {self.total_pass}/{total} assertions passed, "
              f"{self.total_fail} failed, {self.total_skip} test cases skipped")
        if self.total_fail == 0:
            print("All assertions PASSED!")
        print(f"{'=' * 60}")

    @property
    def exit_code(self) -> int:
        return 1 if self.total_fail > 0 else 0


# ---- Pipeline ----
# Orchestrates all stages. Each stage has a single responsibility;
# this function just wires them together in order.

def run_harness(verbose: bool = False) -> int:
    """Runs the full pipeline:
    load -> filter -> compile -> evaluate -> normalize -> assert -> report.
    """

    print("=" * 60)
    print("JSON Schema Annotation Test Harness")
    print("Implementation: jschon (Python)")
    print(f"Target Dialect: {DIALECT}")
    print("=" * 60)

    catalog = create_catalog(DIALECT)
    reporter = Reporter(verbose=verbose)
    test_files = load_test_files(ANNOTATIONS_DIR)

    if not test_files:
        print(f"ERROR: No test files found in {ANNOTATIONS_DIR}")
        return 1

    for test_file in test_files:
        filename = test_file["filename"]
        reporter.file_header(filename)

        for test_case in test_file["suite"]:
            desc = test_case.get("description", "(no description)")
            compat = test_case.get("compatibility")

            # Filter incompatible test cases
            if not parse_compatibility(compat, DIALECT_NUMBER):
                reporter.skip(desc, f"incompatible with {DIALECT}")
                continue

            try:
                # Compile the schema
                schema = compile_schema(
                    catalog, test_case["schema"], test_case.get("externalSchemas")
                )

                passed = 0
                failed = 0
                failures = []

                for test in test_case["tests"]:
                    # Evaluate and normalize
                    output = evaluate_instance(schema, test["instance"])
                    normalized = normalize_annotations(output)

                    # Check each assertion
                    for assertion in test.get("assertions", []):
                        ok, msg = check_assertion(normalized, assertion)
                        if ok:
                            passed += 1
                        else:
                            failed += 1
                            failures.append(msg)

                reporter.test_case(desc, passed, failed, failures)

            except Exception as e:
                reporter.error(desc, str(e))

    reporter.summary()
    return reporter.exit_code


if __name__ == "__main__":
    verbose = "--verbose" in sys.argv or "-v" in sys.argv
    sys.exit(run_harness(verbose=verbose))
