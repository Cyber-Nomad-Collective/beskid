---
title: Error handling - Verification and traceability
description: Tests, implementation checklist, and verification matrix for Beskid
  error handling.
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
| `expr?` on Result | Compiles; desugars to branches |
| `expr?` on non-Result | **E1222** emitted |
| `?` in lambda | Failure returns from lambda |
| Manual `match` on Result | Compiles; all arms type-checked |

## Implementation checklist

- [x] Grammar: postfix `?` operator
- [x] AST: `TryExpression`
- [x] Parser: `beskid.pest` production for try
- [x] Type checker: `TypeInvalidTryTarget` (**E1222**)
- [x] HIR lowering: `?` desugar to branch sequences
- [ ] Full `Result` corelib integration
- [ ] FFI error envelope mapping

## Test locations

- `compiler/crates/beskid_analysis/src/syntax/expressions/try_expression.rs` — parser tests
- `compiler/crates/beskid_analysis/src/types/context/expressions.rs` — try typing tests
- `compiler/crates/beskid_tests` — integration tests for error handling
