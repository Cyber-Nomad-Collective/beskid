<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Interop.Contracts Specification

## Purpose

This specification defines language-agnostic primitives for foreign boundaries. The primitives cover symbols, call shapes, ownership, and conformance. The C and Rust ABI profiles share these primitives.

## Requirements

### Requirement: Feature hub owns normative contract: Decision [D-LMETA-IC-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **must** own the language-agnostic **Interop.Contracts** vocabulary. Profile features **must** bind these primitives, not redefine them.

**Stable ID:** `BSP-REQ-2E4B234994A2`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/adr/0001-hub-authority/content.md`  
**Source SHA-256:** `aeaae8e41270ed8aa714b48f4fed8103c24894acb0ddbcafcfd748832e63d66f`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Profiles instantiate abstract primitives: Decision [D-LMETA-IC-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> **Interop.Contracts** **does not** prescribe a single calling convention. **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)** and **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** **must** bind symbols, layouts, linking, and unwind rules to these primitives.

**Stable ID:** `BSP-REQ-866F24FC8623`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/adr/0002-profiles-bind-primitives/content.md`  
**Source SHA-256:** `0d05140e8220aafed92f30d3bd87e5043293fb8299a421db4df205203a8e0aa7`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Conformance and versioning envelope: Decision [D-LMETA-IC-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature **must** specify symbol identity, type-shape classes, call-shape classes, ownership obligations, error/unwind semantics, and a **conformance envelope** (versioning and forward compatibility) for compatibility claims.

**Stable ID:** `BSP-REQ-BBF7CEC90006`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/adr/0003-conformance-envelope/content.md`  
**Source SHA-256:** `6f575f9dd23d804f70e580475d883f8f2d07ee420a18ec2576c179d737199eab`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Dispatch envelope layout: Decision [D-LMETA-IC-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Rule | Detail |
> | --- | --- |
> | Envelope type | **`RuntimeInteropEnvelope`** is the normative tagged payload header for v3 soft dispatch |
> | Layout band | Envelope field offsets and size **must** version with `BESKID_RUNTIME_ABI_VERSION`; v3 defines the initial band |
> | Tag validity | Dispatch tags **must** be assigned from the manifest; runtime **must** reject unknown tags (bitmap or table validation) |
> | Return groups | Tags partition into `unit`, `ptr`, `usize`, and `i64` return groups; codegen **must** call the matching `interop_dispatch_*` kernel entry |
> | Conformance | Hosts claiming Interop.Contracts compatibility **must** honor envelope layout for the advertised ABI version |
> 
> Envelope offsets are realized in `beskid_runtime::interop_layout` and documented in corelib `Runtime.Abi`.

**Stable ID:** `BSP-REQ-E2205E2E829F`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/adr/0004-dispatch-envelope-layout/content.md`  
**Source SHA-256:** `d7dc9bed2dc50168c7d5ef5ab23dd2a7c3ad2830693090eed5237144782acbad`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history. They are not normative except where text was extracted into a requirement above.

### Source Record: Interop.Contracts

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/content.md`  
**SHA-256:** `ac863f0106667fad810b5c1c743a42df708b4d940e3a5279a71fe5efde8c3921`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
**Interop.Contracts** is the normative, language-agnostic vocabulary for describing how Beskid values and control flow cross a **foreign boundary**. It does **not** prescribe a single calling convention; **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)** and **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** bind these primitives to concrete ABIs and linking models.

This feature specifies: **symbol identity**, **type-shape classes**, **call-shape classes**, **ownership and lifetime obligations** at the boundary, **error and unwind semantics**, and a **conformance envelope** (versioning and forward compatibility) that host runtimes and compilers must honor when claiming compatibility.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Runtime export names and builtin dispatch tables: `compiler/crates/beskid_abi/src/symbols.rs`, `compiler/crates/beskid_abi/src/builtins.rs`
- Stable FFI layouts for standard runtime types: `compiler/crates/beskid_abi/src/types.rs`
- Runtime ABI version constant: `compiler/crates/beskid_abi/src/version.rs`
- JIT symbol registration and extern import validation: `compiler/crates/beskid_engine/src/jit_module.rs`, `compiler/crates/beskid_engine/src/engine.rs`
- Extern import collection and Cranelift calls: `compiler/crates/beskid_codegen/src/lowering/lowerable.rs`, `compiler/crates/beskid_codegen/src/lowering/expressions/call_expression.rs`
- ABI contract tests: `compiler/crates/beskid_tests/src/abi/contracts.rs`
</SpecSection>

<SpecSection title="Relationship to language syntax" id="relationship-to-language-syntax">
User-visible **`[Extern(...)] contract`** declarations are specified under **[FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/)**. That chapter must remain consistent with the abstract contracts here; profile pages add ABI-specific rules.
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-LMETA-IC-0001` … `D-LMETA-IC-0004`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Interop.Contracts — Callback call shapes](./articles/callback-call-shapes/)
- [Interop.Contracts — Conformance and versioning](./articles/conformance-and-versioning/)
- [Interop.Contracts — Core primitives](./articles/core-primitives/)
- [Interop.Contracts — Error and unwind semantics](./articles/error-and-unwind-semantics/)
- [Interop.Contracts — Language-agnostic mapping rules](./articles/language-agnostic-mapping/)
- [Interop.Contracts — Ownership at the boundary](./articles/ownership-at-boundary/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub owns normative contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/adr/0001-hub-authority/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/adr/0001-hub-authority/content.md`  
**SHA-256:** `aeaae8e41270ed8aa714b48f4fed8103c24894acb0ddbcafcfd748832e63d66f`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

C and Rust profiles previously duplicated primitive definitions.

## Decision

This feature hub **must** own the language-agnostic **Interop.Contracts** vocabulary. Profile features **must** bind these primitives, not redefine them.

## Consequences

Articles under C/Rust ABI cite ownership, call shapes, and conformance from here.

## Verification anchors

/platform-spec/language-meta/interop/interop-contracts/
``````

</details>

### Source Record: Profiles instantiate abstract primitives

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/adr/0002-profiles-bind-primitives/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/adr/0002-profiles-bind-primitives/content.md`  
**SHA-256:** `0d05140e8220aafed92f30d3bd87e5043293fb8299a421db4df205203a8e0aa7`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Authors need one abstract model with two concrete ABI bindings.

## Decision

**Interop.Contracts** **does not** prescribe a single calling convention. **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)** and **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** **must** bind symbols, layouts, linking, and unwind rules to these primitives.

