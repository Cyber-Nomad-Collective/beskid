# Complete Public Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Beskid website Docs a complete, STE-governed technical guidance surface for every project audience.

**Architecture:** Store mutable procedures in `/docs/`, keep OpenSpec normative, keep the Book narrative, and derive shared presentation from typed metadata and navigation data. Contract tests prevent command, route, annotation, diagram, and download-platform drift.

**Tech Stack:** Astro 6, Starlight, TypeScript, React 19, Node test runner, Mermaid 11, pnpm 10.17.1, Markdown and MDX.

**Spec:** `docs/superpowers/specs/2026-09-08-complete-public-docs-design.md`

## Global Constraints

- Do not edit, stage, resolve, commit, merge, or push any file or gitlink under `compiler/`.
- Use the root-pinned compiler commit or a later clean revision supplied by the compiler owner as read-only command evidence.
- Do not use GitNexus.
- Use ASD-STE100, Issue 9, January 2025, for technical prose; do not claim certification.
- Use `.bproj`, `.bws`, `Main`, AOT execution, pnpm, the Rust pckg service, and current public service names.
- Keep OpenSpec as the only normative authority and Tracker as delivery authority.
- Add no `Co-authored-by` trailer.
- Stage only named files. Preserve unrelated modified submodules and scratch directories.
- Update `CHANGELOG.md` and `GLOSSARY.md` when the implementation establishes user-visible behavior or terminology.

---

### Task 1: Add the typed Docs contract and one navigation source

**Files:**
- Modify: `site/website/src/content.config.ts`
- Create: `site/website/src/data/docs-navigation.ts`
- Create: `site/website/src/components/starlight/DocsPageTitle.astro`
- Modify: `site/website/src/components/starlight/BlogAwarePageTitle.astro`
- Modify: `site/website/astro.config.mjs`
- Modify: `beskid_web_common/packages/beskid-ui/src/docs/DocsNavChrome.astro`
- Create: `site/website/src/lib/docs-contract.test.mjs`
- Modify: `site/website/src/lib/docs-shell.test.mjs`

**Interfaces:**
- Produces: `docsNavigation`, the sole ordered navigation model used by Starlight and the custom rail.
- Produces: typed `audience`, `authority`, and `verified` frontmatter fields.
- Produces: one visible authority annotation rendered immediately after the page title.

- [ ] **Step 1: Write failing contract tests**

  Assert that all technical Docs entries have the required metadata, both navigation consumers import `docsNavigation`, the custom page-title component renders status, authority, limits, audience, revision, and date, and source pages do not contain `## Document annotation`.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run `pnpm --dir site/website test -- src/lib/docs-contract.test.mjs src/lib/docs-shell.test.mjs`. The new metadata and shared-navigation assertions must fail.

- [ ] **Step 3: Implement the contract**

  Extend the Starlight schema with the exact fields in the design. Export one navigation tree. Adapt the shared rail to consume the tree through a serializable input or generated module, without keeping its hard-coded route list. Render the annotation through the custom page-title seam. Keep blog metadata behavior intact.

- [ ] **Step 4: Migrate the existing ten Docs pages**

  Add complete frontmatter, remove explicit H1 headings, and remove manual annotation sections. Use the root-pinned compiler revision for command pages and the current OpenSpec revision for the Standard page.

- [ ] **Step 5: Run focused and full website tests**

  Run `pnpm --dir site/website test`. Confirm the metadata, navigation, title, and existing blog contracts pass.

- [ ] **Step 6: Commit the task**

  Commit only the listed root files and, if required, a clean dedicated `beskid_web_common` commit plus its root gitlink update. Do not include any other submodule pointer.

### Task 2: Repair download, route, and rendered-document safety

**Files:**
- Modify: `site/website/src/pages/api/version.json.ts`
- Modify: `beskid_web_common/packages/beskid-ui-react/src/components/downloads/DownloadsSection.tsx`
- Modify: existing download tests adjacent to these modules
- Create: `site/website/scripts/verify-built-docs.mjs`
- Modify: `site/website/package.json`
- Rename: affected `site/website/src/content/docs/book/reference/**/README.md` files to `index.md`
- Modify: `site/website/astro.config.mjs`

**Interfaces:**
- Produces: one exact platform identifier union: `linux-amd64`, `darwin-arm64`, and `windows-amd64`.
- Produces: `verify-built-docs.mjs`, which validates routes, anchors, H1 count, and explicit 404 output.

- [ ] **Step 1: Write a failing platform-contract test**

  Assert that each API package uses one selected-platform identifier and appears in the corresponding Downloads tab. Include raw binary and supported package rows.

- [ ] **Step 2: Run the platform tests and verify RED**

  Run the focused website and shared UI tests. Confirm that the current `linux`, `macos`, and `windows` values fail the exact-match assertions.

