## Why

A test named `Parse` clashes with the function `Parse` under the PascalCase test names of `v067-test-naming-and-failures`. A test is an entry point, not a value that code can name, so it needs no place in the item scope. The owner ruled that tests have their own namespace.

## What Changes

- A test may share its name with any non-test item in the module.
- Two tests with one name in one module are **E1102**.

## Capabilities

### Modified Capabilities
- `language-meta--program-structure--name-resolution`, `language-meta--contracts-and-effects--testing`.

## Impact

Resolver collection, staged definition checks, discovery, symbols and the language server. Target release: 0.6.7.

## Compatibility, Migration and Reversion

No users exist. There is no compatibility path.
