# System.Path

## Purpose
Cross-platform path operations with deterministic semantics.

## Candidate surface
- `Path.Combine(string left, string right) -> string`
- `Path.FileName(string path) -> string`
- `Path.Extension(string path) -> string`

## Notes
- Path separator behavior must be defined by API contract.
- Normalization/validation rules should be explicit.
