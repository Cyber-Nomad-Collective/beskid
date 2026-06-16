# Beskid Platform Spec (`beskid-platform-spec`)

Memgraph-backed normative platform specification at **`https://spec.beskid-lang.org`**.

## Features

- **Public reader** — anonymous SSR at `/platform-spec/*` (Memgraph `SpecDocument` nodes)
- **Draft workflow** — authenticated users submit `DraftChange` proposals
- **Moderation** — maintainers approve → GitHub PR → merge webhook → published graph + git export
- **JSON APIs** — `/api/v1/catalog`, `/api/v1/nav-tree`, `/api/v1/docs/{slug}`

## Local development

```bash
# Terminal 1 — Memgraph
docker compose up memgraph

# Terminal 2 — normative JSON submodule + app
git submodule update --init site/spec-content
cp .env.example .env   # set MEMGRAPH_URI, SESSION_SECRET, AUTH_HUB_PUBLIC_URL
bun install            # requires NODE_AUTH_TOKEN for @beskid/* packages
bun run dev            # http://localhost:8460
```

Normative JSON lives in **`site/spec-content`** (submodule). Author with the spec CLI from the superrepo root:

```bash
bun run spec validate
bun run spec new node -t Feature --slug platform-spec/community/spec-maintenance/architecture
```

Local reader against the submodule checkout:

```bash
SPEC_LOCAL_WORKSPACE=site/spec-content bun run dev
```

Optional: refresh submodule content from legacy website MDX (migration aid only):

```bash
PLATFORM_SPEC_SEED_FROM=site/website/src/content/docs/platform-spec bun run seed:force
```

Legacy Memgraph MDX import (optional):

```bash
SKIP_ENV_VALIDATION=1 bun run import:mdx
```

## Auth hub pairing

1. Deploy [auth hub](../auth/COOLIFY.md) and pair app id **`platform-spec`**
2. Open `/settings/auth/pair` on this app
3. Sign in at `/settings/auth/login`

See [COOLIFY.md](./COOLIFY.md) for production deploy.

## Git export path

Published MDX is written to:

`content/docs/platform-spec/`

(trudoc CI verifies this tree after merge)
