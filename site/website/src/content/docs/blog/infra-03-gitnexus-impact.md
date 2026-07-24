---
title: "66,413 Symbols, 136,109 Relationships: The Graph Explorer That Knows What Breaks When You Change This Function"
description: "Beskid added GitNexus — a code intelligence engine that indexes every symbol, every relationship, and every execution flow. Before any edit, run impact analysis. Before any commit, run changed-scope review. The graph doesn't guess. It traces."
date: 2026-07-17
blogStatus: released
release: Infrastructure
---

A codebase with 66,413 symbols and 136,109 relationships is a codebase nobody holds in their head. You can hold a module in your head. You can hold a subsystem in your head. You cannot hold the full transitive closure of every function call, every type dependency, every trait implementation, and every execution flow in a compiler, a runtime, a platform spec, and three websites. The graph holds it. GitNexus is the graph.

The commits: `063eac71` (setup for git nexus ingest), `02dc5a02` (GitNexus changed-scope and whole-branch review CYB-43), `b74068b5` (CYB-43 branch review + platform delivery pnpm cutover repairs), `449b6929` (finalize CYB-43 whole-branch review with resolved findings). Four commits. One graph engine. Every symbol in the monorepo now has a node. Every relationship has an edge. Every edit has a blast radius.

## What GitNexus indexes

The numbers are not estimates. They are counts from the ingest run: 66,413 symbols and 136,109 relationships. The symbols include functions (every `fn` in the compiler, runtime, and tooling), types (structs, enums, type aliases, trait definitions), methods (impl block functions with receiver parameters), and variables (locals, statics, constants). The relationships include calls (function A calls function B), imports (module X imports symbol Y from module Z), type-of (variable V has type T), implements (type T implements trait Tr), and contains (module M contains symbol S).

Beyond the static graph, GitNexus indexes 300 execution flows: process-grouped traces from entry point to output. An execution flow is not a call graph — it's a path through the call graph for a specific input. The flow for compiling a `for` expression is different from the flow for compiling a `match` expression, even though both go through the same lowering pass. GitNexus traces both. The execution flows are grouped by process: compilation, runtime GC cycle, spec validation, website build. Each process has entry points and outputs. GitNexus knows the paths between them.

## The changed-scope review

The primary consumer of GitNexus is the changed-scope review. Before merging a branch, GitNexus compares it against main and reports every symbol that changed, every execution flow that was affected, and every call chain that was modified. The report is not a diff. A diff tells you which lines changed. GitNexus tells you what those lines mean.

A function with 200 callers that changed gets a HIGH risk flag. The flag doesn't mean the change is wrong. It means the blast radius is large. A type change that affects three execution flows gets a MEDIUM. A comment edit gets LOW — zero symbols changed, zero relationships modified, zero execution flows affected, zero risk.

The risk classification is mechanical. GitNexus doesn't judge the quality of the change. It judges the quantity of the impact. A one-line fix in a function called from every lowering pass is HIGH risk because the impact surface is the entire compiler. A 500-line refactor in a module with no callers is LOW risk because nothing depends on it. The classification forces the question: is this HIGH-risk change justified? Sometimes it is — ABI version bumps are always HIGH risk and sometimes necessary. Sometimes it isn't — and the review catches a change that should have been scoped smaller.

## The blast radius before every edit

The Claude agents that work on the Beskid codebase are instructed to run impact analysis before touching any symbol. The instruction is not "be careful." It is "query GitNexus for the symbol's callers, callees, and execution flows, and report the blast radius before you make the edit."

This flips the default from optimistic to informed. Without impact analysis, the default assumption is "this change is local, it probably doesn't affect anything." With impact analysis, the agent knows before it edits whether the function it's about to touch is a leaf with two callers or a root with two hundred. The edit is the same. The awareness is different.

The blog post you are reading had its own changes verified by `detect_changes()` before commit — the same impact analysis pipeline that runs on compiler code. The meta is intentional. The tool that verifies the codebase also verifies the documentation of the tool. Eat your own dogfood, then write a blog post about how it tastes.

## Grep versus the graph

Grep finds text. GitNexus finds relationships. The difference is not academic. You can grep for every call to `lower_source` and find every direct call site — the source files where the string `lower_source` appears followed by an open paren. You will miss the indirect call through a trait dispatch. You will miss the call where `lower_source` is stored in a function pointer and called later. You will miss the call in a macro expansion that doesn't exist in the source text.

GitNexus traces the dispatch. The trait implementation edge in the graph connects `Lowerable::lower` to every concrete `lower` method. The call edge connects every lowering pass to `Lowerable::lower`. The transitive closure — every lowering pass calling every concrete `lower` method through the trait — is in the graph. Grep can't see it because grep doesn't understand traits. GitNexus does.

The same applies to types, imports, and execution flows. Grep can find every file that imports `Result`. It cannot tell you which of those imports are used in functions that are called from the GC trace path. GitNexus can — it walks the import edges, then the call edges, then the execution flow edges, and returns the intersection. The query is "which files importing Result are reachable from the GC trace entry point?" The answer is a list of files. The alternative is reading every one of those files and tracing the call chains by hand.

## Code intelligence as immune system

Code intelligence is not a luxury. It is the immune system for a codebase too large for any one person to hold in their head. The immune system metaphor is precise: GitNexus doesn't prevent bugs, it detects the impact of changes. A change to a widely-called function triggers a HIGH risk flag — the immune system is saying "this change affects many things, verify it carefully." A change to an isolated module triggers LOW — "this change is local, proceed."

Without the immune system, every change has unknown impact. The developer guesses. The reviewer guesses. The CI pipeline tests but tests only cover what tests cover. GitNexus covers the structure — every symbol, every relationship, every execution flow. The structure is not the behavior, but the behavior depends on the structure. Change the structure and you change what behaviors are possible. GitNexus tells you how much structure you changed.

Cross-reference the OpenSpec catalog post (design-03-openspec-catalog.md). The catalog is the immune system for documentation. GitNexus is the immune system for code. Both follow the same trust-to-verify pattern. Both index their domain and detect drift. Both are mechanical — no judgment, just measurement. The catalog says "this spec document changed and the catalog hash doesn't match." GitNexus says "this function changed and 200 callers are affected." Neither says whether the change is good. Both say the change is real and here is its scope.

66,413 symbols. 136,109 relationships. 300 execution flows. Nobody holds that in their head. GitNexus does. The graph doesn't guess. It traces. And before every commit, it answers the only question that matters: what breaks when this changes?

## Provenance

[`063eac71` — setup for git nexus ingest](https://github.com/Cyber-Nomad-Collective/beskid/commit/063eac71) — [`02dc5a02` — GitNexus changed-scope and whole-branch review CYB-43](https://github.com/Cyber-Nomad-Collective/beskid/commit/02dc5a02) — [`449b6929` — finalize CYB-43 whole-branch review with resolved findings](https://github.com/Cyber-Nomad-Collective/beskid/commit/449b6929)
