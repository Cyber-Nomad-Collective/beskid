---
title: "Language law vs implementation"
description: language-meta owns user-visible semantics; compiler, execution, tooling, and core-library realize them.
tableOfContents: true
---

Ask: *"What does valid Beskid code mean?"* → **[Language meta](/platform-spec/language-meta/)**.

Ask: *"Which crate phase does that?"* → **[Compiler](/platform-spec/compiler/)**, **[Execution](/platform-spec/execution/)**, **[Core library](/platform-spec/core-library/)**, **[Tooling](/platform-spec/tooling/)**.

## Split

| Concern | Owning surface | Realization |
| --- | --- | --- |
| Syntax, types, contracts, memory, spawn | language-meta | `beskid_analysis`, `beskid_codegen` |
| Manifests, CLI commands, LSP UX | tooling | `beskid_cli`, `beskid_lsp` |
| Runtime ABI, scheduler, GC | execution | `beskid_runtime`, `beskid_engine`, `beskid_abi` |
| Standard library API | core-library | `corelib` packages in `compiler/corelib` |

Implementation domains **defer** with `relatedTopics`—they do not redefine normative tables copied from language-meta ([Spec authority](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/)).

## Example: spawn

- **Law:** [Fibers and spawn](/platform-spec/language-meta/evaluation/fibers-and-spawn/)
- **Lowering:** [Fiber scheduler and stacks](/platform-spec/execution/runtime/fiber-scheduler-and-stacks/)
- **API:** [Concurrency package](/platform-spec/core-library/concurrency/concurrency-package/)

## Example: `beskid test`

- **Law:** [Testing](/platform-spec/language-meta/contracts-and-effects/testing/)
- **CLI:** [Build / analyze / run contract](/platform-spec/tooling/cli/build-analyze-run-contract/)

## Next

[Proposed vs Standard](/book/12-the-normative-bible/proposed-vs-standard/)
