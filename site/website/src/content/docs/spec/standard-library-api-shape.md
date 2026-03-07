---
title: "Standard Library API Shape"
---


This document defines the recommended API design shape for Beskid's standard library.
Detailed module contracts live in `docs/standard-library/`.

## 14.1 Design goals

1. Predictable naming and discoverability.
2. Minimal surface area for MVP.
3. Composable modules over monolithic APIs.
4. Stable contracts that can be backed by interop dispatch internally.

## 14.2 Namespace layout

Recommended top-level modules:
- `Core` (error handling, results, string primitives)
- `Collections` (array/list/map/set/queue/stack)
- `Query` (query contracts, operators, execution)
- `System` (IO, FS, Path, Time, Environment, Process)

For MVP, start with:
- `Core.String`
- `Collections.Array`
- `Query`
- `System.IO`

### Naming rule (drop `Std` prefix)
- Public APIs must not require a `Std` namespace prefix.
- Standard library modules are addressed directly by canonical module paths (`Core.String`, `Collections.Array`, `Query`, `System.IO`, ...).
- Existing `Std.*` spelling is considered legacy documentation form and should not appear in new docs/examples.

## 14.3 API style rules

### Prefer verbs for operations
- `System.IO.Print`
- `System.IO.Println`
- `Core.String.Contains`

### Prefer nouns for types
- `StringBuilder`
- `Duration`
- `PathInfo`

### Keep signatures explicit and small
- Avoid hidden allocations in APIs that look cheap.
- Avoid broad `Any`-style parameters.

## 14.4 Error handling policy

- Prefer total APIs where failure is impossible or exceptional.
- Use `Result`-based forms for expected recoverable failures.
- Canonical language-level `Result` semantics live in `docs/spec/error-handling.md`.
- Canonical stdlib `Result` API contracts live in `docs/standard-library/Core/Results.md`.

## 14.5 Runtime boundary policy

- Public stdlib APIs remain stable while runtime internals evolve.
- Runtime ABI/syscall ownership and backend parity are defined in `docs/execution/runtime/syscalls-and-abi-boundary.md`.
- Language-level `Extern` syntax and typing are defined in `docs/spec/ffi-and-extern.md`.

## 14.6 Versioning and compatibility

- `std` API changes should be additive in minor releases.
- Breaking rename/removal requires a migration note.
- New experimental modules should be prefixed or documented as unstable.

## 14.7 Canonical module contract sources

Per-module API contracts are canonical in `docs/standard-library/`:
- `Core/`
- `Collections/`
- `Query/`
- `System/`

## 14.8 Coupled feature references

- Query protocol and operator contracts: `docs/standard-library/Query/`.
- Lambda/closure language semantics: `docs/spec/lambdas-and-closures.md`.
- `for in` language semantics: `docs/spec/control-flow.md`.
