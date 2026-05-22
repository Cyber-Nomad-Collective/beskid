---
title: "Conformance and tests"
description: Unit tests, e2e evidence, and tying Standard features to runnable checks.
tableOfContents: true
---

**Standard** platform-spec features should cite verification anchors—`beskid_tests`, `beskid_e2e_tests`, diagnostic codes, or explicit conformance documents under [Compiler / Conformance](/platform-spec/compiler/conformance/).

## Habits that help

- Add or update a test when you fix a spec MUST.
- Do not disable flaky tests without a linked issue—fix root cause (see pckg Server.Tests parallelization policy in workspace notes).
- Language-user tests live in source as `test` items—chapter 08.

## Reference

- [Testing reference](/book/reference/testing/)
