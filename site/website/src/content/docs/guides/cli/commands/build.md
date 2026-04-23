---
title: "beskid build"
description: "AOT-compile and link a Beskid program to object, library, or executable outputs."
---

AOT-compiles a resolved Beskid program, links against the Beskid runtime (unless standalone), and writes build artifacts. Progress output can be animated unless `--plain` is set.

## Project and entrypoint

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` entry |
| `--project` | Project directory or `Project.proj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.proj` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |
| `--entrypoint` | Entry function when applicable |

## Output and linking

| Argument | Description |
| --- | --- |
| `--kind` | `exe`, `shared`, `static`, `object` (defaults follow project target kind) |
| `--release` | Release profile (otherwise debug) |
| `--target-triple` | LLVM-style triple (e.g. `x86_64-unknown-linux-gnu`) |
| `--output` | Final artifact path (default derived next to input / target stem) |
| `--object-output` | Optional explicit object file path |

## Runtime and exports

| Argument | Description |
| --- | --- |
| `--runtime-archive` | Use a prebuilt runtime archive instead of building on the fly |
| `--runtime-abi-version` | ABI version for prebuilt runtime archive |
| `--standalone` | No Beskid runtime archive linkage (cannot combine with `--runtime-archive`) |
| `--export` | Repeatable: explicit symbols to export in shared/static artifacts |
| `--prefer-static` / `--prefer-dynamic` | Link mode preference (mutually exclusive with each other) |

## Diagnostics

| Argument | Description |
| --- | --- |
| `--verbose-link` | Print linker invocations |
| `--plain` | Disable animated progress and graph output |

## Example

```bash
beskid build --project path/to/Project.proj --release
```

[← Back to CLI command reference](/guides/cli/command-reference/)
