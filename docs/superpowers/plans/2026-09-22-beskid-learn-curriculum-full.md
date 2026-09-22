# Beskid Learn Curriculum Implementation Plan

> **For agentic workers:** Execute the approved curriculum migration in
> independently reviewable slices. The user explicitly requested no TDD;
> use schema, content, and real-Beskid-CLI verification instead.

**Goal:** Replace the Learn command tour with a Markdown-source-of-truth,
evidence-informed curriculum covering supported Beskid concepts through fibers.

**Architecture:** Nested Markdown lesson packages and a manifest own all
curriculum content. A deterministic generator produces the existing React
catalog shape, while a curriculum validator checks structure, dependencies,
and every executable lesson against the declared Beskid CLI mode.

**Tech Stack:** Markdown, JSON, Node.js, TypeScript, pnpm, Vite, Vitest, and
the Beskid CLI.

**Spec:** `docs/superpowers/specs/2026-09-22-beskid-learn-curriculum-design.md`

## Global Constraints

- Normative language claims cite `openspec/specs`; grammar and CLI verification
  outrank illustrative prose.
- Preserve unrelated dirty worktree changes.
- No TDD workflow; validate authored curriculum and compile runnable samples.
- Do not describe unimplemented language surfaces as interactive exercises.
- Update `site/learn/CHANGELOG.md` under `Unreleased`.

## Review Focus

- Nested manifest paths must not let arbitrary directories enter `check:all`.
- Prerequisites must be acyclic and resolve to a lesson in the manifest.
- Generated catalog content must be traceable to one authored lesson.
- Lesson acceptance must use the command named by its metadata.
- Fiber prose must not imply schedule ordering or ownership rules unsupported
  by the current normative sources.

### Task 1: Establish the authored curriculum contract

**Files:**
- Create: `site/learn/curriculum/TEMPLATE.md`
- Modify: `site/learn/curriculum/README.md`
- Create: `site/learn/curriculum/manifest.json`

- [ ] Define required lesson headings, front matter, and check schema.
- [ ] Define context order and initial complete capability map in the manifest.
- [ ] Verify all ids, paths, and prerequisite edges with a schema validator.

### Task 2: Implement Markdown-to-catalog loading and validation

**Files:**
- Create: `site/learn/scripts/build-curriculum.mjs`
- Create: `site/learn/scripts/validate-curriculum.mjs`
- Create: `site/learn/src/data/generatedLearningCatalog.ts`
- Modify: `site/learn/src/data/learningCatalog.ts`
- Modify: `site/learn/scripts/check-lesson.mjs`
- Modify: `site/learn/package.json`

- [ ] Generate the React-compatible catalog deterministically from the manifest
  and lesson front matter/body.
- [ ] Validate schema, dependency order, required files/headings, and command
  metadata before generation.
- [ ] Change checks to address manifest ids rather than filesystem discovery.
- [ ] Run validator, generated-catalog check, relevant Vitest suite, and build.

### Task 3: Author the orientation, foundation, and control-flow contexts

**Files:**
- Replace/create: `site/learn/curriculum/00-orientation/**`
- Replace/create: `site/learn/curriculum/01-foundations/**`
- Replace/create: `site/learn/curriculum/02-control-flow/**`

- [ ] Write complete lessons to the template with compiler-verified examples.
- [ ] Add `start.bd`, `solution.bd`, and acceptance metadata for runnable
  lessons.
- [ ] Validate content schema and run declared CLI checks.

### Task 4: Author data, program structure, reliability, and closure contexts

**Files:**
- Create: `site/learn/curriculum/03-data-modeling/**`
- Create: `site/learn/curriculum/04-program-structure/**`
- Create: `site/learn/curriculum/05-reliability-and-abstraction/**`
- Create: `site/learn/curriculum/06-functions-with-context/**`

- [ ] Author only source-backed lessons, marking reference-only gaps plainly.
- [ ] Reuse retrieval prompts and fade starter support across contexts.
- [ ] Validate every catalogued executable lesson and its metadata.

### Task 5: Author the fiber-and-channel context and capstone

**Files:**
- Create: `site/learn/curriculum/07-fibers-and-channels/**`

- [ ] Teach spawn, `Fiber<T>`, join result/error, yield/cancel/detach, and
  channels in prerequisite order.
- [ ] Use one labelled schedule diagram and distinguish it from a guarantee.
- [ ] Validate examples against sources and the real toolchain where supported.

### Task 6: Retire legacy lessons and verify the full replacement

**Files:**
- Remove/replace: legacy `site/learn/curriculum/0*-*/`, `10-*`, `11-*`
- Modify: `site/learn/CHANGELOG.md`

- [ ] Remove duplicate legacy curriculum packages after generated catalog
  migration consumes the nested manifest.
- [ ] Run curriculum validation, all executable lesson checks, tests, build,
  `git diff --check`, and GitNexus changed-flow detection.
- [ ] Audit every manifest capability against a source-backed lesson or an
  explicit reference-only status before reporting completion.
