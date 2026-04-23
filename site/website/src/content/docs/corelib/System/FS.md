---
title: "System.FS"
---


## Purpose
Filesystem operations with explicit error-returning APIs.

## Candidate surface
- `FS.ReadAllText(string path) -> Result<string, FsError>`
- `FS.WriteAllText(string path, string text) -> Result<bool, FsError>`
- `FS.Exists(string path) -> bool`

## Notes
- Runtime owns platform-specific I/O behavior.
- Keep path normalization policy explicit and testable.
- `WriteAllText` currently returns a success flag; a future additive transition to `Result<unit, FsError>` is possible when unit-result ergonomics are standardized.
