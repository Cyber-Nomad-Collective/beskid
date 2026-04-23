# M4 — System APIs

## Goal
Implement platform-facing corelib modules with runtime-owned platform policy.

## Scope
- `System.IO`
- `System.FS`
- `System.Path`
- `System.Time`
- `System.Environment`
- `System.Process`

## Tasks
1. Implement IO façade (`Print`, `Println`).
2. Implement FS/path/time/environment/process candidate APIs.
3. Use domain-specific error enums.
4. Keep platform differences behind runtime boundary.

## Acceptance
- Public System contracts are stable and docs-aligned.
- Recoverable failures use `Result` patterns.
