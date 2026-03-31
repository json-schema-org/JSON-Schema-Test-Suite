# ---- Tests for annotation_harness.py ----
# Covers each pipeline stage in isolation, then a small integration test.

import pytest
from jschon import JSONSchema, create_catalog

from annotation_harness import (
    ANNOTATIONS_DIR,
    DIALECT,
    Reporter,
    check_assertion,
    compile_schema,
    deep_equal,
    evaluate_instance,
    extract_keyword,
    load_test_files,
    normalize_annotations,
    normalize_schema_location,
    parse_compatibility,
)

# ---- Fixtures ----

@pytest.fixture(scope="session")
def catalog():
    """Initialize jschon catalog once for the whole test session."""
    return create_catalog(DIALECT)


# ---- Loader Tests ----

class TestLoader:
    def test_loads_all_test_files(self):
        files = load_test_files(ANNOTATIONS_DIR)
        filenames = [f["filename"] for f in files]
        assert "meta-data.json" in filenames
        assert "applicators.json" in filenames
        assert "core.json" in filenames

    def test_each_file_has_suite(self):
        files = load_test_files(ANNOTATIONS_DIR)
        for f in files:
            assert "suite" in f
            assert isinstance(f["suite"], list)

    def test_empty_dir_returns_empty(self, tmp_path):
        assert load_test_files(tmp_path) == []


# ---- Filter Tests ----

class TestFilter:
    def test_none_is_always_compatible(self):
        assert parse_compatibility(None, 2020) is True

    def test_bare_number_minimum(self):
        assert parse_compatibility("7", 2020) is True
        assert parse_compatibility("2020", 2020) is True
        assert parse_compatibility("2020", 2019) is False

    def test_less_equal(self):
        assert parse_compatibility("<=2019", 2019) is True
        assert parse_compatibility("<=2019", 2020) is False

    def test_exact_match(self):
        assert parse_compatibility("=2020", 2020) is True
        assert parse_compatibility("=2020", 2019) is False

    def test_comma_separated(self):
        # Between draft-06 and 2019-09
        assert parse_compatibility("6,<=2019", 7) is True
        assert parse_compatibility("6,<=2019", 2019) is True
        assert parse_compatibility("6,<=2019", 2020) is False
        assert parse_compatibility("6,<=2019", 4) is False

    def test_unknown_version_returns_false(self):
        assert parse_compatibility("99", 2020) is False


# ---- Normalizer Tests ----

class TestExtractKeyword:
    def test_simple(self):
        assert extract_keyword("/title") == "title"

    def test_nested(self):
        assert extract_keyword("/properties/foo/title") == "title"

    def test_deep(self):
        assert extract_keyword("/allOf/0/title") == "title"


class TestNormalizeSchemaLocation:
    def test_root_keyword(self):
        assert normalize_schema_location("urn:uuid:abc#/title") == "#"

    def test_nested_property(self):
        loc = normalize_schema_location("urn:uuid:abc#/properties/foo/title")
        assert loc == "#/properties/foo"

    def test_defs_via_ref(self):
        loc = normalize_schema_location("urn:uuid:abc#/$defs/bar/title")
        assert loc == "#/$defs/bar"

    def test_percent_encoded(self):
        loc = normalize_schema_location("urn:uuid:abc#/patternProperties/%5Ea/title")
        assert loc == "#/patternProperties/%5Ea"

    def test_no_fragment(self):
        assert normalize_schema_location("urn:uuid:abc") == "#"

    def test_allof_path(self):
        loc = normalize_schema_location("urn:uuid:abc#/allOf/1/title")
        assert loc == "#/allOf/1"


class TestNormalizeAnnotations:
    def test_basic_title(self):
        output = {
            "valid": True,
            "annotations": [
                {
                    "instanceLocation": "",
                    "keywordLocation": "/title",
                    "absoluteKeywordLocation": "urn:uuid:x#/title",
                    "annotation": "Foo",
                }
            ],
        }
        result = normalize_annotations(output)
        assert result == {("", "title"): {"#": "Foo"}}

    def test_skips_applicator_list_annotations(self):
        output = {
            "valid": True,
            "annotations": [
                {
                    "instanceLocation": "",
                    "keywordLocation": "/properties",
                    "absoluteKeywordLocation": "urn:uuid:x#/properties",
                    "annotation": ["foo"],  # list => applicator bookkeeping
                }
            ],
        }
        result = normalize_annotations(output)
        assert result == {}

    def test_empty_annotations(self):
        output = {"valid": True}
        assert normalize_annotations(output) == {}


# ---- Asserter Tests ----

