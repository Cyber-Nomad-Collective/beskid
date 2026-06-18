# Normative Spec Migration to `site/spec-content` + React Platform-Spec

**Date:** 2026-06-18
**Status:** Design — pending approval
**Scope:** Full migration of the normative platform-spec off the Astro website into the React `site/platform-spec` app, retiring `trudoc`, adding railroad syntax graphs + interactive spec content + realtime validation, enforcing exhaustive uniform templates per nesting level, adding a proposal/draft banner, and cleaning up CICD.

---

## 1. Locked decisions

| Decision | Value | Rationale |
|---|---|---|
| Syntax graph type | **Railroad / EBNF diagrams** (per-production) | User choice. Most precise for grammar readers. Source: `compiler/crates/beskid_analysis/src/beskid.pest` (338 lines, 6 sections, ~120 rules). |
| Detach level | **B** — platform-spec-specific React components relocate out of `@beskid/beskid-ui` into `@beskid/ui-react`; keep `@beskid/ui-react` as the shared UI dependency | `@beskid/ui-react` is already pure-React (shadcn + xyflow). The only true `.astro` coupling is transitive via `@beskid/beskid-ui`'s package boundary; relocating `BeskidHub.tsx` + `hub.css` severs it. |
| Realtime validation | **spec-core validators run client-side in React** (replace trudoc's validation role) | spec-core already owns `validate-node-document.ts`, `mdshape-schemas.ts`, `path-rules.ts`. Only `validateFrontmatterForLevel` + layout zod schemas still leak through trudoc — those get ported. |
| Proposal banner | **Top-of-page banner on the draft editor** with editable proposal title + metadata (summary, specLevel, changeKind, status, PR link) | Reads existing `DraftChangeNode` fields — no schema change. Mounts at top of `DraftEditorPage`. |
| Platform-spec location | **Fully outside `site/website`** — no hyperlink-redirect coupling, no filesystem reads of `site/website/src/content/docs/platform-spec` | platform-spec already reads `site/spec-content` (canonical). Residual filesystem couplings (seed.ts, import-mdx.ts, Dockerfile) get cut. |
| CICD | Remove trudoc-bound website `verify:*`/`generate:*` scripts; relax `setup-beskid-web` assertions; strip `platform-smoke.sh` website-prebuild block. New railroad validation flows through `normative-spec.yml` via spec-core. | normative-spec.yml is already post-trudoc. |

---

## 2. Current-state findings (from 4 parallel-agent audits)

### 2.1 Node census (1042 `content.md` files)

| Domain | domain | area | feature | article | adr | total |
|---|--:|--:|--:|--:|--:|--:|
| community | 1 | 1 | 7 | 0 | 19 | 28 |
| compiler | 1 | 8 | 35 | 200 | 110 | 354 |
| core-library | 1 | 6 | 23 | 94 | 60 | 184 |
| execution | 1 | 2 | 8 | 39 | 25 | 75 |
| index | 1 | 0 | 0 | 0 | 0 | 1 |
| language-meta | 1 | 10 | 29 | 161 | 39 | 240 |
| tooling | 1 | 11 | 32 | 71 | 44 | 159 |
| **TOTAL** | **7** | **38** | **134** | **565** | **297** | **1041** (+1 root = 1042) |

**File coverage:** every node has `content.md` + `layout.json` (100%). Gaps: 49 nodes missing `related.json` (48 articles in 8 features — 36 of them in language-meta; 1 root). `node.json` is **not a convention** in this tree (0 files) — the node model is `content.md` + frontmatter.

**Article-kind catalog:** 565 articles use 33 distinct slugs; the **canonical-6** cover 94.7%: `design-model` (100), `contracts-and-edge-cases` (94), `verification-and-traceability` (92), `flow-and-algorithm` (86), `examples` (86), `faq-and-troubleshooting` (77). language-meta has 21 one-off slugs (worst violator).

### 2.2 Template system gaps

The community meta-spec at `platform-spec/community/spec-maintenance/feature-hub-article-bundle-template/` mandates **ordered section contracts per level** that NO existing template implements:

| Level | Meta-spec sections mandated | Richest existing template achieves | Gap |
|---|---|---|---|
| Domain | 8 (Scope, Terminology, Architectural principles, Area map, Normative guarantees, Conformance evidence, Change policy, Related domains) | 2–4 | 4–6 missing |
| Area | 8 (Area contract, Responsibility boundaries, Internal model, Feature index, Failure & diagnostics, Verification matrix, Operational guidance, Related areas) | 1–3 | 5–7 missing |
| Feature | 11 (Contract statement, I/O, State model, Algorithms & flow, Edge cases & errors, Compatibility & versioning, Security & performance, Examples, Verification & traceability, Related features, Decisions) | 4–7 | 4–7 missing |
| Article | 5 (Purpose & scope, Canonical references, Detailed behavior, Verification & maintenance, Related topics) | **0 — no template file exists** | 5 |
| ADR | 3 (Context, Decision, Consequences) | **0 — no template file exists** | 3 |

**Critical:** `templateFileForLevel("article")` and `templateFileForLevel("adr")` return `null` — the resolver never even looks. 565 articles + 297 ADRs (826 leaf nodes, 79% of all content) have **zero template enforcement**. Three domains (`core-library`, `execution`, `tooling`) ship byte-identical generic-default templates despite having rich content.

### 2.3 trudoc dependency surface

trudoc is imported across 5 consumers (website, platform-spec, spec-core, beskid-ui, tracker). spec-core itself has a `file:../trudoc` dependency — **the core blocker**: 8 internal spec-core imports pull layout zod schemas, `getPresetBase`, `classifyPlatformSpecRel`, `validateFrontmatterForLevel` from trudoc. Actions A.1–A.3 (port frontmatter zod schemas + `validateFrontmatterForLevel`, inline `classifyPlatformSpecRel`, port layout schemas + presets) eliminate all 8 spec-core trudoc imports and unblock every downstream consumer switch.

### 2.4 Graph systems

Three graph concerns, each distinct:
1. **Architecture graph (4 datasets)** — already has a complete React path: `api/v1/architecture/$key.ts` → `ArchitectureGraphCanvas` (xyflow/dagre). v1→v2 normalizer exists. **Gaps:** 2 of 4 JSONs missing from `.spec/architecture/` mirror; `spec.json` `architectureGraphs: []` registry empty; MDX frontmatter still uses `source:` not `graphKey:`.
2. **Platform-spec hierarchy map (d3 client)** — no React counterpart. Largest net-new piece.
3. **Railroad syntax graph** — nothing exists. Net-new generator + component.

### 2.5 Draft editor + detach

- Draft editor is a single flat component at `_edit/edit/drafts/$id.tsx`; no `_edit/edit/drafts` parent layout; banner mounts at top of `DraftEditorPage`.
- platform-spec is **functionally standalone** for content (reads `site/spec-content`), but carries legacy MDX-import plumbing pointing at `site/website` (seed.ts, import-mdx.ts, Dockerfile) + the transitive `@beskid/beskid-ui` Astro-package problem.
- The only `@beskid/beskid-ui` import that's actually React is `BeskidHub.tsx` (+ `hub.css`). Relocating those 4 files severs the Astro coupling.

---

## 3. Template-per-level design with detailed reasoning

**Requirement (user-stated):** "ensure most formative spec is exhaustive and uniform to currently bound TEMPLATE depending on nesting level, making each domain/area template describe each concept."

**Reasoning:** Templates are the enforcement mechanism for spec uniformity. Today they exist only for domain/area/feature, vary wildly per domain (3 domains ship generic defaults), and cover 0% of the meta-spec's mandated sections. The leaf levels (article, adr) — 79% of content — have no template at all. Without exhaustive uniform templates:
- The "realtime validation" feature has nothing to validate *against* beyond frontmatter shape.
- Parallel content agents filling out spec have no consistent target.
- Stub duplication (already 30+ identical scaffolds) propagates unchecked.

The design materializes the meta-spec's section contracts into actual template files at all 5 levels, activated in the resolver, with domain-specific layering as **additive subsections on a uniform spine** (not replacements — which is why no domain is currently conformant).

### 3.1 Template activation (code change)

**File:** `beskid_web_common/packages/spec-core/src/template-resolve.ts`

```ts
const TEMPLATE_BY_LEVEL: Partial<Record<SpecLevel, string>> = {
  root: DOMAIN_TEMPLATE_FILE,
  domain: DOMAIN_TEMPLATE_FILE,
  area: AREA_TEMPLATE_FILE,
  feature: FEATURE_TEMPLATE_FILE,
  article: ARTICLE_TEMPLATE_FILE,   // NEW
  adr: ADR_TEMPLATE_FILE,           // NEW
};
```

**Constants** (`constants.ts`): add `ARTICLE_TEMPLATE_FILE = "ARTICLE_TEMPLATE.md"`, `ADR_TEMPLATE_FILE = "ADR_TEMPLATE.md"`.

**`ensureDefaultTemplates()`** (`layout-boilerplate.ts` or `seed-workspace.ts`): write all 5 templates to `.spec/templates/`.

### 3.2 Uniform template spines (the canonical forms)

These become the **global defaults** in `site/spec-content/.spec/templates/`. Per-domain templates layer domain-specific subsections *on top* of these spines, never replacing them.

#### DOMAIN_TEMPLATE.md (8 sections)

```markdown
---
specLevel: domain
title: Domain title
description: One-sentence scope statement.
owner: { name: Maintainer, email: maintainer@example.com }
submitter: { name: Maintainer, email: maintainer@example.com }
relatedTopics: []
---

## Scope & boundaries
What this domain governs, and explicitly what it does NOT.

## Terminology
Domain-specific terms with definitions. Each term MUST appear here before use elsewhere.

## Architectural principles
The invariants and design rules that hold across every area/feature in this domain.

## Area map
<!-- spec:generate:area-index -->
<!-- /spec:generate:area-index -->
(Auto-generated index of child areas.)

## Normative guarantees
The guarantees implementations MUST provide within this domain.

## Conformance evidence
How an implementation proves it conforms to this domain (test corpus, anchors).

## Change policy
Stability tier, breaking-change rules, deprecation policy for this domain.

## Related domains
<!-- spec:generate:related-domains -->
<!-- /spec:generate:related-domains -->
```

**Reasoning per section:** Scope prevents scope-creep into other domains; Terminology eliminates ambiguous MUST statements; Architectural principles give reviewers a checklist; Area map is navigation; Normative guarantees are the contract; Conformance evidence makes the spec testable; Change policy governs versioning; Related domains prevent isolation.

#### AREA_TEMPLATE.md (8 sections)

```markdown
---
specLevel: area
title: Area title
description: One-sentence area scope.
owner: {...}
submitter: {...}
relatedTopics: []
---

## Area contract
The responsibility boundary this area owns within its parent domain.

## Responsibility boundaries
What this area does vs. what sibling areas do. Explicit non-responsibilities.

## Internal model
The conceptual model (data shapes, state machines, pipelines) this area assumes.

## Feature index
<!-- spec:generate:feature-index -->
<!-- /spec:generate:feature-index -->

## Failure & diagnostics model
How failures surface, which diagnostic codes this area owns, error taxonomy.

## Verification matrix
Table: feature → conformance test → anchor location.

## Operational guidance
Runtime/ops considerations: performance, resource limits, observability hooks.

## Related areas
<!-- spec:generate:related-areas -->
<!-- /spec:generate:related-areas -->
```

#### FEATURE_TEMPLATE.md (11 sections)

```markdown
---
specLevel: feature
title: Feature title
status: Proposed
description: One-sentence feature scope.
owner: {...}
submitter: {...}
relatedTopics: []
---

## Contract statement
The normative behavior this feature mandates, in one paragraph.

## Inputs & outputs
What the feature consumes and produces (syntax, data, artifacts).

## State model
Mutable state, lifetimes, ownership. (N/A if stateless — state so explicitly.)

## Algorithms & flow
The algorithm or pipeline this feature implements, with ordering rules.

## Edge cases & errors
Numbered edge cases + the diagnostic each MUST raise.

## Compatibility & versioning
Stability tier, backward-compat rules, migration path on change.

## Security & performance notes
Threat model considerations, perf characteristics, resource bounds.

## Examples
<!-- spec:generate:article-index role=examples -->
Normative examples that MUST stay valid.

## Verification & traceability
<!-- spec:generate:article-index role=verification-and-traceability -->
How conformance is proven; test anchors.

## Related features
<!-- spec:generate:related-features -->
<!-- /spec:generate:related-features -->

## Decisions
<!-- spec:generate:adr-index -->
<!-- /spec:generate:adr-index -->
```

#### ARTICLE_TEMPLATE.md (5 sections) — NEW

```markdown
---
specLevel: article
title: Article title
description: One-sentence article purpose.
status: Standard
lastReviewed: YYYY-MM-DD
owner: {...}
submitter: {...}
relatedTopics: []
---

## Purpose & scope
What this article covers and why it exists as a standalone article (not folded into its feature hub).

## Canonical references
The normative sources this article explains/operationalizes (pest rules, crate paths, ADRs).

## Detailed behavior
The article's substance — algorithm walkthrough, contract table, or procedure.

## Verification & maintenance notes
How to keep this article accurate; test anchors; last-reviewed discipline.

## Related topics
<!-- spec:generate:related-topics -->
<!-- /spec:generate:related-topics -->
```

**Role variants (decision: per-kind template variants resolved by slug):** the canonical-6 article kinds (`design-model`, `contracts-and-edge-cases`, `verification-and-traceability`, `flow-and-algorithm`, `examples`, `faq-and-troubleshooting`) each get a dedicated `ARTICLE_TEMPLATE.<kind>.md` file that specializes the "Detailed behavior" section. The resolver checks, in order: (1) a per-domain `ARTICLE_TEMPLATE.<slug>.md` matching the article's directory slug, (2) the global `.spec/templates/ARTICLE_TEMPLATE.<slug>.md`, (3) the global `ARTICLE_TEMPLATE.md` fallback. No `role:` frontmatter hint is added — the slug IS the role. Non-canonical one-off slugs (the 27 one-offs in language-meta) fall through to the global template and are flagged by the §3.4 stub/normalization check for renaming to a canonical kind.

#### ADR_TEMPLATE.md (3 sections) — NEW

```markdown
---
specLevel: adr
adrId: {DOMAIN}-{AREA}-{SEQ}
adrStatus: Proposed | Accepted | Superseded | Deprecated
adrDate: YYYY-MM-DD
title: Decision title
owner: {...}
submitter: {...}
relatedTopics: []
---

## Context
The forces at play when this decision was made. Problems, constraints, prior art.

## Decision
The change we're making or the normative rule we're asserting, stated plainly.

## Consequences
What becomes easier, harder, or newly required. Verification anchors.
```

### 3.3 Per-domain layering (additive, not replacement)

Each domain's `DOMAIN/AREA/FEATURE_TEMPLATE.md` keeps its domain-specific flavor as **added subsections** under the uniform spine:

| Domain | Domain-level additions | Feature-level additions |
|---|---|---|
| compiler | "Data flow" + "Conformance hooks" subsections under Architectural principles | "Behavioral contract" + "Data structures" + "Conformance evidence" subsections |
| language-meta | "Syntax conventions" + "Semantic invariants" (already present — keep) | "Syntax" (pest excerpts) + "Type rules" + "Evaluation semantics" (already present — keep) |
| community | "Decision records" + governance framing | "Policy scope" + "Enforcement" |
| core-library | (currently generic) → add "Stability tiers" + "Corelib surface contract" | "Runtime builtins mapping" + "Stability tier" |
| execution | (currently generic) → add "ABI surface" + "Host composition contract" | "Memory model" + "Scheduler interaction" |
| tooling | (currently generic) → add "Tool surface contract" + "LSP/CLI integration" | "Command/flag contract" + "Editor integration" |
| index | (no children — leaf hub, global default is fine) | — |

### 3.4 Stub anti-pattern enforcement

The validator (`validate-node-document.ts`) gains a **stub-content check**: if an article body, after stripping generated regions, hashes identically to the template scaffold or is below a minimum-content threshold (configurable per article-kind), it emits a `stub-content` warning and forces `status: Proposed`. This kills the 30+ duplicated stubs.

---

## 4. trudoc retirement → spec-core relocation

**Critical-path order** (from agent 2): A.1 (frontmatter schemas + `validateFrontmatterForLevel`) → A.2 (`classifyPlatformSpecRel` inline) → A.3 (layout schemas + `getPresetBase`) eliminate spec-core's own trudoc dependency. Then downstream consumers switch.

### 4.1 Ports into spec-core (VALIDATION/DATA)

| New module | Ports (from trudoc) | Unblocks |
|---|---|---|
| `spec-core/src/frontmatter/schema.ts` | `platformSpecBaseSchema`, `domainSpecSchema`, `areaSpecSchema`, `featureSpecSchema`, `articleSpecSchema`, `adrSpecSchema`, `platformSpecNodeSchema`, `relatedTopicSchema`, `specPerson` (zod) | validate-node-document.ts |
| `spec-core/src/frontmatter/validate.ts` | `validateFrontmatterForLevel` | validate-node-document.ts, platform-spec/drafts.ts |
| `spec-core/src/layout/schema.ts` | `layoutLevelSchema`, `layoutPresetKeySchema`, `widgetSpecSchema`, `layoutContractFileSchema`, `effectiveLayoutSchema`, `completenessReportSchema`, types `LayoutPresetKey`/`WidgetSpec`/`CompletenessReport` | content/schema.ts, grid-layout.ts, workspace/schema.ts |
| `spec-core/src/layout/presets.ts` | `getPresetBase`, `defaultArticleDefaultsForFeature` | import-legacy-mdx.ts, scaffold-node.ts, index.ts re-export |
| `spec-core/src/catalog/schema.ts` | `PlatformSpecCatalogEntry`, `PlatformSpecDocumentBundle`, `parseCatalogFile`, `encodeCatalogDocSlug`, `decodeCatalogDocSlug` | platform-spec catalog.ts, tracker catalog-url.ts |
| `spec-core/src/nav-tree.ts` | `NavTreeNode`, `buildNavTree`, `pathClassToNavLevel`, `slugToHref`, `SKIP_NAV_DOMAINS` | platform-spec memgraph, local-workspace, reader components |
| (inline into `path-rules.ts`) | `classifyPlatformSpecRel` (~16 lines) | path-rules.ts stops importing trudoc/layout |
| `spec-core/src/frontmatter/form-layouts.ts` | `formValuesToFrontmatter`, `frontmatterToFormValues`, `parseFrontmatterJson`, `buildRepoPathFromForm` | platform-spec/drafts.ts |

### 4.2 Ports into beskid-ui (RENDERING)

| Target | Ports | Consumers |
|---|---|---|
| `beskid-ui/src/platform-spec/related-topics-html.ts` | `renderRelatedTopicsSection`, `escapeHtml`, `RelatedTopicPayload` | RelatedTopics.astro, graph clients |
| `beskid-ui/src/platform-spec/github-repo.ts` | `DEFAULT_GITHUB_REPO`, `githubWebUrl`, `githubCommitUrl`, `githubCommitsHistoryUrl`, `lineHash` + `beskid-default-repo.json` | GithubResourceLink.astro, SpecDocHistory.astro, PlatformSpecLatestChanges.astro |
| `beskid-ui/src/platform-spec/git-meta.ts` | `loadPlatformSpecGitMeta`, types `GitFileMeta`/`PlatformSpecGitMeta` | SpecDocHistory.astro, PlatformSpecHome.astro |

### 4.3 Package.json dependency removals (after ports land)

- `beskid_web_common/packages/spec-core/package.json`: drop `@cyber-nomad-collective/trudoc`
- `beskid_web_common/packages/beskid-ui/package.json`: drop trudoc (after B.9–B.12)
- `site/platform-spec/package.json`: drop trudoc (after switching to spec-core)
- `site/website/package.json`: drop `trudoc` (after C.13–C.17 website-local reimplementation)
- `beskid_tracker/package.json`: drop trudoc (after A.4) + clean vite/vitest aliases

---

## 5. Architecture graph migration (mostly done)

1. **Sync missing JSONs** into `site/spec-content/.spec/architecture/`: copy `compiler-mod-host-flow.json` + `execution-stack.json` from `site/website/src/data/architecture-graphs/`.
2. **Register keys** in `site/spec-content/spec.json` → `architectureGraphs: ["compiler-build-pipeline", "compiler-mod-host-flow", "compiler-mods", "execution-stack"]`.
3. **Convert frontmatter** in the 4 MDX files: `architectureGraph.source: <path>` → `architectureGraph: { graphKey, entryNode? }`. React route/loader/renderer already wired — **no new React code**.
4. **Optional** author v2 JSONs directly for the 2 graphs that lose precision without `meta.Crate`.

---

## 6. Railroad syntax graph (net-new)

**Source:** `compiler/crates/beskid_analysis/src/beskid.pest` (338 lines, 6 sections, ~120 rules). Also `beskid_doc.pest` (doc-comment grammar).

### 6.1 Generator

**New script:** `beskid_web_common/scripts/sync-pest-railroad.mjs` (modeled on existing `sync-syntax-ast-kinds.mjs`).

- **Parses** `beskid.pest` — pest's operator set is small (`~`, `|`, `*`, `+`, `?`, grouping, `_{}` silent, `@{}` atomic). Hand-roll a tokenizer; no JS pest parser exists today.
- **Emits** a v2 architecture-graph JSON with one node per pest rule (kind `astSyntaxNode`, props `{family, syntaxKind}` — the schema already supports this) and `contains` edges for each rule reference.
- **Output:** `site/spec-content/.spec/architecture/syntax-railroad.json` (loads through the existing `$key.ts` route unchanged) OR a dedicated `routes/api/v1/syntax-graph.ts` if railroad rendering needs a different payload than the architecture graph.
- **Registers** `"syntax-railroad"` in `spec.json` `architectureGraphs`.
- **Runs in CI** via `normative-spec.yml` (path filter already covers `compiler/**`? — extend to trigger on pest changes).

Pest rule families for the railroad (group nodes by these):
- **Lexical** (terminals): `Identifier`, 40 keyword rules, `IntegerLiteral`, `FloatLiteral`, `StringLiteral`, `CharLiteral`.
- **Program structure:** `Program`, `ItemList`, `InnerItem` (item dispatch), `ItemWithDocs`.
- **Types:** `BeskidType` (precedence chain Arrow → Function → Array → TypeName), `GenericParameters`.
- **Definitions:** `FunctionDefinition`, `ImplBlock`, `TypeDefinition`, `EnumDefinition`, `ContractDefinition`, `HostDefinition`, `MacroDefinition`, DI (`RegistryBlock`, `ScopeDefinition`), `TestDefinition`.
- **Statements:** `Block`, `Statement` (choice), `LetStatement`, control flow (`IfStatement`, `WhileStatement`, `ForStatement`, `WithStatement`, `LaunchStatement`).
- **Expressions:** `Expression` (Lambda | Match | Assignment), the precedence ladder (LogicalOr → … → Unary → Postfix → Primary), `MatchExpression`/`Pattern`.

### 6.2 React component

**New:** `site/platform-spec/src/components/reader/syntax-graph.tsx` (or extend `@beskid/ui-react` with a `railroad-graph/` package).

- Railroad rendering is structurally different from node-link diagrams (horizontal tracks, not dagre TB), so `ArchitectureGraphCanvas` is **not** directly reusable — but its v2-payload fetching, side-panel, and `astSyntaxNode` rendering patterns are.
- **Renderer options:** (a) `railroad-diagrams` npm (the classic tabatkin library) — renders to SVG, React wrapper needed; (b) custom React Flow with horizontal layout + custom node types for sequence/choice/loop; (c) hand-rolled SVG. Recommendation: **(a)** for correctness + speed, wrapped in a React component.
- **Surface** from `lexical-and-syntax` node: add `architectureGraph: { graphKey: "syntax-railroad", entryNode: "Program" }` to its frontmatter once generator + route exist.

---

## 7. Platform-spec hierarchy map (net-new React)

The d3-force hierarchy map (client 1a) has no React counterpart. Largest net-new UI piece.

**Target:** `site/platform-spec/src/components/reader/platform-spec-map.tsx`.

- Build payload client-side from `listLocalCatalog` (already exposes slug/href/title/specLevel/status/parentSlug — enough to reconstruct the root/domain/area/feature payload minus `relatedTopics`).
- **Renderer:** reuse React Flow (`@xyflow/react`) with a d3-force-driven custom layout (React Flow has no first-class force layout — keep `d3-force` for positioning, React Flow for rendering/interaction), OR port the existing collapse/expand/zoom/panel/search UX. DOM contracts from client 1a (panel ids, toolbar, legend) get React equivalents.

---

## 8. Draft/proposal banner

**Mount:** top of `DraftEditorPage` in `_edit/edit/drafts/$id.tsx` (simplest) or a new `_edit/edit/drafts.tsx` parent layout if banner must persist across the editor sub-tree.

**New component:** `site/platform-spec/src/components/editor/proposal-banner.tsx`.

**Banner content (editable unless read-only):**
- Proposal **title** (text input — the headline)
- **Spec level** (select), **Change kind** (select)
- **Status badge** + PR link + reject reason (read-only)
- **Owner** (from frontmatter)
- **Summary** (collapsible textarea)
- Action buttons: Save / Submit for review / Delete

All fields map 1:1 to existing `DraftChangeNode` fields — **no schema change**. The `readOnly` gate (status not in draft/rejected) applies to banner controls.

---

## 9. Realtime spec doc validation (in React)

**Where:** `SpecContentEditor` / `DraftLayoutEditor` in `@beskid/ui-react/platform-spec` get a validation panel that re-runs spec-core validators on every content change (debounced).

**Validators run client-side:**
- `validateFrontmatterForLevel` (ported from trudoc → spec-core)
- `validateBodyWithMdshape` (already in spec-core)
- Template-section presence check (new — checks all mandated sections for the node's level exist)
- Stub-content check (new — flags duplicated/template-identical scaffolds)

**Display:** inline diagnostics gutter in the editor + a "Validation" panel listing issues by severity. Reuses the existing `DocumentValidationIssue` type.

---

## 10. Detach platform-spec from website

### 10.1 UI-layer detach
1. Move `BeskidHub.tsx` + `data/beskid-services.ts` + `hub/icons.ts` + `hub/beskid-hub-close-icon.ts` + `styles/hub.css` from `@beskid/beskid-ui` (Astro) into `@beskid/ui-react`.
2. In platform-spec: `import { BeskidHub } from "@beskid/ui-react"`; fix `styles.css` hub import.
3. Remove `@beskid/beskid-ui` from `site/platform-spec/package.json`.

### 10.2 Filesystem detach
4. `scripts/seed.ts`: drop `../../website/src/content/docs/platform-spec` fallback; `site/spec-content` is the only seed source.
5. `src/server/memgraph/import-mdx.ts`: remove `site/website/` slug prefix (line 108); default content root = `site/spec-content`.
6. `scripts/import-mdx.ts`: remove the website-generated-catalog dependency.
7. `Dockerfile`: drop `COPY site/website/src/content/docs/platform-spec`.
8. `README.md`: update seed instructions to `site/spec-content` only.

### 10.3 Website-side purge (Astro platform-spec rendering)
9. Delete `site/website/src/content/docs/platform-spec/` (the orphaned MDX — already 301-redirected).
10. Simplify `site/website/astro.config.mjs`: remove `platformSpecExternalRedirects()` (no in-site platform-spec URLs left to redirect); keep book config.
11. Move `src/data/architecture-graphs/` → `site/spec-content/.spec/architecture/` (already partially done — finish the sync).
12. Remove trudoc-bound `verify:*`/`generate:platform-spec-*`/`bootstrap:*` scripts from `site/website/package.json` (keep `verify:book-*`, `generate:book-nav-tree`, `sync:cli-version`, website-local reimplementations of `prebuild`/`predev`).

---

## 11. CICD cleanup

| Item | Action |
|---|---|
| `normative-spec.yml` | **Keep as-is** — already post-trudoc. Railroad validation auto-picked up once spec-core exposes it. |
| `scripts/ci/platform-smoke.sh` | **Modify** — remove `site/website prebuild` + `verify:platform-spec-git-meta` block (lines 22-26). |
| `.github/actions/setup-beskid-web/action.yml` | **Modify** — relax "Verify beskid_web_common submodule" assertions (drop `packages/trudoc/package.json` + `run-trudoc.mjs` hard checks). |
| All other workflows | **Keep as-is** (compiler, corelib, container-images, coolify, release, distribute, publish-open-vsx, per-site ci.yml). |
| `site/platform-spec/.github/workflows/ci.yml` | **Keep as-is** — already trudoc-free at script layer. |

---

## 12. Parallel-agent execution strategy

The implementation splits into **independent workstreams** that parallel agents can execute without shared state:

| Stream | Agent scope | Depends on |
|---|---|---|
| **A. Templates** | Write 5 uniform templates + per-domain layering; activate resolver; add stub validator | — (independent) |
| **B. trudoc→spec-core ports** | Port frontmatter/layout/catalog/nav-tree modules into spec-core; flip consumers | — (independent, but blocks E package.json removal) |
| **C. Architecture graph** | Sync JSONs, register keys, convert frontmatter | — (independent) |
| **D. Railroad generator + component** | pest parser, sync script, React component | C (route exists) |
| **E. React detach** | Relocate BeskidHub, cut website filesystem couplings | B (trudoc ports) for final package.json removal |
| **F. Draft banner + realtime validation** | Banner component, validation panel | B (validators in spec-core) |
| **G. Content fill (parallel sub-agents per domain)** | Fill stub articles, add missing `related.json`, normalize one-off slugs to canonical-6 | A (templates must exist) |
| **H. CICD + website purge** | Modify platform-smoke.sh, setup action; delete orphaned MDX; simplify astro.config | E (detach done first) |

Streams A, B, C can start immediately in parallel. D follows C. G follows A. E follows B. F follows B. H follows E.

---

## 13. Verification

- `bun run beskid_web_common/packages/spec-core/scripts/validate-workspace.ts site/spec-content` passes (normative gate).
- `spec validate --dir site/spec-content` passes.
- `cd site/platform-spec && bun run test && bun run build && bun run verify:client-bundle` all pass.
- No `trudoc` import remains in `site/platform-spec/src`, `beskid_web_common/packages/spec-core/src`.
- `site/website` builds with book-only content (no platform-spec rendering, no trudoc).
- Railroad graph renders at `/platform-spec/language-meta/surface-syntax/lexical-and-syntax/` with `Program` as entry node.
- Draft editor shows the proposal banner with editable title + metadata.
- Realtime validation panel surfaces template-section + stub issues as content is edited.
