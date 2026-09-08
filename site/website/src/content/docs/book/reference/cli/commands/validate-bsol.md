---
title: "beskid validate-bsol"
description: "Validate a BSOL document against a schema profile."
---

`beskid validate-bsol [PATH]` reads a BSOL document from a path or from standard input. The default `--profile` is `project.v1`.

```bash
beskid validate-bsol --profile project.v1 ./App.bproj
```

Use `--migrate` only when you want the profile migration rewrites to run before validation. A successful command prints the validated profile on standard error.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
