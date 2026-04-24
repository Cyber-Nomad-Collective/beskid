---
title: "System.IO"
description: "Console-oriented output built on System.Syscall."
---

`System.IO` provides human-facing output helpers. All bytes go through **`System.Syscall.Write`**; there are no legacy `sys_print` / `sys_println` runtime entrypoints.

## API

- **`Print(string text)`** — writes UTF-8 to standard output with no trailing newline.
- **`PrintLine(string text)`** — writes `text` then `"\n"` (composition entirely in Beskid).

## Contract

- Encoding follows the language `string` representation (UTF-8 payload).
- Line breaks are corelib policy, not a separate runtime builtin.
