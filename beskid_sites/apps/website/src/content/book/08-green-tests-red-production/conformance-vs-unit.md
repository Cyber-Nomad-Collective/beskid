---
title: "Conformance vs unit"
description: Your project's tests vs the compiler workspace harnesses that lock platform behavior.
tableOfContents: true
---

Two different questions:

1. **Does my package behave?** Your `test` items, your CI job.
2. **Does Beskid still mean what the spec says?** The `beskid_tests_*` crate family, `beskid_e2e_tests`, and the [conformance](/platform-spec/compiler/conformance/) area.

Confusing them is how you ship a green app on a red language.

## Your unit and integration tests

- Authored as `test` items in **your** repos.
- Run with `beskid test` and your tags/groups.
- Prove **your** contracts, parsers, and business rules.

## Platform conformance harnesses

The reference compiler workspace (`compiler/Cargo.toml`) splits conformance by domain rather than keeping one monolithic crate: `beskid_tests_surface`, `beskid_tests_projects`, `beskid_tests_mods`, `beskid_tests_lsp`, `beskid_tests_aot`, `beskid_tests_pckg`, `beskid_tests_interop`, `beskid_tests_cli`, `beskid_tests_composition`, and `beskid_tests_abi` each lock one slice of behavior, and `beskid_e2e_tests` covers end-to-end CLI and pipeline scenarios. None of them are a substitute for your own `test` items, and your `test` items are not a substitute for any of them.

Normative policy: [conformance evidence](/platform-spec/compiler/conformance/conformance-evidence-policy/) and [test harnesses and fixtures](/platform-spec/compiler/conformance/test-harnesses-and-fixtures/).

## When to contribute upstream

If you found a **language** or **compiler** bug (diagnostic code wrong, spawn lowering changed, manifest resolution drift), add or extend a conformance fixture in `compiler/` **and** update the spec in the same change set ([spec leads code](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/)).
