<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Design model Specification

## Purpose

Graph-first landing, navbar shell, global registry, code-doc vs platform-spec separation, and MCP connect surface.

## Requirements

### Requirement: Design model conformance status
This capability SHALL remain non-conformant and MUST NOT be cited as an implemented Beskid guarantee until a validated OpenSpec change adds explicit behavioral requirements.

**Stable ID:** `BSP-REQ-A4847E932F66`

#### Scenario: Capability has descriptive material only
- **GIVEN** the migrated sources contain no uppercase BCP-14 obligation or accepted ADR decision
- **WHEN** an implementation reports Beskid conformance
- **THEN** it MUST NOT claim conformance based on this capability

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/tooling/nexus/design-model/`  
**Source:** `site/spec-content/platform-spec/tooling/nexus/design-model/content.md`  
**SHA-256:** `2172729ea529619ab2ca0002b1c3a92ea4ce861ce4a58228f57f55a38f6c4cee`

<details>
<summary>Migrated source text</summary>

``````markdown
## UX shell

Nexus **must** align with tracker and site chrome:

| Element | Contract |
| --- | --- |
| Layout | Top navbar (not sidebar) |
| Kicker | `Beskid / Nexus / {repo}` |
| Repo switch | `<Select>` bound to public catalog |
| Search | Symbol search over active graph |
| Theme | Light/dark toggle |
| Hub | `BeskidHub` launcher from `@beskid/beskid-ui` |

Interactive UI **must** use `@beskid/ui-react` primitives via the `#/components/ui` alias. Styles **must** import `@beskid/ui-react/styles/shadcn-entry.css` and `@beskid/beskid-ui/styles/hub.css`.

## Graph-first landing

| Rule | Behavior |
| --- | --- |
| N-01 | `/` **must** load the first **enabled, indexed** catalog entry by ascending `sortOrder` |
| N-02 | When no indexed entry exists, show empty state with sign-in CTA for repo owners |
| N-03 | Deep link `?repo=<catalog-id>` **must** select that entry and load its graph |
| N-04 | Default view **must** be the graph explorer — not a catalog home grid |

Admin flows (add repo, re-index, delete) **must** appear as dialog or sheet overlays, not separate full-page phases.

## Global registry model

The server maintains `catalog.json` — the authoritative list of public Nexus entries.

| Field | Role |
| --- | --- |
| `id` | Stable catalog identifier; used in `?repo=` and admin routes |
| `displayName`, `description`, `gitUrl`, `defaultBranch` | Public metadata |
| `sortOrder` | Landing and selector ordering |
| `indexed`, `registryName` | Whether a LadybugDB export exists and its storage key |
| `lastIndexedCommit`, `indexedAt`, `stats` | Index freshness and graph size |
| `docStatus` | Coarse doc pipeline state (`idle` \| `running` \| `failed` \| `ready`) — no AI vendor details |

Index pipeline: clone → analyze worker → `.gitnexus/` index → optional code-doc maintenance worker.

## Code documentation vs platform spec

Two distinct layers. Implementations **must never** merge or paraphrase platform spec into code documentation.

| Layer | Source | Stored in | Public exposure |
| --- | --- | --- | --- |
| **Code documentation** | Graph + source snippets | `code-docs/{registryName}.json` | `properties.codeDoc` on graph nodes/clusters |
| **Platform spec** | `site/website/.../platform-spec/` | Site only — **not copied** | Never inlined |
| **Spec links** | Read-only spec index search | Same JSON sidecar | `properties.specLinks` — `{ title, href }[]` |

### CodeDocRecord

```typescript
interface CodeDocRecord {
  entityId: string;
  entityKind: 'node' | 'cluster';
  /** Repo-scoped explanation. Must NOT contain platform-spec prose. */
  codeDoc: string;
  /** 0–3 canonical platform-spec URLs. href must exist in spec index. */
  specLinks: Array<{ title: string; href: string }>;
  contentHash: string;
  updatedAt: string;
}
```

Doc worker rules:

1. **Code doc text** is generated solely from graph context and file snippets.
2. Spec search is used **only** by `resolve_spec_links` to propose canonical URLs — models **must not** invent paths.
3. When a spec page fully covers a topic, `codeDoc` stays brief and points via `specLinks`.
4. Anti-copy validation rejects records where `codeDoc` contains long n-grams matching spec index chunks.

Public graph API **must** merge `codeDoc` and `specLinks` as **separate** node properties. UI **must** render them in distinct sections.

## Server architecture

```
┌─────────────────────────────────────────────────────────────┐
│  gitnexus serve (single process)                            │
├─────────────────────────────────────────────────────────────┤
│  /api/catalog          public registry + graph metadata     │
│  /api/graph              cached LadybugDB export (stream)   │
│  /api/admin/catalog/*  repo-owner gated CRUD + analyze        │
│  /api/mcp                StreamableHTTP (Bearer token)      │
│  /api/internal/code-docs/*  server-only job status (no UI)  │
├─────────────────────────────────────────────────────────────┤
│  catalog.json → clone → analyze → .gitnexus/ index            │
│  post-analyze → doc-maintenance (OpenRouter, hidden)          │
│  code-docs/{registryName}.json                              │
│  spec-index.json (read-only link resolution)                │
└─────────────────────────────────────────────────────────────┘
```

## MCP connect surface

| Rule | Contract |
| --- | --- |
| N-MCP-01 | MCP endpoint **must** be same-origin `{origin}/api/mcp` |
| N-MCP-02 | Transport **must** require `Authorization: Bearer $NEXUS_MCP_AUTH_TOKEN` |
| N-MCP-03 | Header button **Connect MCP** **must** be visible when user is signed in |
| N-MCP-04 | Dialog **must** show endpoint URL, auth header template, copy actions, and link to [MCP contracts](/platform-spec/tooling/nexus/contracts-and-edge-cases#mcp) |

Token value is a deployment secret — UI shows placeholder guidance for operators, not the live secret.

## Ownership verification

On mutating catalog operations the server **must** call GitHub `GET /repos/{owner}/{repo}` with the user's hub token and require `permissions.admin` or owner login match. Env-based admin rosters **must not** gate per-repo CRUD (operator setup endpoints excepted).

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
