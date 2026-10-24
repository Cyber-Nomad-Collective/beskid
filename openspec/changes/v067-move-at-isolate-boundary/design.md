# Design: move at the isolate boundary (0.6.7)

Owner ruling, 2026-10-24: "i did not want the move semantics in beskid" and "B is my option". The decisions D1–D4 in `docs/reports/2026-10-04-v06-decisions.md` carry an amendment.

## Crossing

A crossing operand is (as implemented by slice own):

1. the value argument of `Port<T>.Send` and of the builtin `__port_send`;
2. a binding declared outside a closure that is the argument of a `[Captures]`-bounded parameter, or initializes a `[Captures]`-bounded field, or is the body of `__isolate_spawn`, where the closure reads the binding with `move`.

`Scope.Spawn` and `Parallel.Scope` tasks and the `.Parallel()` steps are crossings through item 2, because their parameters carry `[Captures]` bounds. They are not separate cases. A fiber `spawn` is not a crossing, because the fiber stays in the isolate.

Only at a crossing does `move` have a meaning. The operand of `move` at a crossing is consumed. A later read of that name in the same callable is **E1234**. A crossing that loops without revival is **E1240**. A crossing operand that is not written with `move` is **E1242**. These codes keep their numbers and are reported only for crossing operands.

## Ordinary code

Outside a crossing the compiler does not classify names as owning or borrowed. Assignment, `let y = x`, field stores, returns and calls never consume. A value of Moved class may be aliased inside one isolate. `move` written outside a crossing is **E1239** with the help "remove `move`; it applies only when a value crosses to another isolate".

## Zero-copy hand-over

The hand-over by pointer of 0.6.5 stays. The `iso` precondition is established at the crossing by a conservative rule: the operand is a `move` parameter or a local first set from an owned expression, and no other name is made for it in the callable. The exact text is in the requirement "ORCA preconditions at crossings". Otherwise the compiler reports E1241 with the help to copy the value first.

## Collections

`List<T>` and the other Corelib collections mutate in place: `items.Push("milk");`. A method that formerly returned the updated collection through `move this` becomes a `mut this` method that returns `unit`, or returns a value that is not the collection. Assigning a `List` or passing it to a parameter gives the new binding its own storage. The implementation MAY delay the copy until the first write, but no write through one `List` SHALL be visible through another. Growth of one `List` SHALL NOT write into storage that another `List` sees. This removes the sharing bug of 0.6.0 without a use-after-move rule.

## Not changed

`Fiber<T>` handle linearity (`Join` and `Detach` consume the handle, double `Join` is E1234) is a handle lifecycle rule and stays as specified by `v062-captures-and-move`. Capture bounds (`[Captures]`), the borrowed-element and `[ScopeBorrowed]` rules of `v067-ownership-checker` that concern lifetime stay.

## Open items

- Passing a `List` to a `mut` parameter: shared storage (mutation visible to the caller) or a copy. The coll slice decides and records it.
