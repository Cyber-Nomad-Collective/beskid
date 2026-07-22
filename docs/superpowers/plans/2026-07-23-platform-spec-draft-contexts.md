# Platform Spec Draft Contexts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace one-document proposals with revision-pinned, multi-document Draft Contexts and a source-first validated editor.

**Architecture:** A canonical document-identity module feeds catalog generation, routes, seed, graph, wizard, validation, and the sole active PR serializer. Memgraph stores a mutable Draft Context head plus immutable revisions; each context owns ordered document changes. Markdown source remains authoritative, while a restricted Tiptap editor proposes diff-confirmed source updates.

**Tech Stack:** TypeScript, TanStack Start, Memgraph, OpenSpec, React, Tiptap 3.28.0, Vitest/Bun-compatible current test runner (migrated to pnpm in the companion plan).

## Global Constraints

- OpenSpec remains normative; draft data is a reviewable change bundle, never a second source of truth.
- Paths and public slugs are resolver-derived; neither browser nor request body supplies a repository path.
- Domain/Area/Feature/Article/ADR choices are enabled only when catalog, reader, seed, graph, validation, and PR output support them.
- Source Markdown is the only persisted editor representation; visual editing needs explicit source-diff acceptance.
- Save may retain invalid work; submit and approve must fail closed.
- Keep `src/server/git-sync/pr.ts` as the only GitHub writer; remove rather than extend duplicate serializers.

---

### Task 1: Specify first-class Platform Spec documents

**Files:**
- Create: `openspec/changes/add-platform-spec-document-contexts/{proposal.md,tasks.md,design.md}`
- Create: `openspec/changes/add-platform-spec-document-contexts/specs/standard-content-authority/spec.md`
- Modify: `openspec/specs/standard-content-authority/spec.md` through the archived OpenSpec change process
- Test: `scripts/openspec/{validate-standard.ts,validate-layouts.ts}`

**Interfaces:**
- Produces the required authority/path contract consumed by catalog, wizard, and PR tasks.

- [ ] **Step 1: Write a failing catalog fixture for each artifact identity**

```text
openspec/specs/taxonomy--compiler/spec.md
openspec/specs/taxonomy--compiler--front-end/spec.md
openspec/specs/compiler--front-end--parser/spec.md
openspec/documents/platform-spec/compiler--front-end--parser/articles/grammar-notes.md
openspec/documents/platform-spec/compiler--front-end--parser/decisions/0001-parser-shape.md
```

- [ ] **Step 2: Run the catalog validator and verify it rejects unknown document kinds**

Run: `pnpm run openspec:validate`

Expected: FAIL until the authority and catalog requirements are implemented.

- [ ] **Step 3: Add SHALL requirements and scenarios**

Document canonical paths, normative/informative authority, parent relationships, catalog fields, immutable draft base revisions, explicit feature requirements/scenarios, and server-side validation. Do not promote a taxonomy hub beyond its provisional authority.

- [ ] **Step 4: Validate and archive through the normal OpenSpec flow**

Run: `pnpm run openspec:catalog && pnpm run openspec:validate`

Expected: PASS with catalog revision updated.

- [ ] **Step 5: Commit**

```bash
git add openspec
git commit -m "spec: define platform spec document contexts"
```

### Task 2: Add one canonical identity and catalog model

**Files:**
- Create: `site/platform-spec/src/lib/spec/document-identity.ts`
- Create: `site/platform-spec/src/lib/spec/document-identity.test.ts`
- Modify: `scripts/openspec/build-catalog.ts`
- Modify: `scripts/openspec/{validate-standard.ts,validate-layouts.ts}`
- Modify: `site/platform-spec/src/lib/spec/{catalog.ts,document.ts,domain-model.ts,static.ts,graph-seed.ts}`
- Test: `site/platform-spec/src/lib/spec/{catalog,document,domain-model,static,graph-seed}.test.ts`

**Interfaces:**
- Produces `SpecArtifactKind`, `SpecDocumentIdentity`, `resolveDocumentIdentity()`, and discriminated `OpenSpecCatalogDocument`.
- Consumes the paths defined in Task 1.

- [ ] **Step 1: Write resolver tests**

```ts
expect(resolveDocumentIdentity({ kind: "area", domain: "compiler", area: "front-end" }))
  .toMatchObject({ canonicalPath: "openspec/specs/taxonomy--compiler--front-end/spec.md" });
expect(resolveDocumentIdentity({ kind: "article", domain: "compiler", area: "front-end", feature: "parser", article: "grammar-notes" }))
  .toMatchObject({ authority: "informative" });
expect(() => resolveDocumentIdentity({ kind: "feature", domain: "../escape" } as never)).toThrow();
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm --dir site/platform-spec test -- document-identity`

