#!/usr/bin/env python3
"""
Regression tests for output-tests/check_output_suite.py.

Verifies:
- Production output suite passes without brittle count assertions.
- Controlled temporary suite discovery correctly filters schemas, includes v1,
  handles nested structures, and dynamically handles additional fixtures.
- Consecutive runs in the same process do not leak class state.
- Malformed JSON in fixtures, metaschema, and supporting schemas fails and recovers.
- Structural schema violations (missing output, invalid expectation schema) fail and recover.
- Missing metaschema or empty fixture directories fail clearly.
- Description style and length rules have negative boundary tests.
- Offline checking succeeds with blocked sockets and unreachable $ref targets.
- Strict JSON loader rejects non-standard constants (NaN/Infinity).
"""

import io
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

# Add output-tests directory to sys.path so check_output_suite can be imported
OUTPUT_TESTS_DIR = Path(__file__).resolve().parent
if str(OUTPUT_TESTS_DIR) not in sys.path:
    sys.path.insert(0, str(OUTPUT_TESTS_DIR))

import check_output_suite


CHECKER_SCRIPT = OUTPUT_TESTS_DIR / "check_output_suite.py"


def run_checker(target_dir: Path) -> subprocess.CompletedProcess:
    """
    Run check_output_suite.py against the specified target directory.
    """
    env = os.environ.copy()
    env["OUTPUT_TESTS_DIR"] = str(target_dir)
    return subprocess.run(
        [sys.executable, str(CHECKER_SCRIPT)],
        cwd=str(target_dir),
        env=env,
        capture_output=True,
        text=True,
    )


def minimal_fixture(description="minimal test case"):
    """
    Return a minimal valid output fixture array conforming to output-test-schema.json.
    """
    return [
        {
            "description": description,
            "schema": {},
            "tests": [
                {
                    "description": "minimal test",
                    "data": 1,
                    "output": {"basic": {}},
                }
            ],
        }
    ]


class CheckOutputSuiteRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_dir = OUTPUT_TESTS_DIR

    def copy_suite(self, dest: Path):
        """
        Copy all files from output-tests into a temporary directory.
        """
        shutil.copytree(self.source_dir, dest, dirs_exist_ok=True)

    def test_unmodified_output_files_pass_smoke(self):
        """
        Smoke test: the real repository output suite passes all checks cleanly.
        """
        result = run_checker(self.source_dir)
        self.assertEqual(
            result.returncode,
            0,
            f"Checker failed on clean repo:\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}",
        )

    def test_controlled_suite_discovery_and_filtering(self):
        """
        In a controlled temporary suite with known structure:
        - fixture arrays are discovered recursively
        - v1 fixtures are included
        - supporting schemas and root metaschema are excluded from fixture validation
        - all schemas remain included in JSON syntax checks
        - adding another valid fixture is discovered and still passes
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)

            # Copy the real root metaschema
            shutil.copy2(
                self.source_dir / "output-test-schema.json",
                temp_path / "output-test-schema.json",
            )

            # Supporting schemas
            for dialect in ("draft2019-09", "draft2020-12", "v1"):
                schema_dir = temp_path / dialect
                schema_dir.mkdir(parents=True, exist_ok=True)
                (schema_dir / "output-schema.json").write_text(
                    json.dumps({"description": f"{dialect} supporting schema"}),
                    encoding="utf-8",
                )

            # Fixtures in various locations, including nested structure
            fixtures_map = {
                temp_path / "draft2019-09" / "content" / "test1.json": "d2019 fixture",
                temp_path / "draft2020-12" / "content" / "test2.json": "d2020 fixture",
                temp_path / "v1" / "content" / "test3.json": "v1 fixture",
                temp_path / "draft2020-12" / "structure" / "nested" / "test4.json": "nested structure fixture",
            }

            for path, desc in fixtures_map.items():
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_text(json.dumps(minimal_fixture(desc)), encoding="utf-8")

            # Run setup to inspect checker's actual discovered collections
            with patch.dict(os.environ, {"OUTPUT_TESTS_DIR": str(temp_path)}):
                check_output_suite.OutputSuiteChecks.setUpClass()
                try:
                    rel_json = [
                        p.relative_to(temp_path).as_posix()
                        for p in check_output_suite.OutputSuiteChecks.json_files
                    ]
                    rel_fixtures = [
                        p.relative_to(temp_path).as_posix()
                        for p in check_output_suite.OutputSuiteChecks.fixture_files
                    ]

                    # All 8 files are discovered for JSON checks
                    expected_json = {
                        "output-test-schema.json",
                        "draft2019-09/output-schema.json",
                        "draft2020-12/output-schema.json",
                        "v1/output-schema.json",
                        "draft2019-09/content/test1.json",
                        "draft2020-12/content/test2.json",
                        "v1/content/test3.json",
                        "draft2020-12/structure/nested/test4.json",
                    }
                    self.assertEqual(set(rel_json), expected_json)

                    # Only the 4 fixtures are in fixture_files
                    expected_fixtures = {
                        "draft2019-09/content/test1.json",
                        "draft2020-12/content/test2.json",
                        "v1/content/test3.json",
                        "draft2020-12/structure/nested/test4.json",
                    }
                    self.assertEqual(set(rel_fixtures), expected_fixtures)

                    # Verify exclusions
                    self.assertNotIn("output-test-schema.json", expected_fixtures)
                    self.assertFalse(any(p.endswith("output-schema.json") for p in rel_fixtures))

                    # Verify inclusions
                    self.assertIn("v1/content/test3.json", rel_fixtures)
                    self.assertIn("draft2020-12/structure/nested/test4.json", rel_fixtures)
                finally:
                    check_output_suite.OutputSuiteChecks.tearDownClass()

            # Verify the checker passes cleanly on this controlled suite
            res = run_checker(temp_path)
            self.assertEqual(
                res.returncode,
                0,
                f"Controlled suite failed:\n{res.stdout}\n{res.stderr}",
            )

            # Step E: Add another valid fixture and verify it is discovered and passes
            extra_path = temp_path / "v1" / "content" / "another.json"
            extra_path.write_text(json.dumps(minimal_fixture("another v1 fixture")), encoding="utf-8")

            with patch.dict(os.environ, {"OUTPUT_TESTS_DIR": str(temp_path)}):
                check_output_suite.OutputSuiteChecks.setUpClass()
                try:
                    rel_fixtures_after = [
                        p.relative_to(temp_path).as_posix()
                        for p in check_output_suite.OutputSuiteChecks.fixture_files
                    ]
                    self.assertIn("v1/content/another.json", rel_fixtures_after)
                finally:
                    check_output_suite.OutputSuiteChecks.tearDownClass()

            res_after = run_checker(temp_path)
            self.assertEqual(
                res_after.returncode,
                0,
                f"Suite with added fixture failed:\n{res_after.stdout}\n{res_after.stderr}",
            )

    def test_consecutive_runs_in_same_process_do_not_leak_class_state(self):
        """
        Running the same OutputSuiteChecks class sequentially against clean dir A
        and then clean dir B in the same Python process must pass for both runs
        without retaining stale output_dir or output_metaschema_path.
        """
        with tempfile.TemporaryDirectory() as td_a, tempfile.TemporaryDirectory() as td_b:
            path_a = Path(td_a).resolve()
            path_b = Path(td_b).resolve()
            self.copy_suite(path_a)
            self.copy_suite(path_b)

            # Run A
            with patch.dict(os.environ, {"OUTPUT_TESTS_DIR": str(path_a)}):
                stream_a = io.StringIO()
                suite_a = unittest.TestLoader().loadTestsFromTestCase(check_output_suite.OutputSuiteChecks)
                res_a = unittest.TextTestRunner(stream=stream_a).run(suite_a)

                self.assertTrue(
                    res_a.wasSuccessful(),
                    f"Run A failed:\n{stream_a.getvalue()}",
                )
                self.assertEqual(check_output_suite.OutputSuiteChecks.output_dir, path_a)
                self.assertEqual(
                    check_output_suite.OutputSuiteChecks.output_metaschema_path,
                    path_a / "output-test-schema.json",
                )
                self.assertNotIn(
                    path_a / "output-test-schema.json",
                    check_output_suite.OutputSuiteChecks.fixture_files,
                )
                for f in check_output_suite.OutputSuiteChecks.fixture_files:
                    self.assertTrue(path_a in f.parents, f"Fixture {f} does not belong to dir A")

            # Run B using the exact same class in the same process
            with patch.dict(os.environ, {"OUTPUT_TESTS_DIR": str(path_b)}):
                stream_b = io.StringIO()
                suite_b = unittest.TestLoader().loadTestsFromTestCase(check_output_suite.OutputSuiteChecks)
                res_b = unittest.TextTestRunner(stream=stream_b).run(suite_b)

                self.assertTrue(
                    res_b.wasSuccessful(),
                    f"Run B failed (stale state bug reproduced):\n{stream_b.getvalue()}",
                )
                self.assertEqual(check_output_suite.OutputSuiteChecks.output_dir, path_b)
                self.assertEqual(
                    check_output_suite.OutputSuiteChecks.output_metaschema_path,
                    path_b / "output-test-schema.json",
                )
                self.assertNotIn(
                    path_b / "output-test-schema.json",
                    check_output_suite.OutputSuiteChecks.fixture_files,
                )
                for f in check_output_suite.OutputSuiteChecks.fixture_files:
                    self.assertTrue(path_b in f.parents, f"Fixture {f} does not belong to dir B")

    def test_malformed_draft2020_content_fixture_fails_and_recovers(self):
        """
        Malformed JSON in draft2020-12/content/general.json fails and identifies file.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            target = temp_path / "draft2020-12" / "content" / "general.json"
            original_bytes = target.read_bytes()

            try:
                target.write_text("[ invalid json {", encoding="utf-8")
                res = run_checker(temp_path)
                self.assertNotEqual(res.returncode, 0)
                output = res.stdout + res.stderr
                self.assertIn("general.json", output)
            finally:
                target.write_bytes(original_bytes)

            recovered = run_checker(temp_path)
            self.assertEqual(recovered.returncode, 0)

    def test_missing_test_output_property_fails_and_recovers(self):
        """
        Removing the first test's output property fails structural validation.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            target = temp_path / "draft2020-12" / "content" / "general.json"
            original_bytes = target.read_bytes()

            try:
                data = json.loads(original_bytes.decode("utf-8"))
                del data[0]["tests"][0]["output"]
                target.write_text(json.dumps(data), encoding="utf-8")

                res = run_checker(temp_path)
                self.assertNotEqual(res.returncode, 0)
                output = res.stdout + res.stderr
                self.assertTrue(
                    "output" in output or "output-test-schema" in output,
                    f"Expected output schema failure in diagnostics:\n{output}",
                )
            finally:
                target.write_bytes(original_bytes)

            recovered = run_checker(temp_path)
            self.assertEqual(recovered.returncode, 0)

    def test_invalid_expectation_schema_fails_and_recovers(self):
        """
        Replacing output.basic with {'type': 42} fails structural validation.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            target = temp_path / "draft2020-12" / "content" / "general.json"
            original_bytes = target.read_bytes()

            try:
                data = json.loads(original_bytes.decode("utf-8"))
                data[0]["tests"][0]["output"]["basic"] = {"type": 42}
                target.write_text(json.dumps(data), encoding="utf-8")

                res = run_checker(temp_path)
                self.assertNotEqual(res.returncode, 0)
                output = res.stdout + res.stderr
                self.assertTrue(
                    "42" in output or "output-test-schema" in output,
                    f"Expected schema rejection in diagnostics:\n{output}",
                )
            finally:
                target.write_bytes(original_bytes)

            recovered = run_checker(temp_path)
            self.assertEqual(recovered.returncode, 0)

    def test_malformed_draft2020_supporting_schema_fails_and_recovers(self):
        """
        Malformed draft2020-12/output-schema.json fails JSON check despite exclusion from fixtures.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            target = temp_path / "draft2020-12" / "output-schema.json"
            original_bytes = target.read_bytes()

            try:
                target.write_text("{ unclosed", encoding="utf-8")
                res = run_checker(temp_path)
                self.assertNotEqual(res.returncode, 0)
                output = res.stdout + res.stderr
                self.assertIn("output-schema.json", output)
            finally:
                target.write_bytes(original_bytes)

            recovered = run_checker(temp_path)
            self.assertEqual(recovered.returncode, 0)

    def test_malformed_root_metaschema_and_v1_supporting_schema_fails_and_recovers(self):
        """
        Malformed root output-test-schema.json and v1/output-schema.json fail clearly.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)

            # Test malformed root metaschema
            root_metaschema = temp_path / "output-test-schema.json"
            root_orig = root_metaschema.read_bytes()
            try:
                root_metaschema.write_text("{ malformed: true ", encoding="utf-8")
                res = run_checker(temp_path)
                self.assertNotEqual(res.returncode, 0)
                output = res.stdout + res.stderr
                self.assertIn("output-test-schema.json", output)
            finally:
                root_metaschema.write_bytes(root_orig)

            self.assertEqual(run_checker(temp_path).returncode, 0)

            # Test malformed v1 supporting schema
            v1_schema = temp_path / "v1" / "output-schema.json"
            v1_orig = v1_schema.read_bytes()
            try:
                v1_schema.write_text("{ bad json ", encoding="utf-8")
                res = run_checker(temp_path)
                self.assertNotEqual(res.returncode, 0)
                output = res.stdout + res.stderr
                self.assertIn("v1/output-schema.json", output.replace("\\", "/"))
            finally:
                v1_schema.write_bytes(v1_orig)

            self.assertEqual(run_checker(temp_path).returncode, 0)

    def test_missing_metaschema_fails_without_false_success(self):
        """
        A missing root output-test-schema.json fails clearly.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            metaschema = temp_path / "output-test-schema.json"
            metaschema.unlink()

            res = run_checker(temp_path)
            self.assertNotEqual(res.returncode, 0)
            output = res.stdout + res.stderr
            self.assertIn("output-test-schema.json", output)

    def test_empty_fixture_tree_fails_without_false_success(self):
        """
        An empty fixture directory fails clearly.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            # Remove all json files except the root metaschema
            for json_file in temp_path.rglob("*.json"):
                if json_file.name != "output-test-schema.json":
                    json_file.unlink()

            res = run_checker(temp_path)
            self.assertNotEqual(res.returncode, 0)

    def test_description_length_boundaries(self):
        """
        Case description length < 150 and test description length < 70 boundaries.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            target = temp_path / "draft2020-12" / "content" / "general.json"
            data = json.loads(target.read_text(encoding="utf-8"))

            # Case description: 149 chars should pass
            data[0]["description"] = "c" * 149
            data[0]["tests"][0]["description"] = "t" * 69
            target.write_text(json.dumps(data), encoding="utf-8")
            self.assertEqual(run_checker(temp_path).returncode, 0)

            # Case description: 150 chars must fail
            data[0]["description"] = "c" * 150
            target.write_text(json.dumps(data), encoding="utf-8")
            self.assertNotEqual(run_checker(temp_path).returncode, 0)

            # Reset case length to 10
            data[0]["description"] = "Valid case"

            # Test description: 69 chars should pass
            data[0]["tests"][0]["description"] = "t" * 69
            target.write_text(json.dumps(data), encoding="utf-8")
            self.assertEqual(run_checker(temp_path).returncode, 0)

            # Test description: 70 chars must fail
            data[0]["tests"][0]["description"] = "t" * 70
            target.write_text(json.dumps(data), encoding="utf-8")
            self.assertNotEqual(run_checker(temp_path).returncode, 0)

    def test_duplicate_descriptions_checks(self):
        """
        Duplicate case descriptions in a file fail; duplicate tests in a case fail;
        cross-file duplicates remain allowed.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            target = temp_path / "draft2020-12" / "content" / "general.json"
            data = json.loads(target.read_text(encoding="utf-8"))

            # Duplicate case descriptions in same file
            duplicated_case = json.loads(json.dumps(data[0]))
            data.append(duplicated_case)
            target.write_text(json.dumps(data), encoding="utf-8")
            res = run_checker(temp_path)
            self.assertNotEqual(res.returncode, 0)
            self.assertIn("Duplicate case descriptions", res.stdout + res.stderr)

            # Fix case descriptions, add duplicate test descriptions in same case
            data.pop()
            dup_test = json.loads(json.dumps(data[0]["tests"][0]))
            data[0]["tests"].append(dup_test)
            target.write_text(json.dumps(data), encoding="utf-8")
            res = run_checker(temp_path)
            self.assertNotEqual(res.returncode, 0)
            self.assertIn("Duplicate test descriptions", res.stdout + res.stderr)

    def test_forbidden_description_wording(self):
        """
        Descriptions using 'should' or 'test that' fail.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)
            target = temp_path / "draft2020-12" / "content" / "general.json"
            data = json.loads(target.read_text(encoding="utf-8"))

            # Case with 'should'
            data[0]["description"] = "it should succeed"
            target.write_text(json.dumps(data), encoding="utf-8")
            self.assertNotEqual(run_checker(temp_path).returncode, 0)

            # Case with 'test that'
            data[0]["description"] = "test that output works"
            target.write_text(json.dumps(data), encoding="utf-8")
            self.assertNotEqual(run_checker(temp_path).returncode, 0)

            # Reset case, test with 'should'
            data[0]["description"] = "valid case"
            data[0]["tests"][0]["description"] = "output should be basic"
            target.write_text(json.dumps(data), encoding="utf-8")
            self.assertNotEqual(run_checker(temp_path).returncode, 0)

            # Test with 'tests that'
            data[0]["tests"][0]["description"] = "tests that basic output works"
            target.write_text(json.dumps(data), encoding="utf-8")
            self.assertNotEqual(run_checker(temp_path).returncode, 0)

    def test_offline_structural_validation_with_unreachable_refs(self):
        """
        Fixtures with arbitrary unreachable $ref URIs inside schema or expectations
        validate successfully without triggering network requests.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            self.copy_suite(temp_path)

            custom_fixture = [
                {
                    "description": "case with unreachable remote ref",
                    "schema": {
                        "$ref": "http://unreachable.invalid.nonexistent:9999/remote.json"
                    },
                    "tests": [
                        {
                            "description": "test with unreachable output ref",
                            "data": 123,
                            "output": {
                                "basic": {
                                    "$ref": "http://unreachable.invalid.nonexistent:9999/basic.json"
                                }
                            }
                        }
                    ]
                }
            ]
            target = temp_path / "draft2020-12" / "content" / "unreachable-ref.json"
            target.write_text(json.dumps(custom_fixture), encoding="utf-8")

            def fail_connect(*args, **kwargs):
                raise RuntimeError("Network connection was attempted!")

            # Cleanly mock socket connect and environment using scoped context managers
            with patch.object(socket.socket, "connect", side_effect=fail_connect), \
                 patch.dict(os.environ, {"OUTPUT_TESTS_DIR": str(temp_path)}):
                stream = io.StringIO()
                loader = unittest.TestLoader()
                suite = loader.loadTestsFromTestCase(check_output_suite.OutputSuiteChecks)
                runner = unittest.TextTestRunner(stream=stream)
                result = runner.run(suite)
                self.assertTrue(
                    result.wasSuccessful(),
                    f"Offline validation failed:\n{stream.getvalue()}",
                )

    def test_strict_json_constant_rejection(self):
        """
        Non-JSON numeric constants like NaN/Infinity are rejected by the strict loader.
        """
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "test.json"
            for token in ("NaN", "Infinity", "-Infinity"):
                with self.subTest(token=token):
                    path.write_text(f'{{"val": {token}}}', encoding="utf-8")
                    with self.assertRaises(ValueError):
                        check_output_suite.load(path)

            # Quoted strings and valid numbers are accepted
            path.write_text('["NaN", "Infinity", "-Infinity", 1e400]', encoding="utf-8")
            loaded = check_output_suite.load(path)
            self.assertEqual(loaded[0], "NaN")


if __name__ == "__main__":
    unittest.main(verbosity=2)
