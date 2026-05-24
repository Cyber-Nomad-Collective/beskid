---
title: "Panic vs contract"
description: When the runtime traps, when contracts fail at compile time, and how FFI keeps worlds apart.
tableOfContents: true
---

**Contract failure** is a compile-time diagnostic—you fix the type or member before shipping.

**Panic** is a runtime trap for invariant violations, failed host assumptions, or policy-defined unwinds at boundaries—not a replacement for `Result`.

## Compile-time: contracts win early

Missing `Dispose()` on `Disposable`? **E1601**, not a stack trace in prod. That is the point of structural contracts ([Contracts](/platform-spec/language-meta/contracts-and-effects/contracts/)).

## Runtime: panic policy

Execution owns panic bridges and syscall surfaces:

- [Panic, IO, and syscalls](/platform-spec/execution/runtime/panic-io-and-syscalls/)
- [Error and unwind semantics](/platform-spec/language-meta/interop/interop-contracts/error-and-unwind-semantics/)

Normative gist: Beskid panic **must not** assume foreign callers catch Rust/Beskid unwinds. Profiles define who may translate traps.

## Recoverable vs non-recoverable

| Mechanism | Use for |
| --- | --- |
| `Result` / `?` | Expected failures (parse errors, missing files, domain rules) |
| `test` assertions | Harness failures with structured runner output |
| Panic / trap | Bug, violated invariant, host abort |

Do not catch panic in application Beskid as if it were Java. If you need control flow, use `Result`.

## Mod analyzers

`Analyzer` mods emit diagnostics and fixes—they do not throw into your runtime. Host merge either accepts typed rewrites or fails closed ([Mod host bridge](/platform-spec/compiler/compiler-mods/mod-host-bridge/)).

## Next chapter

[10. Memory without another billion-dollar mistake](/book/10-memory-without-billion-dollar-mistake/)
