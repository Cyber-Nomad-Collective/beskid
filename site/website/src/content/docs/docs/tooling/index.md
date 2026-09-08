---
title: Tooling
description: Select concise Beskid commands and their grouped developer aliases for source, build, project, and package tasks.
audience:
  - developer
  - contributor
authority:
  status: informative
  sourceLabel: Pinned Beskid CLI command model
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_compiler/blob/252aa528ac7ee01a64e49e9b88b32393206fbd71/crates/beskid_cli/src/cli.rs
  limits: This page groups verified commands. Run command help for the complete option contract.
verified:
  revision: 252aa528ac7ee01a64e49e9b88b32393206fbd71
  date: 2026-09-08
---

Use concise root commands for routine work. Use `beskid dev` groups when a script or explanation benefits from an explicit domain.

## Prerequisites

Install Beskid and open a terminal in the source or project directory. Run `beskid --help` before you infer a command name.

## Actions

1. Use `beskid analyze`, `beskid format`, or `beskid doc` for source tasks.
2. Use `beskid build`, `beskid run`, or `beskid test` for AOT build and execution tasks.
3. Use `beskid fetch`, `beskid lock`, `beskid update`, or `beskid graph` for project tasks.
4. Use `beskid pckg` for registry tasks.
5. Use the grouped alias when you need the domain in the command path:

   | Domain | Grouped commands |
   | --- | --- |
   | Syntax | `beskid dev syntax parse`, `tree`, `analyze`, `doc`, `format`, `clif` |
   | Build | `beskid dev build compile`, `test`, `corelib` |
   | Project | `beskid dev project fetch`, `lock`, `update`, `graph` |
   | Package | `beskid dev package registry` |

6. Add `--plain` to analysis, build, run, and test commands in logs or automation.

```mermaid
flowchart TD
  accTitle: CLI taxonomy
  accDescr: The Beskid CLI routes source work to syntax commands, native output work to build commands, dependency work to project commands, and publishing work to package commands.
  A[beskid] --> B[Syntax]
  A --> C[Build]
  A --> D[Project]
  A --> E[Package]
  B --> B1[analyze format doc]
  C --> C1[build run test]
  D --> D1[fetch lock update graph]
  E --> E1[pckg]
```

### Diagram text

- Syntax commands inspect or change source text.
- Build commands create or execute native artifacts and test items.
- Project commands resolve manifests, lockfiles, dependencies, and graphs.
- Package commands communicate with the package registry.

## Expected result

The selected command help describes the input and flags for one task. The concise and grouped forms dispatch to the same command implementation where a grouped alias exists.

## Recovery

If the CLI rejects a command path, run `beskid --help`, then run `--help` on the next command group. Do not combine segments from different groups. Use the concise root command when a grouped path makes a script harder to read.

## Next task

Use [build, run, and test](/docs/tooling/build-run-test/) for local work or [run Beskid in CI](/docs/tooling/ci/) for automation.
