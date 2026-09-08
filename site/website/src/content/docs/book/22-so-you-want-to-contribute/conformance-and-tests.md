---
title: "Conformance and tests"
description: Unit tests, e2e evidence, and tying Standard features to runnable checks.
tableOfContents: true
---

**Standard** capabilities must cite verification anchors. Use a focused `beskid_tests_*` crate, `beskid_e2e_tests`, a diagnostic code, or an explicit conformance document under [Compiler / Conformance](/docs/standard/compiler/conformance/).

## Habits that help

- Add or update a test when you fix a spec MUST.
- Do not disable flaky tests without a linked issue—fix root cause (see pckg Server.Tests parallelization policy in workspace notes).
- Language-user tests live in source as `test` items—chapter 08.

## Reference

- [Testing reference](/book/reference/testing/)
