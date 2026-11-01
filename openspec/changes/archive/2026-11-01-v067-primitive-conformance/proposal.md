## Why

Generic code cannot require that a number or a string can print itself, because primitives cannot implement contracts. `Assert.Equal` then needs one function per type. The owner ruled that primitives and `string` conform to contracts.

## What Changes

- `impl <primitive> : C { ... }` makes a primitive or `string` conform to a contract. Violations are **E1611**.
- Corelib `Core.Text.Formatting` declares `contract Formatting { string Format(); }` with implementations for all primitives and `string`.
- `Assert.Equal<T>`, `Assert.NotEqual<T>` and a generic `Expect.Equal<T>` require `T: Formatting`.

## Capabilities

### Modified Capabilities
- `language-meta--contracts-and-effects--contracts`, `language-meta--contracts-and-effects--testing`, `compiler--semantic-pipeline--diagnostic-code-registry`.

### New Capabilities
- `core-library--text-and-parsing--formatting`.

## Impact

Contract proof and dispatch for primitives, Corelib `Core.Text.Formatting` and `Testing`. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. `Expect.EqualI64`, `Expect.EqualString` and `Expect.EqualBool` are removed. There is no compatibility path.
