---
title: "One Compiler, Two Faces: Why the LSP Needs a Different View of Your Program Than Codegen Does"
description: "The LSP wants syntax facts. Codegen wants lowering. They disagree on what the AST should look like. The syntax facade is how Beskid gives both of them what they need without duplicating the compiler."
date: 2026-07-21
blogStatus: released
release: Compiler
---

import { BlogIndex } from '../../../components/BlogIndex.astro';

Here's a problem that every language with an LSP eventually hits: the AST that's good for codegen is terrible for editor tooling.

Codegen wants a fully typed, fully resolved, fully lowered AST. Every name resolved to a definition. Every type inferred and checked. Every expression lowered to its runtime representation. The compiler can take its time — it has the whole file, it can do multiple passes, it can build up the full program graph.

The LSP wants the opposite. The user is still typing. There are unresolved names — the symbol they're about to complete doesn't exist yet. The cursor position matters more than the full tree. And latency is measured in milliseconds, not seconds. You can't run full codegen on every keystroke.

The syntax facade is how Beskid solves this: one compiler, two views of the program.

## The five commits

The facade didn't appear fully formed. It accreted across five commits in July 2026:

- **[`dc7ec5f5`](https://github.com/opencp/beskid/commit/dc7ec5f5)** — "LSP syntax documentation fact migration." The first crack: documentation facts (hover text, doc comments) moved from a separate LSP code path into the shared syntax-fact system.
- **[`cd303402`](https://github.com/opencp/beskid/commit/cd303402)** — "LSP diagnostics syntax-fact migration." Diagnostics followed. Before this, the LSP had its own error-reporting logic that duplicated the compiler's. After: same diagnostic facts, different consumer.
- **[`2ac36288`](https://github.com/opencp/beskid/commit/2ac36288)** — "merge LSP syntax facts." The unification commit — all the separately-migrated fact types came together under one facade API.
- **[`444cfd80`](https://github.com/opencp/beskid/commit/444cfd80)** — "ForIteratorFact + LSP syntax intellisense." A specific fact type for for-loops, plus the intellisense integration that made completions work from syntax facts.
- **[`840c8ebc`](https://github.com/opencp/beskid/commit/840c8ebc)** — "LSP syntax intellisense." The intellisense system fully operational: completions, hover, go-to-definition, all powered by the syntax facade rather than a fully-resolved AST.

## The problem: two consumers, one program representation

Imagine the user types:

```beskid
let x = foo.ba|
```

The cursor is at `|`. The LSP needs to suggest completions: `bar`, `baz`, `bat`. To do that, it needs to know that `foo` has a type with fields. But the code doesn't compile — `foo` might be unresolved, the type inference might be incomplete, the expression isn't finished.

If the LSP waits for full type resolution, the user waits 500ms and gets nothing. If the LSP has its own type-resolution code, it diverges from the compiler and produces wrong completions. Neither option works.

The syntax facade offers a third path. It produces **syntax facts** — partial, best-effort information about the program structure that's cheap to compute and sufficient for editor tooling. A `ForIteratorFact` says "this is a for loop and this is its iterator variable" without lowering the loop body. A `CompletionFact` says "at this position, these names are in scope" without resolving every type. A `DiagnosticFact` says "this token is wrong" using the same logic as the compiler, just computed incrementally.

## The facade pattern

The key insight: the LSP doesn't need the full AST. It needs a **view** of the AST that answers specific questions quickly.

The syntax facade sits between the parser output and the two consumers. Codegen takes the full path: parse → resolve → typecheck → lower → emit. The LSP takes the facade path: parse → syntax facts → answer queries. Both start from the same parse tree. Both use the same name resolution logic (cached, incremental). But the facade stops before the expensive passes — type inference, lowering, optimization — because the LSP doesn't need them.

This isn't duplication. It's stratification. The compiler has layers, and different consumers can stop at different layers. The syntax facade is the layer boundary.

## ForIteratorFact

`ForIteratorFact` is the canonical example. A for loop in Beskid:

```beskid
for item in collection {
    process(item);
}
```

Codegen needs to know: what type is `collection`? Does it implement `Iterable`? What's the element type? How is the loop lowered — to a while loop with an iterator? To a for-in-native? The answers depend on full type resolution.

The LSP needs to know much less: this is a for loop, `item` is the loop variable, `collection` is the iterated expression. With those facts, the LSP can provide completions inside the loop body (the loop variable is in scope), hover types for `item` (it's the element type of whatever `collection` is), and diagnostics if the syntax is wrong (missing `in`, missing body).

`ForIteratorFact` captures exactly that: the structural facts about a for loop that don't depend on type resolution. The LSP reads the fact. Codegen ignores it and does the full lowering. Both are right.

## The diagnostic migration

Before the facade, LSP diagnostics were a mess. The compiler had error-reporting code. The LSP had its own error-reporting code. They reported different errors in different formats. Fixing a diagnostic bug meant fixing it in two places — and usually only one got fixed.

The migration in `cd303402` and `dc7ec5f5` eliminated the duplication. Now both the CLI and the LSP consume the same `DiagnosticFact` stream from the compiler. The difference is timing: the CLI gets all diagnostics after a full compile; the LSP gets incremental diagnostics as the user types, using the syntax facade to avoid running full typechecking on incomplete code.

Same facts, different resolution. No duplication, no divergence.

## The Book chapter

The Book chapter ["From source to runs"](https://opencp.org/book/compiler/from-source-to-runs) covers the AST facts graph in detail — how facts flow from parsing through resolution through typechecking, and how different consumers can tap into the graph at different stages. The syntax facade is the LSP's entry point into that graph: early enough to be fast, deep enough to be useful.

## The principle

An LSP is not a convenience. It is a second compiler consumer with different latency requirements, different completeness requirements, and different query patterns. Treating it as an afterthought — bolting it onto a compiler that was designed for batch codegen — produces a slow, incomplete, divergent editor experience.

The facade pattern is how you serve both consumers without forking the codebase. One compiler, two faces. Codegen gets the deep view. The LSP gets the fast view. Both are real. Both are the compiler. The difference is where they stop.

<BlogIndex />
