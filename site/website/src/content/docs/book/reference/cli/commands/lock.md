---
title: "beskid lock"
description: "Removed in 0.6.0. Use beskid dev project lock."
---

The root command `beskid lock` was removed in version 0.6.0. Use `beskid dev project lock` instead.

```bash
beskid dev project lock --help
```

The replacement accepts `--project`, `--target`, `--workspace-member`, `--frozen`, `--locked`, `--offline`, and `--plain`. To change a dependency, use `beskid add`, `beskid remove`, or `beskid update`.

For lockfile behavior and recovery, use [Dependencies and locks](/docs/projects/dependencies-and-locks/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
