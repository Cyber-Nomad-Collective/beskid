# Beskid Nexus Redesign — Design Spec

**Date:** 2026-05-30  
**Status:** Approved (user clarifications incorporated)

## Goal

Replace the GitNexus-derived catalog/onboarding UX with a **graph-first public explorer** for Beskid repositories. Server maintains **cached knowledge graphs** for a global repo registry. **GitHub repo owners** administer their repos (add, re-index, doc maintenance). **AI documentation runs server-side only** — invisible to public visitors.

## Access model

| Actor | Capabilities |
|-------|--------------|
| **Public visitor** | View any indexed repo graph; switch repos via navbar selector; read **code documentation** on nodes/clusters (AI-generated, repo-scoped) plus optional **links** to platform spec pages (no spec text inlined, no chat/AI UI) |
| **Signed-in GitHub user** | Same as public; if they **own** a repo on GitHub, unlock admin actions for that repo |
| **Repo owner (per repo)** | Add repo to global registry, edit metadata, trigger index + doc refresh, delete repo from nexus, view MCP connect URL |
| **Instance operator** | First-run auth hub pairing (`NEXUS_SETUP_TOKEN`), env secrets, webhook HMAC |

**Ownership verification:** On mutating catalog operations, server calls GitHub API (`GET /repos/{owner}/{repo}`) with the user's hub token and requires `permissions.admin` or `owner` login match.

**Not in scope:** Per-repo private graphs. All indexed graphs are public read.

## UX shell (tracker/site alignment)

- **Layout:** Top navbar (not sidebar) — `Beskid / Nexus / {repo}` kicker, repo `<Select>`, symbol search, theme toggle, `BeskidHub` launcher (from `@beskid/beskid-ui`, same as tracker).
- **Landing:** `/` loads first enabled catalog entry by `sortOrder`; if none indexed, show empty state with sign-in CTA for repo owners.
- **Deep link:** `?repo=<catalog-id>` selects repo and loads graph.
- **Components:** `@beskid/ui-react` only for interactive UI (`Button`, `Select`, `Dialog`, `Card`, `Sidebar` primitives via `#/components/ui` alias). Tailwind + `@beskid/ui-react/styles/shadcn-entry.css` + `@beskid/beskid-ui/styles/hub.css`.
- **Removed from public UI:** DropZone, local analyze, CatalogHome grid, Cypher QueryFAB, LLM settings, Graph RAG chat, OnboardingGuide (hosted), advanced server connect.

## Server architecture

```
┌─────────────────────────────────────────────────────────────┐
│  gitnexus serve (single process)                            │
├─────────────────────────────────────────────────────────────┤
│  /api/catalog          public registry + graph metadata     │
│  /api/graph              cached LadybugDB export (stream)   │
│  /api/admin/catalog/*  repo-owner gated CRUD + analyze      │
│  /api/mcp                StreamableHTTP (Bearer token)      │
│  /api/internal/code-docs/*  server-only job status (no UI)    │
├─────────────────────────────────────────────────────────────┤
│  catalog.json → clone → analyze worker → .gitnexus/ index   │
│  post-analyze → doc-maintenance worker (OpenRouter)          │
│  code-docs/{registryName}.json  (repo-scoped AI code docs)  │
│  spec-index.json (read-only catalog for link resolution)    │
└─────────────────────────────────────────────────────────────┘
```

## Documentation model — code docs vs platform spec

Two distinct layers. **Never merge or paraphrase platform spec into code documentation.**

| Layer | Source | Content | Stored in |
|-------|--------|---------|-----------|
| **Code documentation** | Graph + source files (symbols, paths, call edges, clusters) | Plain-language explanation of what this code *does* in the repo | `code-docs/{registryName}.json` |
| **Platform spec** | `site/website/src/content/docs/platform-spec/` (normative) | Authoritative Beskid language/platform contracts | Site only — **not copied into nexus** |
| **Spec links** | Search over read-only spec index (link discovery only) | `{ title, href }` pointers when code clearly relates to a spec page | Attached to code-doc records |

**Rules for the doc worker:**

1. **Code doc text** is generated solely from graph context and file snippets — never from platform-spec MDX body text.
2. **Platform spec search** is used only by the `resolve_spec_links` tool to propose canonical URLs; the model may attach pages it found via search, not invent paths.
3. **No duplication:** If a spec page already fully covers a topic, the code doc stays brief and points to the spec link instead of restating normative content.
4. **Validation:** Reject commits where `codeDoc` contains long n-grams matching spec index chunks (anti-copy guard).

## AI documentation (hidden)

- **Trigger:** After successful analyze job; nightly cron for stale repos; webhook push.
- **Model:** OpenRouter free-tier models with tool use (`OPENROUTER_API_KEY`, model from `NEXUS_DOC_MODEL`).
- **Spec index (read-only):** Built from platform-spec MDX at `NEXUS_SPEC_ROOT` — title, slug, heading outline for **link lookup only**; not fed into code-doc prompts as source material.
- **Output:** `code-docs/{registryName}.json` keyed by node/cluster ID:

  ```typescript
  {
    entityId: string;
    entityKind: 'node' | 'cluster';
    codeDoc: string;           // repo-scoped; describes this code only
    specLinks: Array<{ title: string; href: string }>;  // 0–3 canonical spec pages
    contentHash: string;
    updatedAt: string;
  }
  ```

- Dedup via `contentHash`; skip regeneration when graph slice unchanged; dedup similar `codeDoc` text across siblings.
- **Public exposure:** Graph API merges `properties.codeDoc` and `properties.specLinks` separately — UI renders code doc body and spec links as distinct sections. No endpoint mentions AI, OpenRouter, or prompts.

## MCP connect

- **UI:** Header button "Connect MCP" (visible when signed in as repo owner for current repo, or always for compiler org repos).
- **Dialog:** Shows `https://<host>/api/mcp`, required `Authorization: Bearer $NEXUS_MCP_AUTH_TOKEN`, copy buttons, link to platform spec MCP section.

## GitNexus remnants — removal policy

| Keep (engine) | Remove/replace (product) |
|---------------|--------------------------|
| LadybugDB, tree-sitter analyze, graph API, MCP tools | DropZone, CatalogHome, QueryFAB, SettingsPanel LLM |
| `gitnexus-shared` types | `src/core/llm/*` (web), langchain deps |
| analyze-worker, embeddings (search) | Public analyze triggers from browser |
| wiki generator (reference) | Graph RAG RightPanel chat |

Package rename `gitnexus` → `beskid-nexus` is **deferred** (internal names stay; user-facing strings say "Beskid Nexus").

## Normative spec location

`site/website/src/content/docs/platform-spec/tooling/nexus/` — design model, contracts, ADRs for public graphs, owner admin, code-doc records (separate from platform spec body), MCP.
