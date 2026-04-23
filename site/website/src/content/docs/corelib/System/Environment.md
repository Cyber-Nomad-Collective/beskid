---
title: "System.Environment"
---


## Purpose
Access process environment values in a controlled, explicit API.

## Candidate surface
- `Environment.Get(string name) -> Result<string, EnvironmentError>`
- `Environment.TryGet(string name) -> Query.Contracts.Option`
- `Environment.Set(string name, string value) -> Result<bool, EnvironmentError>`
- Compatibility helpers: `Environment.GetVariable`, `Environment.CurrentDirectory`

## Notes
- Mutating environment should be clearly scoped and documented.
- Runtime mediates platform differences.
- Current baseline marks `Set` as unsupported until runtime-backed environment mutation is added.