class TestDeepEqual:
    def test_equal_dicts(self):
        assert deep_equal({"a": 1}, {"a": 1}) is True

    def test_unequal_dicts(self):
        assert deep_equal({"a": 1}, {"a": 2}) is False

    def test_missing_key(self):
        assert deep_equal({"a": 1}, {}) is False

    def test_equal_lists(self):
        assert deep_equal([1, "x"], [1, "x"]) is True

    def test_unequal_lists(self):
        assert deep_equal([1], [1, 2]) is False

    def test_nested(self):
        assert deep_equal({"a": [1, {"b": 2}]}, {"a": [1, {"b": 2}]}) is True

    def test_int_float_equal(self):
        assert deep_equal(1, 1.0) is True

    def test_type_mismatch(self):
        assert deep_equal("1", 1) is False


class TestCheckAssertion:
    def test_pass_matching(self):
        normalized = {("", "title"): {"#": "Foo"}}
        assertion = {"location": "", "keyword": "title", "expected": {"#": "Foo"}}
        ok, msg = check_assertion(normalized, assertion)
        assert ok is True
        assert msg == ""

    def test_fail_mismatch(self):
        normalized = {("", "title"): {"#": "Bar"}}
        assertion = {"location": "", "keyword": "title", "expected": {"#": "Foo"}}
        ok, msg = check_assertion(normalized, assertion)
        assert ok is False
        assert "Mismatch" in msg

    def test_pass_empty_expected_no_annotation(self):
        normalized = {}
        assertion = {"location": "/x", "keyword": "title", "expected": {}}
        ok, _ = check_assertion(normalized, assertion)
        assert ok is True

    def test_fail_empty_expected_but_annotation_exists(self):
        normalized = {("/x", "title"): {"#/foo": "Bar"}}
        assertion = {"location": "/x", "keyword": "title", "expected": {}}
        ok, msg = check_assertion(normalized, assertion)
        assert ok is False
        assert "Expected NO annotations" in msg


# ---- Compiler Tests ----

class TestCompiler:
    def test_compiles_simple_schema(self, catalog):
        schema = compile_schema(catalog, {"title": "Test"})
        assert isinstance(schema, JSONSchema)

    def test_compiles_boolean_schema(self, catalog):
        schema = compile_schema(catalog, True)
        assert isinstance(schema, JSONSchema)

    def test_preserves_existing_dollar_schema(self, catalog):
        data = {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "title": "Existing",
        }
        schema = compile_schema(catalog, data)
        assert isinstance(schema, JSONSchema)


# ---- Evaluator Tests ----

class TestEvaluator:
    def test_returns_dict_with_valid(self, catalog):
        schema = compile_schema(catalog, {"title": "Foo"})
        output = evaluate_instance(schema, 42)
        assert "valid" in output
        assert output["valid"] is True

    def test_returns_annotations(self, catalog):
        schema = compile_schema(catalog, {"title": "Foo"})
        output = evaluate_instance(schema, "hello")
        assert "annotations" in output
        assert len(output["annotations"]) > 0


# ---- Reporter Tests ----

class TestReporter:
    def test_exit_code_zero_on_all_pass(self):
        r = Reporter()
        r.total_pass = 10
        r.total_fail = 0
        assert r.exit_code == 0

    def test_exit_code_one_on_failure(self):
        r = Reporter()
        r.total_pass = 9
        r.total_fail = 1
        assert r.exit_code == 1

    def test_skip_increments(self):
        r = Reporter()
        r.skip("test", "reason")
        assert r.total_skip == 1


# ---- Integration: end-to-end on meta-data.json ----

class TestIntegration:
    def test_meta_data_title(self, catalog):
        """The simplest test: schema {"title": "Foo"} on instance 42."""
        schema = compile_schema(catalog, {"title": "Foo"})
        output = evaluate_instance(schema, 42)
        normalized = normalize_annotations(output)

        assertion = {"location": "", "keyword": "title", "expected": {"#": "Foo"}}
        ok, msg = check_assertion(normalized, assertion)
        assert ok, msg

    def test_meta_data_description(self, catalog):
        schema = compile_schema(catalog, {"description": "Bar"})
        output = evaluate_instance(schema, "anything")
        normalized = normalize_annotations(output)

        ok, msg = check_assertion(normalized, {
            "location": "", "keyword": "description", "expected": {"#": "Bar"}
        })
        assert ok, msg

    def test_properties_annotation(self, catalog):
        """Properties subschema annotations land at the right instance location."""
        schema = compile_schema(catalog, {
            "properties": {"foo": {"title": "Foo"}}
        })
        output = evaluate_instance(schema, {"foo": 42})
        normalized = normalize_annotations(output)

        ok, msg = check_assertion(normalized, {
            "location": "/foo", "keyword": "title",
            "expected": {"#/properties/foo": "Foo"},
        })
        assert ok, msg

    def test_ref_resolves_to_defs(self, catalog):
        """$ref annotations should point to $defs, not $ref."""
        schema = compile_schema(catalog, {
            "$ref": "#/$defs/x",
            "$defs": {"x": {"title": "X"}},
        })
        output = evaluate_instance(schema, "val")
        normalized = normalize_annotations(output)

        ok, msg = check_assertion(normalized, {
            "location": "", "keyword": "title",
            "expected": {"#/$defs/x": "X"},
        })
        assert ok, msg
