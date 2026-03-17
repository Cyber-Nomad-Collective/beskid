# Beskid Standard Library — Full Implementation Plan

## Goal
Build a complete, production-ready Beskid standard library aligned with the canonical site specification, while preserving runtime ABI stability and backend parity (JIT/AOT).

## Grounded current state

### Canonical spec sources
- Standard library contracts: `site/website/src/content/docs/standard-library/README.md`
- API shape policy: `site/website/src/content/docs/spec/standard-library-api-shape.md`
- Module groups:
  - Core: `.../standard-library/Core/*`
  - Collections: `.../standard-library/Collections/*`
  - Query: `.../standard-library/Query/*`
  - System: `.../standard-library/System/*`

### Repository state today
- `standard_library/` currently contains only top-level group directories (`Core/`, `Collections/`, `Query/`, `System/`) and no implementation files.
- No `Project.proj`, no `Src/Prelude.bd`, no `.bd` module sources.
- Compiler/runtime now has source-owned interop dispatch (generation feature removed), so stdlib must be implemented against stable runtime ABI/builtins, not generation workflows.

## Non-negotiable design constraints
1. **No `Std` prefix** in public API paths. Use canonical names (`Core.String`, `Collections.Array`, `Query`, `System.IO`, ...).
2. **C#-style naming** for public API (`PascalCase` modules and callables).
3. **Runtime boundary discipline**: platform/syscall behavior remains runtime-owned.
4. **Result-first recoverable errors**: avoid panic-only API contracts for expected failures.
5. **Additive evolution policy** for public stdlib surface.
6. **Backend parity**: language-level behavior must remain JIT/AOT equivalent.

## Target deliverable structure (proposed)

```text
standard_library/
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

### Layer A — Public stdlib API modules (`standard_library/Src/**`)
- Owns module-level type signatures, contracts, and API composition.
- Encodes user-facing docs/examples behavior.
- Must not contain platform-specific policy.

### Layer B — Runtime ABI bridge (existing runtime/builtins)
- Owns concrete syscall/platform integrations and low-level helpers.
- Exposed through stable symbols/types already declared in runtime/abi crates.

### Layer C — Compiler integration
- Resolver/typechecker/codegen must resolve stdlib modules and preserve contract semantics.
- Must enforce the naming/routing shape from docs (`Core.*`, `Collections.*`, `Query.*`, `System.*`).

## Phase plan

## Phase 0 — Foundation bootstrap (blocking)
### Objective
Create a valid stdlib project skeleton consumable by CLI/workflows.

### Tasks
1. Add `standard_library/Project.proj`.
2. Add `standard_library/Src/Prelude.bd`.
3. Create empty module files for all target modules listed above.
4. Wire `Prelude.bd` exports/imports with canonical module paths.

### Acceptance criteria
- `standard_library` contains a valid project manifest and source root.
- CLI stdlib-related workflows can reference checked-in stdlib without template assumptions breaking.
- Module paths resolve without `Std.*` aliases.

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

## Phase 5 — Hardening, parity, and rollout
### Objective
Make stdlib release-ready with compatibility and regression safety.

### Tasks
1. Add comprehensive test matrix:
   - analysis/type tests
   - codegen lowering tests
   - runtime parity tests (JIT/AOT)
2. Add API compatibility policy checks (additive change guardrails).
3. Add module-level examples and migration notes for any breaking proposal.
4. Create release checklist for stdlib versioning and docs sync.

### Acceptance criteria
- Full stdlib targeted test suites pass sequentially.
- JIT/AOT parity holds for stdlib-backed language features.
- Docs and implementation are synchronized for all module groups.

## Cross-cutting work items

### C1 — Docs/implementation sync protocol
- Every implemented module must map to exactly one spec file.
- Any API mismatch requires either code change or docs change in same PR.

### C2 — Naming and visibility audit
- Ensure no `Std.*` path remains in examples/tests/stdlib sources.
- Ensure public APIs follow PascalCase naming policy.

### C3 — Error taxonomy consistency
- Establish shared error naming conventions and per-domain enums.
- Ensure `Try*` APIs and `Result` conventions are consistent across modules.

### C4 — Performance transparency
- Document complexity and allocation behavior for public APIs.
- Reject hidden allocations in cheap-looking operations.

### C5 — Runtime dependency manifest
- Maintain a single map from stdlib operations to runtime symbols.
- Validate that used runtime symbols are stable and parity-tested.

## Risk register and controls
1. **Risk: docs drift from implementation**
   - Control: mandatory contract checklist in every stdlib PR.
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
- `M0-stdlib-foundation.md` (skeleton + loader assumptions)
- `M1-core.md`
- `M2-collections-array-query-contracts.md`
- `M3-query-operators-and-execution.md`
- `M4-system-apis.md`
- `M5-parity-hardening-and-release.md`

## Done definition (program-level)
- `standard_library` contains complete source tree and manifest.
- All module groups from docs are implemented with test-backed contracts.
- No legacy interop-generation assumptions remain.
- Public API naming and paths align with canonical docs.
- JIT/AOT parity validated for stdlib-backed features.
