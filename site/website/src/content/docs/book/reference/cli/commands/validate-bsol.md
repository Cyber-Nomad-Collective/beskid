---
title: "beskid validate-bsol"
description: "Removed in 0.6.0. Use beskid dev bsol validate."
---

The root command `beskid validate-bsol` was removed in version 0.6.0. Use `beskid dev bsol validate` instead.

```bash
beskid dev bsol validate --help
```

Validate a project manifest with:

```bash
beskid dev bsol validate ./App.bproj
```

For a BSOL document that is not a project manifest, add `--profile <profile>`. The default profile is `project.v1`. A `type = Bsol` manifest rejects `--profile`. Use `--migrate` only to apply profile migration rewrites before validation.

The optional `PATH` argument names the document; without it the command reads standard input. `--schema-import-root <dir>` names the controlled root that holds already materialized schema imports. `--schema-import-lock <file>` names the JSON array of exact request, canonical identity, materialized path, and SHA-256 locks. Each of the two options requires the other.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
