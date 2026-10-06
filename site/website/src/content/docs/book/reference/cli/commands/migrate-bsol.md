---
title: "beskid dev bsol migrate"
description: "Migrate a BSOL document to a selected schema profile."
---

`beskid dev bsol migrate [PATH]` reads a BSOL document from a path or from standard input. The required `--to` flag selects the target profile. The migrated document goes to standard output unless `-o` or `--output` selects a file.

```bash
beskid dev bsol migrate --to project.v2 ./App.bproj --output ./App-v2.bproj
```

Review the migrated file before you replace a project manifest. Run `beskid dev bsol validate` against the target profile after the migration.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
