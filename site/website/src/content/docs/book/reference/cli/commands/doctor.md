---
title: "beskid doctor"
description: "Diagnose the installation without changing it."
---

`beskid doctor` checks the installation that owns the running executable. It changes nothing and takes no arguments.

The command prints the host target triple on its first line. It then verifies the debug and release ABI-v5 runtime kits for that target and the Corelib bundle. A missing or invalid part fails the command and names the repair: `beskid toolchain update` or a complete toolchain bundle.

## Example

```bash
beskid doctor
```

See [`beskid toolchain`](/book/reference/cli/commands/up/) for status and updates.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
