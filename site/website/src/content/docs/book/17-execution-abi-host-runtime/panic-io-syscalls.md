---
title: "Panic, IO, and syscalls"
description: When the process dies, how IO fails, and where syscalls enter.
tableOfContents: true
---

**Panic** terminates the process in the reference runtime—no "catch and continue the ERP" fantasy at the platform boundary. Normative detail: [Panic, IO, and syscalls](/platform-spec/execution/runtime/panic-io-and-syscalls/).

Syscall-backed surfaces are split (`Input`, `Output`, `Error`) under runtime `System` paths; higher-level console work stays in corelib (chapter 16). If your bug is "wrong bytes on stderr," trace IO policy here before rewriting `Console.WriteLine` nostalgia.

## Language tie-in

Contract failures vs panic are language-owned—chapter 09. Runtime owns what happens after the failure kind is chosen.

## Hub

[17. Execution](/book/17-execution-abi-host-runtime/)
