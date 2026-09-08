---
title: "beskid run"
description: "AOT-compile, link, and execute a Beskid program in a subprocess."
---

`beskid run` resolves the program, AOT-compiles it, links a temporary executable, and starts that executable in a subprocess. The command forwards program output and returns the subprocess status.

## Arguments

| Argument | Description |
| --- | --- |
| `[INPUT]` | Optional `.bd` entry |
| `--project` | Project directory or `App.bproj` path |
| `--target` | Target name from the manifest |
| `--workspace-member` | Workspace member when resolving via `Workspace.bws` |
| `--frozen` | Require lockfile match; forbid updates |
| `--locked` | Require an existing lockfile |
| `--entrypoint` | Function name to run (default `Main`) |
| `--plain` | Disable animated progress and graph output |

## Example

```bash
beskid run --project path/to/App.bproj --entrypoint Main --plain
```

The command requires an exact ABI-v5 runtime kit for the selected host and profile. The REPL and the current test engine use JIT execution; `beskid run` does not. See [Build, run, and test](/docs/tooling/build-run-test/) for the procedure and recovery steps.

For the executable check sequence and recovery steps, use [Build, run, and test](/docs/tooling/build-run-test/).

[← Back to CLI command reference](/book/reference/cli/command-reference/)
