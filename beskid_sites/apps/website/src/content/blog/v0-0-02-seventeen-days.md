---
title: "Seventeen Days of Pecan: What We Built and What We Threw Away"
description: "18 February to 5 March 2026. The furious prototype period that established parsing, HIR, resolution, diagnostics, and GC research — and then threw half of it out when Beskid was born."
date: 2026-02-28
blogStatus: released
release: v0.0
---

The Pecan prototype did not have a plan. It had a window. Seventeen days between the first commit and the rename to Beskid — compressed, obsessive, and structured only by the question: *what would a language need to be to make the form renderer problem trivial?*

This is the day-by-day log of what we built, what we learned, and what we threw away before it shipped. If you are building a compiler from scratch, consider this a reconnaissance report.

## Days 1–3: Parsing and the shape of syntax

The first commit on 18 February 2026 was a Cargo workspace and a handwritten parser. No parser generator, no grammar DSL — just recursive descent and a lot of `match` statements. The goal was not to finalize syntax. The goal was to *feel* what it was like to read Beskid source text and produce a tree.

By the end of day 3 we had a lexer, a parser, and a rough AST. The syntax was C-family with some Rust inflection: curly braces, `fn` for functions, `let` for bindings. Nothing revolutionary. That was the point. Syntax should not be the novel part of a language; it should be the comfortable hallway you walk through to reach the interesting rooms.

The real discovery was the HIR — the high-level intermediate representation. We knew from the start that we wanted a staged pipeline: parse → HIR → resolve → lower. The HIR sat between the AST (too close to syntax) and the MIR (too close to codegen). It was the "what does this program *mean*" layer. Getting the HIR right in those first three days — even in its embryonic form — set the architecture for everything that followed.

## Days 4–6: Resolution and the diagnostic discipline

Name resolution is where compilers earn their keep. A parser can be wrong and still produce a tree; resolution must decide what every identifier points to, and it must be correct about it.

We built module graphs, local scopes, and a simple import resolver. The first diagnostic codes appeared: E1806, E1807, E1809 — attribute target validation errors. The numbering was arbitrary (18 was the day, 06/07/09 were the error indices), but the *discipline* was intentional. Every diagnostic got a code, a span, and a severity. No "error on line 1." No "something went wrong." If the compiler could not understand your program, it would tell you *exactly* what it could not understand, *exactly* where, and *exactly* why.

This discipline now anchors the [Diagnostic Code Registry](/platform-spec/compiler/semantic-pipeline/diagnostic-code-registry/). Every diagnostic in the Beskid compiler — parsing, resolution, type checking, lowering, codegen — follows the pattern established in that three-day sprint. Build the infrastructure early, even when the language is too small to need it. You will not regret it.

## Days 7–9: GC-arena and the runtime question

We spent three days on garbage collection research. Specifically: the `gc-arena` crate, an experimental Rust library for GC-managed memory regions. We kicked the tires on allocation strategies, traced some object graphs, and asked the hard question: *do we need a GC, and if so, what kind?*

The answer, after three days, was: we don't know yet, and we are not going to pretend we do. This was a pivotal non-decision. The project's default stance toward runtime questions became: try, learn, document, retreat. No vaporware GC. No "we'll figure it out later" hand-waving. Just honest notes about what we explored and where the boundaries of our knowledge sat. Five releases later, the runtime architecture is still evolving — but it has never been a lie.

## Days 10–12: Interop and builtins

The first builtins: `SYM_SYS_PRINT`, `SYM_SYS_PRINTLN`, `SYM_STR_LEN`. Three symbols that bridged language space and host space. The dispatch mechanism was crude — a match on symbol ID that called a Rust function — but it established the pattern: the compiler does not implement `print`. The compiler knows the *signature* of `print` and emits a call that the runtime resolves.

If you look at today's [ABI builtins authority](/platform-spec/execution/abi-and-host/builtins-and-symbols/adr/0003-builtin-specs-sole-clif-source/), you can trace the Pecan-era dispatch table through every iteration. The symbol IDs changed. The mechanism matured. But the boundary — compiler verifies, runtime implements — has held since day 10.

## Days 13–15: pecan_lsp and metaprogramming dreams

Two experiments that died. The first: `pecan_lsp`, an in-process Language Server Protocol implementation that we wired directly into the compiler crate. It worked — barely — for hover information on local variables. But the architecture was wrong. Tying the LSP to compiler internals meant that every refactor of the compiler risked breaking editor integration. When Beskid shipped its proper LSP in a later release, it did so through a stable protocol boundary, not a crate dependency.

The second: Stage-8 metaprogramming — macros, code generation, compile-time reflection. We built a prototype that could walk HIR nodes and emit new HIR nodes at compile time. It was powerful and terrifying. The metaprogramming model was rebuilt from scratch in a later release, with strict hygiene rules and a much narrower surface area. The Pecan prototype taught us what *not* to build.

## Days 16–17: The manifest and the rename

`project.pn` — the Pecan manifest format. A TOML-like file that described project structure, dependencies, and compiler flags. It lasted exactly two days before the rename to Beskid consigned it to the archive. Its successor, `Project.proj`, learned from every mistake: stricter schema, explicit versioning, and a file name that could not be confused with a nut.

On 26 February 2026, the rename commit landed: "Rename project from Pecan to Beskid across all documentation and workspace configuration." Seventeen days of identity crisis resolved in one commit message. The name Pecan had been a placeholder that overstayed. Beskid was a statement. But that is [its own story](/blog/v0-0-03-naming-beskid/).

## What survived and what didn't

| What survived | What died |
|---|---|
| Staged analysis: parse → HIR → resolve → lower | `pecan_lsp` (replaced by proper LSP later) |
| Diagnostic discipline: codes, spans, severity | `project.pn` manifest (replaced by `Project.proj`) |
| Query-style traversal for semantic facts | Stage-8 metaprogramming (rebuilt from scratch) |
| Compiler-as-submodule architecture | In-repo Cargo workspace (moved to standalone compiler repo) |
| Builtin dispatch: compiler verifies, runtime implements | The name "Pecan" |

Seventeen days. A compiler that could parse, resolve, and diagnose — but could not compile itself. A runtime architecture that was honest about what it did not know. A discipline of staged analysis that every release since has extended but never abandoned. And half of it thrown away before it shipped, because the prototype's job is not to survive. It is to find the boundaries.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.0/version.json) &mdash; [compiler handoff](https://github.com/Cyber-Nomad-Collective/compiler/commit/dd75bff)
