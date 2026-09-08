---
title: "beskid build"
description: "AOT-compile and link a Beskid program to object, library, or executable outputs."
---

AOT-compiles a resolved Beskid program and writes build artifacts.
This command is available under `beskid build`.

Executable and library outputs link only the matching hash-validated ABI-v5 runtime kit installed with the toolchain; `--kind object` emits no runtime dependency.
Progress output is animated by default. Use `--plain` for line-based output.

## Project and entrypoint

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` entry |
| `--project` | Project directory or `App.bproj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.bws` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |
| `--entrypoint` | Entry function when applicable |

## Output and linking

| Argument | Description |
| --- | --- |
| `--kind` | `exe`, `shared`, `static`, `object` (default: App/Test: exe; Lib: shared) |
| `--release` | Release profile (otherwise debug) |
| `--target-triple` | LLVM-style triple (e.g. `x86_64-unknown-linux-gnu`) |
| `--output` | Final artifact path (default derived next to input / target stem) |
| `--object-output` | Optional explicit object file path |
| `--backend` | Codegen backend (default `clif`); declared non-CLIF backends fail closed in this release |

## Runtime and exports

| Argument | Description |
| --- | --- |
| `--export` | Repeatable: explicit symbols to export in shared/static artifacts |
| `--prefer-static` / `--prefer-dynamic` | Link mode preference (mutually exclusive with each other) |

## Diagnostics

| Argument | Description |
| --- | --- |
| `--verbose-link` | Print linker invocations |
| `--plain` | Plain line-based progress (no step bar or dependency graph panel) |

## Example

```bash
beskid build --project path/to/App.bproj --release
```

For the executable check sequence and recovery steps, use [Build, run, and test](/docs/tooling/build-run-test/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
