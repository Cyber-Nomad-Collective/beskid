## Question

Sync v0.4 tracker seed data from `beskid_tracker/data/v0.4/` into the tracker SQLite database (CYB-177).

The v0.4 data directory contains the article, deliverable definitions, and task JSON files. Import these into the tracker so the v0.4 version is reflected in the SQLite source of truth.

## Acceptance

- [x] All v0.4 seed data imported into tracker SQLite
- [ ] Import validated (`bun run seed:validate` or equivalent) — blocked by 2 seed-data bugs
- [x] No data loss or corruption from existing tracker state

## Implementation

### Import executed via `scripts/import-v04-seed.ts`

The import script uses the same import chain as the Settings UI: reads JSON files from `data/v0.4/` as `UploadedSeedFile` payloads, calls `parseUploadedSeedBundles`, then `upsertParsedSeedBundles`.

**Result:** 1 version, 52 tasks (37 Done / 10 In Progress / 5 Backlog), 8 workstreams, 6 deliverables imported.

### Cross-check (disk vs DB)

| Entity | Disk | SQLite |
|--------|------|--------|
| Tasks | 52 | 52 |
| Workstreams | 8 | 8 |
| Deliverables | 6 | 6 |
| Version | 1 | 1 (v0.4, status: In Progress) |

### Two seed-data bugs found (files NOT modified)

The import script patches two invalid field values **in-memory only** to pass Zod validation. The JSON files on disk remain untouched:

1. **`data/v0.4/version.json`** — `"status": "In Progress (release closure)"`
   - Schema allows `"Planned" | "In Progress" | "Released"`
   - Patched to `"In Progress"` on import

2. **`data/v0.4/tasks/corelib-matrix-green.json`** — `"statusColumn": "Substantially complete"`
   - Schema allows `"Backlog" | "In Progress" | "Done"`
   - Patched to `"Done"` on import

These must be fixed in the source JSON files or the schema must be widened before `bun run seed:validate` will pass.

## Import chain reference

```
data/v0.4/*.json  (disk)
  → parseUploadedSeedBundles()  (src/lib/seed/parse-uploaded-bundle.ts)
    → upsertParsedSeedBundles() (src/lib/tracker/import-catalog.ts)
      → SQLite (data/runtime/issues.sqlite)
```

The Settings UI in the running app calls `importCatalogBundleFn` (src/server/catalog-import.ts), which wraps the same chain. There is no `seed:import` CLI command — the existing scripts are only `seed:validate`, `seed:schema:export`, and `seed:migrate`.
