# Public Docs User Journeys Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add enforceable public documentation for actual Beskid product users, extenders, and maintainers without weakening existing operator or normative boundaries.

**Architecture:** A checked-in coverage catalogue maps each non-compiler public surface to one annotated Docs route and diagram policy. New task groups separate evaluation, product use, extension work, and service operation while reusing the existing typed metadata, navigation, and built-output verification.

**Tech Stack:** Astro 6, Starlight, TypeScript, Node test runner, Mermaid 11, Markdown, MDX, pnpm 10.17.1.

**Spec:** `docs/superpowers/specs/2026-09-08-public-docs-user-journeys-design.md`

## Global Constraints

- Do not edit, stage, resolve, commit, merge, or push any file or gitlink under `compiler/`.
- Do not use GitNexus.
- Use ASD-STE100, Issue 9, January 2025, for technical prose; do not claim certification.
- Use only root commit `3143396b796d86c1a70a0bfb1aa4761b593bbae5` and its pinned submodule gitlinks as factual evidence unless the owning task supplies a later clean revision.
- Keep OpenSpec normative, Tracker authoritative for delivery, Docs authoritative for current procedures, and the Book narrative.
- Every new Mermaid diagram must define `accTitle` and `accDescr` and must have an adjacent `### Diagram text` equivalent.
- Do not publish a settled deployment, service-inventory, or authentication runbook while tracked authorities conflict.
- Add no `Co-authored-by` trailer.
- Stage only named files. Preserve unrelated modified submodules and scratch directories.
- Update `CHANGELOG.md` and `GLOSSARY.md` for user-visible routes and established terms.

---

### Task 1: Make documentation completeness explicit

**Files:**
- Modify: `site/website/src/content.config.ts`
- Create: `site/website/src/data/docs-coverage.ts`
- Modify: `site/website/src/data/docs-navigation.ts`
- Create: `site/website/src/lib/docs-coverage.test.mjs`
- Modify: `site/website/src/lib/docs-contract.test.mjs`
- Modify: `site/website/src/lib/docs-procedures.test.mjs`
- Modify: the 36 existing files under `site/website/src/content/docs/docs/` only for `pageKind`, `diagramPolicy`, and the three pinned authority-link corrections

**Interfaces:**
- Produces: `docsCoverage`, one catalogue of non-compiler public surfaces and their route, audience, source boundary, page kind, and diagram policy.
- Produces: `pageKind: task | guide | reference` and `diagramPolicy: required | not-needed` typed frontmatter.
- Preserves: `docsNavigation` as the only ordered navigation model.

- [ ] **Step 1: Add failing contract tests**

  Require a coverage entry for each existing product surface and every coverage route in navigation. Require page-kind structure, diagram policy, and immutable source URLs for immutable verified revisions.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run `pnpm --dir site/website test -- src/lib/docs-coverage.test.mjs src/lib/docs-contract.test.mjs src/lib/docs-procedures.test.mjs`. Missing types and catalogue entries must fail.

- [ ] **Step 3: Implement the typed catalogue and metadata**

  Add the two fields to the content schema. Classify existing pages without changing their user-facing prose. Store each diagram omission reason in frontmatter and consume it from tests instead of a hidden hard-coded rationale.

- [ ] **Step 4: Pin mutable authority links and visible annotation prose**

  Replace the mutable `main` URLs in `contributing/documentation.md`, `contributing/ste-100.md`, and `standard/index.md` with the exact declared revision. Rewrite the passive `authority.limits` sentence in `projects/dependencies-and-locks.md` in active voice.

- [ ] **Step 5: Run focused and full tests**

  Run the three focused files, `pnpm --dir site/website test`, and `pnpm --dir site/website review:ste`.

- [ ] **Step 6: Commit**

  Commit only Task 1 files with message `test(docs): enforce public surface coverage`.

### Task 2: Add evaluation and learning journeys

**Files:**
- Create: `site/website/src/content/docs/docs/evaluate/index.md`
- Create: `site/website/src/content/docs/docs/learn/index.md`
- Modify: `site/website/src/content/docs/docs/index.md`
- Modify: `site/website/src/content/docs/docs/services/learn.md`
- Modify: `site/website/src/data/docs-navigation.ts`
- Modify: `site/website/src/data/docs-coverage.ts`
- Modify: `site/website/src/lib/docs-procedures.test.mjs`

