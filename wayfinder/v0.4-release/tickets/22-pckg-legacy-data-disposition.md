## Status

Closed

## Type

Grilling (HITL)

## Question

Does any production pckg registry data or artifact inventory need to survive the .NET-to-Rust cutover?

## Context

The local pckg migration deletes the old service and its importer/migrations. If no legacy production data exists or it is disposable, the release slice may remove stale cutover tooling and use immutable-image plus PostgreSQL/artifact-volume snapshot rollback. If data must survive, the removed migration implementation and rehearsed reconciliation must be restored before the .NET source is deleted.

## Recommended answer

Treat legacy data as non-disposable unless an operator can confirm an empty/disposable environment and a verified backup inventory. This is fail-closed: it prevents an irreversible loss but requires a larger migration prerequisite.

## Resolution

**Resolved 2026-09-07.** The legacy registry is disposable. Beskid will publish a fresh Rust-backed registry inventory, beginning with corelib, templates, and subsequent packages. The .NET service and its deleted cutover tooling will not be restored. The deployment rollback boundary is the previous immutable image plus preserved volume snapshot; there is no legacy application-data migration claim.
