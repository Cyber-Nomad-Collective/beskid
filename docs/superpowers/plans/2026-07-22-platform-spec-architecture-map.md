# Platform Spec Architecture Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for every behavior change. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Platform Spec taxonomy DAG with an immutable, traversable compiler architecture map and replace the unbounded sidebar with a searchable, highlighted, independently scrolling tree.

**Architecture:** A checked-in conceptual compiler manifest is resolved against the OpenSpec catalog by pure functions, then rendered by a dedicated read-only React Flow component with a detail panel. The existing OpenSpec navigation tree remains authoritative; pure filtering/disclosure helpers drive one responsive tree component while a `100dvh` shell separates rail and document scrolling.

**Tech Stack:** React 19, TanStack Router/Start, TypeScript 6, React Flow 12, dagre 3, Tailwind CSS 4, Vitest 3, Bun.

## Global Constraints

- Scope is the compiler plus directly connected runtime, corelib, CLI/LSP, packages, and OpenSpec authority; wider platform systems appear only as boundary nodes.
- OpenSpec remains normative; `openspec/catalog.json` supplies canonical public specification URLs.
- The production path is AOT. JIT may appear only as a tooling/test boundary.
- `TypedProgram -> CodegenInput -> generated ISLE -> stock verified CLIF` is the canonical production lowering path.
- Transitional typed-HIR preparation and Rust runtime/host compatibility are visibly labeled transitional or retiring and are not production-path fallbacks.
- The architecture graph permits pan, zoom, fit, selection, keyboard focus, and link traversal but never node movement, connection, deletion, or editing.
- The navigation hierarchy has one implementation and continues to consume `buildNavTree`; search does not create another taxonomy or server index.
- Search is case-insensitive, preserves matching ancestors, highlights matched text safely, auto-expands matching and active paths, and restores disclosure state when cleared.
- Desktop and mobile consume the same tree/search implementation.
- The reader frame is bounded to `100dvh`; the navigation and document regions scroll independently.
- No invented URLs for unpromoted OpenSpec changes.
- Follow repository PascalCase/camelCase naming conventions and do not add compatibility fallbacks.

---

### Task 1: Canonical Compiler Architecture Model

**Files:**
- Create: `site/platform-spec/src/lib/architecture/compiler-architecture.ts`
- Create: `site/platform-spec/src/lib/architecture/architecture-model.ts`
- Test: `site/platform-spec/src/lib/architecture/architecture-model.test.ts`

**Interfaces:**
- Produces `ArchitectureState`, `ArchitectureNodeKind`, `ArchitectureManifest`, `ResolvedArchitectureModel`, and `resolveArchitectureModel(manifest, catalogEntries)`.
- `catalogEntries` is `readonly { capability: string; href: string; title: string }[]`.
- The resolved model exposes groups, nodes with `specLinks`, typed edges, adjacency, and named traversal IDs `build`, `ide`, and `spec-to-code`.

- [ ] **Step 1: Write failing model tests**

Cover duplicate IDs, unknown edge endpoints, unresolved current spec keys, target-only unresolved keys, adjacency, canonical catalog URL resolution, the complete AOT build traversal, and lifecycle state for typed-HIR/Rust-runtime compatibility nodes.

- [ ] **Step 2: Run tests and verify RED**

Run: `bun run test src/lib/architecture/architecture-model.test.ts`

Expected: FAIL because the architecture modules do not exist.

- [ ] **Step 3: Implement the model and manifest**

Use stable kebab-case concept IDs. Include these required build-path nodes in order:

```ts
export const BuildTraversal = [
  "beskid-source",
  "workspace-resolver",
  "expanded-syntax-assembly",
  "generation-safe-facts",
  "typed-program",
  "codegen-input",
  "isle-operation-selection",
  "stock-clif",
  "clif-verifier",
  "codegen-artifact",
  "aot-backend",
  "runtime-kit",
  "native-artifact",
] as const;
```

