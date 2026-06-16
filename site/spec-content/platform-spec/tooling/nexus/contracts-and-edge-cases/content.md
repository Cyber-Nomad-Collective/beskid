---
title: Contracts and edge cases
description: Nexus REST API contracts, CodeDocRecord rules, spec link
  validation, auth/me ownedRepoIds, and MCP Bearer requirements.
specLevel: feature
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
submitter:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-05-30
---

## Public catalog

### `GET /api/catalog`

**Returns:**

```json
{
  "entries": [
    {
      "id": "beskid",
      "displayName": "Beskid",
      "description": "Language platform superrepo",
      "gitUrl": "https://github.com/Cyber-Nomad-Collective/beskid",
      "defaultBranch": "main",
      "sortOrder": 0,
      "indexed": true,
      "registryName": "beskid-main",
      "lastIndexedCommit": "abc123",
      "indexedAt": "2026-05-30T12:00:00.000Z",
      "stats": { "nodes": 12000, "relationships": 45000 },
      "docStatus": "ready"
    }
  ]
}
```

| Rule | Policy |
| --- | --- |
| NX-01 | Response **must not** expose internal paths, OpenRouter model names, or prompt text |
| NX-02 | Entries with `indexed: false` **may** appear in catalog but **must not** be selected as landing default |
| NX-03 | `docStatus` is coarse public state only — no AI pipeline error strings |

### `GET /api/catalog/:id`

**Returns:** single `PublicCatalogEntry` or `404`.

## Public graph

### `GET /api/graph?repo=<registryName>`

**Returns:**

```json
{
  "nodes": [
    {
      "id": "n_42",
      "labels": ["Function"],
      "properties": {
        "name": "resolveImports",
        "path": "compiler/crates/beskid_analysis/src/resolve/mod.rs",
        "codeDoc": "Resolves import declarations against the module index for the active compilation unit.",
        "specLinks": [
          {
            "title": "Dependency graph and cycle policy",
            "href": "/platform-spec/compiler/resolution-and-projects/dependency-graph-and-cycle-policy/"
          }
        ]
      }
    }
  ],
  "relationships": []
}
```

| Rule | Policy |
| --- | --- |
| NX-G-01 | `repo` query **must** match `registryName` of an indexed catalog entry |
| NX-G-02 | `properties.codeDoc` and `properties.specLinks` **must** be omitted when no `CodeDocRecord` exists |
| NX-G-03 | When present, `codeDoc` and `specLinks` **must** be attached separately — never concatenated into one string |
| NX-G-04 | Graph stream **must** be the cached LadybugDB export; clients **must not** trigger analyze from this route |

## Authenticated session

### `GET /api/auth/me`

**Returns:**

```json
{
  "login": "octocat",
  "name": "Octocat",
  "avatarUrl": "https://avatars.githubusercontent.com/u/1?v=4",
  "ownedRepoIds": ["my-demo", "beskid"]
}
```

| Rule | Policy |
| --- | --- |
| NX-A-01 | `ownedRepoIds` lists catalog `id` values where the session user is GitHub owner or admin |
| NX-A-02 | Unauthenticated requests **must** return `401` |
| NX-A-03 | Ownership **must** be verified via GitHub API with hub user token — not a static env roster |

## Repo-owner admin

All routes below require authenticated session **and** GitHub ownership of the target entry's `gitUrl`.

### `POST /api/admin/catalog`

**Body:**

```json
{
  "displayName": "My Demo",
  "description": "Example Beskid repo",
  "gitUrl": "https://github.com/octocat/demo",
  "defaultBranch": "main"
}
```

**Returns:** created `PublicCatalogEntry` or `403` when user is not repo owner.

### `PATCH /api/admin/catalog/:id`

**Body:** partial metadata fields (`displayName`, `description`, `gitUrl`, `defaultBranch`, `sortOrder`).

### `DELETE /api/admin/catalog/:id`

Removes entry from global registry and associated index artifacts.

