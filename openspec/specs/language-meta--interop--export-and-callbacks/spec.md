<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Export and callbacks Specification

## Purpose

v0.3 normative Beskid export to C hosts and callback registration tables.

## Requirements

### Requirement: Feature hub owns normative contract: Decision [D-LMETA-EXPORT-0001]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature hub **must** own normative MUST/SHOULD for Beskid **export** and **callback registration** (user interop).

**Stable ID:** `BSP-REQ-DD66DBC36293`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/adr/0001-hub-authority/content.md`  
**Source SHA-256:** `ebff8ca0ea8f20299b6e999c5e3bba3ff830d8b96e41fa57c992d00072511246`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: User export distinct from runtime builtins: Decision [D-LMETA-EXPORT-0002]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> User **export** symbols are **generated** from Beskid compilation units. Frozen **runtime builtin** exports remain on **`beskid_abi`** / **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** — export-only work **must not** change `BESKID_RUNTIME_ABI_VERSION`.

**Stable ID:** `BSP-REQ-AADD43AF2937`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/adr/0002-distinct-from-runtime-builtins/content.md`  
**Source SHA-256:** `0f58bc819fdcedb617b22af8e23c914a17727db3cc679269531de709ecde112a`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Export on pub functions v0.3: Decision [D-LMETA-EXPORT-0003]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> v0.3 Standard **must** support **`[Export]`** on **`pub` functions** with FFI-permitted types. Exporting arbitrary **`contract`** vtables as Standard is **out of scope** for v0.3.

**Stable ID:** `BSP-REQ-BD779AD7B20D`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/adr/0003-export-pub-functions-v03/content.md`  
**Source SHA-256:** `907ee96e6c70a6aa27be5c9e2720b77e3b1ab4fc0bef82f9b64b5e65c4a23a3d`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

### Requirement: Standard spec implementation may trail: Decision [D-LMETA-EXPORT-0004]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> This feature is **Standard** in v0.3 specification. Reference compiler support **may** trail; verification article records gaps until codegen lands.

**Stable ID:** `BSP-REQ-99088FB02EE3`  
**Legacy source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/adr/0004-spec-standard-impl-may-trail/content.md`  
**Source SHA-256:** `260d9e9e1c13a906dd66cfd73fb97b0f52bbb7daa19480f874cbcf2e2e4f5d60`

#### Scenario: Conformance exercises Decision
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Export and callbacks

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/export-and-callbacks/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/content.md`  
**SHA-256:** `3a025ff918f48d011d545a7c7d1a3c86e328396a3ccf036d7977700114083840`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="What this feature specifies" id="what-this-feature-specifies">
**Export and callbacks** defines how Beskid code **exposes** entrypoints to foreign hosts (plugins, embedders, C drivers) and how **function-pointer callbacks** are registered for re-entry.

This is **user interop**, not the frozen **runtime builtin** table on the **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)**. Export symbols are **generated** from Beskid compilation units; runtime builtins remain **`beskid_abi`** exports.
</SpecSection>

<SpecSection title="v0.3 scope" id="v03-scope">
| In scope | Out of scope |
| --- | --- |
| **`[Export]`** on **`pub` functions** with FFI-permitted types | Exporting arbitrary `contract` vtables as Standard |
| **Callback registration** table protocol | Foreign-thread entry without host contract (Proposed v0.3.2+) |
| **Trampolines** for GC-safe re-entry | Changing `BESKID_RUNTIME_ABI_VERSION` for export-only features |

Spec is **Standard** in v0.3; reference compiler support for export lowering, callback registration, and link-time extern resolution is landed on Linux tier-1 (see **[verification](./verification-and-traceability/)**).
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- Export metadata in `compiler/crates/beskid_codegen/src/lowering/expressions/export.rs` and `compiler/crates/beskid_codegen/src/lowering/context.rs` (`CodegenArtifact::exports`)
- AOT export table and linker export policy: `compiler/crates/beskid_aot/src/export_table.rs`
- Callback registration and GC-safe trampolines: `compiler/crates/beskid_runtime/src/builtins/callback.rs` (`beskid_register_callbacks`, `BESKID_USER_FFI_LAYOUT_BAND` in `compiler/crates/beskid_abi/src/symbols.rs`)
- Optional extension of `interop_dispatch_*` for typed host callbacks (reserved; not user `Extern`)
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No open decisions. Closed choices are normative ADRs under **`adr/`** (`D-LMETA-EXPORT-0001` … `D-LMETA-EXPORT-0004`); use the reader **ADRs** tab for expandable detail.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
- [Callback registration](./articles/callback-registration/)
- [Export attribute](./articles/export-attribute/)
- [Export and callbacks — Verification and traceability](./articles/verification-and-traceability/)
<!-- /spec:generate:article-index -->
``````

</details>

### Source Record: Feature hub owns normative contract

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/export-and-callbacks/adr/0001-hub-authority/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/adr/0001-hub-authority/content.md`  
**SHA-256:** `ebff8ca0ea8f20299b6e999c5e3bba3ff830d8b96e41fa57c992d00072511246`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Export/callback rules were scattered between runtime and language-meta drafts.

