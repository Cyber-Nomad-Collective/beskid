## Why

Two gaps remain in the checker of 0.6.6. An `[Export]` entry can match a function by simple name. A `[ScopeBorrowed]` value can escape, because only corelib review prevents it. Each gap lets a program keep a reference after its scope ended. Evidence: wayfinder ticket 13 (owner accepted 2026-10-24).

The third gap of ticket 13, returning a borrowed element `xs[i]` of a Moved class, is withdrawn. The owner ruling of 2026-10-24 (`v067-move-at-isolate-boundary`) removes owning and borrowed names from ordinary code, so an ordinary return of `xs[i]` is no longer an error. A borrowed element at an isolate crossing is covered by that change.

## What Changes

- `[Export]` entries resolve by the identity of the declaration. Name matching is removed.
- The checker enforces `[ScopeBorrowed]`: the value stays in the scope that uses it.

## Capabilities

### Modified Capabilities
- `language-meta--memory-model--memory-and-references`, `language-meta--interop--export-and-callbacks`.

## Impact

`beskid_queries` ownership checks, export entry resolution. Target release: 0.6.7. Builds on `v065-parallel-sequences` and `v067-move-at-isolate-boundary`.

## Compatibility, Migration and Reversion

No users exist. Programs that rely on name matching for `[Export]`, or that let a `[ScopeBorrowed]` value escape, stop compiling. There is no compatibility path.