**Interfaces:**
- Produces: `/docs/evaluate/`, a readiness decision based on supported host, release, first program, editor, project, package, and service evidence.
- Produces: `/docs/learn/`, the browser lesson loop, diagnostic recovery, temporary-source boundary, and progression to local projects.

- [ ] **Step 1: Add failing procedure assertions**

  Require exact pinned authority, roles, five task sections, stop criteria, privacy boundary, navigation links, and accessible diagrams for both routes.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run `pnpm --dir site/website test -- src/lib/docs-coverage.test.mjs src/lib/docs-procedures.test.mjs` and confirm both routes are missing.

- [ ] **Step 3: Write the evaluation task**

  Use a Mermaid decision tree for intended use, required evidence, and stop conditions. Link to Downloads, Standard, Tracker, and the existing first-program and editor tasks. Do not claim unsupported release maturity.

- [ ] **Step 4: Write the learner task**

  Describe selecting a lesson, editing source, running the check, reading a diagnostic, using hints, and continuing. Use a feedback-loop diagram and state that checks use temporary workspaces.

- [ ] **Step 5: Cross-link without duplicating operation guidance**

  Route learners from Docs home and the Learn service page. Keep health, image, and rollback details in the operator page.

- [ ] **Step 6: Test, review, and commit**

  Run focused tests, the full website tests, and the STE reviewer. Commit with message `docs: add evaluation and learning journeys`.

### Task 3: Add platform-user journeys

**Files:**
- Create: `site/website/src/content/docs/docs/platform/index.md`
- Create: `site/website/src/content/docs/docs/platform/account.md`
- Create: `site/website/src/content/docs/docs/platform/tracker.md`
- Create: `site/website/src/content/docs/docs/platform/report-bug.md`
- Create: `site/website/src/content/docs/docs/platform/nexus.md`
- Modify: `site/website/src/content/docs/docs/services/{authentication,tracker,nexus}.md`
- Modify: `site/website/src/data/docs-navigation.ts`
- Modify: `site/website/src/data/docs-coverage.ts`
- Modify: `site/website/src/lib/docs-procedures.test.mjs`

**Interfaces:**
- Produces: ordinary user procedures for account sign-in, roadmap reading, bug reporting, and graph exploration.
- Preserves: administrative pairing, database, index, proxy, and token actions in service/operator pages.

- [ ] **Step 1: Add failing route and procedure assertions**

  Require public-versus-authenticated boundaries, permissions, exact routes, expected results, recovery, and cross-links to operator contracts.

- [ ] **Step 2: Write platform and account pages**

  Explain the Hub handoff at user level without exposing pairing secrets or asserting disputed service-auth topology.

- [ ] **Step 3: Write Tracker pages**

  Separate public timeline and bug tasks from authenticated version/workstream maintenance. Add a diagram that keeps Tracker delivery authority distinct from OpenSpec normative authority and GitHub bug transport.

- [ ] **Step 4: Write the Nexus reader page**

  Explain repository selection, graph navigation, code references, process flows, Standard links, empty/loading states, and the privilege boundary. Add a role-boundary diagram without documenting administrator or MCP credentials.

- [ ] **Step 5: Test, review, and commit**

  Run focused tests, full website tests, the STE reviewer, and the production build. Commit with message `docs: add platform user workflows`.

### Task 4: Complete the VS Code product workflow

**Files:**
- Create: `site/website/src/content/docs/docs/editor/index.md`
- Create: `site/website/src/content/docs/docs/editor/vs-code.md`
- Modify: `site/website/src/content/docs/docs/getting-started/editor.md`
- Modify: `site/website/src/content/docs/docs/projects/index.md`
- Modify: `site/website/src/content/docs/docs/packages/index.md`
- Modify: `site/website/src/data/docs-navigation.ts`
- Modify: `site/website/src/data/docs-coverage.ts`
- Modify: `site/website/src/lib/docs-procedures.test.mjs`

**Interfaces:**
- Produces: project focus, status dashboard, dependency refresh, package browser, graph explorer, settings, and recovery guidance pinned to `beskid_vscode` commit `94640e47f3292a883cb2f92c4a04321f8724a3f7`.

