---
title: Design model
description: Fluent step contracts, Beskid.Fluent attributes, and compiler-owned generation.
specLevel: article
owner:
  name: Piotr Mikstacki
  email: pmikstacki@cybernomad.it
status: Standard
lastReviewed: 2026-06-10
---

## Step contract shape

```beskid
pub contract ListStep {
    ListStep Push(T item);
    ListStep Pop();
    Core.Optional.Option<T> Get(i64 index);
    Collections.List<T> IntoList();
}
```

Chain methods **must** return the step contract type. Terminal methods **must** unwrap the underlying value or produce a finished artifact.

## Authoring model (`Beskid.Fluent` attributes)

Fluent wrappers are **attribute-authored** on the wrapper type and its members—not registered in a separate `FluentSurface` table. Attribute definitions live in the compiler SDK package (`Beskid/Fluent.bd`):

```beskid
pub attribute FluentStep(TypeDefinition) {
    stepName: string,    // default: "{TypeName}Step"
    innerField: string,  // default: "inner"
}

pub attribute FluentChain(MethodDefinition) { }
pub attribute FluentTerminal(MethodDefinition) { }
pub attribute FluentInner(Field) { }
```

Authors annotate the **wrapper type** and **fields**:

```beskid
[FluentStep]
pub type ListFluent<T> {
    [FluentInner]
    Collections.List<T> inner,

    [FluentChain]
    pub ListFluent<T> Push(T value) => inner.Push(value);

    [FluentTerminal]
    pub Collections.List<T> IntoList() => inner;
}
```

| Attribute | Target | Role |
| --- | --- | --- |
| **`[FluentStep]`** | `TypeDefinition` | Marks a fluent wrapper; optional `stepName` / `innerField` overrides |
| **`[FluentInner]`** | `Field` | Marks the backing value field on the wrapper |
| **`[FluentChain]`** | `MethodDefinition` | Chain method: returns the step/wrapper type |
| **`[FluentTerminal]`** | `MethodDefinition` | Terminal: unwraps inner or produces finished value |

**Expression-bodied methods (`=>`)** on single-expression chain/terminal bodies reduce boilerplate versus full `{ return ... }` blocks. Owning-type methods on `[FluentStep]` types **must** conform to the step contract via existing method-dispatch rules.

### Deprecated transitional model

The following are **not** normative for new work:

- **`Core.Fluent.Registry`** manual `FluentSurface` records
- Template bodies and empty `BuildAll()` stubs in `corelib_fluent_gen`
- Standalone **`beskid mod generate`** CLI with `--layout` / `--output`

## Generation workflow

Generation follows the same attribute-driven pattern as **[Serialization](/platform-spec/language-meta/metaprogramming/serialization/)**:

1. **`Beskid.Fluent.Collector`** (`Collector` contract) returns syntax targets—all types carrying `[FluentStep]` in the workspace scope, plus file paths for materialization fingerprints.
2. **`Beskid.Fluent.Generator`** (`Generator` contract) for each target emits via **`Beskid.Compiler.Emitter`**:
   - synthesized `pub contract {StepName} { ... }` from `[FluentChain]` / `[FluentTerminal]` methods
   - validation of the author-written wrapper `TypeDefinition`
   - factory function when missing
3. Host merges typed contributions into dependent compilations. When Collector targets change (fingerprint miss), the host optionally materializes to foundation paths when the mod declares **`generatedOutputs`** (see **[Project manifest contract](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/design-model/)**). No separate generate CLI.

Initial surfaces: **Console ANSI** builders (`AnsiStyleStep`, `AnsiCursorStep`, …) with **inline self-returning methods** on owning builder types (see [ADR-0005 owning-type inline methods](/platform-spec/core-library/stability-and-api-shape/corelib-api-shape/adr/0005-owning-type-inline-methods/)). **Collections and Query** use inline chain methods on the owning type (`List<T>`, `QueryState<T>`)—not `[FluentStep]` wrappers.

## Reference implementation

- `compiler/corelib/packages/console/src/Ansi/Contracts.bd` — hand-written `AnsiStyleStep`, `AnsiCursorStep`
- `compiler/corelib/packages/console/src/Ansi/StyleChain.bd` — inline chain methods on builder types
- `compiler/corelib/packages/foundation/src/Query/QueryState.bd` — inline `Where` / `Select` / `Take` / … on `QueryState<T>`

## Implementation anchors

- `compiler/corelib/packages/foundation/src/Core/Fluent/Step.bd`
- `compiler/corelib/packages/compiler-sdk/src/Beskid/Fluent.bd` (attribute definitions)
- `compiler/corelib/packages/compiler-sdk/src/Beskid/Compiler/Emitter.bd`
