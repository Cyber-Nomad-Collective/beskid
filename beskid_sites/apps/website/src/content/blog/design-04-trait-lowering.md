---
title: "Trait-Based Lowering and the Node-by-Node Roadmap That Shaped Everything"
description: "February 2026. Before Beskid had a compiler, it had an architecture decision: trait-based lowering instead of a visitor pattern. The node-by-node implementation roadmap got retired. The trait-based architecture is still here."
date: 2026-02-23
blogStatus: released
release: Design
---

Before Beskid had a compiler that could parse a single line of source code, it had an architecture decision that would define every lowering pass written since. That decision was trait-based lowering. The alternative was the visitor pattern. The choice was made in week one. Every compiler commit since has been made possible by it.

## The fork in the road

The visitor pattern is the default answer for compiler pipelines. You define one big function — `visit(node: AstNode)` — that pattern-matches on every AST node kind. A hundred node kinds, a hundred match arms. Adding a new node kind means editing the visitor. Adding a new lowering pass means writing a new visitor. The pattern works. Every compiler textbook uses it.

The trait-based alternative flips the responsibility. Instead of one function that knows about every node, each AST node implements a `Lowerable` trait. The trait defines a method — `lower(&self, ctx: &mut LowerCtx) -> Ir` — and each node kind provides its own implementation. A lowering pass is a function that calls `node.lower(ctx)` and trusts the trait dispatch to do the right thing.

The visitor is simpler to start. One file, one function, all the logic visible in one place. Trait-based is more work up front — every node kind needs a trait implementation, even if half of them are mechanical. But the payoff is on the other side of the first hundred node kinds. When a new AST node lands, the visitor author has to find every visitor in the codebase and add a new match arm. The trait author implements `Lowerable` once and every lowering pass gets it for free. New lowering pass, same deal: implement the trait methods, no central dispatch to edit.

Besid picked trait-based from day one. Commit `7b35a52f` landed the trait-based lowering architecture alongside a node-by-node implementation roadmap. Commit `c6e0d5a3` updated Plan.md shortly after. The roadmap and the architecture were sibling artifacts — one said "here is how we will build this," the other said "here is what we will build." They didn't survive together long.

## The roadmap that retired itself

The node-by-node implementation roadmap was a detailed plan to implement lowering one AST node at a time. Each node kind had a checklist item: parse it, lower it, verify it against the spec, check the box. The roadmap was thorough. It was methodical. It was also irrelevant within weeks of being written.

The trait-based architecture made it irrelevant. Once the `Lowerable` trait was implemented for the first few node kinds — literals, binary expressions, let bindings — the rest followed mechanically. The pattern was proven. Each new node kind was the same shape: implement the trait, add a test, move on. The roadmap's granularity — "implement lowering for ForExpression," "implement lowering for MatchExpression" — assumed each node kind was a distinct engineering task. Under the trait-based architecture, they were catalog entries.

The roadmap wasn't wrong. It was a planning artifact from before the architecture was proven. Its retirement — it was removed from Plan.md, not replaced — was the architecture being proven. You don't need a checklist for things that follow mechanically from the design.

## What trait-based lowering actually does

The `Lowerable` trait is the spine of the compiler pipeline. Every lowering pass — HIR construction, type resolution, codegen — calls `lower()` on AST nodes. The trait dispatch means the lowering pass doesn't know which node kind it's lowering. It doesn't need to. The node knows how to lower itself.

This is the inversion that makes the compiler extensible. When v0.3 added fibers, the `SpawnExpression` node implemented `Lowerable` and every lowering pass could lower spawns. When v0.4 added capturing closures, the `ClosureExpression` node implemented `Lowerable` and the closure environment contract flowed through the same dispatch. No visitor was edited. No central pattern match grew a new arm. The trait dispatch absorbed the change.

The trait also enforces a contract between the AST and the lowering pipeline. Every node must produce IR of the correct shape. Every node must handle the lowering context — the symbol table, the type environment, the provenance chain. The compiler doesn't trust that the lowering pass will do the right thing for each node kind. The compiler trusts that the node kind's trait implementation will do the right thing, and the lowering pass will call it.

## The half-life of architecture decisions

Architecture decisions from the prototype phase have half-lives measured in years. The trait-based lowering decision was made when Beskid couldn't compile a hello world. It has survived every compiler refactor since — the type system refactor, the ABI version bumps, the ISLE native runtime migration. Each of those refactors changed what `lower()` produces. None of them changed the fact that `lower()` is called through a trait.

Cross-reference the Book chapter "From source to runs" — the semantic pipeline section. The lowering pipeline diagram in that chapter is the trait-based architecture in motion. The arrows between passes are trait method calls. The IR transformations are trait implementations. The pipeline is not a visitor walking a tree. It is a chain of trait dispatches, each one transforming the IR one step closer to machine code.

The roadmap is gone. The architecture is still here. Architecture decisions from week one cast shadows across years. The trait-based lowering decision was made in week one. Choose your week-one decisions carefully. They will outlast every plan you write after them.
