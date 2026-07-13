<!-- migrated from the legacy platform spec; canonical OpenSpec source -->
# Dynamic types and mapping (v0.3 scope) Specification

## Purpose

Normative dynamic cell representation, AOT object-to-object mapping, and runtime fallback for serializable types.

## Requirements

### Requirement: Dynamic types and mapping (v0.3 scope): Contract [compiler/codegen-and-ir/dynamic-types-and-mapping]
The Beskid standard SHALL enforce the following migrated contract section. Accepted ADR decisions are binding; uppercase requirement keywords retain their BCP-14 meaning.

> <SpecSection title="v0.3 scope" id="scope">
> This article specifies the v0.3 **dynamic typing** surface: a GC-visible dynamic cell, compile-time object-to-object mapping for eligible `[Serialize]` shapes, and a runtime fallback when static shape information is unavailable at compile time.
> 
> Goals:
> 
> 1. **Dynamic type** representation in HIR/CLIF for schema-evolving payloads without language-level reflection.
> 2. **AOT object-to-object mapping** for known serializable types at compile time.
> 3. **Runtime mapping** for dynamic values when static shape is unavailable.
> 4. Eligibility enforced by **Serialization Mod analyzers** — mapping applies only to types classified as serializable; codegen MUST consult that signal and MUST NOT bypass it.
> </SpecSection>
> 
> <SpecSection title="HIR/CLIF representation" id="hir-clif">
> The `dynamic` surface (named alias until a language primitive lands) lowers to a **pointer-sized CLIF value** referencing a runtime [`DynamicCell`](compiler/crates/beskid_runtime/src/dynamic/cell.rs) header allocated through the runtime arena.
> 
> **Cell header layout (normative):**
> 
> | Field | Width | Semantics |
> | --- | --- | --- |
> | `shape_id` | `u32` | Registered object shape tag used by mapping tables |
> | `flags` | `u32` | Reserved (zero in v0.3) |
> | `payload` | pointer | Arena-allocated static object or inline buffer; traced when non-null |
> 
> **Allocation:** cell headers and mapping target objects MUST be allocated through the runtime arena builtins (`dynamic_cell_create`, `dynamic_object_alloc`) to honour Phase A single-mutator rules. Codegen MUST NOT introduce parallel allocators for dynamic cells.
> 
> **GC tracing:** non-null `payload` pointers are treated as heap references and traced by the runtime collector; null payloads are ignored.
> 
> **Lowering entry points:** cell creation, static wrap, checked cast, AOT map, and fallback map are emitted as imported runtime builtins from `compiler/crates/beskid_codegen/src/lowering/expressions/dynamic.rs`. Type mapping for the `dynamic` alias is centralized in `compiler/crates/beskid_codegen/src/lowering/types.rs`.
> </SpecSection>
> 
> <SpecSection title="AOT object-to-object mapping" id="aot-mapping">
> When both source and destination static shapes are known and mod-eligible, codegen emits a direct call to `dynamic_map_aot(src_shape, dst_shape, src_ptr, dst_out)` after eligibility checks.
> 
> **Eligibility (normative):**
> 
> - Delegated to Serialization Mod analyzers on the analysis surface; until a dedicated analyzer signal is threaded into [`TypeResult`](compiler/crates/beskid_analysis/src/types/context/context.rs), codegen applies the same structural rules as the `[Serialize]` contract: only structs whose fields are primitives or nested eligible structs, with deterministic declaration-order field lists.
> - Ineligible pairs MUST fail lowering with structured diagnostic **`E2013`** (`IneligibleSerializeMapping`) — never silent mapping or runtime panic from codegen.
> 
> **Mapping kinds (v0.3):**
> 
> - **Identity mapping:** source and destination structs share field names, order, and types; field steps copy memory ranges in declaration order.
> - **Transform mapping:** same eligibility gate; v0.3 registers explicit offset/size steps in the runtime shape table (future Serialization Mod generators populate the table).
> 
> **Shape identifiers:** stable per resolved item id (FNV-1a hash in v0.3) so AOT tables and runtime registration agree across codegen and tests.
> 
> Implementation: `compiler/crates/beskid_codegen/src/lowering/expressions/mapping.rs` (lowering) and `compiler/crates/beskid_codegen/src/lowering/expressions/serialize.rs` (eligibility).
> </SpecSection>
> 
> <SpecSection title="Runtime fallback" id="runtime-fallback">
> When compile-time shape information is unavailable (value already wrapped in a `DynamicCell`), generated code calls `dynamic_map_fallback(cell, dst_shape, dst_out)`.
> 
> **Algorithm:**
> 
> 1. Reject null cell payload → `DYNAMIC_ERR_NULL_PAYLOAD`.
> 2. Require registered source and destination shapes → `DYNAMIC_ERR_UNKNOWN_SRC_SHAPE` / `DYNAMIC_ERR_UNKNOWN_DST_SHAPE`.
> 3. Look up field steps for `(cell.shape_id, dst_shape)` in the runtime mapping table.
> 4. On missing or incompatible mapping → **`DYNAMIC_ERR_INCOMPATIBLE`** (`E-dynamic-map-001`); this path is deterministic and structured — no implicit reflection or best-effort coercion.
> 
> Fallback shares the same field-step table as the AOT path (`compiler/crates/beskid_runtime/src/dynamic/table.rs`, `compiler/crates/beskid_runtime/src/dynamic/fallback.rs`).
> </SpecSection>
> 
> <SpecSection title="Eligibility and Serialization Mods" id="eligibility">
> Mapping MUST NOT bypass Serialization Mod analyzer classification. Codegen reads the analyzer signal on the typed program (structural stand-in until mod host wiring lands) via `require_mapping_eligible` in `serialize.rs`.
> 
> Cross-reference: [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/) for analyzer contracts; [Serialization packages](/platform-spec/language-meta/metaprogramming/serialization/) for serializable type constraints.
> </SpecSection>
> 
> <SpecSection title="Implementation anchors" id="implementation-anchors">
> - CLIF lowering: `compiler/crates/beskid_codegen/src/lowering/expressions/dynamic.rs`
> - AOT mapping + eligibility: `compiler/crates/beskid_codegen/src/lowering/expressions/mapping.rs`, `compiler/crates/beskid_codegen/src/lowering/expressions/serialize.rs`
> - Dynamic CLIF type mapping: `compiler/crates/beskid_codegen/src/lowering/types.rs`
> - Codegen diagnostic **`E2013`**: `compiler/crates/beskid_codegen/src/diagnostics.rs`
> - Runtime cell + tables + fallback: `compiler/crates/beskid_runtime/src/dynamic/`
> - C ABI builtins: `compiler/crates/beskid_runtime/src/builtins/dynamic.rs`
> - ABI symbol registration: `compiler/crates/beskid_abi/src/symbols.rs`, `compiler/crates/beskid_abi/src/builtins.rs`
> - Integration tests: `compiler/crates/beskid_tests/src/codegen/dynamic_types/`, `compiler/crates/beskid_tests/src/runtime/dynamic/`
> </SpecSection>