Add direct boundary nodes for OpenSpec/catalog/conformance, BSOL/pckg/corelib/Compiler Mods, parser/Salsa/diagnostics, ABI manifest/generated ABI, CLI/LSP/VS Code/Tree-sitter, and visibly transitional typed-HIR and Rust runtime/host paths. Resolve public links only from exact catalog capability keys.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `bun run test src/lib/architecture/architecture-model.test.ts`

Expected: PASS.

- [ ] **Step 5: Run focused typecheck and commit**

Run: `bun run typecheck`

Commit: `feat(platform-spec): model compiler architecture`

---

### Task 2: Searchable Responsive Specification Tree

**Files:**
- Create: `site/platform-spec/src/components/reader/spec-nav-tree.ts`
- Test: `site/platform-spec/src/components/reader/spec-nav-tree.test.ts`
- Modify: `site/platform-spec/src/components/reader/spec-nav-rail.tsx`
- Modify: `site/platform-spec/src/components/reader/spec-shell.tsx`
- Modify: `site/platform-spec/src/components/reader/reader-chrome.tsx`
- Modify: `site/platform-spec/src/components/reader/structured-document-view.tsx`
- Modify: `site/platform-spec/src/styles/reader-app.css`

**Interfaces:**
- Produces `filterNavTree(tree, query)`, `findActivePath(tree, activeSlug)`, and `highlightTitle(title, query)` ranges for safe React rendering.
- `SpecNavRail` remains the single desktop/mobile tree implementation and accepts `tree`, `activeSlug`, and optional `onNavigate`.

- [ ] **Step 1: Write failing navigation tests**

Test case-insensitive title matching, preserved ancestors, hidden unrelated branches, literal handling of regex punctuation, title highlight ranges, active paths, and zero matches.

- [ ] **Step 2: Run tests and verify RED**

Run: `bun run test src/components/reader/spec-nav-tree.test.ts`

Expected: FAIL because the helper module does not exist.

- [ ] **Step 3: Implement pure tree helpers**

Do not mutate the loader-provided tree. Normalize with `trim().toLocaleLowerCase()` and compute highlights with string indices rather than regular expressions.

- [ ] **Step 4: Run helper tests and verify GREEN**

Run: `bun run test src/components/reader/spec-nav-tree.test.ts`

Expected: PASS.

- [ ] **Step 5: Rebuild `SpecNavRail` around one searchable tree**

Add labeled search/clear controls, result count, collapsible domain/area branches, active/match ancestor expansion, safe `<mark>` highlighting, empty state, active-link reveal, and standard tree keyboard behavior. Keep feature links navigable through TanStack `Link`.

- [ ] **Step 6: Bound layout height and add mobile access**

Use `h-dvh overflow-hidden` on `ReaderChrome`; ensure its content row, `SpecShell`, and the aside are `min-h-0`/overflow-bounded; make main document scrolling independent. Render the same `SpecNavRail` in an accessible mobile modal sheet opened by a header-positioned button. Prevent prose, tables, preformatted blocks, and inline code from widening the viewport.

- [ ] **Step 7: Verify navigation slice and commit**

Run:

```bash
bun run test src/components/reader/spec-nav-tree.test.ts
bun run typecheck
bun run check
```

Expected: all exit 0.

Commit: `feat(platform-spec): add searchable spec tree`

---

### Task 3: Immutable Traversable Architecture Map UI

**Files:**
- Create: `site/platform-spec/src/components/reader/architecture-map-layout.ts`
- Test: `site/platform-spec/src/components/reader/architecture-map-layout.test.ts`
- Create: `site/platform-spec/src/components/reader/compiler-architecture-map.tsx`
- Modify: `site/platform-spec/src/components/reader/platform-spec-home-client.tsx`
- Modify: `site/platform-spec/src/routes/platform-spec/index.tsx`
- Modify: `site/platform-spec/package.json`
- Modify: `bun.lock`

