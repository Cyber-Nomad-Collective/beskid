<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Core.Fluent Specification

## Purpose

Self-returning step contracts and generated fluent facades for corelib types.

## Requirements

### Requirement: Self-returning fluent step contract: Decision [D-CORE-FLUENT-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Contract | `pub contract {Name}Step` declares chain methods returning `{Name}Step` |
> | Terminal | At least one method **must** return a non-step type (`Into{Name}()`, `ApplyTo(...)`, `IntoSequence()`, etc.) |
> | Authoring | Wrapper types carry **`[FluentStep]`** / **`[FluentInner]`** / **`[FluentChain]`** / **`[FluentTerminal]`** attributes (`Beskid.Fluent` in compiler SDK) |
> | Generation | `Beskid.Fluent` mod **may** emit step contracts from annotated types via `Collector`/`Generator` and `Emitter`; **`Core.Fluent.Registry`** is deprecated |
> | Stability | Generated fluent facades are **`@tier(supported)`** until host merge and target-driven materialization are automatic in CI |

**Stable ID:** `BSP-REQ-14BA430C6B5A`  
**Legacy source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-fluent/adr/0001-fluent-step-contract/content.md`  
**Source SHA-256:** `781389c29bfcc0c20f377aa6bbd40aab9478ee78710af4192987810d42145907`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Core.Fluent

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-fluent/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-fluent/content.md`  
**SHA-256:** `9c1100c0585ddb81bcad63393a9bb92dd8977750658c190c9a5dc0c8c96a95ea`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
`Core.Fluent` defines the **step-contract** pattern for chainable corelib APIs: a `pub contract XxxStep` whose chain methods return `XxxStep`, plus at least one **terminal** method that produces a final value (`string`, `T`, `IntoPrefix`, etc.). Wrapper types are **attribute-authored** via **`Beskid.Fluent`** (`[FluentStep]`, `[FluentChain]`, `[FluentTerminal]`); the `Beskid.Fluent` compiler mod collects annotated types and emits step contracts through **`Beskid.Compiler.Emitter`**. Optional on-disk materialization is compiler-owned on Collector target fingerprint miss—there is no `beskid mod generate` CLI.
</SpecSection>

<SpecSection title="Contract statement" id="contract-statement">
| Rule | Detail |
| --- | --- |
| Step contract | `pub contract {Name}Step` — intermediate methods return `{Name}Step` |
| Terminal | At least one method returns a non-step type (for example `IntoList()`, `ApplyTo(string)`) |
| Reference | Hand-written reference: `Ansi.AnsiStyleStep` in `corelib_console` |
| Tier | Generated fluent facades are **Supported** (Tier 2) until merge is automatic in the mod harness |
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-CORE-FLUENT-0004`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Design model](./articles/design-model/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Self-returning fluent step contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-fluent/adr/0001-fluent-step-contract/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-fluent/adr/0001-fluent-step-contract/content.md`  
**SHA-256:** `781389c29bfcc0c20f377aa6bbd40aab9478ee78710af4192987810d42145907`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Chainable APIs (ANSI builders, future collection facades) need a uniform contract shape that codegen and mods can target without ad hoc free-function `self` parameters.

## Decision

| Rule | Detail |
| --- | --- |
| Contract | `pub contract {Name}Step` declares chain methods returning `{Name}Step` |
| Terminal | At least one method **must** return a non-step type (`Into{Name}()`, `ApplyTo(...)`, `IntoSequence()`, etc.) |
| Authoring | Wrapper types carry **`[FluentStep]`** / **`[FluentInner]`** / **`[FluentChain]`** / **`[FluentTerminal]`** attributes (`Beskid.Fluent` in compiler SDK) |
| Generation | `Beskid.Fluent` mod **may** emit step contracts from annotated types via `Collector`/`Generator` and `Emitter`; **`Core.Fluent.Registry`** is deprecated |
| Stability | Generated fluent facades are **`@tier(supported)`** until host merge and target-driven materialization are automatic in CI |

## Consequences

- Collections and Query gain optional fluent wrappers without duplicating semantics on the underlying types.
- Console ANSI contracts remain the normative hand-written example; registry may include them later.
- Mod output may be checked in via **`generatedOutputs`** materialization until merge/reparse is proven in CI; no standalone `beskid mod generate` CLI.

## Verification anchors

- `compiler/corelib/packages/console/src/Ansi/Contracts.bd`
- `compiler/corelib/mods/corelib_fluent_gen/` (Phase 5)
``````

</details>

### Source Record: Design model

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/core-library/foundation-and-primitives/core-fluent/articles/design-model/`  
**Source:** `site/spec-content/platform-spec/core-library/foundation-and-primitives/core-fluent/articles/design-model/content.md`  
**SHA-256:** `054490af2ef1cb44c06c67592e6042fddfede970ae027df97defc9874db10c1a`

<details>
<summary>Migrated source text</summary>

``````markdown
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
``````

</details>
