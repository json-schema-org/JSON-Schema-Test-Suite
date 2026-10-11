#!/usr/bin/env python3
"""
Sanity checker for the output-tests/ test suite.

Usage:
    python output-tests/check_output_suite.py                  # check all fixtures
    python output-tests/check_output_suite.py general.json     # check one fixture

Verifies that all JSON files under output-tests/ are valid JSON,
that fixture files conform to output-tests/output-test-schema.json,
and that case and test descriptions meet length and style guidelines.
"""

import json
import os
import sys
import unittest
from pathlib import Path

try:
    import jsonschema.validators
except ImportError:
    jsonschema = None


ROOT_DIR = Path(__file__).resolve().parent
OUTPUT_METASCHEMA_NAME = "output-test-schema.json"
SUPPORTING_SCHEMA_NAME = "output-schema.json"


def load(path: Path):
    """
    Load a JSON file strictly, rejecting non-JSON numeric constants like NaN/Infinity.
    """
    def reject_constant(token):
        raise ValueError(f"Invalid JSON numeric constant: {token}")

    return json.loads(path.read_text(encoding="utf-8"), parse_constant=reject_constant)


def files(paths):
    """
    Yield (path, cases) for each file path.
    """
    for path in paths:
        yield path, load(path)


def cases(paths):
    """
    Yield each test case across the provided file paths.
    """
    for _, test_file in files(paths):
        yield from test_file


def tests(paths):
    """
    Yield each individual test across the provided file paths without schema mutation.
    """
    for case in cases(paths):
        for test in case.get("tests", []):
            yield test


