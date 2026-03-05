---
title: "System.Environment"
---


## Purpose
Access process environment values in a controlled, explicit API.

## Candidate surface
- `Environment.Get(string name) -> Result<string, EnvironmentError>`
- `Environment.TryGet(string name) -> Option<string>`
- `Environment.Set(string name, string value) -> Result<unit, EnvironmentError>`

## Notes
- Mutating environment should be clearly scoped and documented.
- Runtime mediates platform differences.
