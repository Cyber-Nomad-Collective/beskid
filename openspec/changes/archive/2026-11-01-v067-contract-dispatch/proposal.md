## Why

A contract bounds a type parameter, but a value cannot have a contract type. Code that needs several implementations behind one name, such as `inject Contract[]`, has no runtime form. The owner ruled for runtime dispatch of contract values in 0.6.7, like C# interfaces.

## What Changes

- A value of contract type may hold any conforming implementation: a type, or a primitive with an `impl`.
- A concrete value converts to a contract type where a contract type is expected. Calls through a contract value dispatch at run time.
- Contract values may be locals (including `mut`), fields, array and `List` elements, parameters, return values and `inject Contract[]` elements.
- A singular `inject` of a contract may bind a different implementation per scope.
- Crossing rules apply to the value a contract value holds; the transfer class comes from the embedded markers.
- The exclusion "contract-typed parameters that receive primitives stay out of 0.6.7" is removed from `v067-primitive-conformance`.

## Capabilities

### Modified Capabilities
- `language-meta--contracts-and-effects--contracts`, `language-meta--composition--dependency-injection`, `language-meta--memory-model--memory-and-references`.

## Impact

Type checker (contract types as value types), lowering (contract value representation and dispatch tables), composition (injection of contract values). Target release: 0.6.7. Builds on `v067-primitive-conformance`.

## Compatibility, Migration and Reversion

No users exist. There is no compatibility path.
