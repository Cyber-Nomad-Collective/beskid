# Learn Guided Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add guided, step-based Learn lessons with editor highlighting, source/command checks, lesson-specific layouts, CLI curriculum, and fluent transitions.

**Architecture:** Keep one canonical `LessonStep` model in the catalog. `LessonWorkspace` owns step state and delegates display to a guided rail plus existing editor/terminal surfaces. Use Motion for React for React state transitions and Monaco decorations for source focus.

**Tech Stack:** React 19, TypeScript, Monaco Editor, existing Learn API, Motion for React, Vitest/Testing Library, Biome.

## Global Constraints

- Preserve existing authenticated Learn entry and `/api/check` protocol.
- Keep required workspace surfaces open; do not create a second generic layout system.
- Use PascalCase for types/functions/methods and camelCase for locals/params.
- Respect `prefers-reduced-motion`.
- Update `CHANGELOG.md` under `Unreleased`.

### Task 1: Step model and pure validation

**Files:** Modify `site/learn/src/data/learningCatalog.ts`; create `site/learn/src/components/lessonWorkspace/steps.ts`; test `site/learn/src/components/lessonWorkspace/steps.test.ts`.

- Add `LessonStep`, `LessonCheck`, `LessonFocus`, and `LessonLayout` types.
- Add `steps` and `layout` to `LearnExercise`.
- Add pure `validateSourceStep(step, code)` returning `{ ok, message }`.
- Write failing tests for exact source matching, substring checks, and missing focus ranges; run the focused test red, implement, then run green.

### Task 2: Guided workspace behavior

**Files:** Modify `site/learn/src/components/lessonWorkspace/LessonWorkspace.tsx`; create `site/learn/src/components/lessonWorkspace/GuidedLessonRail.tsx`; modify `site/learn/src/components/WorkspaceTabs.tsx` and `site/learn/src/styles.css`.

- Track `activeStepIndex`, per-step status, and check result.
- Add Monaco editor ref and decorations for the active focus range; reveal the line when the step changes.
- Validate source steps locally and command steps through the existing check request.
- Replace the detached hints/questions experience with the guided rail while retaining contextual hint content.
- Make tabs lesson-aware and prevent closing required surfaces.
- Use Motion `AnimatePresence`, `layout`, and `layoutId` for rail content, step status, and active tab indicator.
- Add component tests for step selection, check gating, and required-tab close behavior.

### Task 3: Catalog migration and CLI lessons

**Files:** Modify `site/learn/src/data/learningCatalog.ts`; create curriculum markdown files under `site/learn/curriculum/09-cli-help`, `10-cli-new`, `11-cli-format`, and `12-cli-build` if lesson validation requires them.

- Add step definitions to existing lessons with precise line ranges.
- Set lesson-specific layouts: editor-only for language basics, editor+terminal for parser/tree/run and CLI lessons.
- Add CLI lessons using commands confirmed in the compiler CLI source.
- Ensure each added lesson has checks, hints, prerequisites, and catalog-consistent content.

### Task 4: Motion dependency and visual polish

**Files:** Modify `site/learn/package.json`, lockfile, `site/learn/src/styles.css`.

- Add the current Motion package import path `motion/react`.
- Improve tab contrast, active state, rail hierarchy, status colors, and responsive bottom-sheet behavior.
- Keep terminal hidden when lesson layout does not request it.

### Task 5: Verification and maintenance

- Run `pnpm --dir site/learn test`, `typecheck`, `check`, and `build`.
- Run `git diff --check` and GitNexus `detect_changes({ scope: "all" })`.
- Update `CHANGELOG.md` and inspect final diff for accidental artifacts.
