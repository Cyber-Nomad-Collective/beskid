## Why

Three gaps remain in the ownership checker of 0.6.6. A function can return a borrowed element `xs[i]` of a Moved class. An `[Export]` entry can match a function by simple name. A `[ScopeBorrowed]` value can escape, because only corelib review prevents it. Each gap lets a program keep a reference after the owner released the value. Evidence: wayfinder ticket 13 of the 0.6.7 map (owner accepted 2026-10-24).

## What Changes

- Returning a borrowed element of a Moved class is an error (E1241), and the diagnostic suggests taking the value out or cloning it.
- `[Export]` entries resolve by the identity of the declaration. Name matching is removed.
- The checker enforces `[ScopeBorrowed]`: no store into a field, no return, no capture by an escaping closure.

## Capabilities

### Modified Capabilities
- `language-meta--memory-model--memory-and-references`, `language-meta--interop--export-and-callbacks`.

## Impact

`beskid_queries` ownership and affine checks, export entry resolution. Target release: 0.6.7. Builds on `v062-captures-and-move` and `v065-parallel-sequences`.

## Compatibility, Migration and Reversion

No users exist. Programs that return a borrowed element, or that rely on name matching for `[Export]`, stop compiling. There is no compatibility path.
