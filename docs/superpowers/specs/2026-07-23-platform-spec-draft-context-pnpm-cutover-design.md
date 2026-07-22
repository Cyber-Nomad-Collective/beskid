# Platform Spec Draft Context and pnpm Cutover Design

## Decision

Deliver two coordinated refactors with clear boundaries:

1. Replace the Platform Spec's one-document proposal editor with a revision-pinned Draft Context: a multi-document working set that is traversable, auditable, and immutable by revision.
2. Remove Bun from all active superrepo, site, container, GitHub Actions, and checked-out web-submodule paths. Use Node 22.12 and Corepack-pinned pnpm 10.17.1. Each submodule remains its own pnpm workspace and commits independently; the superrepo records only its resulting gitlink.

There is no Bun compatibility path, mixed active lockfile, UI-only document type, or lossy rich-editor source of truth.

## Codebase facts

| Concern | Current state | Required change |
| --- | --- | --- |
| Root package tooling | `packageManager` already pins pnpm, but scripts and `bun.lock` still use Bun | Root pnpm workspace and sole `pnpm-lock.yaml` |
| Deployable data layer | Auth, Platform Spec, and Tracker import `bun:sqlite` | Node-compatible SQLite boundary before Node containers ship |
| Platform Spec authoring | A `DraftChange` holds one forced Feature-shaped body | `DraftContext` with ordered document changes |
| Spec document model | Catalog, routes, seed, graph, and PR generation are feature-only | One canonical identity model for Domain, Area, Feature, Article, and ADR |
| Visual authoring | Plain Markdown textarea and client-only advisory validation | Source-first restricted Tiptap plus shared fail-closed validation |
| CI/containers | Actions and seven Dockerfiles directly execute Bun | Corepack/pnpm and Node 22 builders/runtimes |

## Draft Context model

A context is analogous to an e-shop cart: it pins a base catalog revision and contains an ordered, atomic set of document operations. It is not a second normative authority. Its output is an OpenSpec change bundle reviewed through the normal repository gates.

```ts
type DraftContextStatus =
  | "draft" | "submitted" | "approved" | "rejected" | "merged" | "superseded";

type SpecArtifactKind = "domain" | "area" | "feature" | "article" | "adr";

interface DraftContext {
  id: string;
  title: string;
  summary: string;
  baseCatalogRevision: string;
  status: DraftContextStatus;
  authorLogin: string;
  validationState: "unknown" | "valid" | "invalid";
  validationRevision: string | null;
  branch: string | null;
  prNumber: number | null;
}

interface DraftDocumentChange {
  id: string;
  contextId: string;
  ordinal: number;
  operation: "create" | "update" | "delete";
  identity: SpecDocumentIdentity;
  sourceMarkdown: string;
  baseMarkdown: string | null;
  baseContentHash: string | null;
  contentHash: string | null;
  validation: DraftValidationResult;
}
```

Every mutation writes an immutable `DraftContextRevision` snapshot of metadata, ordered change hashes, author, and time. The mutable context head is only the current operational view. It can be edited only while `draft` or `rejected`; submission and approval revalidate the current content digest and pinned base revision.

The fixed banner sits below the authenticated top bar on editor and moderation routes. It shows context status, pinned revision, scope, validation, and changed/added/deleted counts. Its change-set drawer shows hierarchy, canonical path, operation, diagnostics, and a unified base-to-proposed diff; new documents show their complete body. Authors and moderators use the same component.

## Canonical document identities

One resolver owns identity, path, layout, parent, authority, and public slug. The browser never composes a repository path.