Expected: FAIL because no resolver exists.

- [ ] **Step 3: Implement a pure resolver and catalog normalization**

Export a closed artifact-kind union; map only valid segment grammar to paths and public slugs. Scan capability specs and informative documents into one document list with identity, parent key, layout, authority, hash, and title. Reject unrecognized known-level artifacts rather than defaulting them to `feature`.

- [ ] **Step 4: Convert reader, routes, static seed, and graph seed to the model**

Domain/Area routes render their taxonomy document. Existing feature capability URLs remain stable. Feature-only views explicitly filter `kind === "feature"`.

- [ ] **Step 5: Run focused and catalog tests**

Run: `pnpm --dir site/platform-spec test -- document-identity catalog domain-model static graph-seed && pnpm run openspec:catalog && pnpm run openspec:validate`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/openspec site/platform-spec/src/lib/spec openspec/catalog.json
git commit -m "feat(platform-spec): add canonical document identities"
```

### Task 3: Persist Draft Contexts and immutable revisions

**Files:**
- Modify: `site/platform-spec/src/server/memgraph/{types.ts,schema.ts,drafts.ts}`
- Modify: `site/platform-spec/src/server/drafts.ts`
- Create: `site/platform-spec/src/server/memgraph/draft-contexts.test.ts`
- Test: `site/platform-spec/src/server/drafts.test.ts`

**Interfaces:**
- Produces `createDraftContextFn`, `addDraftDocumentFn`, `updateDraftDocumentFn`, `submitDraftContextFn`.
- Produces `DraftContext`, `DraftDocumentChange`, and immutable `DraftContextRevision` records.

- [ ] **Step 1: Write persistence transition tests**

```ts
expect(context.baseCatalogRevision).toBe(catalog.revision);
expect(context.documentChanges).toHaveLength(2);
expect(await revisionsFor(context.id)).toHaveLength(3);
await expect(submitDraftContextFn({ id: context.id })).rejects.toThrow("validation");
```

- [ ] **Step 2: Run tests and verify the current single `DraftChange` model fails them**

Run: `pnpm --dir site/platform-spec test -- drafts draft-contexts`

- [ ] **Step 3: Replace the persistence shape in one migration**

Create `DraftContext`, `DraftDocumentChange`, and `DraftContextRevision` nodes with ordered containment edges. Migrate existing one-item drafts into one context/change once and remove old read/write APIs; retain no parallel legacy writer. Pin `baseCatalogRevision` at creation and append a revision snapshot after every mutation.

- [ ] **Step 4: Enforce status and ownership at server boundaries**

Only owner drafts/rejected contexts mutate; submission/approval create no implicit content and require fresh content/base hashes.

- [ ] **Step 5: Run tests**

Run: `pnpm --dir site/platform-spec test -- drafts draft-contexts && pnpm --dir site/platform-spec typecheck`

- [ ] **Step 6: Commit**

```bash
git add site/platform-spec/src/server
git commit -m "feat(platform-spec): persist draft contexts"
```

### Task 4: Create shared validation and atomic PR output

**Files:**
- Create: `site/platform-spec/src/lib/spec/draft-validation.ts`
- Create: `site/platform-spec/src/lib/spec/draft-validation.test.ts`
- Modify: `site/platform-spec/src/server/{drafts.ts,git-sync/pr.ts}`
- Modify: `site/platform-spec/src/server/git-sync/pr.test.ts`
- Delete: `site/platform-spec/src/server/openspec/pr-sync.ts`
- Delete: `site/platform-spec/src/server/openspec/pr-sync.test.ts`

**Interfaces:**
- Produces `validateDraftDocument(change, catalog): DraftValidationResult`.
- Consumes the Task 2 identity resolver and Task 3 ordered changes.

- [ ] **Step 1: Write validation and serializer failures**

```ts
expect(validateDraftDocument(featureWithoutScenario, catalog).errors)
  .toContainEqual(expect.objectContaining({ code: "missing-scenario" }));