## Decision

This feature hub **must** own normative MUST/SHOULD for Beskid **export** and **callback registration** (user interop).

## Consequences

Distinct from runtime builtin exports on Rust ABI profile.

## Verification anchors

/platform-spec/language-meta/interop/export-and-callbacks/
``````

</details>

### Source Record: User export distinct from runtime builtins

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/export-and-callbacks/adr/0002-distinct-from-runtime-builtins/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/adr/0002-distinct-from-runtime-builtins/content.md`  
**SHA-256:** `0f58bc819fdcedb617b22af8e23c914a17727db3cc679269531de709ecde112a`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Plugin authors confused generated exports with frozen JIT builtin tables.

## Decision

User **export** symbols are **generated** from Beskid compilation units. Frozen **runtime builtin** exports remain on **`beskid_abi`** / **[Rust ABI profile](/platform-spec/language-meta/interop/rust-abi-profile/)** — export-only work **must not** change `BESKID_RUNTIME_ABI_VERSION`.

## Consequences

Codegen plans export metadata beside `ExternImport`; trampolines use runtime TLS hooks.

## Verification anchors

/platform-spec/language-meta/interop/export-and-callbacks/ implementation anchors.
``````

</details>

### Source Record: Export on pub functions v0.3

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/export-and-callbacks/adr/0003-export-pub-functions-v03/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/adr/0003-export-pub-functions-v03/content.md`  
**SHA-256:** `907ee96e6c70a6aa27be5c9e2720b77e3b1ab4fc0bef82f9b64b5e65c4a23a3d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

Embedding hosts need a minimal stable export surface before full vtable stories.

## Decision

v0.3 Standard **must** support **`[Export]`** on **`pub` functions** with FFI-permitted types. Exporting arbitrary **`contract`** vtables as Standard is **out of scope** for v0.3.

## Consequences

Callback registration table protocol is Standard; foreign-thread entry without host contract is Proposed v0.3.2+.

## Verification anchors

[export attribute](/platform-spec/language-meta/interop/export-and-callbacks/export-attribute/); [callback registration](/platform-spec/language-meta/interop/export-and-callbacks/callback-registration/).
``````

</details>

### Source Record: Standard spec implementation may trail

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/export-and-callbacks/adr/0004-spec-standard-impl-may-trail/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/adr/0004-spec-standard-impl-may-trail/content.md`  
**SHA-256:** `260d9e9e1c13a906dd66cfd73fb97b0f52bbb7daa19480f874cbcf2e2e4f5d60`

<details>
<summary>Migrated source text</summary>

``````markdown
## Context

v0.3 is spec-first for interop; codegen for export is still landing.

## Decision

This feature is **Standard** in v0.3 specification. Reference compiler support **may** trail; verification article records gaps until codegen lands.

## Consequences

Contributors implement against ADRs without downgrading spec status to Proposed.

## Verification anchors

[verification and traceability](/platform-spec/language-meta/interop/export-and-callbacks/verification-and-traceability/).
``````

</details>

### Source Record: Callback registration

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/export-and-callbacks/articles/callback-registration/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/articles/callback-registration/content.md`  
**SHA-256:** `4f558bdc62b19404368ddf14ee2f47db24dab72de67906530bc6b1c7e8b6f5a3`

<details>
<summary>Migrated source text</summary>

``````markdown
## Model

Foreign hosts (game engines, shells, OS services) register Beskid **callbacks** before or during runtime. v0.3 Standard defines:

1. **Exported Beskid functions** — normal `[Export]` entrypoints.
2. **Registration contract** — a Beskid `contract` describing callback function-pointer types the host implements or consumes.
3. **Registration export** — a stable C symbol the host calls to install a table of function pointers.

## Registration export (normative shape)

The platform reserves a runtime or generated symbol (exact name is toolchain-defined; example):

```text
beskid_register_callbacks(version: u32, table: *const CallbackTable, count: usize) -> i32
```

| Field | Meaning |
| --- | --- |
| `version` | **User FFI layout band** — must match `BESKID_USER_FFI_LAYOUT_BAND` |
| `table` | Array of `{ symbol_id, fn_ptr, userdata }` rows |
| `count` | Number of rows |
| Return | `0` success; non-zero stable error codes |

Hosts **must** reject unknown `version` values.

## Reference symbol

The reference runtime exposes `beskid_register_callbacks` from `compiler/crates/beskid_runtime/src/builtins/callback.rs`, registered in `RUNTIME_EXPORT_SYMBOLS` and `BUILTIN_SPECS` via `compiler/crates/beskid_abi/src/symbols.rs`. Hosts **must** pass `version == BESKID_USER_FFI_LAYOUT_BAND` (initial Standard value `1`).

## Beskid-side callback exports

Each callback slot points at a **`[Export(Abi:"C")]`** function or a **compiler-generated trampoline** that:

- Enters runtime TLS / heap scope.
- Performs any GC safepoint policy required before executing Beskid code.
- Maps parameters from C layout to Beskid types.

## Import-side function pointers

`Extern` contracts **may** accept function-pointer parameters when the pointee is a documented **`Export`** or trampoline symbol. See **[callback call shapes](/platform-spec/language-meta/interop/interop-contracts/callback-call-shapes/)**.

## Non-goals (v0.3)

- Automatic binding generation from C headers.
- Foreign-thread callback without host lifecycle contract (Proposed later).
``````

</details>

### Source Record: Export attribute

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/export-and-callbacks/articles/export-attribute/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/articles/export-attribute/content.md`  
**SHA-256:** `8f83321c3ed87c9089d4315a987bfa36f326b3f2bfcf938cfc51f6802f322e5b`

