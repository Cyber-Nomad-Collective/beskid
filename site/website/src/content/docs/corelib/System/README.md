---
title: "System Module Group"
---


System covers platform-oriented APIs with runtime-mediated behavior.

## Files
- `IO.md`
- `Syscall.md`
- `FS.md`
- `Path.md`
- `Time.md`
- `Environment.md`
- `Process.md`

## Contract
- Public APIs remain stable across runtime implementation changes.
- Platform-specific policy stays in runtime, not in compiler backends.
- Corelib source layout follows **one type per file** for public data types; `System/Syscall/` demonstrates the convention.
