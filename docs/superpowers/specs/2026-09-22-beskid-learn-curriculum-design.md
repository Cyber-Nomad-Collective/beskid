# Beskid Learn Curriculum Design

## Intent

Replace the command-tour lessons with an evidence-informed, Markdown-first
curriculum that takes a learner from `Main` through the full source-backed
Beskid surface, including fibers. The recurring Ridge Signal program grows
from an exit status into a state model and finally a cooperating worker roster.

## Architecture

`site/learn/curriculum/` is the authored source of truth. Context directories
own `context.md`; lesson directories own `lesson.md`, `start.bd`, `solution.bd`
and `check.json` when executable. A manifest and Node generator validate this
nested tree and emit the existing TypeScript `LearnExercise` shape. The UI and
server retain their catalog interface but no longer duplicate curriculum prose.

Every lesson declares `status: proven-runnable | parser-and-analysis |
normative-pending | deferred`. Only proven-runnable lessons appear as
interactive compiler exercises. The remaining lessons are explicit reference
or preview material, never misleading executable tasks.

## Required lesson shape

1. Hook and goal
2. Predict
3. Run
4. Investigate
5. Modify
6. Make and retrieve
7. Failure clinic
8. Recap and next link

The author must use functional subgoal labels, actual commands, a real
compiler/source citation, and a meaningful change rather than a rename-only
exercise.

## Coverage order

Orientation; syntax, values, and types; expressions, control flow, and
functions; data/types/methods/events; enums/match/Option/Result; collections
and loops; modules/projects; contracts/tests/composition; lambdas/closures;
practical core library; fibers/channels/coordination; advanced attributes,
macros, mods, FFI, and memory. The normative source and verified compiler
surface decide availability, not syntax familiarity from another language.

## Verification

Manifest ids and prerequisite graph must be valid; every lesson must satisfy
the template; generated metadata must equal authored metadata; every
interactive starter and solution must pass its declared Beskid CLI command;
and the existing Learn typecheck/tests/build must consume the generated catalog.
This is content and toolchain verification, not a TDD workflow.
