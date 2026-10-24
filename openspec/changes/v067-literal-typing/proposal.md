## Why

A bare numeric literal without context gets a fixed type, and a literal passed where another width is required is silently cast. Programs such as `Port { high: 1, low: 2 }` with `u8` fields need explicit suffixes. The owner ruled that a bare literal takes its type from its context. Evidence: slice lit of the 0.6.7 program.

## What Changes

- A bare numeric literal takes its type from context. Without context: the suffix, else `i32` if the value fits, else `i64`. Floats are `f64`, or `f32` from context.
- A literal that does not fit its type is **T0905**, never wrapped.
- A suffix that conflicts with the context is **E1206**, except as an operand of a binary operator.
- In a conditional expression, a bare literal in one branch takes the type of the other branch.

## Capabilities

### Modified Capabilities
- `language-meta--type-system--type-inference`, `compiler--semantic-pipeline--diagnostic-code-registry`.

## Impact

`beskid_queries` expected-type and the literal gate, lowering of literals, Corelib and fixtures that relied on the silent cast. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. Code that passed a suffixed literal of another width is rejected with E1206 and fixed by dropping the suffix. There is no compatibility path.
