# Agent E - Platform Spec Authoring and Node/pnpm Cutover

## Scope
Complete the revision-pinned Platform Spec Draft Contexts implementation and the repository-wide Node/pnpm cutover (replacing Bun).

## Issues (3, all In Progress)

| ID | Pri | Title | Dependencies |
|----|-----|-------|--------------|
| CYB-165 | High | Platform Spec authoring and Node/pnpm cutover (parent) | - |
| CYB-166 | High | Implement revision-pinned Platform Spec Draft Contexts | - |
| CYB-167 | High | Complete repository-wide Node and pnpm cutover | - |

## CYB-166 - Draft Contexts Implementation

### Current State
Task 1 (OpenSpec authority change) is review-approved and active. Task 2 (canonical identity/catalog implementation) is in progress.

### Required Work
1. Canonical identity - Domain/Area/Feature/Article/ADR identity types, catalog, reader, seed, graph, and route slice. See site/platform-spec/src/lib/spec/document-identity.ts, catalog.ts, domain-model.ts.
2. Draft Context revisions - Immutable revisions with ordered document changes. See site/platform-spec/src/server/memgraph/types.ts (DraftContext, DraftDocumentChange, DraftContextRevision).
3. Shared validation - Server/client structural validation and atomic PR serialization. See site/platform-spec/src/lib/spec/draft-validation.ts.
4. Git-sync PR path - Use site/platform-spec/src/server/git-sync/pr.ts only for PR editing.
5. Memgraph integration - Draft context storage in Memgraph. See site/platform-spec/src/server/memgraph/client.ts, schema.ts.

### Verification
  cd site/platform-spec
  pnpm test
  pnpm run validate-standard

## CYB-167 - Node/pnpm Cutover

### Current State
Task 1 (pnpm workspace/lock contracts) is review-approved. Task 2 (Node SQLite and test-runtime portability) is in progress.

### Required Work
1. Node 22.12 + Corepack-pinned pnpm 10.17.1 across root and independent submodule workspaces.
2. Port Auth, Platform Spec, and Tracker from bun:sqlite to node:sqlite or better-sqlite3.
   - site/auth/src/server/db/index.ts - auth database
   - site/platform-spec/ - if any Bun SQLite usage
   - beskid_tracker/ - tracker SQLite
3. Replace Bun tests/runtime tooling in GitHub Actions, Docker builders/runtimes, local scripts.
4. Remove Bun from all CI workflows - no bun install, bun test, bun run in any workflow.
5. Update Dockerfiles - use node:22-slim or equivalent, not oven/bun.
6. Update package.json scripts - replace bun commands with pnpm equivalents.

### Verification
  pnpm install --frozen-lockfile
  pnpm test
  cd site/auth && pnpm test
  cd site/platform-spec && pnpm test
  cd site/website && pnpm build
  cd site/learn && pnpm test
  grep -r 'bun ' .github/workflows/ # should return nothing

## Key Files
- site/platform-spec/src/lib/spec/ - document-identity.ts, catalog.ts, domain-model.ts, draft-validation.ts
- site/platform-spec/src/server/memgraph/ - client.ts, schema.ts, types.ts
- site/platform-spec/src/server/git-sync/pr.ts - PR editing path
- site/auth/src/server/db/index.ts - auth SQLite
- beskid_tracker/src/ - tracker SQLite
- .github/workflows/ - CI workflows (remove Bun)
- package.json files - scripts (replace Bun)
- pnpm-workspace.yaml - workspace config

## Acceptance
- Draft Contexts: revision-pinned, multi-document OpenSpec change sets work end-to-end
- Node/pnpm: Node 22.12 + pnpm 10.17.1 across all workspaces
- No bun:sqlite imports remain
- No bun commands in CI workflows or Dockerfiles
- All site tests pass under Node/pnpm
- pnpm install --frozen-lockfile works at root and all sub-workspaces
