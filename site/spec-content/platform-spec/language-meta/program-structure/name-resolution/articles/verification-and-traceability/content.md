---
title: Name resolution - Verification and traceability
description: Tests, implementation checklist, and verification matrix for Beskid
  name resolution.
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
| Local resolution | Identifier binds to local declaration |
| Import resolution | `use` path resolves to exported symbol |
| Duplicate name | **E1102** emitted |
| Unknown name | **E1101** or **E1201** emitted |
| Private access | **E1107** emitted |
| Shadowing | **W1103** warned |

## Implementation checklist

- [x] Grammar: identifiers, paths, `use`
- [x] AST: `UseDeclaration`, path expressions
- [x] Parser: `beskid.pest` productions for paths
- [x] Resolver: `resolver.rs`, `collect.rs`, `resolve_refs.rs`
- [x] Name resolution rules: `name_resolution.rs`
- [x] Diagnostics: **E1101–E1108**, **W1103**
- [x] Cross-package resolution (assembly prefetch + `ModuleIndex`)
- [x] Stable package-prefixed symbol identity for tooling (`SymbolRegistry`, `symbolKey`) — see [resolver contract](/platform-spec/compiler/semantic-pipeline/resolver-contract/)

## Test locations

- `compiler/crates/beskid_analysis/src/resolve/resolver.rs` — resolver tests
- `compiler/crates/beskid_analysis/src/resolve/resolve_refs.rs` — reference tests
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/name_resolution.rs` — rule tests
- `compiler/crates/beskid_tests` — integration tests for resolution
