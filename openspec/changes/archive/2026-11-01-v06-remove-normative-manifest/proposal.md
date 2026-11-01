## Why

The `standard-normative-manifest` capability specifies a chaptered JSON manifest served by the platform-spec site. The manifest was never built: the change `add-normative-manifest` was archived as abandoned with 0 of 13 tasks done, and no chapter documents, schema, catalog support or route exist. The platform-spec site it targeted was retired; the public standard surface is `/docs/standard/` on the website. Beskid has no users, so the capability is removed instead of being kept as an unimplemented obligation. See `docs/reports/2026-10-13-openspec-reconciliation.md`.

## What Changes

- **BREAKING** (specification only): remove every requirement of `standard-normative-manifest`.
- Delete the capability directory `openspec/specs/standard-normative-manifest/` when this change is archived with `--skip-specs` (OpenSpec cannot apply a delta that leaves a spec without requirements), then regenerate `openspec/catalog.json`.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `standard-normative-manifest`: all requirements removed; the capability is retired.

## Impact

No code, tooling or site depends on the manifest. `scripts/openspec` and the website do not reference it.
