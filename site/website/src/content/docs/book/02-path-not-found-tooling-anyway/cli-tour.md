---
title: "CLI tour"
description: Week-one Beskid subcommands—parse, analyze, format, fetch, lock, build, run, test, new.
tableOfContents: true
---

The CLI is the ground truth. Editors are a pretty face on the same pipeline.

## Global behavior

- Response files: `@file` expansion (Rust `argfile` convention).
- Failures: diagnostic report (miette) + non-zero exit unless noted.
- Corelib: materialized on launch; override with `BESKID_CORELIB_SOURCE`.

Full tables: [CLI command reference](/book/reference/cli/command-reference/).

## Commands you will actually press

| Command | Why you care |
| --- | --- |
| `parse` / `tree` | "Did the parser see my file?" |
| `analyze` | Semantic diagnostics before you blame codegen |
| `format` | Stop formatting debates |
| `fetch` / `lock` / `update` | Dependencies and reproducibility |
| `build` / `run` | Ship something executable |
| `test` | Run `test` items in the project |
| `new` | Templates for projects/workspaces/items |
| `doc` | `api.json` + markdown API output |
| `corelib` | Materialize embedded corelib template |
| `pckg` | Registry client when you publish packages |

```mermaid
flowchart TD
  subgraph day1 [Day one]
    P[parse/tree] --> A[analyze]
    A --> F[format]
  end
  subgraph project [With Project.proj]
    A --> Fetch[fetch/lock]
    Fetch --> B[build/run/test]
  end
```

## Project-scoped flags

When a manifest exists, prefer explicit roots while learning:

```bash
beskid analyze --project ./Project.proj --target App
```

`--frozen` / `--locked` participate in resolution policy—see [fetch](/book/reference/cli/commands/fetch/) and [lock](/book/reference/cli/commands/lock/).

## Next

[Logging and debug flags](/book/02-path-not-found-tooling-anyway/logging-and-debug-flags/)
