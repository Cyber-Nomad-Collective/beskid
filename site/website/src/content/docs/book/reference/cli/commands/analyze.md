---
title: "beskid analyze"
description: "Removed in 0.6.0. Use beskid check."
---

The root command `beskid analyze` was removed in version 0.6.0. Use `beskid check` instead.

```bash
beskid check --help
```

`beskid check` accepts an optional `.bd` `[INPUT]`, `--project`, `--target`, `--workspace-member`, `--frozen`, `--locked`, `--offline`, and `--plain`. It checks semantics and manifest validity without linking.

For the executable check sequence, use [Build, run, and test](/docs/tooling/build-run-test/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