- [ ] **Step 3: Implement one platform representation**

  Replace the duplicate string shapes with the exact union. Render the available package rows, extension installation, channel label, immutable pin, install location, upgrade, and uninstall guidance. Do not advertise artifacts absent from release metadata.

- [ ] **Step 4: Write and verify failing built-route tests**

  Build the website, run the new verifier, and confirm that the current missing LSP/reference routes, duplicate H1 pages, missing anchors, and false home-page 404s are reported.

- [ ] **Step 5: Repair the routes and 404 behavior**

  Give reference directories canonical index files, add deliberate redirects for known renamed routes, and make unknown routes return the explicit 404 page. Do not collapse named Standard links to a generic page in this task.

- [ ] **Step 6: Run focused tests and a production build**

  Run `pnpm --dir site/website test`, `pnpm --dir site/website build`, and `node site/website/scripts/verify-built-docs.mjs site/website/dist`.

### Task 3: Complete the Start and Develop user journeys

**Files:**
- Modify: `site/website/src/content/docs/docs/index.md`
- Modify: `site/website/src/content/docs/docs/getting-started/index.md`
- Modify: `site/website/src/content/docs/docs/getting-started/install.md`
- Modify: `site/website/src/content/docs/docs/getting-started/first-program.md`
- Create: `site/website/src/content/docs/docs/getting-started/editor.md`
- Create: `site/website/src/content/docs/docs/getting-started/troubleshooting.md`
- Modify: `site/website/src/content/docs/docs/tooling/index.md`
- Create: `site/website/src/content/docs/docs/tooling/build-run-test.md`
- Create: `site/website/src/content/docs/docs/tooling/ci.md`
- Create: `site/website/src/content/docs/docs/language-basics/index.md`
- Create: `site/website/src/lib/docs-procedures.test.mjs`

**Interfaces:**
- Consumes: typed page metadata and `docsNavigation` from Task 1.
- Produces: complete evaluator, installer, first-program, editor, CLI, CI, and troubleshooting paths.

- [ ] **Step 1: Write failing procedure tests**

  Assert that every task page has prerequisites, actions, expected result, recovery, next task, complete metadata, and either a Mermaid block plus text equivalent or an explicit no-diagram rationale in test data. Reject active `.proj`, lowercase Beskid entrypoint, and JIT-run claims.

- [ ] **Step 2: Run the procedure tests and verify RED**

  Run `pnpm --dir site/website test -- src/lib/docs-procedures.test.mjs`. Confirm the missing sections and prohibited current guidance fail.

- [ ] **Step 3: Write the Start pages in ASD-STE100 style**

  Explain supported platforms and release channels, install effects, PATH, CLI and LSP verification, upgrade, pinning, uninstall, first AOT execution, editor binary selection, and exact first-day recovery paths. Use `Main` and observable output.

- [ ] **Step 4: Write the Develop pages in ASD-STE100 style**

  Explain the concise root commands, grouped advanced aliases, AOT build/run/test, diagnostic interpretation, reproducible CI flags, and the minimum language syntax required by the verified program. Link language rules to OpenSpec and command details to the reference.

- [ ] **Step 5: Add accessible Mermaid diagrams**

  Add audience routing, install decision, source-to-AOT execution, editor/LSP, CLI taxonomy, CI, and troubleshooting diagrams. Follow each with a text-equivalent list or table.

- [ ] **Step 6: Run tests and build**

  Run the focused procedure tests, the full website tests, the production build, and the built-output verifier.

### Task 4: Complete Projects and Packages

**Files:**
- Modify: `site/website/src/content/docs/docs/projects/index.md`
- Create: `site/website/src/content/docs/docs/projects/create.md`
- Create: `site/website/src/content/docs/docs/projects/workspaces.md`
- Create: `site/website/src/content/docs/docs/projects/dependencies-and-locks.md`
- Modify: `site/website/src/content/docs/docs/packages/index.md`
- Create: `site/website/src/content/docs/docs/packages/publish.md`
- Create: `site/website/src/content/docs/docs/packages/consume.md`
- Create: `site/website/src/content/docs/docs/packages/credentials-and-recovery.md`
- Modify: `site/website/src/lib/docs-procedures.test.mjs`

**Interfaces:**
- Produces: canonical `.bproj`, `.bws`, lock, registry dependency, publication, and consumption procedures.
- Consumes: clean root-pinned project and pckg command evidence; never consumes the conflicted compiler checkout.

- [ ] **Step 1: Add failing project and package assertions**

  Require one verified example for project creation, workspace selection, path dependency, registry dependency, lock/frozen behavior, credential setup, package-record creation, pack, inspect, upload, consume, yank, and recovery. Reject `login`, `dry-run`, and `publish` as pckg subcommands.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run the procedure test and confirm the current shallow pages fail.