**Interfaces:**
- Consumes `ResolvedArchitectureModel` and `resolveArchitectureModel` from Task 1.
- Produces `CompilerArchitectureMap({ model })` and a pure `layoutArchitectureMap(model)` helper.
- The home route passes catalog entries including `capability`, `href`, and `title`.

- [ ] **Step 1: Write failing layout tests**

Verify deterministic left-to-right coordinates, stable node dimensions, valid edge endpoints, and selected-node neighborhood derivation.

- [ ] **Step 2: Run tests and verify RED**

Run: `bun run test src/components/reader/architecture-map-layout.test.ts`

Expected: FAIL because the layout module does not exist.

- [ ] **Step 3: Add direct graph dependencies and implement layout**

Add `@dagrejs/dagre` and `@xyflow/react` to Platform Spec dependencies using the versions already pinned in the root lockfile. Configure dagre for `rankdir: "LR"`.

- [ ] **Step 4: Implement the dedicated read-only map**

React Flow must set:

```tsx
nodesDraggable={false}
nodesConnectable={false}
elementsSelectable
deleteKeyCode={null}
panOnDrag
zoomOnScroll
zoomOnPinch
```

Render no handles. Cards expose group, kind, and lifecycle without relying on color alone. Selection emphasizes the direct neighborhood and fills a persistent detail panel with description, metadata, source paths, and canonical spec links. Add Build, IDE, and Spec-to-code traversal controls plus fit/zoom controls. Node links use internal canonical catalog URLs.

- [ ] **Step 5: Replace the taxonomy DAG on the home page**

Delete `catalogToFactsDag`, the generic facts-DAG import, its fake empty-catalog nodes, and editor-location behavior. Browse mode remains domain cards; map mode resolves and renders the canonical compiler manifest.

- [ ] **Step 6: Verify UI slice and commit**

Run:

```bash
bun run test src/lib/architecture/architecture-model.test.ts src/components/reader/architecture-map-layout.test.ts
bun run typecheck
bun run check
```

Expected: all exit 0.

Commit: `feat(platform-spec): render compiler architecture map`

---

### Task 4: Integration, Governance, and Release Verification

**Files:**
- Modify: `GLOSSARY.md`
- Modify: `CHANGELOG.md`
- Modify tests or implementation files only when integration failures prove a defect.

**Interfaces:**
- Consumes completed Tasks 1-3.
- Produces one coherent Platform Spec build with documented terminology.

- [ ] **Step 1: Integrate worker commits and inspect combined diff**

Cherry-pick the reviewed model, navigation, and map commits onto `codex/platform-spec-architecture-map`. Confirm no worker branch changed files outside its assigned slice.

- [ ] **Step 2: Add glossary definitions**

Define Architecture map, Immutable graph, and Traversable graph using the confirmed design. Keep entries alphabetical or within the existing project taxonomy.

- [ ] **Step 3: Add Keep a Changelog entry**

Under `[Unreleased]`, describe the compiler architecture map and searchable independently scrolling specification tree.

- [ ] **Step 4: Run complete verification**

Run:

```bash
bun run test
bun run typecheck
bun run check
bun run build
bun run verify:client-bundle
```

from `site/platform-spec`, then run `git diff --check` from the repository root.

Expected: every command exits 0 with no test failures or formatting errors.

- [ ] **Step 5: Run GitNexus change detection and artifact safety checks**

Run `detect_changes({ scope: "compare", base_ref: "main" })`, review every affected symbol/flow, and run `~/.agents/hooks/check-agent-artifacts.sh` if present. No `.superpowers`, agent knowledge, or temporary review files may be committed.

- [ ] **Step 6: Final review and commit**

Complete a whole-branch spec/code-quality review, fix every Critical or Important issue with focused tests, rerun affected verification, and commit:

`docs: record platform spec navigation and map`
