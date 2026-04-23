# Beskid Corelib — Full Implementation Plan

## Goal
Build a complete, production-ready Beskid corelib aligned with the canonical site specification, while preserving runtime ABI stability and backend parity (JIT/AOT).

## Grounded current state

### Canonical spec sources
- Corelib contracts: `site/website/src/content/docs/corelib/README.md`
- API shape policy: `site/website/src/content/docs/spec/corelib-api-shape.md`
- Module groups:
  - Core: `.../corelib/Core/*`
  - Collections: `.../corelib/Collections/*`
  - Query: `.../corelib/Query/*`
  - System: `.../corelib/System/*`

### Repository state today
- `compiler/corelib/beskid_corelib/src` contains concrete `.bd` module implementations and a populated `Prelude.bd` (via the `corelib` submodule inside `compiler/`).
- Phase skeleton is present (M0 complete), but many module APIs are still placeholder/stub implementations.
- No explicit `use` declarations currently exist in corelib sources; modules rely on qualified paths and prelude module declarations.
- Compiler/runtime now has source-owned interop dispatch (generation feature removed), so corelib must be implemented against stable runtime ABI/builtins, not generation workflows.

### Implementation snapshot (2026-03-17)
- **M0 Foundation:** ✅ complete (project structure + module tree + prelude)
- **M1 Core:** 🟡 partial
  - `Core.Results` baseline enum implemented
  - `Core.String` partially implemented (`Contains` still placeholder semantics)
  - `Core.ErrorHandling` does not yet enforce typed domain-enum guidance
- **M2 Collections + Query contracts:** 🟡 partial
  - Collections files exist but mostly scaffold-level behavior
  - `Array.Len` and several collection operations return placeholder values
  - Query contract shape not yet fully aligned with canonical generic `Iterator<T>` / `Option<T>` contract
- **M3 Query operators/execution:** 🟡 partial
  - Operators exist but are state-count placeholders rather than element-aware semantics
- **M4 System APIs:** 🟡 partial
  - `System.IO` builtins façade exists
  - `FS/Path/Time/Environment/Process` are present but include stubs and doc/impl signature drift
- **M5 Hardening/parity/release:** ⛔ not started

## Non-negotiable design constraints
1. **No `Std` prefix** in public API paths. Use canonical names (`Core.String`, `Collections.Array`, `Query`, `System.IO`, ...).
2. **C#-style naming** for public API (`PascalCase` modules and callables).
3. **Runtime boundary discipline**: platform/syscall behavior remains runtime-owned.
4. **Result-first recoverable errors**: avoid panic-only API contracts for expected failures.
5. **Additive evolution policy** for public corelib surface.
6. **Backend parity**: language-level behavior must remain JIT/AOT equivalent.

## Target deliverable structure (proposed)

```text
beskid_corelib/
  Project.proj
  Src/
    Prelude.bd
    Core/
      ErrorHandling.bd
      Results.bd
      String.bd
    Collections/
      Array.bd
      List.bd
      Map.bd
      Set.bd
      Queue.bd
      Stack.bd
    Query/
      Contracts.bd
      Operators.bd
      Execution.bd
    System/
      IO.bd
      FS.bd
      Path.bd
      Time.bd
      Environment.bd
      Process.bd
```

## Architecture and ownership model

### Layer A — Public corelib API modules (`beskid_corelib/Src/**`)
- Owns module-level type signatures, contracts, and API composition.
- Encodes user-facing docs/examples behavior.
- Must not contain platform-specific policy.

### Layer B — Runtime ABI bridge (existing runtime/builtins)
- Owns concrete syscall/platform integrations and low-level helpers.
- Exposed through stable symbols/types already declared in runtime/abi crates.

### Layer C — Compiler integration
- Resolver/typechecker/codegen must resolve corelib modules and preserve contract semantics.
- Must enforce the naming/routing shape from docs (`Core.*`, `Collections.*`, `Query.*`, `System.*`).

## Phase plan

## Execution directive
From this point, this document is not only a design target but an execution tracker. Each phase below must be advanced with concrete code/doc/test changes and status updates in the same PR/iteration.

## Phase 0 — Foundation bootstrap (blocking)
### Objective
Create a valid corelib project skeleton consumable by CLI/workflows.

### Tasks
1. Add `beskid_corelib/Project.proj`.
2. Add `beskid_corelib/Src/Prelude.bd`.
3. Create empty module files for all target modules listed above.
4. Wire `Prelude.bd` exports/imports with canonical module paths.

### Acceptance criteria
- `beskid_corelib` contains a valid project manifest and source root.
- CLI corelib-related workflows can reference checked-in corelib without template assumptions breaking.
- Module paths resolve without `Std.*` aliases.