**Stable ID:** `BSP-REQ-2F2436C9A68F`  
**Legacy source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/dynamic-types-and-mapping/content.md`  
**Source SHA-256:** `7b9163fc4dbf2b24616a4cbca726d30e571a45020adf1f8b8ec64fb386de7266`

#### Scenario: Conformance exercises Contract
- **GIVEN** an implementation claims conformance with this capability
- **WHEN** behavior governed by this contract section is exercised
- **THEN** every MUST, SHALL, REQUIRED, prohibition, and accepted decision in the section is satisfied

## Informative Source Provenance

The records below preserve migration history and are not normative except where text was extracted into a requirement above.

### Source Record: Dynamic types and mapping (v0.3 scope)

**Authority:** informative provenance  
**Legacy path:** `/platform-spec/compiler/codegen-and-ir/dynamic-types-and-mapping/`  
**Source:** `site/spec-content/platform-spec/compiler/codegen-and-ir/dynamic-types-and-mapping/content.md`  
**SHA-256:** `7b9163fc4dbf2b24616a4cbca726d30e571a45020adf1f8b8ec64fb386de7266`

<details>
<summary>Migrated source text</summary>

``````markdown
<SpecSection title="v0.3 scope" id="scope">
This article specifies the v0.3 **dynamic typing** surface: a GC-visible dynamic cell, compile-time object-to-object mapping for eligible `[Serialize]` shapes, and a runtime fallback when static shape information is unavailable at compile time.

Goals:

1. **Dynamic type** representation in HIR/CLIF for schema-evolving payloads without language-level reflection.
2. **AOT object-to-object mapping** for known serializable types at compile time.
3. **Runtime mapping** for dynamic values when static shape is unavailable.
4. Eligibility enforced by **Serialization Mod analyzers** — mapping applies only to types classified as serializable; codegen MUST consult that signal and MUST NOT bypass it.
</SpecSection>

<SpecSection title="HIR/CLIF representation" id="hir-clif">
The `dynamic` surface (named alias until a language primitive lands) lowers to a **pointer-sized CLIF value** referencing a runtime [`DynamicCell`](compiler/crates/beskid_runtime/src/dynamic/cell.rs) header allocated through the runtime arena.

**Cell header layout (normative):**

| Field | Width | Semantics |
| --- | --- | --- |
| `shape_id` | `u32` | Registered object shape tag used by mapping tables |
| `flags` | `u32` | Reserved (zero in v0.3) |
| `payload` | pointer | Arena-allocated static object or inline buffer; traced when non-null |

**Allocation:** cell headers and mapping target objects MUST be allocated through the runtime arena builtins (`dynamic_cell_create`, `dynamic_object_alloc`) to honour Phase A single-mutator rules. Codegen MUST NOT introduce parallel allocators for dynamic cells.

**GC tracing:** non-null `payload` pointers are treated as heap references and traced by the runtime collector; null payloads are ignored.

**Lowering entry points:** cell creation, static wrap, checked cast, AOT map, and fallback map are emitted as imported runtime builtins from `compiler/crates/beskid_codegen/src/lowering/expressions/dynamic.rs`. Type mapping for the `dynamic` alias is centralized in `compiler/crates/beskid_codegen/src/lowering/types.rs`.
</SpecSection>

<SpecSection title="AOT object-to-object mapping" id="aot-mapping">
When both source and destination static shapes are known and mod-eligible, codegen emits a direct call to `dynamic_map_aot(src_shape, dst_shape, src_ptr, dst_out)` after eligibility checks.

**Eligibility (normative):**

- Delegated to Serialization Mod analyzers on the analysis surface; until a dedicated analyzer signal is threaded into [`TypeResult`](compiler/crates/beskid_analysis/src/types/context/context.rs), codegen applies the same structural rules as the `[Serialize]` contract: only structs whose fields are primitives or nested eligible structs, with deterministic declaration-order field lists.
- Ineligible pairs MUST fail lowering with structured diagnostic **`E2013`** (`IneligibleSerializeMapping`) — never silent mapping or runtime panic from codegen.

**Mapping kinds (v0.3):**

- **Identity mapping:** source and destination structs share field names, order, and types; field steps copy memory ranges in declaration order.
- **Transform mapping:** same eligibility gate; v0.3 registers explicit offset/size steps in the runtime shape table (future Serialization Mod generators populate the table).

**Shape identifiers:** stable per resolved item id (FNV-1a hash in v0.3) so AOT tables and runtime registration agree across codegen and tests.

Implementation: `compiler/crates/beskid_codegen/src/lowering/expressions/mapping.rs` (lowering) and `compiler/crates/beskid_codegen/src/lowering/expressions/serialize.rs` (eligibility).
</SpecSection>

<SpecSection title="Runtime fallback" id="runtime-fallback">
When compile-time shape information is unavailable (value already wrapped in a `DynamicCell`), generated code calls `dynamic_map_fallback(cell, dst_shape, dst_out)`.

**Algorithm:**

1. Reject null cell payload → `DYNAMIC_ERR_NULL_PAYLOAD`.
2. Require registered source and destination shapes → `DYNAMIC_ERR_UNKNOWN_SRC_SHAPE` / `DYNAMIC_ERR_UNKNOWN_DST_SHAPE`.
3. Look up field steps for `(cell.shape_id, dst_shape)` in the runtime mapping table.
4. On missing or incompatible mapping → **`DYNAMIC_ERR_INCOMPATIBLE`** (`E-dynamic-map-001`); this path is deterministic and structured — no implicit reflection or best-effort coercion.

Fallback shares the same field-step table as the AOT path (`compiler/crates/beskid_runtime/src/dynamic/table.rs`, `compiler/crates/beskid_runtime/src/dynamic/fallback.rs`).
</SpecSection>

<SpecSection title="Eligibility and Serialization Mods" id="eligibility">
Mapping MUST NOT bypass Serialization Mod analyzer classification. Codegen reads the analyzer signal on the typed program (structural stand-in until mod host wiring lands) via `require_mapping_eligible` in `serialize.rs`.

Cross-reference: [Compiler Mod SDK](/platform-spec/language-meta/metaprogramming/compiler-mod-sdk/) for analyzer contracts; [Serialization packages](/platform-spec/language-meta/metaprogramming/serialization/) for serializable type constraints.
</SpecSection>

<SpecSection title="Implementation anchors" id="implementation-anchors">
- CLIF lowering: `compiler/crates/beskid_codegen/src/lowering/expressions/dynamic.rs`
- AOT mapping + eligibility: `compiler/crates/beskid_codegen/src/lowering/expressions/mapping.rs`, `compiler/crates/beskid_codegen/src/lowering/expressions/serialize.rs`
- Dynamic CLIF type mapping: `compiler/crates/beskid_codegen/src/lowering/types.rs`
- Codegen diagnostic **`E2013`**: `compiler/crates/beskid_codegen/src/diagnostics.rs`
- Runtime cell + tables + fallback: `compiler/crates/beskid_runtime/src/dynamic/`
- C ABI builtins: `compiler/crates/beskid_runtime/src/builtins/dynamic.rs`
- ABI symbol registration: `compiler/crates/beskid_abi/src/symbols.rs`, `compiler/crates/beskid_abi/src/builtins.rs`
- Integration tests: `compiler/crates/beskid_tests/src/codegen/dynamic_types/`, `compiler/crates/beskid_tests/src/runtime/dynamic/`
</SpecSection>

## Decisions
<!-- spec:generate:adr-index -->
No ADRs published under **`adr/`** yet.
<!-- /spec:generate:adr-index -->
## Articles
<!-- spec:generate:article-index -->
_No articles in this bundle yet._
<!-- /spec:generate:article-index -->
``````

</details>
