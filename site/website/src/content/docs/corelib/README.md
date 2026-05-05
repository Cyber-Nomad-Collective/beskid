---
title: "Corelib Specification"
---


This directory is the canonical home for **corelib** design and API contracts.

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
- `Testing/README.md`
  - `Testing/Contracts.md`
  - `Testing/Assertions.md`

## Naming direction
- Do not use `Std` prefix in public API examples.
- Use canonical module names directly (`IO`, `String`, `Array`, `Query`, ...).
- Follow C# naming conventions for public API surface (`PascalCase` module segments and callable names).

## Relationship to language spec
- `/platform-spec/core-library/stability-and-api-shape/corelib-api-shape/` defines cross-cutting naming and boundary policy.
- This directory defines per-module contracts and examples.

## Source and release policy
- Canonical implementation is maintained in the compiler `corelib` submodule.
- pckg package identity is **`corelib`** (avoid `std` / misleading `standard_*` package names).
- Corelib release version tracks the shared language/compiler release version.

## Legacy notes
- The previous numbered docs (`00-*` through `07-*`) are legacy scaffolding and should be treated as superseded by this directory structure.