class OutputSuiteChecks(unittest.TestCase):
    _file_filter = None

    @classmethod
    def setUpClass(cls):
        # Resolve output-tests root relative to this file or environment override
        output_dir = Path(
            os.environ.get(
                "OUTPUT_TESTS_DIR",
                getattr(cls, "output_dir", ROOT_DIR),
            )
        ).resolve()
        cls.output_dir = output_dir

        metaschema_path = getattr(
            cls, "output_metaschema_path", output_dir / OUTPUT_METASCHEMA_NAME
        )
        cls.output_metaschema_path = metaschema_path

        if not metaschema_path.is_file():
            raise AssertionError(
                f"Required fixture metaschema not found: {metaschema_path}"
            )

        try:
            cls.output_metaschema = load(metaschema_path)
        except Exception:
            cls.output_metaschema = None

        cls.json_files = sorted(output_dir.rglob("*.json"))

        # Exclude root metaschema and dialect-specific supporting schemas from fixture checks
        cls.fixture_files = [
            p for p in cls.json_files
            if p.name != SUPPORTING_SCHEMA_NAME and p != metaschema_path
        ]

        if cls._file_filter is not None:
            cls.fixture_files = [
                p for p in cls.fixture_files
                if p.name == cls._file_filter
                or p.relative_to(output_dir).as_posix() == cls._file_filter.replace("\\", "/")
            ]

        if not cls.fixture_files:
            raise AssertionError(
                f"No fixture files found in {output_dir}"
                + (f" matching {cls._file_filter}" if cls._file_filter else "")
            )

        print(f"\nChecking {len(cls.fixture_files)} output fixture file(s) in {output_dir}")

    def assertUnique(self, iterable, message="Elements are not unique."):
        seen, duplicated = set(), set()
        for each in iterable:
            if each in seen:
                duplicated.add(each)
            seen.add(each)
        self.assertFalse(duplicated, f"{message} Duplicates: {duplicated}")

    def assertFollowsDescriptionStyle(self, description):
        message = (
            "In descriptions, don't say 'Test that X frobs' or 'X should "
            "frob' or 'X should be valid'. Just say 'X frobs' or 'X is "
            "valid'. It's shorter, and the test suite is entirely about "
            "what *should* be already. "
            "See https://jml.io/pages/test-docstrings.html for help."
        )
        self.assertNotRegex(description, r"\bshould\b", message)
        self.assertNotRegex(description, r"(?i)\btest(s)? that\b", message)

    def test_all_json_files_are_valid(self):
        """
        All files (metaschema, supporting schemas, and test fixtures) contain valid JSON.
        """
        for path in self.json_files:
            relative = path.relative_to(self.output_dir).as_posix()
            with self.subTest(file=relative):
                try:
                    load(path)
                except ValueError as error:
                    self.fail(f"{relative} contains invalid JSON: {error}")

    @unittest.skipIf(jsonschema is None, "Validation library not present!")
    def test_output_suites_are_valid(self):
        """
        All output fixture files conform to output-test-schema.json.
        """
        if self.output_metaschema is None:
            self.fail(
                f"Required fixture metaschema {self.output_metaschema_path.name} "
                "is missing or invalid JSON"
            )

        Validator = jsonschema.validators.validator_for(self.output_metaschema)
        validator = Validator(self.output_metaschema)

        for path in self.fixture_files:
            relative = path.relative_to(self.output_dir).as_posix()
            with self.subTest(file=relative):
                try:
                    data = load(path)
                except ValueError as error:
                    self.fail(f"{relative} contains invalid JSON: {error}")
                try:
                    validator.validate(data)
                except jsonschema.ValidationError as error:
                    path_str = " -> ".join(str(p) for p in error.path) if error.path else "root"
                    self.fail(
                        f"{relative} does not conform to "
                        f"{OUTPUT_METASCHEMA_NAME} at {path_str}:\n{error.message}"
                    )

    def test_all_case_descriptions_have_reasonable_length(self):
        """
        All case descriptions are strictly less than 150 characters.
        """
        for path in self.fixture_files:
            relative = path.relative_to(self.output_dir).as_posix()
            try:
                cases_list = load(path)
            except ValueError:
                continue
            for case in cases_list:
                desc = case.get("description", "")
                with self.subTest(file=relative, description=desc):
                    self.assertLess(
                        len(desc),
                        150,
                        f"Description is too long (keep it to less than 150 chars): {desc!r}",
                    )

    def test_all_test_descriptions_have_reasonable_length(self):
        """
        All test descriptions are strictly less than 70 characters.
        """
        for path in self.fixture_files:
            relative = path.relative_to(self.output_dir).as_posix()
            try:
                cases_list = load(path)
            except ValueError:
                continue
            for case in cases_list:
                for test in case.get("tests", []):
                    desc = test.get("description", "")
                    with self.subTest(file=relative, description=desc):
                        self.assertLess(
                            len(desc),
                            70,
                            f"Description is too long (keep it to less than 70 chars): {desc!r}",
                        )

    def test_all_case_descriptions_are_unique(self):
        """
        Case descriptions are unique within each fixture file.
        """
        for path in self.fixture_files:
            relative = path.relative_to(self.output_dir).as_posix()
            try:
                cases_list = load(path)
            except ValueError:
                continue
            with self.subTest(file=relative):
                self.assertUnique(
                    (case["description"] for case in cases_list if "description" in case),
                    message=f"Duplicate case descriptions in {relative}.",
                )

    def test_all_test_descriptions_are_unique(self):
        """
        Test descriptions are unique within each case.
        """
        for path in self.fixture_files:
            relative = path.relative_to(self.output_dir).as_posix()
            try:
                cases_list = load(path)
            except ValueError:
                continue
            for case in cases_list:
                desc = case.get("description")
                with self.subTest(file=relative, case=desc):
                    self.assertUnique(
                        (test["description"] for test in case.get("tests", []) if "description" in test),
                        message=f"Duplicate test descriptions in case '{desc}' in {relative}.",
                    )

    def test_case_descriptions_do_not_use_modal_verbs(self):
        """
        Case descriptions do not use modal verbs.
        """
        for path in self.fixture_files:
            relative = path.relative_to(self.output_dir).as_posix()
            try:
                cases_list = load(path)
            except ValueError:
                continue
            for case in cases_list:
                desc = case.get("description", "")
                with self.subTest(file=relative, description=desc):
                    self.assertFollowsDescriptionStyle(desc)

    def test_test_descriptions_do_not_use_modal_verbs(self):
        """
        Test descriptions do not use modal verbs.
        """
        for path in self.fixture_files:
            relative = path.relative_to(self.output_dir).as_posix()
            try:
                cases_list = load(path)
            except ValueError:
                continue
            for case in cases_list:
                for test in case.get("tests", []):
                    desc = test.get("description", "")
                    with self.subTest(file=relative, description=desc):
                        self.assertFollowsDescriptionStyle(desc)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].endswith(".json"):
        OutputSuiteChecks._file_filter = sys.argv[1]
        sys.argv.pop(1)

    unittest.main(verbosity=2)