## Consequences

Syntax for `Extern` contracts remains under FFI and extern; profiles add ABI tables.

## Verification anchors

/platform-spec/language-meta/interop/interop-contracts/ and profile hubs.
``````

</details>

### Source Record: Conformance and versioning envelope

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/adr/0003-conformance-envelope/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/adr/0003-conformance-envelope/content.md`  
**SHA-256:** `6f575f9dd23d804f70e580475d883f8f2d07ee420a18ec2576c179d737199eab`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Hosts and compilers need a shared compatibility story at boundaries.

## Decision

This feature **must** specify symbol identity, type-shape classes, call-shape classes, ownership obligations, error/unwind semantics, and a **conformance envelope** (versioning and forward compatibility) for compatibility claims.

## Consequences

ABI contract tests and `BESKID_RUNTIME_ABI_VERSION` align to the envelope.

## Verification anchors

`compiler/crates/beskid_tests/src/abi/contracts.rs`; [conformance and versioning](/platform-spec/language-meta/interop/interop-contracts/conformance-and-versioning/).
``````

</details>

### Source Record: Dispatch envelope layout

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/adr/0004-dispatch-envelope-layout/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/adr/0004-dispatch-envelope-layout/content.md`  
**SHA-256:** `d7dc9bed2dc50168c7d5ef5ab23dd2a7c3ad2830693090eed5237144782acbad`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Soft runtime ops share a small kernel export set in v3. Generated code and hosts need a stable, versioned envelope so dispatch tags, payload pointers, and return groups interoperate across JIT, AOT, and registration.

## Decision

