---
title: "Appendix: Spec Map"
description: Cross-reference book chapters to normative platform-spec, book reference, and compiler crates.
tableOfContents: true
---

Use this matrix when you know *what* you want to do in the book and need the *law* (platform-spec), a *workflow guide* (`book/reference/`), or the *Rust crate* that implements it.

| Ch | Book chapter | Primary platform-spec | Book reference | Compiler / service crates |
| --- | --- | --- | --- | --- |
| 01 | [It works on my machine](/book/01-it-works-on-my-machine/) | [Tooling / CLI](/platform-spec/tooling/cli/), [Build, analyze, run](/platform-spec/tooling/cli/build-analyze-run-contract/) | [Downloads](/downloads/), [CLI](/book/reference/cli/) | `beskid_cli` |
| 02 | [PATH not found — tooling anyway](/book/02-path-not-found-tooling-anyway/) | [LSP](/platform-spec/tooling/lsp/), [VS Code extension](/platform-spec/tooling/vscode-extension/) | [LSP](/book/reference/lsp/), [CLI](/book/reference/cli/) | `beskid_lsp`, `beskid_cli` |
| 03 | [Project.proj or it didn't happen](/book/03-project-proj-or-it-didnt-happen/) | [Project manifest](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/), [Scaffolding](/platform-spec/tooling/project-scaffolding/) | [Projects](/book/reference/projects/) | `beskid_analysis` (resolution) |
| 04 | [Where does this file go?](/book/04-where-does-this-file-go/) | [Program structure](/platform-spec/language-meta/program-structure/), [Modules and visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/) | [Project resolution](/book/reference/projects/resolution/) | `beskid_analysis` |
| 05 | [Names nobody agreed on](/book/05-names-nobody-agreed-on/) | [Name resolution](/platform-spec/language-meta/program-structure/name-resolution/) | [Semantic analysis](/book/reference/analysis/) | `beskid_analysis` |
| 06 | [Monorepo as coping mechanism](/book/06-monorepo-as-coping-mechanism/) | [Workspace and lock contracts](/platform-spec/tooling/manifests-and-lockfiles/workspace-and-lock-contracts/) | [Workspace monorepo](/book/reference/workspace-monorepo/) | `beskid_analysis` |
| 07 | [The compiler is not your therapist](/book/07-compiler-is-not-your-therapist/) | [Surface syntax](/platform-spec/language-meta/surface-syntax/), [Type system](/platform-spec/language-meta/type-system/) | [Semantic rules](/book/reference/analysis/semantic-rules.md) | `beskid_analysis` (parse/semantic) |
| 08 | [Green tests, red production](/book/08-green-tests-red-production/) | [Contracts and effects / testing](/platform-spec/language-meta/contracts-and-effects/) | [Testing](/book/reference/testing/) | `beskid_cli` (`test`), `beskid_tests` |
| 09 | [Contracts, effects, and polite threats](/book/09-contracts-effects-and-polite-threats/) | [Contracts and effects](/platform-spec/language-meta/contracts-and-effects/) | [Semantic rules](/book/reference/analysis/semantic-rules.md) | `beskid_analysis` |
| 10 | [Memory without another billion-dollar mistake](/book/10-memory-without-billion-dollar-mistake/) | [Memory model](/platform-spec/language-meta/memory-model/) | — | `beskid_analysis`, `beskid_runtime` |
| 11 | [Fibers: cheaper than threads](/book/11-fibers-cheaper-than-threads/) | [Evaluation / fibers](/platform-spec/language-meta/evaluation/fibers-and-spawn/), [Execution / channels](/platform-spec/execution/runtime/channels-and-synchronization/) | — | `beskid_runtime`, corelib concurrency |
| 12 | [The normative bible](/book/12-the-normative-bible/) | [Community / spec maintenance](/platform-spec/community/spec-maintenance/) | [Interop canonical map](/book/reference/contributing/interop-platform-spec-canonical-map.md) | — |
| 13 | [Reading the law](/book/13-reading-the-law/) | [Platform specification](/platform-spec/) (all domains) | [Architecture graphs](/book/reference/contributing/architecture-graphs.mdx) | [Crate-to-spec anchors](/platform-spec/compiler/implementation-map/crate-to-spec-anchors/) |
| 14 | [From source to something that runs](/book/14-from-source-to-runs/) | [Build pipeline](/platform-spec/compiler/build-pipeline/), [Codegen and IR](/platform-spec/compiler/codegen-and-ir/) | [CLI commands](/book/reference/cli/command-reference.md) | `beskid_analysis`, `beskid_codegen`, `beskid_engine`, `beskid_aot`, `beskid_pipeline` |
| 15 | [Mods: plugins with consequences](/book/15-mods-plugins-with-consequences/) | [Compiler mods](/platform-spec/compiler/compiler-mods/), [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/) | — | `beskid_mod`, AOT host |
| 16 | [Corelib: batteries with opinions](/book/16-corelib-batteries-with-opinions/) | [Core library](/platform-spec/core-library/), [api.json](/platform-spec/tooling/cli/api-json-contract/) | [corelib command](/book/reference/cli/commands/corelib.md) | `beskid_cli`, `compiler/corelib` |
| 17 | [Execution: ABI, host, and runtime](/book/17-execution-abi-host-runtime/) | [Execution](/platform-spec/execution/), [Conformance](/platform-spec/compiler/conformance/) | — | `beskid_abi`, `beskid_runtime` |
| 18 | [Packages without npm trauma](/book/18-packages-without-npm-trauma/) | [Registry client](/platform-spec/tooling/registry-client/), [Foreign library import](/platform-spec/tooling/foreign-library-import/) | [Publish first package](/book/reference/publish-first-package/), [pckg](/book/reference/cli/commands/pckg.md) | `beskid_pckg`, `pckg` service |
| 19 | [Public API that survives review](/book/19-public-api-that-survives-review/) | [Modules and visibility](/platform-spec/language-meta/program-structure/modules-and-visibility/), [Code style and naming](/platform-spec/language-meta/program-structure/code-style-and-naming/) | — | `beskid_analysis` |
| 20 | [/// comments that are not lies](/book/20-doc-comments-that-are-not-lies/) | [Documentation comments](/platform-spec/language-meta/surface-syntax/documentation-comments/), [api.json](/platform-spec/tooling/cli/api-json-contract/) | [doc command](/book/reference/cli/commands/doc.md) | `beskid_analysis`, `beskid_cli` |
| 21 | [FFI and forbidden friendships](/book/21-ffi-and-forbidden-friendships/) | [Interop](/platform-spec/language-meta/interop/), [Extern dispatch](/platform-spec/execution/abi-and-host/extern-dispatch-and-policy/) | — | `beskid_abi`, `beskid_runtime` |
| 22 | [So you want to contribute](/book/22-so-you-want-to-contribute/) | [Spec authority](/platform-spec/community/spec-maintenance/spec-authority-and-decisions/), [Release policy](/platform-spec/community/spec-maintenance/release-and-versioning-policy/) | [GitHub doc feedback](/book/reference/contributing/github-doc-feedback.md) | Superrepo + submodules |

## Domain quick links

| Domain | Hub |
| --- | --- |
| Language meta | [/platform-spec/language-meta/](/platform-spec/language-meta/) |
| Compiler | [/platform-spec/compiler/](/platform-spec/compiler/) |
| Execution | [/platform-spec/execution/](/platform-spec/execution/) |
| Core library | [/platform-spec/core-library/](/platform-spec/core-library/) |
| Tooling | [/platform-spec/tooling/](/platform-spec/tooling/) |
| Community | [/platform-spec/community/](/platform-spec/community/) |

For full language indexing, see [Beskid Specification](/platform-spec/language-meta/).
