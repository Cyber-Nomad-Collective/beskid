---
title: "Mod SDK"
description: The compiler-sdk package, its Collector/Generator/Analyzer/Rewriter contracts, the Beskid.Syntax mirror, and where the Rust host areas live.
tableOfContents: true
---

`compiler-sdk` is the Beskid-side API mods are written against: contracts and `Beskid.Syntax` operations, not string templates. Full normative text is under [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/).

Five contracts make up the surface. `Collector` declares what a mod instance's scope narrows to. `Generator` contributes typed AST incrementally. `Analyzer` runs on the merged program and emits diagnostics plus rewrite fixes. `AttributeGenerator` exports attribute declarations, the shape a serialization mod uses. And `Rewriter` is generic over the node types it replaces, straight out of `Beskid/Compiler/Collect.bd`:

```beskid
pub contract Rewriter<TSourceNode, TTargetNode> {
    Result<TTargetNode, FixError> Rewrite(TSourceNode sourceNode);
}
```

It is worth noticing that the mod SDK's own contracts are ordinary generic contracts, the same feature chapter 09 covers for user code. There is no separate compiler-only contract form.

## Beskid.Syntax

`Node` is a contract, and traversal happens through `NodeRef`, a `{ syntaxGenerationId, nodeId }` pair rather than a live pointer, so a reference from one generation cannot dangle into the next. `Beskid.Compiler.Query` and its fluent DSL, `Select`, `WhereKind`, `Replace`, and the rest, query and edit the typed tree. There is no source-text emission: a mod builds trees, the host merges them, and the merged program is re-parsed under a bounded number of rounds.

The mirror itself comes from `beskid_ast_reflect_gen`. The Rust AST is canonical and the SDK sources are generated from it rather than hand-duplicated, so a grammar change that does not update the mirror is a build failure for mod authors instead of a silent drift into reading garbage.

## Where the Rust side lives

Implementation specs for the host side sit under [Compiler mods](/platform-spec/compiler/compiler-mods/): the [mod host bridge](/platform-spec/compiler/compiler-mods/mod-host-bridge/), [syntax domain model generation](/platform-spec/compiler/compiler-mods/syntax-domain-model-generation/), and [incremental scheduling and determinism](/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/).
