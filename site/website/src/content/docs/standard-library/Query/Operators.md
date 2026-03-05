---
title: "Query.Operators"
---


## Purpose
Define transformation and terminal operators for query pipelines.

## Candidate transforms
- `Where`
- `Select`
- `Take`
- `Skip`

## Candidate terminals
- `Count`
- `First`
- `CollectArray`

## Notes
- Operators should compose via concrete generic wrappers.
- Public names follow C# conventions (`PascalCase`).