- [ ] **Step 1: Add failing VS Code workflow assertions**

  Require `.bws` and `.bproj` project selection, the Beskid status-bar entry, Projects, Packages, Graph Explorer, automatic fetch, output-channel recovery, and credential-storage warning.

- [ ] **Step 2: Write the chooser and workflow**

  Keep first installation in Getting Started. Put daily project work on the advanced page. Add the extension/project-context lifecycle diagram and text equivalent.

- [ ] **Step 3: Add contextual cross-links**

  Link Projects and Packages to the matching extension views without treating UI behavior as normative.

- [ ] **Step 4: Test, review, and commit**

  Run focused tests, full website tests, the STE reviewer, and build. Commit with message `docs: complete the VS Code workflow`.

### Task 5: Document extension and contributor surfaces

**Files:**
- Create: `site/website/src/content/docs/docs/extend/index.md`
- Create: `site/website/src/content/docs/docs/extend/bsol.md`
- Create: `site/website/src/content/docs/docs/extend/templates.md`
- Create: `site/website/src/content/docs/docs/extend/tree-sitter.md`
- Create: `site/website/src/content/docs/docs/extend/web-packages.md`
- Create: `site/website/src/content/docs/docs/contributing/superrepo-workflow.md`
- Create: `site/website/src/content/docs/docs/contributing/learn-curriculum.md`
- Modify: `site/website/src/content/docs/docs/contributing/index.md`
- Modify: `site/website/src/data/docs-navigation.ts`
- Modify: `site/website/src/data/docs-coverage.ts`
- Modify: `site/website/src/lib/docs-procedures.test.mjs`

**Interfaces:**
- Produces: verified non-compiler workflows pinned to the BSOL, template, Tree-sitter, web-common, Learn, and root source revisions listed in the design baseline.

- [ ] **Step 1: Add failing coverage and procedure assertions**

  Require source-of-truth boundaries, exact supported package managers, generated-file rules, token hygiene, focused tests, expected evidence, and recovery.

- [ ] **Step 2: Write BSOL and template tasks**

  Cover profile selection, validation, diagnostics, template layout, `{{symbolId}}`, local-path instantiation, and dry-run publication. Do not restate normative schemas.

- [ ] **Step 3: Write Tree-sitter and web-package tasks**

  Cover consumer setup, package identity, generated/handwritten boundaries, sync and test gates, npm aliases, GitHub Packages scopes, and the pnpm-versus-Bun exception.

- [ ] **Step 4: Write contributor workflow tasks**

  Cover setup profiles, submodule ownership, dirty-tree safety, focused gate selection, Learn curriculum sources, one-lesson validation, and all-lesson validation. Add only the superrepo branching-flow diagram.

- [ ] **Step 5: Test, review, and commit**

  Run focused tests, full website tests, the STE reviewer, and build. Commit with message `docs: cover extension and contributor surfaces`.

### Task 6: Audit the whole increment and record it

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `GLOSSARY.md`
- Modify: `site/website/src/lib/docs-coverage.test.mjs` if the audit finds an uncovered shipped surface

**Interfaces:**
- Records: new user roles, product-use versus service-operation boundary, page kinds, and coverage catalogue.

- [ ] **Step 1: Run the completion audit**

  Compare every coverage entry with its page, navigation leaf, pinned source, role, procedure structure, diagram policy, and recovery path. Record unresolved deployment/auth/service-inventory conflicts as remaining work.

- [ ] **Step 2: Update project records**

  Add concise Keep a Changelog entries and glossary definitions for `documentation coverage catalogue`, `page kind`, `product-use guide`, and `service-operation guide`.

- [ ] **Step 3: Run full verification**

  Run `pnpm --dir site/website test`, `pnpm --dir site/website review:ste`, `pnpm --dir site/website build`, `pnpm openspec:validate`, `node site/website/scripts/verify-built-docs.mjs site/website/dist`, and `git diff --check`.

- [ ] **Step 4: Inspect rendered output**

  Use the in-app Browser for one page in Evaluate and Learn, Use the Platform, and Extend. Verify both themes, navigation, diagrams, annotations, and recovery links.

- [ ] **Step 5: Review and integrate**

  Run an independent whole-diff review. Resolve findings, merge with current `origin/main`, preserve unrelated state, push `main`, and verify the public deployment.