<details>
<summary>Migrated source text</summary>

``````markdown
## Placement

**`Export`** applies to **`pub` function definitions** only in v0.3 Standard. Contract methods, types, and modules **must not** use **`Export`** until a future profile promotes contract vtables.

## Attribute fields

| Field | Required | Meaning |
| --- | --- | --- |
| **`Abi`** | yes | **`"C"`** for v0.3 Standard |
| **`Symbol`** | no | Exported linker symbol; default is the Beskid function name (unmangled) |

Example:

```beskid
[Export(Abi:"C", Symbol:"beskid_plugin_init")]
pub i64 plugin_init(i64 host_api_version) {
    return 0;
}
```

## Permitted signatures

Export functions **must** use the same type set as **`Extern`** import methods in v0.3.0 ([interop view types](/platform-spec/language-meta/interop/c-abi-profile/interop-view-types/)).

## Linkage

Exported symbols **must** be emitted with global linkage visible to the platform linker. The build driver **must** include Beskid-generated objects and the runtime static archive per backend docs.

## Panics

Panics in exported functions **must** be treated as **non-returning traps** across the boundary ([error and unwind](/platform-spec/language-meta/interop/interop-contracts/error-and-unwind-semantics/)).
``````

</details>

### Source Record: Export and callbacks — Verification and traceability

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/language-meta/interop/export-and-callbacks/articles/verification-and-traceability/`  
**Source:** `site/spec-content/platform-spec/language-meta/interop/export-and-callbacks/articles/verification-and-traceability/content.md`  
**SHA-256:** `e2984175ba1c202f327ad72ea08b2c25b9060d428f6b4375bf45991c4aab443d`

<details>
<summary>Migrated source text</summary>

``````markdown
## Reference compiler status

| Surface | Status | Primary verification |
| --- | --- | --- |
| `[Export(Abi:"C", Symbol:"...")]` on `pub fn` | Implemented (codegen + AOT) | `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs::export_plugin_init_visible_to_linker` |
| Callback registration `beskid_register_callbacks` + layout band | Implemented (runtime export) | `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs::host_registers_callbacks_with_layout_band` |
| Link-time `Extern` via project `link` / `external_libraries` | Implemented (AOT linker, Linux tier-1) | `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs::link_time_extern_getpid_matches_platform_spec` |
| `Export` on non-`pub` function | Codegen diagnostic | `compiler/crates/beskid_tests/src/interop/export.rs::export_on_non_pub_function_fails_codegen` |

## Verification anchors

- Engine (Linux tier-1): `compiler/crates/beskid_engine/tests/ffi_v03_link_time.rs` — link-time `getpid`, shared-library export visibility, callback layout-band gate.
- Integration: `compiler/crates/beskid_tests/src/interop/export.rs`, `compiler/crates/beskid_tests/src/interop/callback.rs`.
- Codegen export metadata: `compiler/crates/beskid_codegen/src/lowering/expressions/export.rs`, `compiler/crates/beskid_codegen/src/lowering/context.rs` (`CodegenArtifact::exports`).
- AOT export table: `compiler/crates/beskid_aot/src/export_table.rs`.
- Runtime callback registration: `compiler/crates/beskid_runtime/src/builtins/callback.rs` (`beskid_register_callbacks`).
- ABI symbols: `compiler/crates/beskid_abi/src/symbols.rs` (`SYM_BESKID_REGISTER_CALLBACKS`, `BESKID_USER_FFI_LAYOUT_BAND`), `compiler/crates/beskid_abi/src/builtins.rs` (`BUILTIN_SPECS`).

## Runtime ABI

Adding **user export symbols** **must not** change `RUNTIME_EXPORT_SYMBOLS` unless a new **runtime-provided** registrar is promoted to the Rust ABI profile. `beskid_register_callbacks` is a runtime export for host registration; user `[Export]` symbols remain generated from Beskid compilation units.
``````

</details>
