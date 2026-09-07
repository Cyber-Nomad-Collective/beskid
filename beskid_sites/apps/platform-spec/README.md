# Beskid Platform Spec (`beskid-platform-spec`)

OpenSpec-backed normative platform specification at **`https://spec.beskid-lang.org`**.
`openspec/specs` is the authority; Memgraph is an optional derived index, not a
normative store.

## Canonical source

`openspec/specs/*/spec.md` is the build-time authority. `pnpm run seed:static`
projects it into a deterministic `seed/` workspace that the image bakes and the
runtime serves by default, rather than rescanning the repository-root files on
every request. `openspec/catalog.json` supplies stable capability IDs, revision
metadata, and legacy aliases; it is compatibility metadata rather than a second
source of normative text.

## Native shape: OpenSpec, hybrid rendering

OpenSpec is the native shape. On top of it the reader keeps the previous
approach's three affordances:

- **Enforceable layouts.** `openspec/layouts/*.json` declares the required,
  ordered sections each capability must carry for its spec level. The authority
  gate `pnpm run openspec:layouts` and the platform-spec gate (`layouts:check`,
  `verify:seed`) enforce conformance; the reader surfaces the resolved layout and
  its validation result on every document.
- **Domain -> area -> feature model.** Derived natively from the capability id
  (`domain--area--feature`) into the nav rail, the static seed, and the graph.
- **Static generation.** `pnpm run seed:static` projects OpenSpec into a
  deterministic JSON workspace under `seed/` (catalog, nav tree, domain model,
  layouts, document bundles). The runtime serves those artifacts without
  rescanning the filesystem; the image bakes them at build time.

### Seeding and migrations

Seeding is idempotent upsert, safe to run on every container start:

- `pnpm run seed:static` — regenerate the `seed/` JSON workspace from OpenSpec.
- `pnpm run seed:stores` — upsert the workspace into the SQLite settings DB
  (`spec_capability`, `spec_layout`, `spec_seed_meta`; schema migrations in
  `src/lib/storage/schema.ts`).
- `pnpm run seed:graph` — MERGE the domain/area/feature graph into Memgraph.
- `pnpm run seed` — all of the above (graph only when `MEMGRAPH_URI` is set).

The container entrypoint runs `seed:stores` (plus `--graph` when Memgraph is
configured) before starting the server, converging the stores to the image's
OpenSpec revision.

Public APIs:

- `/api/v1/catalog` — versioned OpenSpec capability and alias catalog
- `/api/v1/nav-tree` — reader navigation generated from that catalog
- `/api/v1/docs/{id-or-legacy-slug}` — complete canonical capability document
- `/api/v1/embed/{capability[#requirement]}` — JSON fragment; add
  `?format=html` for embeddable HTML
- `/beskid-doc-embed.js` — dependency-free `<beskid-doc-embed>` custom element

## Local development

```bash
# Terminal 1 — Memgraph
docker compose up memgraph

# Terminal 2 — OpenSpec reader app
cp .env.example .env   # set MEMGRAPH_URI, SESSION_SECRET, AUTH_HUB_PUBLIC_URL
pnpm install            # requires NODE_AUTH_TOKEN for @beskid/* packages
pnpm run dev            # http://localhost:8460
```

Author changes through OpenSpec from the superrepo root:

```bash
openspec validate --all --strict
openspec new change <change-name>
```

For a non-default checkout, point the reader at its OpenSpec directory:

```bash
OPENSPEC_ROOT=/path/to/repo/openspec pnpm run dev
```

## Auth hub pairing

1. Deploy [auth hub](../auth/COOLIFY.md) and pair app id **`platform-spec`**
2. Open `/settings/auth/pair` on this app
3. Sign in at `/settings/auth/login`

See [COOLIFY.md](./COOLIFY.md) for production deploy.

## Markdown embeds

Book and platform Markdown may use typed fenced directives. Each directive has
a readable link fallback and is progressively enhanced when JavaScript loads:

````markdown
```spec
ref: compiler--build-pipeline--program-assembly#artifact-selection
title: Artifact selection requirement
```
````

The same shape supports `book`, `nexus`, and `bug` directive types.
