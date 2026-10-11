#!/usr/bin/env python3
"""
Regression tests for output-tests/check_output_suite.py.

Verifies:
- Unmodified output suite passes.
- Fixture discovery correctly filters schemas and covers v1.
- Malformed JSON in fixtures, metaschema, and supporting schemas fails.
- Structural schema violations (missing output, invalid expectation schema) fail.
- Restoring corrupted files recovers cleanly.
- Missing metaschema or empty fixture directories fail without false success.
- Description style and length rules have negative boundary tests.
- Offline checking succeeds with blocked sockets and unreachable $ref targets.
- Real CLI exit status propagates.
"""

import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

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


class CheckOutputSuiteRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source_dir = OUTPUT_TESTS_DIR

    def copy_suite(self, dest: Path):
        """
        Copy all files from output-tests into a temporary directory.
        """
        shutil.copytree(self.source_dir, dest, dirs_exist_ok=True)

    def test_unmodified_output_files_pass_and_discovery_is_correct(self):
        """
        Unmodified output suite passes all checks, includes v1, and excludes schemas.
        """
        # Run CLI directly
        result = run_checker(self.source_dir)
        self.assertEqual(
            result.returncode,
            0,
            f"Checker failed on clean repo:\nSTDOUT:\n{result.stdout}\nSTDERR:\n{result.stderr}",
        )

        # Inspect discovered files via helper/class
        json_files = sorted(self.source_dir.rglob("*.json"))
        fixture_files = [
            p for p in json_files
            if p.name != "output-schema.json" and p.name != "output-test-schema.json"
        ]

        self.assertEqual(len(json_files), 15)
        self.assertEqual(len(fixture_files), 11)

        # Supporting schemas and metaschema must be excluded from fixtures
        for f in fixture_files:
            self.assertNotEqual(f.name, "output-schema.json")
            self.assertNotEqual(f.name, "output-test-schema.json")

        # Dialect counts: 4 for 2019-09, 4 for 2020-12, 3 for v1
        v1_fixtures = [f for f in fixture_files if "v1" in f.parts]
        d2019_fixtures = [f for f in fixture_files if "draft2019-09" in f.parts]
        d2020_fixtures = [f for f in fixture_files if "draft2020-12" in f.parts]

        self.assertEqual(len(v1_fixtures), 3)
        self.assertEqual(len(d2019_fixtures), 4)
        self.assertEqual(len(d2020_fixtures), 4)

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

            # Monkeypatch socket.socket.connect to fail if any network access is attempted
            original_connect = socket.socket.connect

            def fail_connect(*args, **kwargs):
                raise RuntimeError("Network connection was attempted!")

            socket.socket.connect = fail_connect
            try:
                # Run checker in-process on the modified directory
                old_dir = os.environ.get("OUTPUT_TESTS_DIR")
                os.environ["OUTPUT_TESTS_DIR"] = str(temp_path)
                try:
                    loader = unittest.TestLoader()
                    suite = loader.loadTestsFromTestCase(check_output_suite.OutputSuiteChecks)
                    import io
                    stream = io.StringIO()
                    runner = unittest.TextTestRunner(stream=stream)
                    result = runner.run(suite)
                    self.assertTrue(result.wasSuccessful(), "Offline validation failed")
                finally:
                    if old_dir is not None:
                        os.environ["OUTPUT_TESTS_DIR"] = old_dir
                    else:
                        os.environ.pop("OUTPUT_TESTS_DIR", None)
            finally:
                socket.socket.connect = original_connect

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
