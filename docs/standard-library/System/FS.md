# System.FS

## Purpose
Filesystem operations with explicit error-returning APIs.

## Candidate surface
- `FS.ReadAllText(string path) -> Result<string, FsError>`
- `FS.WriteAllText(string path, string text) -> Result<unit, FsError>`
- `FS.Exists(string path) -> bool`

## Notes
- Runtime owns platform-specific I/O behavior.
- Keep path normalization policy explicit and testable.
