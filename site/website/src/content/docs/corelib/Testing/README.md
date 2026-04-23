---
title: "Testing module group"
description: "Assertion contracts and test primitives for Beskid test harness workflows."
---

`Testing` provides corelib-level primitives used by Beskid tests.

## Modules

- [`Testing.Contracts`](./Contracts.md): contracts for assertion predicates and message builders.
- [`Testing.Assertions`](./Assertions.md): assertion functions (`AssertTrue`, `AssertEqualI64`, `Fail`, ...).

## Design notes

- APIs are verb-first (`AssertTrue`, `AssertContains`, `Fail`).
- Assertion helpers are intentionally small and explicit for v0.1.
- Runtime pass/fail accounting is owned by the test runner; assertion helpers provide reusable failure primitives.
