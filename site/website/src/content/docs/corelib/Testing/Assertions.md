---
title: "Testing.Assertions"
description: "Shouldly-like assertion primitives for Beskid tests."
---

`Testing.Assertions` contains the core assertion helpers used from test bodies.

## Available primitives (v0.1)

- `Fail(message)`
- `AssertTrue(condition, message)`
- `AssertFalse(condition, message)`
- `AssertEqualI64(expected, actual, message)`
- `AssertEqualString(expected, actual, message)`
- `AssertNotEqualI64(left, right, message)`
- `AssertContains(text, needle, message)`

## Failure shape

The module centralizes failure behavior through `Fail(...)`, which:
- emits a failure message
- triggers runtime failure for the current test execution

This keeps assertion behavior consistent across test suites while the runner reports pass/fail/skip/filter buckets.
