---
title: "System.Syscall"
description: "Cross-platform read/write primitives at the runtime boundary."
---

`System.Syscall` is the narrow surface for **fd-oriented** I/O. The runtime normalizes OS differences; Beskid code composes higher layers (`System.IO`, future `System.FS`, …) on top.

## API

- **`Write(i64 fd, string data)`** — implemented; returns `Result<i64, SyscallError>`.
- **`Read(i64 fd, i64 maxBytes)`** — implemented for stdin-oriented reads; returns `Result<string, SyscallError>`.
- **`WriteTo(StandardStream, string)`** and **`ReadFrom(StandardStream, i64)`** — ergonomic stream-first wrappers.
- **`StdoutFd` / `StdinFd` / `StderrFd`** — normalized descriptor helpers.

## Contract

- Prefer **`syscall_write` / `syscall_read`** (`__syscall_write` / `__syscall_read` at the builtin boundary) over ad-hoc print symbols.
- ABI changes are versioned with `BESKID_RUNTIME_ABI_VERSION`.
- Corelib convention is **one type per file**. `System/Syscall/` is the reference layout (`StandardStream`, `SyscallError`, request DTOs).
