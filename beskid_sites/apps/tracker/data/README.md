# Roadmap seed catalog (v0.0–v0.5)

Hand-maintained planning catalog for **import** into the tracker database (or legacy GitHub seed import). JSON entities are validated against [JSON Schema](../schemas/seed/index.json) (exported from Zod via `bun run seed:schema:export`).

Each delivery version has:

- `version.json` — title, theme, summary, **status**, and **cutoff** (date range + end commit SHA + rationale)
- `workstreams/<slug>.json` — grouping metadata for the workstreams dashboard
- `tasks/<id>.json` — work items keyed by **slug `id`** (not GitHub issue numbers)
- `deliverables/<id>.json` — delivery anchors referenced by tasks

### Task fields

| Field | Purpose |
|-------|---------|
| `id` | Stable slug; filename must match (`tasks/<id>.json`) |
| `order` | Optional sort key within the version (lower first) |
| `subtasks` | Checklist steps: `{ "text": "…", "done": true \| false }[]` |
| `source` | Git provenance: `repo`, `commit`, `subject`, optional `url` |
| `deliverableId` | Links to `deliverables/<id>.json` |
| `body` | Markdown narrative (Provenance / Catalog scope sections encouraged) |

Legacy **`number`** on tasks or deliverables is removed; run `bun run seed:migrate` once if importing old JSON.

Catalog layout lives under `data/v0.0/` … `data/v0.5/` (one JSON file per entity). v0.5 is spec-planned only (status `Planned`); its band, article, and workstreams are seeded, but no task files exist yet — tasks will be seeded when implementation begins and 0.4 sign-off closes.

Validate after edits:

```bash
bun run seed:validate
```

Load in the app after import (Settings → Import seed JSON):

```bash
bun run dev
```

The tracker reads catalog and kanban from SQLite once seed data is imported. Seed JSON on disk is still used as fallback when the database has no versions yet.

## Omitted entity types

| Entity | Reason |
|--------|--------|
| **Public bugs** (`bug` label) | Separate anonymous route; seed is for version-scoped roadmap planning only |
