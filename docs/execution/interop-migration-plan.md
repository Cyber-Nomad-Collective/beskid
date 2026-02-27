# Standard Library Interop Migration Plan

This document defines the final migration shape and execution plan for Beskid stdlib interop.

Architecture freeze reference: `docs/execution/aot-jit-architecture-contract.md`.
All runtime/ABI/dispatch changes described here must satisfy the immutable invariants in that contract.

## 1. Final Shape (Target Architecture)

### 1.1 Source of truth
Interop contracts are authored in Rust using attributes:

```rust
#[InteropCall(std::io, name = "println")]
fn sys_println(text: *const BeskidStr) {}
```

The Rust declaration is the canonical source of:
- module path (`std.io`)
- callable name (`println`)
- parameter list and types
- return dispatch group (`unit`, `usize`, `ptr`)

### 1.2 Generated Beskid artifacts
`pekan_cli interop` generates Beskid source files under `standard_library`:
- `Src/Interop/StdInterop.generated.bd` (enum variants)
- `Src/Interop/Calls.generated.bd` (typed dispatcher-call wrappers)
- `Src/Prelude.bd` (project entry file containing generated enum + wrappers)

It also generates runtime tag constants used by dispatcher matching:
- `crates/beskid_runtime/src/interop_generated.rs`

Generated files are deterministic and idempotent. Manual stdlib files are never overwritten.

### 1.3 Manual stdlib facade remains
We do **not** generate full stdlib APIs.

Manual `standard_library/Src/*.bd` files remain the public facade and call generated interop wrappers.

### 1.4 Runtime boundary contract
Compiler/runtime boundary remains ABI-only:
- internal hooks: `__alloc`, `__str_new`, `__array_new`, GC hooks, etc.
- typed dispatch builtins: `__interop_dispatch_unit`, `__interop_dispatch_usize`, `__interop_dispatch_ptr`

Boundary rule:
- Internal runtime hooks (`alloc`, GC/root management, arena mutation helpers, core memory/string primitives) stay runtime-internal implementation details shared by both JIT and AOT.
- Interop is reserved for std/syscall-facing operations (`std.io`, future `std.fs`, `std.net`, `std.process`, etc.) and is always expressed through generated Beskid wrappers calling typed interop dispatch builtins.

No embedded stdlib prelude fallback is used in execution flows.

### 1.5 JIT/AOT parity rule
JIT and AOT must both consume the same interop contract:
- same generated Beskid interop files
- same runtime exported dispatch symbols
- same generated tag ordering contract

No backend-specific interop surface is allowed.

---

## 2. Detailed Implementation Plan

### Phase A — Rust annotation contract
1. Define attribute schema for `InteropCall`:
   - required: module path (e.g. `"std.io"`)
   - optional: explicit Beskid function name override
   - optional: explicit dispatch group override (if inference is ambiguous)
2. Define supported Rust parameter/return type mapping into Beskid interop types.
3. Reject unsupported signatures with source-located diagnostics.

### Phase B — Extraction pipeline (`pekan_cli interop`)
1. Add Rust source discovery for configured roots.
2. Parse/collect annotated declarations into a canonical in-memory model using typed Rust AST parsing (`syn`) in `beskid_interop_tooling`.
3. Normalize names and module paths.
4. Validate uniqueness and disallow collisions.

Implementation note:
- `pekan_cli interop` is a thin wrapper that delegates to `beskid_interop_tooling::execute`.
- Generation/extraction/validation logic does not live in CLI command code.

### Phase C — Canonical interop model
Canonical model per operation includes:
- module path
- function name
- ordered parameters
- return group
- source location metadata

Model ordering is fully deterministic (module path -> function name -> full signature).

### Phase D — Beskid code generation
1. Generate `StdInterop` enum variants from canonical model.
2. Generate wrapper functions calling typed dispatch builtins.
3. Write only `*.generated.bd` files.
4. Use atomic write and content-based no-op rewrites.

### Phase E — Validation and safety checks
Validate before writing:
- duplicate function signatures
- invalid module path segments
- unsupported mapped types
- reserved identifiers
- dispatch return-type mismatches

### Phase F — Runtime contract synchronization
Ensure runtime dispatcher tag mapping and generated enum ordering cannot drift:
1. derive tag ordering from a shared canonical list
2. assert runtime dispatch tables match generated Beskid variant order
3. fail tests on mismatch
4. ensure JIT and AOT both resolve the same runtime dispatcher symbols

### Phase G — Workflow integration
`pekan_cli interop` adds modes:
- default: generate/update files
- `--check`: no writes, fail when generated output is stale
- `--dry-run`: print planned updates

Integrate `--check` into CI.

Recommended operator commands:
- `cargo run -p pekan_cli -- interop`
- `cargo run -p pekan_cli -- interop --check`

### Phase H — stdlib project structure conventions
Enforce separation:
- manual files: public std facade
- generated files: interop enum + wrappers only

Manual facade imports generated wrappers; generator never edits manual files.

Clarification:
- Generated interop wrappers are for std/syscall-facing APIs only.
- Internal runtime ABI hooks (`__alloc`, GC hooks, etc.) are not modeled as `std.*` interop declarations.

### Phase I — End-to-end tests
Add coverage for:
1. annotation parsing and schema validation
2. deterministic generation snapshots
3. stale-output detection in `--check` mode
4. JIT/AOT execution through generated wrappers
5. negative mismatch cases (invalid tags/signatures/types)

---

## 3. Rollout Sequence

1. Introduce annotation schema + parser + model (no behavior change).
2. Switch `pekan_cli interop` from hardcoded tables to annotation extraction.
3. Generate split Beskid artifacts (`StdInterop.generated.bd`, `Calls.generated.bd`).
4. Wire manual std facade to generated wrappers.
5. Add runtime/enum-order contract tests.
6. Enable `pekan_cli interop --check` in CI.
7. Remove superseded hardcoded interop definitions.

---

## 4. Risks and Mitigations

- **Tag drift between runtime and generated enum**
  - Mitigation: shared canonical ordering + contract tests.

- **Nondeterministic generation causing noisy diffs**
  - Mitigation: stable sorting + deterministic formatting + idempotent writes.

- **Manual/generated ownership confusion in standard_library**
  - Mitigation: strict `*.generated.bd` boundaries and documented conventions.

- **Unsupported signature growth over time**
  - Mitigation: explicit type-mapping table and precise diagnostics.

---

## 5. Diagnostics Contract

Interop generation and project lifecycle diagnostics must be actionable and stable.

Minimum error classes:
- invalid/malformed `InteropCall` attribute
- unsupported interop type mapping
- duplicate interop function signature
- stale generated files (`--check` failure)
- runtime/enum contract mismatch

Diagnostics must include source file, symbol, and remediation command.

---

## 6. Definition of Done

Migration is complete when all of the following are true:

1. Interop declarations are authored in Rust attributes and are the only source of truth.
2. `pekan_cli interop` generates deterministic Beskid interop files from those attributes.
3. `standard_library` keeps manual public facade; only interop internals are generated.
4. Runtime dispatch contract and generated enum ordering are verified by tests.
5. CI enforces generation freshness via `pekan_cli interop --check`.
6. Execution pipeline has no embedded stdlib prelude fallback paths.
7. Docs reflect as-built architecture and operator workflow.
8. Internal runtime hooks (alloc/gc/core runtime ABI) remain shared JIT/AOT internals and are not promoted to std interop declarations.
9. Std/syscall-facing APIs are represented as interop declarations and are dispatched through generated wrappers + runtime interop dispatchers.