- [ ] **Step 3: Write Projects pages**

  Use `.bproj` and `.bws`. State discovery, ambiguity, target selection, path and registry behavior, unsupported git behavior, lock changes, generated paths, and `--locked` or `--frozen` effects.

- [ ] **Step 4: Write Packages pages**

  Use `beskid pckg` as the ordinary spelling. Explain safe credential storage, create-before-upload, generated documentation, immutable coordinates, verification, consumption, yanking, and failure recovery. Mention the grouped alias once.

- [ ] **Step 5: Add project and package Mermaid diagrams**

  Add a workspace/project/dependency graph and a publication/consumption sequence. Provide complete text equivalents.

- [ ] **Step 6: Run tests and build**

  Run focused tests, full website tests, production build, and the built-output verifier.

### Task 5: Add service, operator, contributor, and reference guidance

**Files:**
- Create: `site/website/src/content/docs/docs/services/index.md`
- Create: `site/website/src/content/docs/docs/services/authentication.md`
- Create: `site/website/src/content/docs/docs/services/learn.md`
- Create: `site/website/src/content/docs/docs/services/pckg.md`
- Create: `site/website/src/content/docs/docs/services/tracker.md`
- Create: `site/website/src/content/docs/docs/services/nexus.md`
- Create: `site/website/src/content/docs/docs/operations/index.md`
- Create: `site/website/src/content/docs/docs/operations/containers.md`
- Create: `site/website/src/content/docs/docs/operations/deployment.md`
- Create: `site/website/src/content/docs/docs/operations/health-and-monitoring.md`
- Create: `site/website/src/content/docs/docs/contributing/index.md`
- Create: `site/website/src/content/docs/docs/contributing/repository.md`
- Create: `site/website/src/content/docs/docs/contributing/standard-changes.md`
- Create: `site/website/src/content/docs/docs/reference/index.md`
- Create: `site/website/src/content/docs/docs/reference/licensing.md`
- Modify: `site/website/src/lib/docs-procedures.test.mjs`

**Interfaces:**
- Produces: task paths for platform users, self-hosters, maintainers, contributors, and evaluators.
- Consumes: service READMEs, Compose contracts, OpenBao layout, workflow files, `LICENSING.md`, and the Tracker delivery model.

- [ ] **Step 1: Add failing audience-coverage tests**

  Require each audience from the design to have one navigation entry and one complete landing or task page. Require security annotations on authentication, secrets, credentials, and deployment pages.

- [ ] **Step 2: Run the focused tests and verify RED**

  Confirm that service operators, contributors, and reference users currently lack the required routes.

- [ ] **Step 3: Write service and operator pages**

  Describe what each service does, who uses it, public and local boundaries, authentication, persistent state, container images, health checks, deployment ownership, secret sources, monitoring, and recovery. Do not publish secret values or invent service identifiers.

- [ ] **Step 4: Write contributor and reference pages**

  Separate user installation from repository setup. Use `./scripts/setup-environment.sh`, pnpm, submodule ownership, focused test gates, OpenSpec change rules, documentation rules, licensing boundaries, and generated-content boundaries.

- [ ] **Step 5: Add service and authority diagrams**

  Add a public service/authentication topology and an OpenSpec-to-Docs authority flow. Provide text-equivalent tables.

- [ ] **Step 6: Run tests and build**

  Run focused tests, full website tests, production build, and the built-output verifier.

### Task 6: Align active Book and CLI reference material

**Files:**
- Modify: `site/website/src/content/docs/book/reference/cli/**`
- Modify: `site/website/src/content/docs/book/reference/projects/**`
- Modify: `site/website/src/content/docs/book/01-it-works-on-my-machine/**`
- Modify: `site/website/src/content/docs/book/02-path-not-found-tooling-anyway/**`
- Modify: `site/website/src/content/docs/book/03-project-proj-or-it-didnt-happen/**`
- Modify: `site/website/src/content/docs/book/06-monorepo-as-coping-mechanism/**`
- Modify: `site/website/src/content/docs/book/14-from-source-to-runs/**`
- Modify: `site/website/src/content/docs/book/15-mods-plugins-with-consequences/**`
- Modify: `site/website/src/content/docs/book/18-packages-without-npm-trauma/**`
- Modify: `site/website/src/content/docs/book/21-ffi-and-forbidden-friendships/**`
- Modify: `site/website/src/content/docs/book/22-so-you-want-to-contribute/**`
- Create: `site/website/src/lib/reference-alignment.test.mjs`

**Interfaces:**
- Produces: a complete current command reference and Book narrative that links to canonical procedures.
- Consumes: Docs routes from Tasks 3-5 and clean pinned command evidence.

- [ ] **Step 1: Write failing alignment tests**

  Reject active `Project.proj`, `Workspace.proj`, ASP.NET pckg, Bun website commands, removed aggregate test crate, removed pckg commands, active ABI-v4 claims, generic current JIT-run claims, and new `/platform-spec/` links. Require reference pages for every root command in the pinned command inventory.