| Rule | Detail |
| --- | --- |
| Envelope type | **`RuntimeInteropEnvelope`** is the normative tagged payload header for v3 soft dispatch |
| Layout band | Envelope field offsets and size **must** version with `BESKID_RUNTIME_ABI_VERSION`; v3 defines the initial band |
| Tag validity | Dispatch tags **must** be assigned from the manifest; runtime **must** reject unknown tags (bitmap or table validation) |
| Return groups | Tags partition into `unit`, `ptr`, `usize`, and `i64` return groups; codegen **must** call the matching `interop_dispatch_*` kernel entry |
| Conformance | Hosts claiming Interop.Contracts compatibility **must** honor envelope layout for the advertised ABI version |

Envelope offsets are realized in `beskid_runtime::interop_layout` and documented in corelib `Runtime.Abi`.

## Consequences

Envelope layout changes **must** increment `BESKID_RUNTIME_ABI_VERSION` per [D-EXEC-ABI-0002](/platform-spec/execution/abi-and-host/abi-versioning-and-compatibility/adr/0002-breaking-changes-bump-version/). Tag tables are generated from `runtime_manifest.toml`.

## Verification anchors

`compiler/crates/beskid_runtime/src/interop_layout.rs`; `compiler/crates/beskid_tests/src/interop/`; corelib `Runtime/Abi.bd`.
``````

</details>

### Source Record: Interop.Contracts — Callback call shapes

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/articles/callback-call-shapes/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/articles/callback-call-shapes/content.md`  
**SHA-256:** `41e307d6a5fc63a54e8cf031199465e9275181ac4f7cbba8fb3d3271651aa2e5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Callback type-shape

A **callback** is a **function pointer** plus optional **userdata** (`i64` opaque address in v0.3.0) passed to foreign code. The pointed-to function **must** use **`Export`** or a **trampoline symbol** documented in **[callback registration](/platform-spec/language-meta/interop/export-and-callbacks/callback-registration/)**.

Allowed callback signatures use the same primitive and interop-view types as import methods.

## Re-entrancy

When foreign code invokes a Beskid export or registered callback:

1. The runtime **must** enter a documented runtime scope (TLS heap/root/session).
2. Allocation on the Beskid side **must** follow normal GC rules.
3. Panics **must** map to **trap/abort across the boundary** in v0.3 Standard unless a profile documents **`C-unwind`** for a specific runtime entrypoint.

Foreign threads invoking Beskid without a host contract are **Proposed** (v0.3.2+).

## Import side: function-pointer parameters

`Extern` contract methods **may** declare parameters whose type is a **function type** with `Export` ABI in v0.3.0 when the parameter list uses only permitted FFI types. The compiler **must** verify that the referenced export exists or will be generated.

## Tables vs single callbacks

Hosts may register **multiple callbacks** through a versioned **registration table** (see export feature). **Interop.Contracts** only requires that each slot normalize to a flat call shape and stable symbol or trampoline identity.
``````

</details>

