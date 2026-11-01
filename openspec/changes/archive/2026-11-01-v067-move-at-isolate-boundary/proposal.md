## Why

The 0.6.2 alias discipline (decision D1) makes every owning name subject to use-after-move rules in all code. The owner rejected this on 2026-10-24: "i did not want the move semantics in beskid". Ordinary code, such as `items.Push("milk");`, must work without `move` and without rebinding. Move semantics are needed only where a value crosses to another isolate. The owner chose option B: "B is my option". The 0.6.0 bug of two `List` values over one backing array is fixed in a different way, by copy on assignment.

## What Changes

- Move semantics apply only at an isolate crossing. A crossing is a capture of a `Parallel.Scope` or `s.Spawn` task, a port send, or a `.Parallel()` step. Use after move is not diagnosed outside a crossing.
- Zero-copy hand-over of Moved graphs at a crossing stays (decisions D1, D8, D9 and the `iso` precondition).
- Corelib collections mutate in place. Self-returning methods become `mut this` methods (or return `unit`). The rule "owning receiver `move this`" of `v062-captures-and-move` is removed.
- Assigning or passing a `List` gives the new binding its own storage. Growth never writes into storage that another `List` sees.
- REMOVED: the whole-program requirements "Owning and borrowed names", "Consuming uses and use after move", "Branch and loop rules for consumption", "Destructive read of a field" and "ORCA preconditions" of `v062-captures-and-move`. ADDED: crossing-only replacements.

## Capabilities

### Modified Capabilities
- `language-meta--memory-model--memory-and-references`, `core-library--foundation-and-primitives--core-collections`.

## Impact

`beskid_queries` affine analysis (restricted to crossings), Corelib collections, Book and surface tests that use `move` in ordinary code. Target release: 0.6.7. This change SHALL be archived after `v062-captures-and-move`, `v063-isolates-and-scope`, `v064-ports-and-pipelines` and `v065-parallel-sequences`, because it removes and changes requirements that those changes add.

## Compatibility, Migration and Reversion

No users exist. Source that wrote `move` in ordinary code is rejected with a help that says to remove it. Source that rebound the result of a collection method (`l = l.Push(1)`) stays valid when the method returns the updated collection, and is rejected when the method returns `unit`. There is no compatibility path.
