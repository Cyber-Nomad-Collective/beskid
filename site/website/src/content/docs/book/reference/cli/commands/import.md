---
title: "beskid import"
description: "Resolve a supported foreign library and update project link metadata."
---

`beskid import lib` resolves a logical library through the closed provider registry. It updates the `link` block in a `.bproj` manifest.

```bash
beskid import lib libc --project ./App.bproj --dry-run
```

The default provider is `c-posix` on supported tier-1 hosts. Use `--dry-run` to print the selected linker arguments without a file change. Remove `--dry-run` only after you inspect the result.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
