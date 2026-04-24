---
title: "System.Syscall"
description: "Cross-platform read/write primitives at the runtime boundary."
---

`System.Syscall` is the narrow surface for **fd-oriented** I/O. The runtime normalizes OS differences; Beskid code composes higher layers (`System.IO`, future `System.FS`, …) on top.

## API

- **`Write(i64 fd, string data)`** — implemented; returns byte count or `-1` on error / unsupported `fd`.
- **`Read(i64 fd)`** — not implemented yet (stub; calls `__panic_str` until a buffer contract exists).
- **`StdoutFd` / `StdinFd` / `StderrFd`** — small integer handles (`1` / `0` / `2` on POSIX; runtime-defined elsewhere).

## Contract

- Prefer **`syscall_write`** (`__syscall_write` at the builtin boundary) over ad-hoc print symbols.
- ABI changes are versioned with `BESKID_RUNTIME_ABI_VERSION`.
