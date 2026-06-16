---
title: Modules and visibility - Verification and traceability
description: Tests, implementation checklist, and verification matrix for Beskid
  modules and visibility.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Proposed
lastReviewed: 2026-06-05
---

## Verification matrix

| Scenario | Expected evidence |
| --- | --- |
| File-scoped `mod` | Parsed as first item; module identity set |
| Inline `mod` | Nested scope created |
| `use` import | Symbol bound in current scope |
| `pub` export | Accessible from importers |
| Private access | **E1501** or **E1107** emitted |
| Unused import | **W1503** warned |

## Implementation checklist

- [x] Grammar: `mod`, `use`, `pub`
- [x] AST: `ModuleDeclaration`, `InlineModule`, `UseDeclaration`
- [x] Parser: `beskid.pest` productions for modules
- [x] Resolver: module scope building in `resolve/collect.rs`
- [x] Visibility rules: `visibility.rs` with **E1501–E1507**
- [x] Diagnostics: **E1501–E1507**, **W1503**, **W1504**
- [ ] Cross-package visibility rules
- [ ] Assembly-internal friends (deferred)

## Test locations

- `compiler/crates/beskid_analysis/src/syntax/items/module_declaration.rs` — parser tests
- `compiler/crates/beskid_analysis/src/syntax/items/use_declaration.rs` — parser tests
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/visibility.rs` — visibility tests
- `compiler/crates/beskid_tests` — integration tests for modules
