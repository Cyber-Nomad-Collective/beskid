---
title: "beskid import"
description: "Resolve a supported foreign library and update project link metadata."
---

`beskid import lib <LOGICAL>` resolves a logical library through the closed provider registry. It updates the `link` block in a `.bproj` manifest.

```bash
beskid import lib libc --provider c-posix --project ./App.bproj --dry-run
```

`--provider <NAME>` selects a provider. The default is `c-posix`. `--project <PATH>` selects the project manifest. Use `--dry-run` to print the selected linker arguments without a file change. Remove `--dry-run` only after you inspect the result.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