### Status
✅ Completed

## Phase 1 — Core MVP (`Core.Results`, `Core.String`, `Core.ErrorHandling`)
### Objective
Deliver foundational primitives required by all higher modules.

### Tasks
1. Implement `Result<TValue, TError>` canonical enum in `Core/Results.bd`.
2. Implement `Core.String` MVP:
   - `String.Len(string text) -> i64`
   - `String.IsEmpty(string text) -> bool`
   - `String.Contains(string text, string needle) -> bool`
3. Implement `Core.ErrorHandling` guidance types/contracts:
   - shared patterns for typed domain errors.
4. Bind String operations to runtime builtins where needed.

### Acceptance criteria
- Core API matches site docs contracts.
- No panic-only recoverable error APIs in Core.
- Unit/parity tests cover edge cases: empty strings, utf8 validity assumptions, contains boundaries.

### Status
🟡 In progress

## Phase 2 — Collections MVP (`Array` first, then dynamic collections)
### Objective
Deliver ergonomic collection primitives with explicit complexity/capacity behavior.

### Tasks
1. Implement `Collections.Array`:
   - `Array.Len<T>(T[] values) -> i64`
   - `Array.Iterate<T>(T[] values) -> ArrayIter<T>`
2. Implement dynamic types incrementally:
   - `List`, `Map`, `Set`, `Queue`, `Stack` (documented candidate surfaces).
3. Define explicit error types for `Try*` APIs.
4. Define deterministic semantics for map/set equality and ordering guarantees.

### Acceptance criteria
- Array behavior matches language/runtime representation and docs constraints.
- Each collection has explicit contract for growth/capacity/error semantics.
- Query integration points exist (iterable contracts) without hidden per-element allocation.

### Status
🟡 In progress

## Phase 3 — Query module (`Contracts`, `Operators`, `Execution`)
### Objective
Implement composable query pipelines aligned with current language semantics.

### Tasks
1. Define `Query.Contracts` using canonical `Iterator<T>`/`Next()` contract shape.
2. Implement operator wrappers (`Where`, `Select`, `Take`, `Skip`).
3. Implement terminal operators (`Count`, `First`, `CollectArray`).
4. Ensure lowering model is loop/conditional friendly and monomorphization-oriented.
5. Align docs terminology to `Query` (remove iteratorquery legacy naming artifacts from public surface).

### Acceptance criteria
- Query APIs compile to predictable loop-based lowering.
- No virtual-dispatch requirement in hot paths.
- `for in` compatibility is covered by analysis/codegen tests.

### Status
🟡 In progress

## Phase 4 — System module group (`IO`, `FS`, `Path`, `Time`, `Environment`, `Process`)
### Objective
Deliver stable platform-facing APIs with runtime-owned policy.

### Tasks
1. Implement `System.IO` print/println façade on runtime builtins.
2. Implement `FS`, `Path`, `Time`, `Environment`, `Process` per docs candidate surfaces.
3. Define domain error enums (`FsError`, `ProcessError`, etc.).
4. Keep platform differences encapsulated behind runtime boundary.

### Acceptance criteria
- Public System APIs remain stable while runtime internals can evolve.
- Recoverable failures use `Result` contracts.
- Cross-platform semantics documented and test-backed.

### Status
🟡 In progress

## Phase 5 — Hardening, parity, and rollout
### Objective
Make corelib release-ready with compatibility and regression safety.

### Tasks
1. Add comprehensive test matrix:
   - analysis/type tests
   - codegen lowering tests
   - runtime parity tests (JIT/AOT)
2. Add API compatibility policy checks (additive change guardrails).
3. Add module-level examples and migration notes for any breaking proposal.
4. Create release checklist for corelib versioning and docs sync.

### Acceptance criteria
- Full corelib targeted test suites pass sequentially.
- JIT/AOT parity holds for corelib-backed language features.
- Docs and implementation are synchronized for all module groups.

### Status
⛔ Not started

## Immediate execution backlog (next 3 batches)

### Batch E1 — Contract lock + doc/impl sync (active)
1. Resolve canonical contract mismatches in Query and System docs vs code.
2. Remove legacy Query naming remnants (`IteratorQuery.*`) from docs.
3. Add module-by-module signature table and mark each signature as `Aligned` / `Drift`.

**Status:** ✅ Completed (2026-03-17)

### Batch E2 — Stub elimination (Core + Collections)
1. Replace placeholder return values in `Core.String.Contains`, `Collections.Array.Len`, `Set.Contains`, `List.Get`.
2. Introduce explicit error/return semantics where docs require `Result`.
3. Ensure behavior is deterministic and complexity-transparent.

