---
title: "beskid toolchain"
description: "Inspect or update the installed toolchain."
---

The root command `beskid up` was removed in 0.6.0. Use `beskid toolchain`.

| Operation | Result |
| --- | --- |
| `beskid toolchain status` | Print the status of the installation that owns the running executable |
| `beskid toolchain update` | Update the configured toolchain |
| `beskid doctor` | Verify the host target, the ABI-v5 runtime kits, and the Corelib bundle without changing them |

`beskid up host-target` has no direct replacement. `beskid doctor` prints the host target triple on its first line. A package manager or container owner updates its own installation. The direct updater does not replace it. See [Install Beskid](/docs/getting-started/install/) for channel and upgrade procedures.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
