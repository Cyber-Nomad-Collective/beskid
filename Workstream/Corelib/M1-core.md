# M1 — Core Module Group

## Goal
Implement foundational APIs used by all higher corelib modules.

## Scope
- `Core.Results`
- `Core.ErrorHandling`
- `Core.String`

## Tasks
1. Implement canonical `Result<TValue, TError>`.
2. Add common error carrier types/patterns for domain errors.
3. Implement `String.Len`, `String.IsEmpty`, `String.Contains`.
4. Keep behavior explicit (no hidden expensive work in cheap-looking APIs).

## Acceptance
- API contracts match site docs.
- Recoverable failures modeled via `Result`.
- String edge-case behavior covered by tests.
