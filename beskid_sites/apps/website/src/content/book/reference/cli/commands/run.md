---
title: "beskid run"
description: "AOT-compile and execute a Beskid program in a subprocess."
---

AOT-compiles a resolved Beskid program, links a real binary, and runs it in a subprocess with the given entrypoint function, printing the result to stdout. `run` is not a JIT/scripting command — JIT execution in the toolchain is limited to `beskid test` (in-process) and `beskid repl` (interactive snippets).

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` entry |
| `--project` | Project directory or `.bproj` manifest path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via a `.bws` workspace manifest |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |
| `--entrypoint` | Function name to run (default `Main`) |

## Example

```bash
beskid run --project path/to/MyApp.bproj --entrypoint Main
```

[← Back to CLI command reference](/book/reference/cli/command-reference/)
