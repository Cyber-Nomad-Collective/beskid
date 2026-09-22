# Beskid Learn Curriculum Design

## Intent

Replace the current command-tour lessons with an entertaining, complete
beginner-to-concurrency curriculum that teaches verified Beskid concepts from
`Main` through fibers. Learners build a small "Ridge Signal" program: first a
status code, then a stateful trail log, then cooperating workers. The story is
a memory aid, never a substitute for an observable program behaviour.

## Source of truth and migration boundary

`site/learn/curriculum/` becomes the sole authored curriculum source. Every
lesson lives below a context directory and contains `lesson.md`, `start.bd`,
`solution.bd`, and `check.json`. A build script validates the tree and emits
the derived `src/data/generatedLearningCatalog.ts`; the hand-authored
`learningCatalog.ts` becomes a small re-export/type boundary. This removes the
present duplicate prose and keeps the browser metadata, checker, and Markdown
lesson aligned.

The generated catalog preserves the existing `LearnExercise` shape so the
React surface remains a consumer, rather than a second curriculum authoring
system. Nested context paths are explicitly enumerated from a manifest; the
checker no longer discovers arbitrary numeric top-level directories.

## Lesson contract

Each `lesson.md` has front matter containing stable id, context, title,
objective, prerequisites, command, difficulty, vocabulary, and a source link
to its governing OpenSpec section. The body has these required headings:

1. **Hook and goal** — a visible outcome plus the exact command.
2. **Predict** — an answer before the result is disclosed.
3. **Run** — a complete, short runnable example.
4. **Investigate** — explanation grouped by purpose, not punctuation.
5. **Modify** — one constrained semantic change.
6. **Make and retrieve** — a small transfer task plus an explanation prompt.
7. **Failure clinic** — plausible mistake, compiler observation, repair rule.
8. **Recap and next link** — vocabulary and the next prerequisite.

`check.json` names the command and expected acceptance shape. It is deliberately
not a replacement for CLI verification: each checked starter/solution pair
must run against the real Beskid command declared by the lesson. Where a
feature is normative but not executable in the selected compiler build, the
lesson is marked **reference-only** and excluded from the interactive catalog
until runnable; it must never masquerade as an exercise.

## Curriculum sequence

| Context | Lessons | Competency at exit |
| --- | --- | --- |
| Orientation | Learn loop; read diagnostics | Can predict, run, and repair a small program. |
| Foundations | `Main`; literals/types; bindings; expressions | Can make a deterministic executable entry point. |
| Control flow | Functions; `if`; loops; boolean rules | Can decompose and direct a calculation. |
| Data modelling | Nominal types; fields/methods; enums; `match`; collections | Can represent a changing program state. |
| Program structure | Modules/use; visibility; projects/packages; build/test tooling | Can organize and inspect a multi-file program. |
| Reliability and abstraction | `Result`; errors; generics; contracts | Can express failure and reusable APIs. |
| Functions with context | Lambdas; capture boundaries; composition | Can reason about code that carries context. |
| Fibers and channels | Cooperative model; spawn/handle; join; yield/cancel/detach; channels; capstone | Can coordinate workers without asserting an ordering guarantee. |

The authoritative coverage inventory, not familiarity with another language,
controls the final lesson count. A source-backed capability has one principal
lesson, retrieval in a later lesson, and a capstone use. Features absent from
the current normative/implemented surface are excluded rather than invented.

## Authoring and accuracy rules

- Use the Predict → Run → Investigate → Modify → Make progression supported by
  the research note at `docs/research/2026-09-22-learn-programming-pedagogy.md`.
- Introduce one principal concept per lesson and make dependencies explicit.
- Explain observed semantics first and attach canonical Beskid terms second.
- Use actual compiler diagnostics and narrow repair guidance; no generic
  “failed” completion state.
- Use diagrams only for invisible state such as call flow, ownership, or fiber
  scheduling. Fiber traces illustrate one possible trace, never a promised
  scheduling order.
- Teach fiber handles, `Join` results, cancellation, and channel-only
  communication according to the normative fiber/concurrency specifications;
  do not use `async`/`await` or thread metaphors as a compatibility shortcut.
- Compile every runnable code sample. Mark the source/feature status when
  examples cannot be run against the selected toolchain.

## Verification

The migration must prove: the manifest has unique ids and valid prerequisite
edges; each lesson conforms to the template; generated catalog metadata equals
the authored front matter; every executable `start.bd` and `solution.bd`
passes its specified real CLI command; and the Learn TypeScript tests/build
consume the generated catalog. This is content and toolchain verification,
not a TDD workflow.
