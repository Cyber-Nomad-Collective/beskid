---
title: "Testing"
---

## 18.1 Purpose

This chapter defines the language-level test harness for Beskid:
- `test Name { ... }` declarations
- in-test `meta { ... }` metadata
- in-test `skip { ... }` skip policy

CLI workflow details are documented in `docs/guides/testing/`.

## 18.2 Test declaration

Test items are declarations and follow normal item placement rules:

```beskid
test ParserSmoke {
    return;
}
```

Tests are valid at:
- top-level program scope
- inline module scope

The identifier after `test` is the test name.

## 18.3 Test body sections

Inside a test body, Beskid supports three section kinds:
- `meta { ... }`
- `skip { ... }`
- executable statements

Order is not semantically significant.

### 18.3.1 `meta` section

`meta` holds filter metadata used by tooling:

```beskid
test ParseFast {
    meta {
        tags = "fast,parser";
        group = "analysis.parser";
    }
    return;
}
```

Current keys:
- `tags`: string (comma-separated list)
- `group`: string (hierarchical grouping label)

Unknown keys are invalid.

### 18.3.2 `skip` section

`skip` controls pre-execution skipping:

```beskid
test WindowsOnly {
    skip {
        condition = true;
        reason = "disabled on this runtime";
    }
    return;
}
```

Current keys:
- `condition`: boolean literal (`true` or `false`)
- `reason`: string

If `skip.condition` is `true`, tooling must mark the test as skipped and avoid execution.

## 18.4 Conformance rules

Conforming implementations MUST:
- parse and lower `test` items into semantic IR
- preserve test declarations through formatter and symbol services
- expose test items to tooling query surfaces
- enforce duplicate-name checks for test items in item namespace checks
- validate test metadata keys and skip keys against this chapter

Implementations SHOULD:
- provide deterministic discovery ordering
- report per-test status buckets: passed, failed, skipped, filtered-out

## 18.5 Relationship to corelib

Language test declarations are distinct from corelib assertion APIs.

- Syntax and static semantics: this chapter.
- Assertion contracts and helpers: `docs/corelib/Testing/`.