### `POST /api/admin/catalog/:id/analyze`

Enqueues clone + analyze worker for the entry.

### `POST /api/admin/catalog/:id/refresh-docs`

Enqueues code-doc maintenance for the entry (server-side only).

| Rule | Policy |
| --- | --- |
| NX-ADM-01 | Non-owners **must** receive `403` — not `404` — to avoid catalog id enumeration ambiguity |
| NX-ADM-02 | Operator `requireAdmin` **must** remain only for setup pairing (`POST /api/admin/auth/pair`) and instance bootstrap |
| NX-ADM-03 | Ownership checks **may** be cached up to 15 minutes per `(login, gitUrl)` pair |

## CodeDocRecord validation

| Rule | Policy |
| --- | --- |
| NX-DOC-01 | `codeDoc` **must** describe what the code does in the repo — generated from graph metadata and short file snippets only |
| NX-DOC-02 | `codeDoc` **must not** contain platform-spec MDX body text or long excerpts from the spec link index |
| NX-DOC-03 | Anti-copy guard **must** reject records where `codeDoc` contains ≥40 consecutive characters matching any spec index excerpt |
| NX-DOC-04 | `specLinks` **must** contain 0–3 entries; each `href` **must** exist in the built spec link index |
| NX-DOC-05 | Unknown `href` values **must** be dropped at commit time — never stored or exposed |
| NX-DOC-06 | Regeneration **must** skip entities whose `contentHash` is unchanged |
| NX-DOC-07 | Similar sibling `codeDoc` text (Jaccard > 0.85) **should** be deduplicated before persist |

### Spec link index (read-only)

Built at boot from `NEXUS_SPEC_ROOT` (default: `site/website/src/content/docs/platform-spec`). Index stores slug, title, href, and heading outline for **link lookup only** — full MDX bodies **must not** be fed into code-doc generation prompts.

## MCP

### `POST /api/mcp` (Streamable HTTP)

| Rule | Policy |
| --- | --- |
| NX-MCP-01 | Endpoint **must** be mounted at `/api/mcp` on the Nexus origin |
| NX-MCP-02 | Requests **must** include `Authorization: Bearer <NEXUS_MCP_AUTH_TOKEN>` |
| NX-MCP-03 | Missing or invalid Bearer **must** return `401` |
| NX-MCP-04 | MCP tools expose graph query capabilities from the cached index — same data plane as public graph API |
| NX-MCP-05 | Connect MCP dialog **must** document endpoint and header format; token is operator-supplied via deployment env |

Example client configuration:

```
URL: https://nexus.beskid-lang.org/api/mcp
Header: Authorization: Bearer $NEXUS_MCP_AUTH_TOKEN
```

## Edge cases

| Scenario | Expected behavior |
| --- | --- |
| Catalog empty | Landing empty state; repo selector disabled |
| Entry registered but not indexed | Visible in selector with disabled graph; owner may trigger analyze |
| Analyze in progress | Graph route returns `409` or stale export per server policy; UI shows loading state |
| Doc job failed | `docStatus: failed`; graph still served; `codeDoc` absent on affected entities |
| Non-GitHub `gitUrl` on create | `400` — ownership cannot be verified |
| GitHub API rate limit | Ownership cache reduces calls; transient failures **must** fail closed (403) |
| Spec index stale after site deploy | Operator restarts Nexus or triggers spec index rebuild at boot |

## Type reference

```typescript
interface PublicCatalogEntry {
  id: string;
  displayName: string;
  description: string;
  gitUrl: string;
  defaultBranch?: string;
  sortOrder: number;
  indexed: boolean;
  registryName?: string;
  lastIndexedCommit?: string;
  indexedAt?: string;
  stats?: { nodes: number; relationships: number };
  docStatus?: 'idle' | 'running' | 'failed' | 'ready';
}
```

Normative TypeScript mirrors live in `beskid_nexus/gitnexus/src/server/nexus/types.ts`.
