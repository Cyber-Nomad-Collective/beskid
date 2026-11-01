<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# C ABI profile Specification

## Purpose

This specification defines the System V-style C ABI binding for user extern contracts. The binding covers types, calling conventions, libraries, and the engine resolution policy.
## Requirements
### Requirement: Feature hub owns normative contract: Decision [D-LMETA-CABI-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **must** own normative MUST/SHOULD for **C-compatible** foreign libraries. Sibling articles add detail without redefining hub MUST tables.

**Stable ID:** `BSP-REQ-E23B2A7FC1F8`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0001-hub-authority/content.md`  
**Source SHA-256:** `8fc8cada688aae77b7e130ec4b78a224eafb4cd5258580cd86b3fb62d5043612`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Link-time binding Standard tier-1: Decision [D-LMETA-CABI-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> v0.3 **Standard** tier-1 conformance **must** use **link-time** library binding ([link-time linking](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/)).

**Stable ID:** `BSP-REQ-31D9F4825690`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0002-link-time-standard-tier1/content.md`  
**Source SHA-256:** `de891e608bec1a1fc1a2951c2b564f053bb8db82d3dc0b1af2af58b2a5be4f6e`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Runtime dlopen Proposed appendix: Decision [D-LMETA-CABI-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> The dynamic resolution profile is retired together with the engine feature `extern_dlopen`. Runtime `dlopen` and `dlsym` resolution is not a Standard path. Only the JIT backend resolves symbols at run time, as "Extern resolution fails closed" in `execution--abi-and-host--extern-dispatch-and-policy` states. Conformance matrices SHALL NOT require `dlopen` for Standard tier-1.

**Stable ID:** `BSP-REQ-C6967A267A17`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0003-dynamic-resolution-proposed/content.md`  
**Source SHA-256:** `8938aa59711eb7b0e7b1ad15c6829ee3e05bce31cfd822e50cd7963b497a777c`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: WinAPI outside stdlib Standard: Decision [D-LMETA-CABI-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> **WinAPI / stdcall** as a **stdlib** concern is **out of scope** for tier-1 **Standard** conformance; platform packages may document **Proposed** mappings separately.

**Stable ID:** `BSP-REQ-D67818046944`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0004-winapi-out-of-stdlib-standard/content.md`  
**Source SHA-256:** `3ea6af102a0da4b793f259a4e85afd741768879808c1940cf9947bc3a411e565`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: v0.3.0 views v0.3.1 CLayout bands: Decision [D-LMETA-CABI-0005]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> | Band | Content | Status |
> | --- | --- | --- |
> | **v0.3.0** | Interop views, link-time import, symbol overrides | Standard (spec; impl may trail) |
> | **v0.3.1** | `CLayout` primitive structs | Proposed |
> | **Later** | Nested FFI structs, enum ABI, foreign-thread entry | Planned |

**Stable ID:** `BSP-REQ-183A0F839FB1`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0005-v03-delivery-bands/content.md`  
**Source SHA-256:** `eb5df827115d594021b25cac9189d7fe6abd67c3e44f5aa5cb7289e0db77b469`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Rust Glue required primitive and ownership profile
The required Rust Glue profile SHALL support both directions for i8/i16/i32/i64/u8/u16/u32/u64 mapped to exact intN_t/uintN_t, f32/f64 to C float/double, Bool to u8 restricted to 0/1, char to u32 restricted to Unicode scalars, unit to void return only, UTF-8 and bytes to borrowed pointer plus target-usize length inputs and managed returns to signed-i32 status with a checked GlueOwnedView out parameter (pointer, target-usize length, u64 canonical owner token), checked opaque handles to u64 slot/generation tokens, and word to selected-target uintptr_t. It SHALL preserve IEEE bits including NaN, infinities and signed zero across the boundary. Null view pointer SHALL be accepted only for zero length; embedded NUL SHALL be ordinary bounded UTF-8 data, invalid UTF-8 and overflowing lengths SHALL reject before memory access. Borrowed views SHALL remain rooted/owned during call and SHALL NOT escape owners. Transfer buffers SHALL carry an explicit owner/release operation with exactly-once release on success, decode error, cancellation and close; allocator substitution SHALL be rejected. Handles SHALL validate library, session, type/shape, generation and declared nullability, and never encode addresses. Native-width values SHALL record selected-target width and reject wrong-target/range conversion. Raw pointer/never signatures, callbacks, variadics, arbitrary GC records and foreign-thread entry SHALL fail before generation in this profile.

#### Scenario: Complete primitive matrix
- **GIVEN** manual and generated fixtures for every required row and both directions
- **WHEN** they execute natively on Linux x86_64/macOS aarch64/Windows x86_64
- **THEN** integer extrema/zero, float bit patterns, bool 0/1, Unicode limits, views, unit, checked handles and word match (R4-ABI-01..12)

#### Scenario: Invalid view and scalar rejected
- **GIVEN** bool 2/255, surrogate/out-of-range char, invalid UTF-8, null nonempty or overflow view
- **WHEN** an adapter validates the value
- **THEN** it rejects before dereference/allocation/foreign call

#### Scenario: Transfer and stale handles
- **GIVEN** a transferred buffer and a closed or reused handle slot
- **WHEN** completion/error/cancel/close and later handle call occur
- **THEN** buffer release runs exactly once and stale handle fails without dispatch

#### Scenario: Unsupported signature
- **GIVEN** a raw pointer, callback or variadic Glue signature
- **WHEN** binding validation runs
- **THEN** it emits terminal unsupported-form diagnostic before materialization

### Requirement: Checked invocation transport preserves failure separately from values
The generated Rust client SHALL additionally expose a source-qualified checked invocation entry for each export, using an i32 status and explicit out parameter for non-unit results. Its symbol SHALL include the full canonical binding identity digest. Direct scalar C entries SHALL remain the physical unsafe ABI basis; managed-input scalar-result entries SHALL use only the checked transport. Checked entries SHALL zero result outputs before validation, check live owning-library and compiled-shape membership before effects, reject invalid bool and Unicode scalar representations, retain managed input roots through invocation, and resolve moved inputs from those roots after all input allocations. Failures SHALL leave outputs zero and release all acquired input roots. Unit checked invocation SHALL return status without a value output. This transport SHALL NOT claim to catch panic or allocation failure until the separately required checked-effect or process boundary has been admitted.

#### Scenario: Invalid checked argument rejects before body effects
- **GIVEN** an admitted binding with bool, Unicode scalar or managed-view parameters
- **WHEN** a checked entry receives an invalid representation or a revoked owner domain
- **THEN** the body has no effects, status reports failure, outputs remain zero and retained roots are released

#### Scenario: Managed argument survives later argument allocation
- **GIVEN** a binding with two managed borrowed input views
- **WHEN** allocation of the second input moves the first managed object
- **THEN** the body receives both values resolved from current canonical root handles and each root is released after invocation

### Requirement: Canonical native kit resolves only proved internal provider symbols
Canonical native kit emission SHALL resolve a C ABI import declaring the reserved runtime library from its own native object closure only when the current compiler-owned corpus is proved, the exact symbol is an ABI manifest export, and the compiled additional objects actually define that symbol. Required-export labels alone SHALL NOT establish ownership. Ordinary host library emission SHALL retain external-library admission and SHALL NOT acquire this canonical exception. The final native image SHALL satisfy the existing export and provenance audits.

#### Scenario: Owned Dynamic bridge in the current kit
- **WHEN** the canonical Dynamic source calls map_owned and the current compiled canonical provider object defines its manifest C export
- **THEN** the kit SHALL link that import to its own provider object without requiring a second runtime library

#### Scenario: Missing or uncontracted producer
- **WHEN** a declared runtime import lacks an actual object definition or lacks its exact manifest export
- **THEN** emission SHALL reject unresolved ownership before linking

#### Scenario: Ordinary library cannot claim canonical ownership
- **WHEN** an ordinary artifact spells the reserved runtime library name
- **THEN** actual same-named object symbols alone SHALL NOT bypass its external-library admission

### Requirement: C profile represents records, enums and function pointers
The C ABI profile SHALL define a record shape for `[GlueRecord]` types. Fields SHALL be placed in declaration order, each at the next offset aligned to its natural alignment; the record alignment SHALL be the largest field alignment, and the record size SHALL be the end offset rounded up to that alignment. The profile SHALL bind a fieldless enum to a `uint32_t` discriminant and an admitted callback to a C function pointer that takes a `uint64_t` context token first and returns an `int32_t` status. The profile SHALL reject a record shape whose stated size, alignment or offsets differ from this computation.

#### Scenario: Record layout matches the target C ABI
- **GIVEN** a `[GlueRecord]` of one `u8` field followed by one `i64` field
- **WHEN** the C profile computes its shape for a supported target
- **THEN** the field offsets are 0 and 8, the alignment is 8 and the size is 16, equal to those of the equivalent C struct on that target

#### Scenario: Inconsistent record shape rejected
- **GIVEN** a record shape that states offset 4 for an `i64` field after a `u8` field
- **WHEN** the C profile binds the shape
- **THEN** the binding is rejected

### Requirement: Bool and Unicode scalar domains in the C profile
The C ABI profile SHALL bind Bool as `uint8_t` restricted to 0 and 1, `char` as `uint32_t` restricted to Unicode scalar values, and `word` as the target `uintptr_t`. These domains SHALL be part of the scalar shape so that Bool and `u8`, and `char` and `u32`, are distinct shapes with the same C type.

#### Scenario: Bool is a distinct shape
- **GIVEN** the surface primitives `bool` and `u8`
- **WHEN** both are mapped to type shapes
- **THEN** both bind to `uint8_t` and the two shapes are not equal

## Informative Source Provenance

The records below preserve migration history. They are not normative except where text was extracted into a requirement above.

### Source Record: C ABI profile

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/content.md`  
**SHA-256:** `660abb68eb7f467e2b36c972b9a6eb51760148dd3b8b32fa3f40160b05d73f72`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
The **C ABI profile** is the normative mapping from **[Interop.Contracts](/platform-spec/language-meta/interop/interop-contracts/)** primitives to **C-compatible** foreign libraries on tier-1 hosts. v0.3 **Standard** conformance uses **link-time** binding ([link-time linking](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/)), **interop view types** ([interop view types](/platform-spec/language-meta/interop/c-abi-profile/interop-view-types/)), and **System V AMD64** for the reference compiler path.

**Dynamic resolution** (`dlopen` / `dlsym`) is a **Proposed** appendix only ([dynamic resolution profile](/platform-spec/language-meta/interop/c-abi-profile/dynamic-resolution-profile/)). **WinAPI** is **out of scope** for stdlib Standard ([platform tier matrix](/platform-spec/language-meta/interop/c-abi-profile/platform-tier-matrix/)).

Lowering uses **Cranelift**; foreign libraries need only expose C ABI entrypoints compatible with emitted calls.
</SpecSection>

<SpecSection title="v0.3 delivery bands" id="v03-delivery-bands">
| Band | Content | Status |
| --- | --- | --- |
| **v0.3.0** | Interop views, link-time import, symbol overrides | Standard (spec); impl may trail |
| **v0.3.1** | `CLayout` primitive structs | Proposed |
| **Later** | Nested FFI structs, enum ABI, foreign-thread entry | Planned after basic FFI |
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Extern import metadata: `compiler/crates/beskid_codegen/src/lowering/context.rs` (`ExternImport`)
- Collection: `compiler/crates/beskid_codegen/src/lowering/lowerable.rs`
- Contract calls: `compiler/crates/beskid_codegen/src/lowering/expressions/call_expression.rs`
- Signature validation: `compiler/crates/beskid_codegen/src/cranelift_host.rs`
- JIT extern resolution: `compiler/crates/beskid_engine/src/engine.rs` (`resolve_process_extern_symbols`)
- Stable view layouts (embedding): `compiler/crates/beskid_abi/src/types.rs`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-LMETA-CABI-0001` … `D-LMETA-CABI-0005`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [C ABI profile — C layout types (v0.3.1)](./articles/c-layout-types/)
- [C ABI profile — Dynamic resolution profile](./articles/dynamic-resolution-profile/)
- [C ABI profile — Extern contracts and linking](./articles/extern-contracts-and-linking/)
- [C ABI profile — Interop view types (v0.3.0)](./articles/interop-view-types/)
- [C ABI profile — Link-time linking](./articles/link-time-linking/)
- [C ABI profile — Platform tier matrix](./articles/platform-tier-matrix/)
- [C ABI profile — Types and call conventions](./articles/types-and-call-conventions/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub owns normative contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/adr/0001-hub-authority/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0001-hub-authority/content.md`  
**SHA-256:** `8fc8cada688aae77b7e130ec4b78a224eafb4cd5258580cd86b3fb62d5043612`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Interop.Contracts primitives need a single C profile authority for tier-1 hosts.

## Decision

This feature hub **must** own normative MUST/SHOULD for **C-compatible** foreign libraries. Sibling articles add detail without redefining hub MUST tables.

## Consequences

Cranelift lowering and foreign library import tooling align to this profile.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/
``````

</details>

### Source Record: Link-time binding Standard tier-1

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/adr/0002-link-time-standard-tier1/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0002-link-time-standard-tier1/content.md`  
**SHA-256:** `de891e608bec1a1fc1a2951c2b564f053bb8db82d3dc0b1af2af58b2a5be4f6e`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Dynamic resolution complicates reproducible builds and target conformance.

## Decision

v0.3 **Standard** tier-1 conformance **must** use **link-time** library binding ([link-time linking](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/)).

## Consequences

The engine feature `extern_dlopen` is retired.

## Verification anchors

`compiler/crates/beskid_codegen`; [Foreign library import](/platform-spec/tooling/foreign-library-import/).
``````

</details>

### Source Record: Runtime dlopen Proposed appendix

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/adr/0003-dynamic-resolution-proposed/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0003-dynamic-resolution-proposed/content.md`  
**SHA-256:** `8938aa59711eb7b0e7b1ad15c6829ee3e05bce31cfd822e50cd7963b497a777c`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Some hosts want late binding; tier-1 reference path standardizes link-time.

## Decision

**Runtime `dlopen` / `dlsym` resolution** is **demoted** to the [dynamic resolution profile](/platform-spec/language-meta/interop/c-abi-profile/dynamic-resolution-profile/) (**Proposed** appendix, not Standard).

## Consequences

Documentation and conformance matrices must not require dlopen for Standard tier-1.

## Verification anchors

`compiler/crates/beskid_engine/src/engine.rs`.
``````

</details>

### Source Record: WinAPI outside stdlib Standard

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/adr/0004-winapi-out-of-stdlib-standard/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0004-winapi-out-of-stdlib-standard/content.md`  
**SHA-256:** `3ea6af102a0da4b793f259a4e85afd741768879808c1940cf9947bc3a411e565`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

WinAPI/stdcall surfaces belong in platform packages with distinct conformance tiers.

## Decision

**WinAPI / stdcall** as a **stdlib** concern is **out of scope** for tier-1 **Standard** conformance; platform packages may document **Proposed** mappings separately.

## Consequences

[Platform tier matrix](/platform-spec/language-meta/interop/c-abi-profile/platform-tier-matrix/) records host-specific tiers.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/
``````

</details>

### Source Record: v0.3.0 views v0.3.1 CLayout bands

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/adr/0005-v03-delivery-bands/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/adr/0005-v03-delivery-bands/content.md`  
**SHA-256:** `eb5df827115d594021b25cac9189d7fe6abd67c3e44f5aa5cb7289e0db77b469`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Implementers need a spec-first schedule when codegen trails text.

## Decision

| Band | Content | Status |
| --- | --- | --- |
| **v0.3.0** | Interop views, link-time import, symbol overrides | Standard (spec; impl may trail) |
| **v0.3.1** | `CLayout` primitive structs | Proposed |
| **Later** | Nested FFI structs, enum ABI, foreign-thread entry | Planned |

## Consequences

Articles tag Proposed vs Standard explicitly; strict validation can gate premature Standard claims.

## Verification anchors

/platform-spec/language-meta/interop/c-abi-profile/ and child articles.
``````

</details>

### Source Record: C ABI profile — C layout types (v0.3.1)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/articles/c-layout-types/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/articles/c-layout-types/content.md`  
**SHA-256:** `7c8c7bdf04964b1c895d5b005281166616d2fa6f2dfe88e4ff88d5dccb846a39`

<details>
<summary>Migrated source text</summary>

``````markdown
> **Status: Proposed (v0.3.1)** — Normative text is stable for planning; reference compiler support **must** trail **[interop view types](./interop-view-types/)** (v0.3.0 Standard).

## Delivery order

1. **v0.3.0 Standard** — interop views, link-time import, export/callback registration.
2. **v0.3.1** — **`CLayout`** on Beskid `type` declarations for FFI-by-value structs with **primitive fields only**.
3. **Later** — nested records, enums with defined representation, arrays inside FFI structs, and WinAPI-specific calling conventions (not stdlib tier-1).

## `CLayout` attribute (planned)

```beskid
[CLayout(Align: 4)]
pub type WinSize {
    i32 ws_row,
    i32 ws_col,
    i32 ws_xpixel,
    i32 ws_ypixel,
}
```

| Rule | v0.3.1 |
| --- | --- |
| Field types | Primitives and other `CLayout` types only |
| Beskid `string` / `T[]` inside struct | **Forbidden** |
| Enums | **Forbidden** until discriminant/size rules exist |
| Alignment / pack | Explicit `Align` / `Pack`; default platform C rules |

## Complex types (explicitly later)

The platform **will** specify nested FFI structs, fixed-size array fields, and enum ABI **after** basic FFI (views + link + export) is implemented and covered by conformance tests. Until then, authors **must** use interop views, pointers as opaque `i64`, or thin C shims.

## Stdlib note

**WinAPI** and **stdcall** layouts are **out of scope** for standard library tier-1 packages. Windows-focused mappings may appear in optional platform packages under **Proposed** profiles, not as corelib **Standard** requirements.
``````

</details>

### Source Record: C ABI profile — Dynamic resolution profile

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/articles/dynamic-resolution-profile/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/articles/dynamic-resolution-profile/content.md`  
**SHA-256:** `f6c6829d3e207cb640b7cc346123ae99ff1787db6ed8500c9e240bd27183022a`

<details>
<summary>Migrated source text</summary>

``````markdown
> **Status: Retired** — The engine feature `extern_dlopen`, its caches and the variables `BESKID_EXTERN_ALLOW` and `BESKID_EXTERN_DENY` are removed. This page remains only as history.

## Behavior (reference)

The JIT backend resolves a required extern symbol when it compiles the artifact: first among the loaded symbols, then in the declared library (`dlopen` with `RTLD_NOW | RTLD_LOCAL`). A failure is a compile error. See `execution--abi-and-host--extern-dispatch-and-policy`.

## Relationship to v0.3 Standard

Production builds **should** use **[link-time linking](./link-time-linking/)**.

## Deprecation direction

New platform-spec and CLI work **must** target link-time binding.
``````

</details>

### Source Record: C ABI profile — Extern contracts and linking

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/articles/extern-contracts-and-linking/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/articles/extern-contracts-and-linking/content.md`  
**SHA-256:** `c99056d9cb7679b06d9652fa8e08c3a99c6861e21e8cd81194ac2dd68451b501`

<details>
<summary>Migrated source text</summary>

``````markdown
## Extern metadata

User foreign entrypoints are declared on **`contract`** types using the **`Extern`** attribute (see **[FFI and extern](/platform-spec/language-meta/interop/ffi-and-extern/)**). The C ABI profile interprets attribute fields as:

- **`Abi`** — in current toolchains, **`"C"`** is the supported user-facing choice for this profile; other strings are reserved.
- **`Library`** — shared object or loadable module path semantics as implemented by the engine when dynamic resolution is enabled.

Implementation references: `ExternImport` in `compiler/crates/beskid_codegen/src/lowering/context.rs` and collection in `compiler/crates/beskid_codegen/src/lowering/lowerable.rs`.

## Link-time resolution (v0.3 Standard)

User **`Extern`** symbols **must** be satisfied at **link time** via project **`link`** metadata and driver inputs. See **[link-time linking](/platform-spec/language-meta/interop/c-abi-profile/link-time-linking/)** and **[foreign library import](/platform-spec/tooling/foreign-library-import/)**.

Artifacts with unresolved imports **must** fail before run with diagnostics listing `(library, symbol)` pairs.

## Dynamic resolution (non-Standard)

Runtime **`dlopen` / `dlsym`** is documented under **[dynamic resolution profile](/platform-spec/language-meta/interop/c-abi-profile/dynamic-resolution-profile/)** (Proposed). It **must not** be described as the default path in v0.3 platform-spec.

## AOT and JIT parity

Object emission paths **must** surface the same import set for a given artifact; unresolved symbols **must** fail at link time with parity between JIT link drivers and AOT link steps.
``````

</details>

### Source Record: C ABI profile — Interop view types (v0.3.0)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/articles/interop-view-types/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/articles/interop-view-types/content.md`  
**SHA-256:** `4355b50b6beb24e7bbc406f6636f9530c8cf434090a441eb54d25d38a89375d5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Purpose

v0.3.0 introduces **interop view types**: transparent records with **stable C layout** used only at FFI boundaries. They align with runtime `repr(C)` helpers in `compiler/crates/beskid_abi/src/types.rs` without exposing GC-managed Beskid `string` or `T[]` directly.

Canonical definitions **should** live in corelib under an **`Interop`** package (exact package id is a corelib layout decision).

## Normative layouts (tier-1, 64-bit)

Layouts use pointer-sized fields in C ABI order.

### `CStringView`

UTF-8 byte range (does not imply null termination on the foreign side unless documented).

| Field | Type | Meaning |
| --- | --- | --- |
| `ptr` | pointer / `i64` | Start of bytes |
| `len` | `i64` | Byte length |

Maps to **`BeskidStr`** at the runtime embedding boundary.

### `CBuffer`

Read/write byte range.

| Field | Type | Meaning |
| --- | --- | --- |
| `ptr` | pointer / `i64` | Start of bytes |
| `len` | `i64` | Logical length |

### `CArrayView`

Fat-pointer compatible with runtime arrays.

| Field | Type | Meaning |
| --- | --- | --- |
| `ptr` | pointer / `i64` | Element storage |
| `len` | `i64` | Logical element count |
| `cap` | `i64` | Capacity |

Maps to **`BeskidArray`** where the profile documents element size separately.

## Permitted primitives (v0.3.0)

`bool` (as **`i8`** at boundary), `u8`, `i32`, `i64`, `f64`, `unit`, interop views above, and **`ref u8`** (legacy narrow slice start — prefer views).

## Lowering

The C ABI profile lowers views to a **flat list** of machine parameters per System V AMD64 (pointer and integer slots). The engine signature validator **must** accept only types expressible in that flat list.

## After basic FFI

**`CLayout` records** with primitive fields only arrive in **v0.3.1** ([C layout types](./c-layout-types/)). Nested structs, enums, and arrays inside FFI structs remain **deferred** until that band is stable.
``````

</details>

### Source Record: C ABI profile — Link-time linking

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/articles/link-time-linking/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/articles/link-time-linking/content.md`  
**SHA-256:** `277c381b436ee4530d83eafd3b342c537cab6a86d9f18facc63f72714a27e5b5`

<details>
<summary>Migrated source text</summary>

``````markdown
## Standard conformance path

For **Standard** tier-1 conformance (System V AMD64 ELF hosts), user **`Extern`** symbols **must** be resolved at **link time** using:

1. **`Library`** strings on contracts (logical names).
2. Project **`link`** manifest metadata (see **[project link libraries](/platform-spec/tooling/manifests-and-lockfiles/project-manifest-contract/project-link-libraries/)**).
3. Driver-supplied linker inputs from **`beskid link`** / build commands and optional **[foreign library import](/platform-spec/tooling/foreign-library-import/)** mapping.

JIT and AOT backends **must** emit undefined symbols compatible with the platform linker for imports collected in **`ExternImport`**.

## Symbol identity

Link symbols use the method **`Symbol`** override when present; otherwise the Beskid method name. Name mangling **must not** apply to user extern symbols.

## Security

The AOT link step fails with E4050 when a required extern names a library that is not linked. No environment variable changes this check.

## JIT note

JIT extern resolution at compile time is not the Standard story in v0.3; link-time binding is.

## AOT parity

AOT object emission **must** surface the same import set as JIT for a given artifact. Unresolved imports **must** fail at link time with actionable diagnostics listing missing symbols/libraries.

## Reference compiler status

On Linux tier-1, the AOT driver passes project `link.libraries` and discovered `ExternImport.library` values through `AotBuildRequest::external_libraries` (`compiler/crates/beskid_aot/src/api.rs`) and appends `-l<library>` / `-L<path>` in `compiler/crates/beskid_aot/src/linker.rs`. The engine consumer merges manifest link metadata in `compiler/crates/beskid_engine/src/link_libraries.rs`. Verification: `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs::link_time_extern_getpid_matches_platform_spec`.
``````

</details>

### Source Record: C ABI profile — Platform tier matrix

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/articles/platform-tier-matrix/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/articles/platform-tier-matrix/content.md`  
**SHA-256:** `c309451a03a0d3b048de958c0e3d59e207cad4e82b840e1bed838abd1dcead30`

<details>
<summary>Migrated source text</summary>

``````markdown
## Tier-1 Standard (v0.3)

| Host | Calling convention | Linking | Stdlib foreign libs |
| --- | --- | --- | --- |
| Linux x86_64 ELF | System V AMD64 | Link-time | `libc`, `libpthread` class |
| macOS x86_64 / arm64 (POSIX) | Platform C ABI | Link-time | `libc`, `libSystem` class |

Reference compiler conformance claims **must** be justified against this matrix for user **`Extern`**.

## Proposed (not Standard in v0.3)

| Host | Notes |
| --- | --- |
| Windows x86_64 | **WinAPI / stdcall** — **out of scope for stdlib**. Optional platform packages may declare `Extern` contracts against `ucrtbase` / `kernel32` under a **Proposed** profile; not required for corelib **Standard**. |
| Dynamic-only resolution | **[Dynamic resolution profile](./dynamic-resolution-profile/)** |
| Foreign-thread callback entry | v0.3.2+ planning |

## Corelib policy

Standard library packages **must not** require WinAPI linkage for **Standard** conformance. Console and threading on Windows may ship as **optional platform packages** until a Proposed Windows profile is promoted.

Linux/macOS libc contracts in corelib remain the reference patterns for **`Extern`** documentation and tests.
``````

</details>

### Source Record: C ABI profile — Types and call conventions

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/c-abi-profile/articles/types-and-call-conventions/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/c-abi-profile/articles/types-and-call-conventions/content.md`  
**SHA-256:** `334ab6a51922c11d7d09c6c199e868b444de4db6262b0fcceee580fc08e7a6ea`

<details>
<summary>Migrated source text</summary>

``````markdown
## Calling convention

For user **`contract`** calls lowered through the reference compiler path, parameters and returns are prepared for **System V AMD64** when targeting that platform. This matches the explicit `CallConv::SystemV` selection in the contract call lowering implementation.

Other targets must document their own mapping in a future revision of this article; until then, only the documented tier-1 mapping is normative for **Standard** conformance claims.

## Permitted value shapes (v0.3.0)

The C ABI profile instantiates **[Interop.Contracts](/platform-spec/language-meta/interop/interop-contracts/)** as follows:

- **Scalar** — `bool` as **`i8`**, `u8`, `i32`, `i64`, `f64`, `unit`.
- **Interop views** — **`CStringView`**, **`CBuffer`**, **`CArrayView`** per **[interop view types](/platform-spec/language-meta/interop/c-abi-profile/interop-view-types/)**.
- **Opaque handle** — pointer-sized slot or `i64` where documented.
- **`ref u8`** — narrow legacy slice start; prefer **`CBuffer`**.

Beskid **`string`** and **`T[]`** GC values **must not** appear on user `Extern` signatures in v0.3.0 Standard.

**`CLayout` structs** (primitive fields only) are **v0.3.1** — **[C layout types](/platform-spec/language-meta/interop/c-abi-profile/c-layout-types/)**. Nested complex types are **deferred** until basic FFI is implemented.

Types with unstable Beskid-only layout **must not** cross the boundary without an adapter or shim.

## Cranelift note

Beskid user code and bridge code are lowered with **Cranelift**; foreign libraries need only expose **C ABI** entrypoints compatible with the emitted calls. See also `/execution/runtime/ffi/` for additional lowering narrative.
``````

</details>