await expect(buildOpenSpecChangeFiles(contextWithInvalidArticle)).rejects.toThrow("informative");
expect(files.map(({ path }) => path)).toEqual([...files.map(({ path }) => path)].sort());
```

- [ ] **Step 2: Run focused tests and verify failure**

Run: `pnpm --dir site/platform-spec test -- draft-validation git-sync/pr`

- [ ] **Step 3: Implement shared pure validation**

Validate identity, parent, collision, operation, base hash, layout, required headings, GIVEN/WHEN/THEN scenarios, source restrictions, and source ranges. Client preflight is advisory; save records diagnostics; submit/approve reject invalid change sets.

- [ ] **Step 4: Convert the active serializer**

Serialize all ordered context changes atomically through `git-sync/pr.ts`; remove generic requirement/scenario synthesis and the unused generic PR writer. Verify path containment and deterministic ledger output before GitHub mutations.

- [ ] **Step 5: Run tests and strict OpenSpec validation**

Run: `pnpm --dir site/platform-spec test -- draft-validation git-sync/pr && pnpm run openspec:validate`

- [ ] **Step 6: Commit**

```bash
git add site/platform-spec/src/lib/spec site/platform-spec/src/server
git commit -m "feat(platform-spec): validate and serialize draft contexts"
```

### Task 5: Build the banner, wizard, diff, and source-first editor

**Files:**
- Create: `site/platform-spec/src/components/editor/{draft-context-banner.tsx,draft-change-set.tsx,draft-document-wizard.tsx,open-spec-tiptap.tsx,open-spec-markdown-editor.tsx}`
- Modify: `site/platform-spec/src/components/editor/{proposal-banner.tsx,proposal-validation-panel.tsx}`
- Modify: `site/platform-spec/src/routes/_edit/{edit/index.tsx,moderation/index.tsx}`
- Modify: `site/platform-spec/src/routes/_edit/edit/drafts/$id.tsx`
- Modify: `site/platform-spec/package.json`
- Test: `site/platform-spec/src/components/editor/*.test.tsx`

**Interfaces:**
- Consumes `DraftContext`, `DraftDocumentChange`, and `DraftValidationResult` from Tasks 3–4.
- Produces accessible shared author/moderator context views.

- [ ] **Step 1: Write component tests**

```tsx
render(<DraftContextBanner context={context} />);
expect(screen.getByText("2 added")).toBeVisible();
await user.click(screen.getByRole("button", { name: /changes/i }));
expect(screen.getByText("openspec/documents/platform-spec/.../grammar-notes.md")).toBeVisible();
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `pnpm --dir site/platform-spec test -- draft-context-banner draft-document-wizard open-spec-markdown-editor`

- [ ] **Step 3: Implement the sticky context shell and wizard**

Render the banner below the edit top bar. Wizard selection calls the server for canonical identity and starter layout, lists valid parents/types only, and never contains a raw path input. Share change-set/diff rendering with moderation.

- [ ] **Step 4: Implement the restricted Tiptap boundary**

Pin all Tiptap packages to `3.28.0`; use `immediatelyRender: false`, source/visual tabs, allowed extension factory, labelled toolbar, `aria-live` diagnostics, and a required source-diff confirmation before visual updates apply.

- [ ] **Step 5: Run UI, typecheck, build, and asset checks**

Run: `pnpm --dir site/platform-spec test && pnpm --dir site/platform-spec typecheck && pnpm --dir site/platform-spec build && pnpm --dir site/platform-spec verify:client-bundle`

- [ ] **Step 6: Commit**

```bash
git add site/platform-spec
git commit -m "feat(platform-spec): add draft context authoring"
```

### Task 6: Seed, migration, and full verification

**Files:**
- Modify: `site/platform-spec/scripts/{seed.ts,verify-seed.ts}`
- Modify: `site/platform-spec/src/lib/spec/{static.ts,graph-seed.ts}`
- Modify: `CHANGELOG.md`, `GLOSSARY.md`

- [ ] **Step 1: Add seed/graph fixtures for all five document kinds**
- [ ] **Step 2: Run `pnpm --dir site/platform-spec seed:static` and `verify:seed`**
- [ ] **Step 3: Run full platform gate**

Run: `pnpm --dir site/platform-spec test && pnpm --dir site/platform-spec typecheck && pnpm --dir site/platform-spec check && pnpm --dir site/platform-spec build && pnpm --dir site/platform-spec verify:client-bundle && pnpm run openspec:validate`

- [ ] **Step 4: Update changelog/glossary and commit**

```bash
git add site/platform-spec CHANGELOG.md GLOSSARY.md openspec/catalog.json
git commit -m "docs: record draft context authoring"
```
