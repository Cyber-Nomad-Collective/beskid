## Why

The formatter renamed declarations to the naming profile without renaming their uses. A format run could therefore break a program. The owner rule is that the formatter never renames.

## What Changes

- The formatter never changes an identifier. Renaming belongs to the naming-style lint and its quick fix (W1630–W1638).
- The token check compares identifiers exactly.

## Capabilities

### Modified Capabilities
- `tooling--formatter--verification-and-traceability`.

## Impact

`beskid_tools` formatter, Mod-generated program formatting. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. `beskid fmt` no longer renames tests to PascalCase; the lint and its quick fix rename.
