---
title: "Conformance vs unit"
description: Your project's tests vs the compiler workspace harnesses that lock platform behavior.
tableOfContents: true
---

Two different questions:

1. **Does my package behave?** That is your `test` items, your CI job.
2. **Does Beskid still mean what the spec says?** That is `beskid_tests`, `beskid_e2e_tests`, and the [Conformance](/docs/standard/capabilities/taxonomy--compiler--conformance/) area.

Confusing them is how you ship a green app on a red language.

## Your unit and integration tests

- Authored as `test` items in **your** repos.
- Run with `beskid test` and your tags/groups.
- Prove **your** contracts, parsers, and business rules.

## Platform conformance harnesses

The reference compiler workspace (`compiler/Cargo.toml`) includes:

| Crate | Role |
| --- | --- |
| `beskid_tests` | Fixture-heavy behavior locks, incremental/mod scheduling |
| `beskid_e2e_tests` | End-to-end CLI and pipeline scenarios |

Normative policy: [Conformance evidence](/docs/standard/capabilities/compiler--conformance--conformance-evidence-policy/), [Test harnesses and fixtures](/docs/standard/capabilities/compiler--conformance--test-harnesses-and-fixtures/).

```mermaid
flowchart TB
  accTitle: Unit tests versus conformance suites
  accDescr: Your test items run through the CLI, while compiler conformance suites check the platform spec contracts and are not replaced by user tests.
  userTests[Your test items in .bd files]
  cli[beskid test]
  conformance[beskid_tests / beskid_e2e_tests in compiler CI]
  spec[Standard contracts]
  userTests --> cli
  conformance --> spec
  cli -.->|does not replace| conformance
```

## When to contribute upstream

If you found a **language** or **compiler** bug (diagnostic code wrong, spawn lowering changed, manifest resolution drift), add or extend a conformance fixture in `compiler/` **and** update the spec in the same change set ([spec leads code](/docs/standard/capabilities/community--spec-maintenance--spec-authority-and-decisions/)).

## Next

[CI and testing](/book/08-green-tests-red-production/ci-testing/)
