---
title: System.Output
description: Standard output write helpers for the Beskid core library.
---

> **Non-normative (legacy bridge).** This page is transitional API reference material. **Canonical** core-library contracts: [/platform-spec/core-library/](/platform-spec/core-library/). Full path mapping: [/platform-spec/legacy-spec-mapping/](/platform-spec/legacy-spec-mapping/).

`System.Output` provides **`Write`** and **`WriteLine`** on stdout via **`System.Syscall.WriteWith`**.

| Function | Behavior |
|----------|----------|
| `Write(string text)` | Writes UTF-8 text without a newline. |
| `WriteLine(string text)` | Writes text followed by `\n`. |

See also: [System.Input](./Input.md), [Console](/corelib/) (styled output via `Console.Format`).
