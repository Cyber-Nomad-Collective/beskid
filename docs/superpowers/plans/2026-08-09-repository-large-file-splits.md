# Repository Large-File Splits Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:dispatching-parallel-agents` for non-overlapping wave ownership and the repository GitNexus refactoring workflow for each edited symbol. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every qualifying oversized authored production file with a focused facade and responsibility-based modules, without behavioral change or duplicate implementations.

**Architecture:** One owner splits one original monolith completely. Up to three owners work concurrently only when their file sets do not overlap. Each original import path becomes a thin facade or composition root; implementations move to inward-depending private modules.

**Tech Stack:** Rust 2024/Salsa/Cranelift/ISLE, TypeScript/React/TanStack, Node/pnpm, C#/.NET/Blazor, shell tooling, GitNexus.

## Global Constraints

- Do not run Cargo until every target in the current wave has reached its intended module structure.
- Preserve public APIs, route paths, query keys, diagnostics, manifest ordering, worker protocols, and runtime semantics.
- Maintain one implementation per construct; delete moved bodies from the monolith in the same task.
- Do not add compatibility fallbacks or retired HIR/Lowerable paths.
- Run GitNexus upstream impact analysis before editing every named function, class, or method; warn on HIGH or CRITICAL risk.
- Preserve all pre-existing user changes; do not reset, overwrite unrelated diffs, commit, push, or add agent scratch files.
- Each owner writes scope, invariants, changed files, and remaining concerns to `~/.agents/knowledge/<domain>.md`.
- Apply idiomatic Rust and beskid practices: domain modules, narrow visibility, explicit ownership, no glob leakage, no sibling cycles, PascalCase public Beskid symbols, camelCase locals/parameters, and fail-closed runtime behavior.

---

### Task 1: Split the three compiler foundation monoliths

**Files:**
- Modify: `compiler/crates/beskid_queries/src/semantic_contract.rs`
- Create/modify: `compiler/crates/beskid_queries/src/semantic_contract/*.rs`
- Modify: `compiler/crates/beskid_isle/src/lib.rs`
- Create: `compiler/crates/beskid_isle/src/{facts,layout,context,emitter}.rs` and focused `context/*.rs`
- Modify: `compiler/crates/beskid_pckg_store/src/lib.rs`
- Create: `compiler/crates/beskid_pckg_store/src/{migrations,package,community,administration,operations,api_keys,cutover,memory}.rs`

**Interfaces:**
- Consumes: existing public paths from the three crate roots.
- Produces: the same public paths through thin facades; private responsibility modules contain the sole implementations.

- [ ] Run current-root GitNexus context and upstream impact for each public facade and tracked query family before editing.
- [ ] Assign one owner to each monolith; agents must not edit either other crate.
- [ ] Move complete types, functions, impl blocks, and their private helpers into the target modules; use `pub(super)` only where a sibling genuinely consumes the item.
- [ ] Remove the original bodies and unused imports; ensure every facade visibly contains only exports, declarations that define the public surface, and orchestration.
- [ ] Audit with `rg` for duplicate definitions and with `wc -l` for the target size; do not run Cargo.
- [ ] Record each owner's exact changes and risks in its knowledge document.

### Task 2: Split compiler service monoliths

**Files:**
- Modify/create: `compiler/crates/beskid_codegen/src/module_emission.rs` and `module_emission/*.rs`
- Modify/create: `compiler/crates/beskid_analysis/src/types/checker/expressions.rs` and `expressions/*.rs`
- Modify/create: `compiler/crates/beskid_manifest/src/v5.rs` and `v5/*.rs`

**Interfaces:**
- Consumes: stable lowering, `TypeChecker`, and v5 manifest public contracts.
- Produces: unchanged public entrypoints with responsibility modules for emission, expression checking, and artifact generation.

- [ ] Run GitNexus context/impact for `lower_syntax_program`, the expression-check dispatcher, and v5 load/generate/write entrypoints.
- [ ] Assign one owner per original file and preserve the existing ordering semantics in its facade.
- [ ] Extract the exact responsibility groups defined in the design; avoid generic utility layers and sibling cycles.
- [ ] Delete all moved bodies from the original file and remove stale imports.
- [ ] Run static duplicate/size/import audits only; defer Cargo.
- [ ] Record outcomes in domain knowledge documents.

### Task 2A: Split the canonical Beskid GC source

**Files:**
- Modify: `compiler/runtime/beskid/src/Runtime/Mem/Gc.bd`
- Create: focused `compiler/runtime/beskid/src/Runtime/Mem/Gc/*.bd` units
- Modify: `compiler/crates/beskid_abi/src/runtime_source.rs`
- Modify only where source-corpus assertions require it: `compiler/crates/beskid_abi/tests/canonical_runtime_sources.rs`

**Interfaces:**
- Consumes: current GC public functions, exact ABI export symbols, heap/header offsets, and `canonical_runtime_sources()` authority.
- Produces: the same public GC surface through a small facade and a canonical embedded source unit for every extracted module.

