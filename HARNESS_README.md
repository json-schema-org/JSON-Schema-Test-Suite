# Annotation Test Suite Harness

**Objective:** A standalone test harness for the JSON Schema Annotation Test Suite, utilizing the `jschon` implementation natively.

**Architecture:** Separated the loader, filter, compiler, evaluator, normalizer, asserter, and reporter into distinct pipeline stages enforcing SOLID design principles. The normalization stage handles the conversion of jschon logical keyword paths into specification-compliant physical schema fragments.

**Current Results:** Out of the 84 assertions, 78 Passed, 6 Failed. The 6 failures are due to specific edge-case keyword evaluations native to `jschon` (e.g., `contains` over-annotating negative items, `propertyNames` evaluating actual values, and `$dynamicRef` cross-resource bugs), not harness parsing errors.

**Quickstart (Local):**

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
python annotation_harness.py
pytest
```

**Quickstart (Docker):**

```bash
docker build -t gsoc-annotation-harness .
docker run --rm gsoc-annotation-harness
```

## Normalization Logic Note
Jschon outputs absolute locations (e.g., `urn:uuid:xxx#/$defs/bar/title`). To meet test suite structural expectations (`{"#/$defs/bar": ...}`), the pipeline resolves these references locally, trims trailing keywords, and injects `$schema` dynamically into fragments missing it on compilation.
