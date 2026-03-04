# System.Process

## Purpose
Process-level APIs for args, exit, and process metadata.

## Candidate surface
- `Process.Args() -> string[]`
- `Process.Exit(i32 code) -> unit`
- `Process.Id() -> i32`

## Notes
- `Exit` semantics must be explicit for tests/tools.
- Spawning/subprocess APIs should be specified separately as an additive expansion.
