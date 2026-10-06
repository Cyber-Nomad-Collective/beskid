---
title: "beskid dev"
description: "Compiler inspection and maintenance commands."
---

`beskid dev` holds inspection, plumbing, and maintenance commands. Routine work uses the root commands `new`, `check`, `build`, `run`, `test`, `fmt`, `doc`, `add`, `remove`, `update`, `package`, `toolchain`, and `doctor`.

## Command map

| Command | Replaces the removed root command |
| --- | --- |
| `beskid dev syntax parse` | `beskid parse` |
| `beskid dev syntax tree` | `beskid tree` |
| `beskid dev syntax clif` | `beskid clif` |
| `beskid dev project fetch` | `beskid fetch` |
| `beskid dev project lock` | `beskid lock` |
| `beskid dev project graph` | `beskid graph` |
| `beskid dev bsol validate <manifest>.bproj` | `beskid validate-bsol` |
| `beskid dev bsol migrate` | `beskid migrate-bsol` |
| `beskid dev repl` | `beskid repl` |
| `beskid dev mod` | `beskid mod` |
| `beskid dev import` | `beskid import` |
| `beskid dev lsp` | `beskid lsp` |
| `beskid dev corelib` | `beskid corelib` |
| `beskid dev runtime-kit` | `beskid runtime-kit` |

Other root renames: `analyze` is now `check`, `format` is now `fmt`, `pckg` is now `package`, and `up` is now `toolchain`.

`beskid dev build` shows backend output and linking. `beskid dev capabilities --json` prints the schema-1 canonical CLI capabilities in machine-readable form. `beskid dev toolchain-owner --owner <OWNER> --version <VERSION> --target <TRIPLE>` validates and stamps the installation owner. Use `beskid dev --help` to list the groups.

`beskid dev --log-cranelift` emits backend logs for compiler inspection. The `BESKID_LOG_CRANELIFT=1` environment variable has the same effect.

[← Back to CLI command reference](/book/reference/cli/command-reference/)
