---
title: Examples
description: Panic from lowering, syscall_write status codes, and corelib IO scenarios.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-22
---

## Prose: bounds check failure

An enabled bounds check on array access fails at run time. Lowering emits a call to `panic` with a static message pointer. The process exits; callers do not receive `Option` because the failure is classified as a programmer/contract fault, not a recoverable IO error.

## Prose: broken pipe on stderr

A server logs to stderr after the reader closes the pipe. `syscall_write` returns `-1` or partial failure; `System.Error.Write` panics with the stable stderr message defined in console IO spec. Operators treat this as fatal logging failure in v1.

## Beskid-shaped usage (conceptual)

Corelib (not user panic) wraps builtins:

```beskid
// System.Output — simplified narrative
unit Write(string text) {
    // builds WriteRequest → Syscall.WriteWith(Stdout, bytes)
    // panics when syscall returns error
}
```

User application code should prefer `Option` for expected failures; reserve runtime panic for violations and v1 stream policy.

## Host testing syscall_write

E2E tests in `compiler/crates/beskid_e2e_tests/src/tests/runtime_cases.rs` exercise panic and IO paths without requiring full corelib—they call lowered programs that hit builtins directly.

## Read line scenario

`Input.ReadLine` loops `syscall_read` on stdin until newline or EOF. EOF returns `Result` success with partial/empty string; it **does not** call `panic` (**IO-005** sibling spec).

## Related topics

- [Verification and traceability](./verification-and-traceability/)
- [Panic, IO hub](./)
