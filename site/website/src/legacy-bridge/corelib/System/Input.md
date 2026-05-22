---
title: System.Input
description: Standard input read helpers for the Beskid core library.
---

> **Non-normative (legacy bridge).** This page is transitional API reference material. **Canonical** core-library contracts: [/platform-spec/core-library/](/platform-spec/core-library/). Full path mapping: [/platform-spec/legacy-spec-mapping/](/platform-spec/legacy-spec-mapping/).

`System.Input` exposes **stdin-only** read helpers built on **`System.Syscall.ReadWith`**.

| Function | Behavior |
|----------|----------|
| `Read()` | Reads up to the default byte limit; returns `Result<string, SyscallError>`. |
| `ReadLine()` | Reads until newline or EOF. |

See also: [System.Output](./Output.md), [System.Error](./Error.md), [System.Syscall](./Syscall.md).