- [ ] Treat `canonical_runtime_sources()` as CRITICAL impact and preserve its ordering, uniqueness, source hashing, and proof semantics.
- [ ] Inventory every public GC function/export and every layout constant before editing; the Beskid symbols are not indexed by GitNexus and require direct-source evidence.
- [ ] Split state/allocation, roots, handles, collection/marking, and sweep/heap initialization along dependency direction; avoid duplicate constants and cross-module cycles.
- [ ] Keep `Gc.bd` as the stable facade/namespace and update the embedded corpus with exact logical paths for all extracted units.
- [ ] Update source-corpus assertions to locate the owning GC unit without weakening canonical provenance checks.
- [ ] Run only static symbol/export/offset/source-path inventories until the full structure is present; defer Cargo to the compiler verification wave.

### Task 3: Split GitNexus engine coordinators

**Files:**
- Modify/create: `beskid_nexus/gitnexus/src/mcp/local/local-backend.ts` and `local/*.ts`
- Modify/create: `beskid_nexus/gitnexus/src/core/ingestion/call-processor.ts` and focused call-processing modules
- Modify/create: `beskid_nexus/gitnexus/src/core/ingestion/workers/parse-worker.ts` and focused worker modules
- Later sub-wave: `server/api.ts`, `core/lbug/lbug-adapter.ts`, and qualified ingestion files.

**Interfaces:**
- Consumes: current MCP tool schemas, ingestion graph contracts, and worker message protocol.
- Produces: thin dispatch/coordinator facades with unchanged exports and one canonical context/type environment.

- [ ] Run current GitNexus impact/context using the `beskid_nexus` source repository or current root index.
- [ ] First sub-wave assigns one owner to backend, call processor, and parse worker.
- [ ] Extract services/phases without copying schemas, type maps, query builders, or worker protocol types.
- [ ] Delete old bodies, audit imports and duplicate exports, and keep tests untouched until structure is complete.
- [ ] Second sub-wave handles server API, database adapter, and remaining qualified coordinators.
- [ ] Run pnpm verification only after both sub-waves are structurally complete.

### Task 4: Split pckg web and BSOL monoliths

**Files:**
- Modify/create: `pckg/web/src/router.tsx`, `pckg/web/src/routes/**/*.tsx`, and later `pckg/web/src/lib/api/*.ts`
- Modify/create: `beskid_bsol/crates/bsol-syntax/src/build.rs` and `build/*.rs`
- Modify/create: `beskid_bsol/crates/bsol-analysis/src/validate.rs` and `validate/*.rs`
- Later sub-wave: `beskid_bsol/crates/bsol-schema/src/load.rs` and `load/*.rs`

**Interfaces:**
- Consumes: `clientRoutePaths`, `parse_bsol_document`, validation/load public functions.
- Produces: unchanged paths and parser/validation behavior through thin facades.

- [ ] Capture static route/export and public Rust symbol inventories before editing.
- [ ] Assign owners to router, syntax builder, and validator in the first sub-wave.
- [ ] Move vertical route pages and complete parser/validation phases; retain one API client and one parsing/validation path.
- [ ] Delete old bodies and audit route arrays, diagnostics, and parser entrypoint uniqueness.
- [ ] Split schema loading in the next slot after a first-wave owner completes.
- [ ] Defer pnpm/Cargo verification until every target structure in this task is complete.

### Task 5: Split remaining qualified product and tooling files

**Files:**
- Compiler P1/P2 files listed in the design audit knowledge document.
- `site/platform-spec/src/server/memgraph/draft-contexts.ts`
- `site/learn/src/components/LessonWorkspace.tsx`
- shared Platform Spec graph client and qualifying Tracker surfaces
- qualifying pckg server composition/components/services
- qualifying CI/corelib, VS Code, and OpenBao files where safe operational boundaries exist

**Interfaces:**
- Consumes: established feature folders, shared package boundaries, and current composition roots.
- Produces: focused modules while retaining the same externally visible contracts.

- [ ] Regenerate the ranked LOC/responsibility inventory after Tasks 1–4.
- [ ] Form waves of three files with disjoint owners and explicit public acceptance boundaries.
- [ ] Perform GitNexus impact analysis, extract complete responsibility groups, and delete the old implementations.
- [ ] Explicitly record cohesive exceptions rather than fragmenting declarative or single-algorithm files.
- [ ] Run each ecosystem's build/test commands only after its wave reaches the target structure.

### Task 6: Verify structural and behavioral completion

**Files:**
- Modify: `CHANGELOG.md`
- Inspect: all authored production source and all files changed by Tasks 1–5

**Interfaces:**
- Consumes: completed facades/modules from every wave.
- Produces: evidence that no qualifying mixed-responsibility monolith or duplicate implementation remains.

- [ ] Run `mcp__gitnexus__detect_changes` for root and affected submodule worktrees, comparing with `main` where applicable.
- [ ] Search for duplicate symbol definitions, stale compatibility exports, empty namespace stubs, and old monolithic bodies.
- [ ] Run formatting and focused Cargo checks/tests, pnpm checks/tests, .NET checks/tests, and shell/CI contract tests appropriate to the changed files.
- [ ] Re-run the authored-source LOC inventory and document every remaining file above the qualification threshold as excluded, cohesive, or still requiring work.
- [ ] Update `CHANGELOG.md` under `Unreleased` using Keep a Changelog categories.
- [ ] Run the agent-artifact guard and confirm no `~/.agents` or scratch files are tracked.
- [ ] Request final whole-change review and address all critical/important findings.
