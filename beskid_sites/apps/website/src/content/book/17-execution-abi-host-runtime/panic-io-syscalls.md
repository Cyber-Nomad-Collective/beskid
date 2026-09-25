---
title: "Panic, IO, and syscalls"
description: What the runtime does when a panic happens on the entry fiber versus a spawned one, why a panic can never cross a foreign stack frame, and where syscalls enter.
tableOfContents: true
---

An unhandled panic on the entry fiber, the one running `Main`, terminates the process. A panic on a spawned fiber does not: `beskid_runtime` catches it at the fiber boundary and reports it as a typed `FiberError::Panicked` to whoever calls `Join()`, mechanics that belong to chapter 11's fiber API and chapter 09's panic-versus-contract page, not to this one. Neither path is a general exception-handling story. There is no "catch and keep going" at the platform boundary, the way a decade of `catch (Exception e) { log.warn(e); }` trained people to expect.

The one place this gets strict is the extern boundary: a panic must never unwind through a foreign, native, stack frame, in either direction. Neither a native caller nor native code Beskid calls knows how to unwind a Beskid stack, and the reverse is equally true. The ABI profile in effect at that boundary decides who translates a trap into an error envelope instead. Normative detail: [panic, IO, and syscalls](/platform-spec/execution/runtime/panic-io-and-syscalls/) and [error and unwind semantics](/platform-spec/language-meta/interop/interop-contracts/error-and-unwind-semantics/).

## IO and syscalls

Syscall-backed surfaces are split into `Input`, `Output`, and `Error` under the runtime's `System` paths; higher-level console helpers live in corelib instead (chapter 16). If a bug looks like "wrong bytes on stderr," trace it through this IO policy before rewriting something that looks like `Console.WriteLine` nostalgia.