### Source Record: Interop.Contracts — Conformance and versioning

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/articles/conformance-and-versioning/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/articles/conformance-and-versioning/content.md`  
**SHA-256:** `b130b9d000196818916c9b40195e6f999ea141165a82bbf655f4a3a0d9cbcfbb`

<details>
<summary>Migrated source text</summary>

``````markdown
## Runtime ABI version (embedding)

The platform publishes a monotonic **runtime ABI version** constant for the **Rust runtime export surface** (`BESKID_RUNTIME_ABI_VERSION`). An artifact **must not** load against a runtime that reports an incompatible version when linking builtins.

Implementation reference: `compiler/crates/beskid_abi/src/version.rs` and `compiler/crates/beskid_tests/src/abi/contracts.rs`.

**User FFI** (import layouts, interop views, export tables) is versioned separately — see **User FFI layout band** below. Bumping user FFI layouts **must not** require bumping `BESKID_RUNTIME_ABI_VERSION` unless a runtime export symbol or builtin signature changes.

## User FFI layout band (v0.3)

The platform maintains a **user FFI layout band** for:

- Interop view record layouts (`CStringView`, `CBuffer`, `CArrayView`).
- Export/callback registration table header layout.
- Optional future `repr(C)` rules (v0.3.1).

Toolchains **should** record the band in build metadata (for example manifest or artifact stamp) so linkers and hosts reject incompatible combinations. The reference constant name is reserved as **`BESKID_USER_FFI_LAYOUT_BAND`** (implementation may trail spec).

| Band | Standard content |
| --- | --- |
| **v0.3.0** | Interop views, link-time import, export + callback registration |
| **v0.3.1** | `CLayout` records with primitive fields only |
| **v0.3.2+** | Proposed: nested FFI structs, foreign-thread entry |

## Forward compatibility

**Interop.Contracts** distinguishes:

- **Normative contracts** — behavior and layouts the platform commits to for a given ABI version band.
- **Reserved extensions** — symbol names or dispatch slots documented as internal or experimental; user code **must not** depend on them unless a feature explicitly promotes them to normative status.

When adding symbols or shapes, the platform **should** extend tables in `beskid_abi` with documentation in the **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** before declaring user-visible stability.

## Profile conformance

A toolchain build **conforms** to **Interop.Contracts** if:

1. Every emitted foreign call can be traced to an abstract call shape and symbol identity defined here or in a normative profile article.
2. Runtime exports match the allowlisted symbol set for the declared ABI version.
3. Diagnostics reject unsupported combinations (for example extern imports when the engine feature that resolves them is disabled).
``````

</details>

### Source Record: Interop.Contracts — Core primitives

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/articles/core-primitives/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/articles/core-primitives/content.md`  
**SHA-256:** `1d35a3175e5ca900d95427726d8764d6cc1168f621d16447954e7104bcc2c4d4`

<details>
<summary>Migrated source text</summary>

``````markdown
## Symbol identity

A **foreign symbol** is identified for interop purposes by a logical name (the string used at link or load time) together with optional **library** or **module** metadata, depending on the profile. Profiles define whether names are decorated, mangled, or exported verbatim.

## Type-shape classes

Values that may cross a boundary are classified into **type-shape classes** so that each profile can map them to concrete machine types:

- **Scalar** — fixed-width integers and enumerations mapped to a profile’s integer rules.
- **Opaque handle** — an address-sized token with no Beskid-defined layout on the foreign side beyond “passed by value or by pointer per profile”.
- **Buffer** — length-associated byte or element ranges; ownership (borrow vs transfer) is a separate contract field.
- **String-like** — bounded UTF-8 or implementation-defined encoding; must align with runtime string ABI where shared with the Beskid runtime (`BeskidStr`-class layouts in implementation).
- **Never** — no return across the boundary (divergence); profiles map this to platform unwind or trap semantics.

Profiles may forbid certain shapes at the boundary even if they exist in Beskid source.

## Call-shape classes

A **call shape** describes parameters and return as a flat list of type-shapes plus calling convention metadata. **Interop.Contracts** requires that every lowering to a foreign call be expressible as a call shape; profiles attach concrete ABIs (for example System V on a tier-1 host).

## Boundary invariants

Regardless of profile, these invariants apply unless a profile explicitly documents a narrower guarantee:

1. **No silent re-entrancy** — foreign code must not assume Beskid runtime locks unless the profile documents re-entrancy classes.
2. **Panic isolation** — which side may catch or translate panics is profile-defined; the abstract contract requires the mapping to be explicit.
3. **ABI version gate** — runtimes and artifacts declare a compatible **runtime ABI version**; mismatches are hard errors at load or link time (see implementation anchors on the parent hub).

For C-oriented user libraries, see **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)**. For the embedding Rust runtime surface, see **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)**.
``````

</details>

### Source Record: Interop.Contracts — Error and unwind semantics

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/articles/error-and-unwind-semantics/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/articles/error-and-unwind-semantics/content.md`  
**SHA-256:** `b52f0d43a77e7f53cc941cd5a2875dc871cf19fe6bdf17b21e0febf3568c363e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Return-shape classes

| Shape | Foreign expectation | Beskid mapping |
| --- | --- | --- |
| **Value** | Normal C return | Primitive or interop view per profile |
| **Unit** | `void` | No return value |
| **Never** | Does not return | `Never` → trap/unwind per profile |

## Errors as values

Beskid **`Result`** types **must not** appear on FFI boundaries in v0.3.0. Authors map foreign error codes to Beskid `Result` **after** the call returns.

