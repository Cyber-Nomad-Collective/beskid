---
title: "Language law vs implementation"
description: language-meta owns user-visible semantics; compiler, execution, tooling, and core-library realize them.
tableOfContents: true
---

Ask: *"What does valid Beskid code mean?"* → **[Language meta](/docs/standard/capabilities/taxonomy--language-meta/)**.

Ask: *"Which crate phase does that?"* → **[Compiler](/docs/standard/capabilities/taxonomy--compiler/)**, **[Execution](/docs/standard/capabilities/taxonomy--execution/)**, **[Core library](/docs/standard/capabilities/taxonomy--core-library/)**, **[Tooling](/docs/standard/capabilities/taxonomy--tooling/)**.

## Split

| Concern | Owning surface | Realization |
| --- | --- | --- |
| Syntax, types, contracts, memory, spawn | language-meta | `beskid_analysis`, `beskid_codegen` |
| Manifests, CLI commands, LSP UX | tooling | `beskid_cli`, `beskid_lsp` |
| Runtime ABI, scheduler, GC | execution | `beskid_engine`, `beskid_abi` |
| Standard library API | core-library | `corelib` packages in `compiler/corelib` |

Implementation domains **defer** with `relatedTopics`; they do not redefine normative tables copied from language-meta ([Spec authority](/docs/standard/capabilities/community--spec-maintenance--spec-authority-and-decisions/)).

## Example: spawn

- **Law:** [Fibers and spawn](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/)
- **Lowering:** [Fiber scheduler and stacks](/docs/standard/capabilities/execution--runtime--fiber-scheduler-and-stacks/)
- **API:** [Concurrency package](/docs/standard/capabilities/core-library--concurrency--concurrency-package/)

## Example: `beskid test`

- **Law:** [Testing](/docs/standard/capabilities/language-meta--contracts-and-effects--testing/)
- **CLI:** [Build / analyze / run contract](/docs/standard/capabilities/tooling--cli--build-analyze-run-contract/)

## Next

[Proposed vs Standard](/book/12-the-normative-bible/proposed-vs-standard/)
