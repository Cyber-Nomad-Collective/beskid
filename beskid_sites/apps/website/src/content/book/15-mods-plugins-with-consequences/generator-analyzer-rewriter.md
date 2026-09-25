---
title: "Generator, Analyzer, Rewriter"
description: What each mod contract may change about the program, the order they run in, and what happens when two mods disagree.
tableOfContents: true
---

Three roles operate on one merged program, in a fixed order, and the host's merge step is bounded and fails closed rather than guessing.

## Generator

A `Generator` emits typed AST fragments, never source text. The host merges what every scheduled generator produced, re-parses, and repeats up to `maxGeneratorRounds`, so a generator that depends on another generator's output gets a second pass instead of a missing symbol. This is incremental by default: a generator that regenerates the universe on every keystroke is a generator that made the language server correct and useless at the same time. See [Typed emitter and transforms](/platform-spec/compiler/compiler-mods/typed-emitter-and-transforms/).

## Analyzer

An `Analyzer` runs after generation settles and a semantic snapshot exists, over host code and generated code together. There is no "generated code is second class" carve-out; by the time analysis runs it is all one program, checked the same way. An analyzer emits diagnostics and may register rewrites as fixes, but it does not throw into the compiler process: a rewrite the host cannot apply fails closed with an E18xx diagnostic instead of taking the build down with it. See [Analysis, query, and diagnostics facades](/platform-spec/compiler/compiler-mods/analysis-query-diagnostics-facade/).

## Rewriter

```beskid
pub contract Rewriter<TSourceNode, TTargetNode> {
    Result<TTargetNode, FixError> Rewrite(TSourceNode sourceNode);
}
```

A `Rewriter` replaces any valid node with any other valid typed node, which is real power over the program and is scoped exactly as tightly as that sentence implies. Two mods that fight over the same node do not get merged by vibes: the host picks a documented winner or fails, and [Incremental scheduling and determinism](/platform-spec/compiler/compiler-mods/incremental-scheduling-determinism/) is where that resolution order is written down. Read it before betting a build on undocumented merge luck.
