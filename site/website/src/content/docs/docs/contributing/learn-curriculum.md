---
title: Change the Learn Curriculum
description: Update one lesson and verify one-lesson and all-lesson checks.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The source map and validation tables show the linear lesson workflow.
audience:
  - curriculum contributor
  - maintainer
authority:
  status: informative
  sourceLabel: Pinned Beskid Learn curriculum guide
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/3143396b796d86c1a70a0bfb1aa4761b593bbae5/site/learn/curriculum/README.md
  limits: This procedure maintains lesson source and validation. It does not define language behavior.
verified:
  revision: 3143396b796d86c1a70a0bfb1aa4761b593bbae5
  date: 2026-09-08
---

Each Learn lesson has one numeric-prefix identifier. Work from `site/learn/` for all commands.

## Prerequisites

Select a lesson identifier such as `01-hello-beskid`. Set `BESKID_BINARY` to the verified CLI executable that will check the lesson. Do not use a different compiler revision to approve the lesson.

At the pinned baseline, `09-cli-help`, `10-cli-format`, and `11-cli-build` are instruction-only folders. The aggregate `check:all` gate must stop at `09-cli-help` because it has a missing `start.bd`. Complete these folders before you use aggregate success as evidence.

| Source | Responsibility |
| --- | --- |
| `src/data/learningCatalog.ts` | Web metadata and ordered exercise catalogue. |
| `curriculum/<lesson>/lesson.md` | Learner instructions. |
| `curriculum/<lesson>/start.bd` | Editable starter source. |
| `curriculum/<lesson>/solution.bd` | Reference implementation. |
| `scripts/check-lesson.mjs` | Command selection and one-lesson validation. |

The lesson folders cover `analyze`, `parse`, `tree`, and `run` checks. OpenSpec remains normative for language behavior.

## Actions

1. Inspect `src/data/learningCatalog.ts` for the selected lesson identifier and command mode.
2. Inspect `lesson.md` in the matching numeric-prefix lesson folder.
3. Change `start.bd` as the learner's initial source.
4. Change `solution.bd` as the verified reference implementation.
5. Run `pnpm run lesson:check 01-hello-beskid` with the selected lesson identifier in place of `01-hello-beskid`.
6. Run `pnpm run check:all` after the one-lesson check passes.

## Expected result

The one-lesson check reports `<lesson-id>: <command> pass`. For a complete curriculum, the all-lesson check validates each numeric-prefix folder in deterministic order and exits successfully. At the pinned baseline, record the known instruction-only stop instead of claiming aggregate success.

## Recovery

If the checker reports `Unknown lesson slug`, compare the folder name with the catalogue identifier. If one lesson fails, stop at the first failing lesson and read its CLI diagnostic. Do not change the normative language rule to make a lesson pass.

For a `run` lesson, use the runtime-kit recovery that the checker reports. Do not treat a missing runtime kit as a lesson-content failure.

## Next task

[Use Beskid Learn](/docs/learn/) to check the learner-facing path after all lesson checks pass.