**Status:** ✅ Completed (2026-03-17, baseline semantics)

### Batch E3 — Query runtime semantics
1. Align `Query.Contracts` to generic contract shape.
2. Convert `Query.Operators` from count placeholders to value-aware behavior.
3. Add baseline query execution tests for `Where/Select/Take/Skip/First/Count`.

**Status:** ✅ Completed (2026-03-17, baseline contract tests added)

### Signature alignment matrix (post-E1 snapshot)

| Module | Signature alignment | Notes |
| --- | --- | --- |
| `Core.Results` | Aligned | Canonical `Result<TValue, TError>` shape in place. |
| `Core.String` | Partial | `Len`/`IsEmpty` aligned; `Contains` remains conservative without substring builtin. |
| `Core.ErrorHandling` | Partial | Baseline helpers exist; typed domain-enum policy not fully enforced across all modules. |
| `Collections.Array` | Partial | API shape aligned; `Len` blocked on missing runtime array-length builtin. |
| `Collections.List` | Partial | Bounds semantics explicit; storage-backed retrieval pending. |
| `Collections.Map` | Drift | Candidate APIs (`Set`, `TryGet`, `ContainsKey`) not fully implemented. |
| `Collections.Set` | Partial | `Contains` deterministic baseline only; real backing semantics pending. |
| `Collections.Queue` | Drift | Candidate enqueue/dequeue surface pending. |
| `Collections.Stack` | Drift | Candidate push/pop surface pending. |
| `Query.Contracts` | Aligned | Generic `Option<T>` and `Iterator<T>` contract applied. |
| `Query.Operators` | Partial | Value-aware first-value tracking added; full iterator-backed execution semantics pending. |
| `Query.Execution` | Partial | Baseline wrappers in place; richer execution guarantees need dedicated tests. |
| `System.IO` | Aligned | Builtin façade implemented (`Print`, `Println`). |
| `System.FS` | Partial | Docs/code aligned to current `WriteAllText -> Result<bool, FsError>` baseline. |
| `System.Path` | Partial | `Combine` baseline exists; `FileName`/`Extension` still placeholders. |
| `System.Time` | Partial | API present; runtime-backed clocks pending. |
| `System.Environment` | Partial | `Get`/`TryGet`/`Set` typed baseline added; runtime mutation support pending. |
| `System.Process` | Partial | `Id`/`Exit` baseline added; args/subprocess expansions pending. |

## Cross-cutting work items

### C1 — Docs/implementation sync protocol
- Every implemented module must map to exactly one spec file.
- Any API mismatch requires either code change or docs change in same PR.

### C2 — Naming and visibility audit
- Ensure no `Std.*` path remains in examples/tests/corelib sources.
- Ensure public APIs follow PascalCase naming policy.

### C3 — Error taxonomy consistency
- Establish shared error naming conventions and per-domain enums.
- Ensure `Try*` APIs and `Result` conventions are consistent across modules.

### C4 — Performance transparency
- Document complexity and allocation behavior for public APIs.
- Reject hidden allocations in cheap-looking operations.

### C5 — Runtime dependency manifest
- Maintain a single map from corelib operations to runtime symbols.
- Validate that used runtime symbols are stable and parity-tested.

## Risk register and controls
1. **Risk: docs drift from implementation**
   - Control: mandatory contract checklist in every corelib PR.
2. **Risk: backend behavior divergence (JIT vs AOT)**
   - Control: parity gates for each module phase.
3. **Risk: over-expansion before MVP stabilization**
   - Control: strict phase gating (Core/Array/Query/IO first).
4. **Risk: unstable error model**
   - Control: central Result/error handling conventions from Phase 1.
5. **Risk: runtime coupling leaks to compiler/backend**
   - Control: boundary review for all System and interop-affecting changes.

## Recommended implementation order (granular)
1. Phase 0 skeleton + prelude
2. Core.Results
3. Core.String
4. Collections.Array
5. Query.Contracts + for-in compatibility
6. Query.Operators + terminals
7. System.IO
8. Remaining Collections
9. Remaining System modules
10. Hardening/parity/docs lock

## Suggested milestone artifacts
- `M0-corelib-foundation.md` (skeleton + loader assumptions)
- `M1-core.md`
- `M2-collections-array-query-contracts.md`
- `M3-query-operators-and-execution.md`
- `M4-system-apis.md`
- `M5-parity-hardening-and-release.md`

## Done definition (program-level)
- `beskid_corelib` contains complete source tree and manifest.
- All module groups from docs are implemented with test-backed contracts.
- No legacy interop-generation assumptions remain.
- Public API naming and paths align with canonical docs.
- JIT/AOT parity validated for corelib-backed features.
