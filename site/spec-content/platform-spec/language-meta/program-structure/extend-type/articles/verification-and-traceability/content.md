---
title: extend type - Verification and traceability
description: Tests, implementation checklist, and verification matrix for Beskid
  extend type.
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
| `extend type` parsing | AST round-trip preserves structure |
| Method with receiver | Receiver type bound to extended type |
| Public member access | Compiles; no diagnostic |
| Private member access | **E1511** emitted |
| Dispatch to extension | Resolves to extension method |

## Implementation checklist

- [x] Grammar: `extend type`, method definitions
- [x] AST: `ExtendTypeDefinition`, `MethodDefinition`
- [x] Parser: `beskid.pest` productions for extend type
- [x] Resolver: extension methods indexed under target type
- [x] Visibility: `ExtendTypePrivateMemberAccess` (**E1511**)
- [x] HIR lowering: methods lowered with receiver type
- [ ] Generic type extensions (deferred)
- [ ] Mod-generated extension validation

## Test locations

- `compiler/crates/beskid_analysis/src/syntax/items/extend_type.rs` — parser tests
- `compiler/crates/beskid_analysis/src/resolve/member_items.rs` — dispatch tests
- `compiler/crates/beskid_analysis/src/analysis/rules/staged/visibility.rs` — access tests
- `compiler/crates/beskid_tests` — integration tests for extensions
