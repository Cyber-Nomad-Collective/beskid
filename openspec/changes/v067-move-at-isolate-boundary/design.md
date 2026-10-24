# Design: move at the isolate boundary (0.6.7)

Owner ruling, 2026-10-24: "i did not want the move semantics in beskid" and "B is my option". The decisions D1–D4 in `docs/reports/2026-10-04-v06-decisions.md` carry an amendment.

## Crossing

A crossing is the place where a value leaves the isolate that owns it:

1. the captures of a closure given to `Scope.Spawn` (`s.Spawn(...)`) or to `Parallel.Scope`;
2. the value argument of `Port<T>.Send` and of the runtime builtins that move a value across a runtime instance (`__port_send`), including pipeline stage hand-over;
3. the closures, combiners and source of a `.Parallel()` step.

Only at a crossing does `move` have a meaning. The operand of `move` at a crossing is consumed. A later read of that name in the same callable is **E1234**. A crossing that loops without revival is **E1240**. A crossing operand that is not written with `move` is **E1242**. These codes keep their numbers and are reported only for crossing operands.

## Ordinary code

Outside a crossing the compiler does not classify names as owning or borrowed. Assignment, `let y = x`, field stores, returns and calls never consume. A value of Moved class may be aliased inside one isolate. `move` written outside a crossing is **E1239** with the help "remove `move`; it applies only when a value crosses to another isolate".

## Zero-copy hand-over

The hand-over by pointer of 0.6.5 stays. The `iso` precondition (external uniqueness) is now established at the crossing. The operand SHALL be an owned expression, or a local that the compiler can show has no other name for the same value in the callable. Otherwise the compiler reports an error and the help says to copy the value first. The conservative rule fails closed. The exact analysis is a slice decision recorded in `v067-own-progress.md`.

## Collections

`List<T>` and the other Corelib collections mutate in place: `items.Push("milk");`. A method that formerly returned the updated collection through `move this` becomes a `mut this` method that returns `unit`, or returns a value that is not the collection. Assigning a `List` or passing it to a parameter gives the new binding its own storage. The implementation MAY delay the copy until the first write, but no write through one `List` SHALL be visible through another. Growth of one `List` SHALL NOT write into storage that another `List` sees. This removes the sharing bug of 0.6.0 without a use-after-move rule.

## Not changed

`Fiber<T>` handle linearity (`Join` and `Detach` consume the handle, double `Join` is E1234) is a handle lifecycle rule and stays as specified by `v062-captures-and-move`. Capture bounds (`[Captures]`), the borrowed-element and `[ScopeBorrowed]` rules of `v067-ownership-checker` that concern lifetime stay.

## Open items

- Passing a `List` to a `mut` parameter: shared storage (mutation visible to the caller) or a copy. The coll slice decides and records it.
- The exact aliasing analysis at a crossing (see "Zero-copy hand-over").
