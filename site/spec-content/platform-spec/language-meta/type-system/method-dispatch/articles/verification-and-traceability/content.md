---
title: Method dispatch - Verification and traceability
description: Tests, implementation checklist, and verification matrix for Beskid
  method dispatch.
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
| Instance method call | Resolves to declared method; compiles |
| `extend type` method | Included in member set; compiles |
| Private member access | **E1107** or **E1511** emitted |
| Arity mismatch | **E1204** emitted |
| Argument type mismatch | **E1205** emitted |
| Unknown member | **E1101** or **E1213** emitted |

## Implementation checklist

- [x] Grammar: member expressions, method definitions
- [x] AST: `MemberExpression`, `MethodDefinition`, `ExtendTypeDefinition`
- [x] Resolver: member item collection in `resolve/member_items.rs`
- [x] Type checker: call arity and argument checking
- [x] Visibility: private member rejection
- [x] Diagnostics: **E1101**, **E1107**, **E1204**, **E1205**, **E1213**, **E1511**
- [ ] Dynamic dispatch (deferred to post-v0.1)
- [ ] Virtual table lowering for interface calls

## Test locations

- `compiler/crates/beskid_analysis/src/resolve/member_items.rs` — member resolution tests
- `compiler/crates/beskid_analysis/src/types/context/expressions.rs` — call type checking tests
- `compiler/crates/beskid_tests` — integration tests for dispatch