| Kind | Canonical source | Authority | Public path |
| --- | --- | --- | --- |
| Domain | `openspec/specs/taxonomy--<domain>/spec.md` | normative provisional taxonomy | `/platform-spec/domains/<domain>/` |
| Area | `openspec/specs/taxonomy--<domain>--<area>/spec.md` | normative provisional taxonomy | `/platform-spec/domains/<domain>/areas/<area>/` |
| Feature | `openspec/specs/<domain>--<area>--<feature>/spec.md` | normative | existing capability URL |
| Article | `openspec/documents/platform-spec/<capability>/articles/<article>.md` | informative | capability article URL |
| ADR | `openspec/documents/platform-spec/<capability>/decisions/<nnnn>-<slug>.md` | informative | capability decision URL |

The catalog normalizes capabilities and documents into one discriminated list. Domain and Area taxonomy hubs stop redirecting to a first feature once their own documents exist. Article and ADR support begins only after this catalog, route, seed, graph, and PR-serialization slice exists.

## Wizard, editor, and validation

The wizard creates a context then adds documents through operation, artifact kind, parent selection, server-derived identity, and a layout template. It permits only valid parent/type combinations and fails closed on conflicts.

Tiptap 3.28.0 is restricted to headings, paragraphs, lists, blockquotes, code, emphasis, strong, inline code, and links. Markdown source remains the only persisted data. Visual edits require a source diff confirmation before they replace source; no Tiptap JSON, raw HTML, images, embeds, tables, or collaboration payloads are persisted. TanStack Start rendering is client-only with `immediatelyRender: false`.

A shared pure validation module runs client preflight and server save/submit/approval. Invalid drafts may be saved, but submission and approval fail closed. Feature documents require explicit `### Requirement:` headings and testable GIVEN/WHEN/THEN scenarios. The active `git-sync/pr.ts` serializer emits the complete context atomically and never synthesizes a requirement or scenario from arbitrary prose. GitHub OpenSpec validation remains final authority.

## pnpm and Node cutover

The target is Node 22.12 and the exact pnpm version in root `packageManager`, enabled through Corepack. Root gets `pnpm-workspace.yaml` and one `pnpm-lock.yaml`; each submodule gets its own equivalent lock/workspace where needed. Bun lockfiles are removed only after frozen installs pass. `file:` dependencies remain until a real workspace owns both ends; no cross-repository pseudo-workspace is introduced.

Before changing containers, Auth, Platform Spec, and Tracker receive a compatible SQLite boundary and Platform Spec's Bun-targeted seed bundle is replaced with a Node-targeted build. Bun test suites move to the existing test runner pattern (Vitest or `node:test`), preserving behavior. GitHub Actions use `actions/setup-node`, `corepack enable`, the pinned pnpm, frozen installs, and lockfile-keyed caches. Docker builders use Node 22, `PNPM_HOME`, a cached pnpm store, and BuildKit secret-based package auth; runtime images execute Node. Existing named BuildKit contexts and submodule initialization remain required.

## Delivery order

1. OpenSpec change defining document identities, authority, catalog representation, and validation obligations.
2. Canonical catalog/reader/route/seed/graph identity vertical slice, with static seed verification.
3. Draft Context persistence migration, immutable revisions, APIs, shared banner/diff, and wizard.
4. Source-first Tiptap and structural validation; PR serializer atomic multi-document output.
5. Node-compatible SQLite and test-runtime conversion in each affected owned repository.
6. pnpm workspaces, locks, Actions, Dockerfiles, CI contracts, and gitlink updates.
7. Full service/container and OpenSpec verification, then removal scan proving no active Bun usage.

## Verification

- Unit and integration tests for identity resolution, catalog generation, draft context transitions, change diffs, validation, and PR serialization.
- Markdown round-trip tests for every supported Tiptap construct.
- `pnpm install --frozen-lockfile`, test, typecheck, and build in every workspace.
- `pnpm run openspec:catalog` and `pnpm run openspec:validate` at root.
- Existing CI foundation and tracker-delivery contracts, updated to assert Node/pnpm rather than Bun.
- Build and health-check every migrated container using the same BuildKit contexts as delivery.
- Final absence scan across active source, Actions, and Dockerfiles for `bun`, `oven/bun`, `bun:sqlite`, and `bun:test`.