- [ ] **Step 2: Run the alignment tests and verify RED**

  Confirm the known contradictions fail with file and line diagnostics.

- [ ] **Step 3: Repair the command and project reference**

  Add missing command pages, delete the nonexistent publish command page, document current aliases once, and replace active manifest and provider claims. Link procedural details to Docs.

- [ ] **Step 4: Repair affected Book chapters**

  Preserve intentional chapter voice in introductions. Rewrite procedures and technical claims in controlled language. Replace the JIT run path with AOT execution, update current project/package/contributor paths, and mark any unresolved ABI conflict explicitly instead of inventing a rule.

- [ ] **Step 5: Consolidate diagrams**

  Remove stale duplicate workflow diagrams when the canonical Docs diagram answers the same question. Keep narrative diagrams only when they add a distinct teaching view. Update current labels and links.

- [ ] **Step 6: Run tests and build**

  Run alignment tests, full website tests, production build, and the built-output verifier.

### Task 7: Preserve Standard deep-link identity

**Files:**
- Modify: `site/website/src/lib/remark-beskid-directives.mjs`
- Modify: `site/website/src/lib/remark-beskid-directives.test.mjs`
- Create: `site/website/src/pages/docs/standard/[...id].astro` or an equivalent generated Starlight route
- Modify: `site/website/src/content/docs/docs/standard/index.md`
- Create: `site/website/src/lib/standard-routes.test.mjs`

**Interfaces:**
- Produces: stable public capability and requirement destinations derived from `openspec/catalog.json`.
- Preserves: legacy aliases without collapsing their identity to the Standard landing page.

- [ ] **Step 1: Write failing catalog-route tests**

  Select representative capability, requirement, alias, fragment, and unknown identifiers. Require known links to resolve to identity-preserving public destinations and unknown links to fail closed with a useful Standard search page.

- [ ] **Step 2: Run the focused tests and verify RED**

  Confirm that the current generic rewrite loses identity.

- [ ] **Step 3: Generate identity-preserving Standard routes**

  Read the checked-in catalog at build time. Render informative index data and link directly to the canonical source requirement. Do not duplicate or reinterpret normative prose.

- [ ] **Step 4: Update legacy rewriting**

  Map known aliases to the generated destination. Preserve fragments when the destination defines them. Send unknown identifiers to an explicit not-found/search state, not an unrelated generic page.

- [ ] **Step 5: Run tests and build**

  Run directive tests, Standard route tests, full website tests, production build, and the built-output verifier.

### Task 8: Add STE review, finish project records, and verify deployment

**Files:**
- Create: `site/website/scripts/review-ste-docs.mjs`
- Create: `site/website/src/lib/ste-review.test.mjs`
- Modify: `site/website/package.json`
- Modify: `site/website/src/content/docs/docs/contributing/ste-100.md`
- Modify: `site/website/src/content/docs/docs/contributing/documentation.md`
- Modify: `GLOSSARY.md`
- Modify: `CHANGELOG.md`

**Interfaces:**
- Produces: a deterministic review report for candidate STE issues and documented exception syntax.
- Produces: final user-visible project records and verification evidence.

- [ ] **Step 1: Write failing STE-review tests**

  Test sentence-length candidates, passive-voice candidates, unexplained abbreviations, approved Beskid terms, code-fence exclusion, frontmatter exclusion, requirement/scenario exclusion, and explicit manual-review exceptions.

- [ ] **Step 2: Run the tests and verify RED**

  Confirm the missing review tool fails.

- [ ] **Step 3: Implement the review tool**

  Report candidates with file and line numbers. Do not rewrite prose automatically and do not print a certification claim. Document how maintainers review and record exceptions.

- [ ] **Step 4: Run the complete local verification matrix**

  Run `pnpm --dir site/website test`, `pnpm --dir site/website build`, the built-output verifier, the STE reviewer, and repository checks that do not invoke or modify the compiler. Inspect all generated top-level Docs pages in light and dark modes with the in-app browser.

- [ ] **Step 5: Audit every requirement in the design**

  Record whether each audience, page contract, diagram, route, command claim, authority boundary, and safety requirement has direct evidence. Continue correcting gaps until none remain.

- [ ] **Step 6: Update project records and commit**

  Add glossary entries for the typed Docs annotation and verified procedure. Add Keep a Changelog entries for the public Docs architecture, corrected workflows, reference alignment, and validation gates. Commit only intended files.

- [ ] **Step 7: Merge and push only with existing authorization**

  Reconfirm the root branch and remote state, preserve unrelated changes, push the already-authorized main-worktree commits, and wait for required website delivery checks. Use the in-app browser to verify the deployed Docs routes after production updates.
