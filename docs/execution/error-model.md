---
description: Error model specification
---

# Error model specification

## Decision summary
- **No exceptions** and **no hidden control flow**.
- Errors are expressed explicitly as `Option[T]` (per language spec).
- Runtime `panic` is reserved for unrecoverable faults.

## Error propagation
- Functions return `Option[T]` when errors are expected.
- Callers must explicitly handle `none`.
- No implicit propagation (`?`-style) unless the language introduces a specific operator later.

## Panic behavior
- `panic(msg)` is a runtime builtin.
- Lowering inserts a call to `panic` for unrecoverable runtime conditions (e.g., bounds checks if enabled).
- `panic` terminates execution (trap).

## Diagnostics
- Compile-time errors are reported via semantic diagnostics (HIR stage).
- Runtime errors use `panic` with message + span context when possible.