## Panics and unwinding

Across **user FFI** and **export** boundaries in v0.3 Standard:

- Beskid panic **must not** rely on foreign callers catching Rust/Beskid unwinds.
- The default policy is **abort or trap** at the boundary.
- Runtime syscalls and selected runtime exports may use **`extern "C-unwind"`** internally; that class is **not** implied for user `Extern` or `[Export]` without an explicit future profile.

## Foreign errors

Foreign functions that communicate failure via return codes or `errno` remain the caller’s responsibility to translate; the platform does not inject automatic `errno` threading in v0.3.
``````

</details>

### Source Record: Interop.Contracts — Language-agnostic mapping rules

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/articles/language-agnostic-mapping/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/articles/language-agnostic-mapping/content.md`  
**SHA-256:** `6c21d6639c52e558f9c8ebf2e549fc345fab261dc219dd4f9e9dcb7405e3391e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Declaration to contract

Beskid surfaces foreign entrypoints through **`contract`** declarations annotated for interop (see **[FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/)**). At the **Interop.Contracts** layer, each contract method contributes:

- A **logical symbol** derived from the contract’s extern metadata, optional per-method **`Symbol`** override, or the method’s foreign name when no override is present.
- A **call shape** derived from Beskid parameter and result types using the type-shape rules on the parent hub’s **[core primitives](/platform-spec/language-meta/interop/interop-contracts/core-primitives/)** article.

The compiler **must** reject declarations that cannot be lowered to any supported profile’s call shape without undefined behavior.

## Multiple profiles

The same abstract call shape may admit more than one profile lowering in the future. **Interop.Contracts** defines the shared normalization step; **[C ABI profile](/platform-spec/language-meta/interop/c-abi-profile/)** and **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** document which shapes each profile accepts in the current toolchain.

## Builtin vs user foreign boundary

Calls to **runtime builtins** (allocation, syscalls, internal dispatch helpers) use the same abstract machinery but are **not** user-authored `Extern` contracts. They are governed by the **runtime ABI** and syscall ownership documents under `/execution/runtime/`; those surfaces must remain consistent with the symbol tables in `beskid_abi`.
``````

</details>

### Source Record: Interop.Contracts — Ownership at the boundary

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/interop-contracts/articles/ownership-at-boundary/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/interop-contracts/articles/ownership-at-boundary/content.md`  
**SHA-256:** `23be0fa430a580da9525fd84e73ba6b1897b0ae6e7131d9f687b0b92313eee38`

<details>
<summary>Migrated source text</summary>

``````markdown
## Ownership classes

Every parameter on an abstract **call shape** has an ownership class:

| Class | Meaning |
| --- | --- |
| **Borrow** | Caller retains ownership. Foreign code must not store pointers beyond the call unless the contract documents an exception. |
| **Transfer** | Caller relinquishes the obligation described by the interop view (for example heap-allocated buffer freed by callee). |
| **Opaque borrow** | Address-sized token with no Beskid layout on the foreign side; lifetime is caller-managed. |

Default when no modifier is present: **Borrow**.

## GC-managed values

Beskid **string** and **slice (`T[]`)** values **must not** cross the user FFI boundary as ordinary GC references in v0.3.0 Standard. Authors **must** use **interop view types** (see **[interop view types](/platform-spec/language-meta/interop/c-abi-profile/interop-view-types/)**).

Passing GC pointers to foreign code without a view is **undefined behavior**.

Optional **`GcPin`** (Proposed) would extend a call with a runtime root for the call duration; until standardized, hosts **must** reject or lower pinned forms only when explicitly implemented.

## Safepoints

Every foreign call is a **safepoint** for the active collector policy. Foreign code **must not** be assumed to run with a migrated fiber stack unless documented by the execution runtime.

## Complex types (deferred)

Nested records, enums with non-trivial representation, and nested arrays inside FFI structs are **out of scope** for v0.3.0 Standard. They are specified under **[C layout types](/platform-spec/language-meta/interop/c-abi-profile/c-layout-types/)** for v0.3.1 after basic FFI is in place.
``````

</details>
