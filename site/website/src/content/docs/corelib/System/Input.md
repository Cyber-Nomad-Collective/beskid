---
title: System.Input
description: Standard input read helpers for the Beskid core library.
---

`System.Input` exposes **stdin-only** read helpers built on **`System.Syscall.ReadWith`**.

| Function | Behavior |
|----------|----------|
| `Read()` | Reads up to the default byte limit; returns `Result<string, SyscallError>`. |
| `ReadLine()` | Reads until newline or EOF. |

See also: [System.Output](./Output.md), [System.Error](./Error.md), [System.Syscall](./Syscall.md).
