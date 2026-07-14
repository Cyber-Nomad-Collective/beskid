# Beskid Platform Spec (`beskid-platform-spec`)

OpenSpec-backed normative platform specification at **`https://spec.beskid-lang.org`**.
`openspec/specs` is the authority; Memgraph is an optional derived index, not a
normative store.

## Canonical source

The reader loads the repository-root `openspec/specs/*/spec.md` files directly.
`openspec/catalog.json` supplies stable capability IDs, revision metadata, and
legacy aliases; it is compatibility metadata rather than a second source of
normative text.

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
bun install            # requires NODE_AUTH_TOKEN for @beskid/* packages
bun run dev            # http://localhost:8460
```

Author changes through OpenSpec from the superrepo root:

```bash
openspec validate --all --strict
openspec new change <change-name>
```

For a non-default checkout, point the reader at its OpenSpec directory:

```bash
OPENSPEC_ROOT=/path/to/repo/openspec bun run dev
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
