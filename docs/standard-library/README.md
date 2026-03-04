# Standard Library Specification

This directory is the canonical home for standard library design and API contracts.

## Scope
- Public module naming and surface contracts.
- Runtime boundary rules for system/platform operations.
- Error model and API consistency rules.
- Module-level API evolution plans.

## Index
- `Core/README.md`
  - `Core/Error-Handling.md`
  - `Core/Results.md`
  - `Core/String.md`
- `Collections/README.md`
  - `Collections/Array.md`
  - `Collections/List.md`
  - `Collections/Map.md`
  - `Collections/Set.md`
  - `Collections/Queue.md`
  - `Collections/Stack.md`
- `Query/README.md`
  - `Query/Contracts.md`
  - `Query/Operators.md`
  - `Query/Execution.md`
- `System/README.md`
  - `System/FS.md`
  - `System/Path.md`
  - `System/Time.md`
  - `System/Environment.md`
  - `System/Process.md`

## Naming direction
- Do not use `Std` prefix in public API examples.
- Use canonical module names directly (`IO`, `String`, `Array`, `Query`, ...).
- Follow C# naming conventions for public API surface (`PascalCase` module segments and callable names).

## Relationship to language spec
- `docs/spec/14-standard-library-api-shape.md` defines cross-cutting naming and boundary policy.
- This directory defines per-module contracts and examples.

## Legacy notes
- The previous numbered docs (`00-*` through `07-*`) are legacy scaffolding and should be treated as superseded by this directory structure.
