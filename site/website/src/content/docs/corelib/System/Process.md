---
title: "System.Process"
---


## Purpose
Process-level APIs for args, exit, and process metadata.

## Candidate surface
- `Process.Id() -> i32`
- `Process.Exit(i32 code) -> unit`
- Compatibility helpers: `Process.ExitCode() -> Result<i64, ProcessError>`, `Process.Run(string command) -> Result<bool, ProcessError>`

## Notes
- `Exit` semantics must be explicit for tests/tools.
- Argument and subprocess APIs should be specified separately as additive expansion.
