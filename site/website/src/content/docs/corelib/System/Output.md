---
title: System.Output
description: Standard output write helpers for the Beskid core library.
---

`System.Output` provides **`Write`** and **`WriteLine`** on stdout via **`System.Syscall.WriteWith`**.

| Function | Behavior |
|----------|----------|
| `Write(string text)` | Writes UTF-8 text without a newline. |
| `WriteLine(string text)` | Writes text followed by `\n`. |

See also: [System.Input](./Input.md), [Console](/corelib/) (styled output via `Console.Format`).
