---
title: "Appendix: Spec Map"
description: Cross-reference book chapters to normative Standard, book reference, and compiler crates.
tableOfContents: true
---

Use this matrix when you know *what* you want to do in the book and need the *law* (the Standard), a *workflow guide* (`book/reference/`), or the *Rust crate* that implements it. The Standard column is authoritative; Book and crate links are explanatory and implementation-traceability aids.

## How to use this map

1. Start with the Book chapter for context and examples.
2. Open the linked Standard capability or hub for requirements and maturity.
3. Use the reference guide for a practical workflow.
4. Follow a crate link only when you need to investigate implementation or conformance evidence.

Do not infer a guarantee from a crate name or a Book summary. If an entry has several standard links, begin with the broader hub and follow the feature that owns the exact question.

| Ch | Book chapter | Primary Standard capability | Book reference | Compiler / service crates |
| --- | --- | --- | --- | --- |
| 01 | [It works on my machine](/book/01-it-works-on-my-machine/) | [Tooling / CLI](/docs/standard/capabilities/taxonomy--tooling--cli/), [Build, analyze, run](/docs/standard/capabilities/tooling--cli--build-analyze-run-contract/) | [Downloads](/downloads/), [CLI](/book/reference/cli/) | `beskid_cli` |
| 02 | [PATH not found: tooling anyway](/book/02-path-not-found-tooling-anyway/) | [LSP](/docs/standard/capabilities/taxonomy--tooling--lsp/), [VS Code extension](/docs/standard/capabilities/taxonomy--tooling--vscode-extension/) | [LSP](/book/reference/lsp/), [CLI](/book/reference/cli/) | `beskid_lsp`, `beskid_cli` |
| 03 | [Project.proj or it didn't happen](/book/03-project-proj-or-it-didnt-happen/) | [Project manifest](/docs/standard/capabilities/tooling--manifests-and-lockfiles--project-manifest-contract/), [Scaffolding](/docs/standard/capabilities/taxonomy--tooling--project-scaffolding/) | [Projects](/book/reference/projects/) | `beskid_analysis` (resolution) |
| 04 | [Where does this file go?](/book/04-where-does-this-file-go/) | [Program structure](/docs/standard/capabilities/taxonomy--language-meta--program-structure/), [Modules and visibility](/docs/standard/capabilities/language-meta--program-structure--modules-and-visibility/) | [Project resolution](/book/reference/projects/resolution/) | `beskid_analysis` |
| 05 | [Names nobody agreed on](/book/05-names-nobody-agreed-on/) | [Name resolution](/docs/standard/capabilities/language-meta--program-structure--name-resolution/) | [Semantic analysis](/book/reference/analysis/) | `beskid_analysis` |
| 06 | [Monorepo as coping mechanism](/book/06-monorepo-as-coping-mechanism/) | [Workspace and lock contracts](/docs/standard/capabilities/tooling--manifests-and-lockfiles--workspace-and-lock-contracts/) | [Workspace monorepo](/book/reference/workspace-monorepo/) | `beskid_analysis` |
| 07 | [The compiler is not your therapist](/book/07-compiler-is-not-your-therapist/) | [Surface syntax](/docs/standard/capabilities/taxonomy--language-meta--surface-syntax/), [Type system](/docs/standard/capabilities/taxonomy--language-meta--type-system/) | [Semantic rules](/book/reference/analysis/semantic-rules.md) | `beskid_analysis` (parse/semantic) |
| 08 | [Green tests, red production](/book/08-green-tests-red-production/) | [Contracts and effects / testing](/docs/standard/capabilities/taxonomy--language-meta--contracts-and-effects/) | [Testing](/book/reference/testing/) | `beskid_cli` (`test`), `beskid_tests` |
| 09 | [Contracts, effects, and polite threats](/book/09-contracts-effects-and-polite-threats/) | [Contracts and effects](/docs/standard/capabilities/taxonomy--language-meta--contracts-and-effects/) | [Semantic rules](/book/reference/analysis/semantic-rules.md) | `beskid_analysis` |
| 10 | [Memory without another billion-dollar mistake](/book/10-memory-without-billion-dollar-mistake/) | [Memory model](/docs/standard/capabilities/taxonomy--language-meta--memory-model/) | N/A | `beskid_analysis`, `beskid_engine` |
| 11 | [Fibers: cheaper than threads](/book/11-fibers-cheaper-than-threads/) | [Evaluation / fibers](/docs/standard/capabilities/language-meta--evaluation--fibers-and-spawn/), [Execution / channels](/docs/standard/capabilities/execution--runtime--channels-and-synchronization/) | N/A | Runtime source in `compiler/runtime/beskid`, corelib concurrency |
| 12 | [The normative bible](/book/12-the-normative-bible/) | [Community / spec maintenance](/docs/standard/capabilities/taxonomy--community--spec-maintenance/) | [Interop Standard map](/book/reference/contributing/interop-platform-spec-canonical-map/) | N/A |
| 13 | [Reading the law](/book/13-reading-the-law/) | [Beskid Standard](/docs/standard/) (all domains) | [Architecture graphs](/book/reference/contributing/architecture-graphs.mdx) | [Crate-to-spec anchors](/docs/standard/capabilities/compiler--implementation-map--crate-to-spec-anchors/) |
| 14 | [From source to something that runs](/book/14-from-source-to-runs/) | [Build pipeline](/docs/standard/capabilities/taxonomy--compiler--build-pipeline/), [Codegen and IR](/docs/standard/capabilities/taxonomy--compiler--codegen-and-ir/) | [CLI commands](/book/reference/cli/command-reference.md) | `beskid_analysis`, `beskid_codegen`, `beskid_engine`, `beskid_aot`, `beskid_pipeline` |
| 15 | [Mods: plugins with consequences](/book/15-mods-plugins-with-consequences/) | [Compiler mods](/docs/standard/capabilities/taxonomy--compiler--compiler-mods/), [Compiler Mod SDK](/docs/standard/capabilities/language-meta--metaprogramming--compiler-mod-sdk/) | N/A | `beskid_mod`, AOT host |
| 16 | [Corelib: batteries with opinions](/book/16-corelib-batteries-with-opinions/) | [Core library](/docs/standard/capabilities/taxonomy--core-library/), [api.json](/docs/standard/capabilities/tooling--cli--api-json-contract/) | [corelib command](/book/reference/cli/commands/corelib.md) | `beskid_cli`, `compiler/corelib` |
| 17 | [Execution: ABI, host, and runtime](/book/17-execution-abi-host-runtime/) | [Execution](/docs/standard/capabilities/taxonomy--execution/), [Conformance](/docs/standard/capabilities/taxonomy--compiler--conformance/) | N/A | `beskid_abi`, `beskid_engine` |
| 18 | [Packages without npm trauma](/book/18-packages-without-npm-trauma/) | [Registry client](/docs/standard/capabilities/taxonomy--tooling--registry-client/), [Foreign library import](/docs/standard/capabilities/taxonomy--tooling--foreign-library-import/) | [Publish first package](/book/reference/publish-first-package/), [pckg](/book/reference/cli/commands/pckg.md) | `beskid_pckg`, `pckg` service |
| 19 | [Public API that survives review](/book/19-public-api-that-survives-review/) | [Modules and visibility](/docs/standard/capabilities/language-meta--program-structure--modules-and-visibility/), [Code style and naming](/docs/standard/capabilities/language-meta--program-structure--code-style-and-naming/) | N/A | `beskid_analysis` |
| 20 | [/// comments that are not lies](/book/20-doc-comments-that-are-not-lies/) | [Documentation comments](/docs/standard/capabilities/language-meta--surface-syntax--documentation-comments/), [api.json](/docs/standard/capabilities/tooling--cli--api-json-contract/) | [doc command](/book/reference/cli/commands/doc.md) | `beskid_analysis`, `beskid_cli` |
| 21 | [FFI and forbidden friendships](/book/21-ffi-and-forbidden-friendships/) | [Interop](/docs/standard/capabilities/taxonomy--language-meta--interop/), [Extern dispatch](/docs/standard/capabilities/execution--abi-and-host--extern-dispatch-and-policy/) | [Interop Standard map](/book/reference/contributing/interop-platform-spec-canonical-map/) | `beskid_abi`, `beskid_codegen` and `beskid_aot` (Rust Glue) |
| 22 | [So you want to contribute](/book/22-so-you-want-to-contribute/) | [Spec authority](/docs/standard/capabilities/community--spec-maintenance--spec-authority-and-decisions/), [Release policy](/docs/standard/capabilities/community--spec-maintenance--release-and-versioning-policy/) | [GitHub doc feedback](/book/reference/contributing/github-doc-feedback.md) | Superrepo + submodules |

## Domain quick links

| Domain | Hub |
| --- | --- |
| Language meta | [language-meta](/docs/standard/capabilities/taxonomy--language-meta/) |
| Compiler | [compiler](/docs/standard/capabilities/taxonomy--compiler/) |
| Execution | [execution](/docs/standard/capabilities/taxonomy--execution/) |
| Core library | [core-library](/docs/standard/capabilities/taxonomy--core-library/) |
| Tooling | [tooling](/docs/standard/capabilities/taxonomy--tooling/) |
| Community | [community](/docs/standard/capabilities/taxonomy--community/) |

For full language indexing, see [Language meta](/docs/standard/capabilities/taxonomy--language-meta/).

For the navigation method behind this table, see [13. Reading the law](/book/13-reading-the-law/). For the authority and maturity model, see [Specification authority and decisions](/docs/standard/capabilities/community--spec-maintenance--spec-authority-and-decisions/).
