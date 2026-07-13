# HIR-Free ISLE/CLIF Native Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Follow TDD and run GitNexus impact analysis before every symbol edit.

**Goal:** Replace Beskid's HIR and linked Rust runtime with generation-safe AST/Salsa facts, exhaustive ISLE-to-stock-CLIF lowering, and a Beskid-plus-assembly ABI-v5 runtime.

**Architecture:** Expanded AST nodes receive generation-safe keys. Salsa owns semantic facts; generated ISLE rules consume those facts and emit verified stock CLIF. The same path compiles the canonical Beskid runtime into static/shared native kits, with only context initialization and switching in target assembly.

**Tech Stack:** Rust 2024 compiler tooling, Salsa 0.26, Cranelift 0.128.3, ISLE, Beskid corelib sources, ELF/Mach-O/COFF assembly, Bun/GitHub Actions.

## Global Constraints

- No HIR type, lowering, cache, adapter, or compatibility path remains in active compiler source.
- No Rust runtime, host, bridge, fallback, Abfall, corosensei, panic, or unwind object is linked into generated programs.
- ABI v5 supports little-endian 64-bit `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc` only.
- Runtime calls are direct versioned `beskid_rt_v5_*` symbols; no dispatch tags, envelopes, or handler registration.
- One hosted runtime is shipped in debug and release variants; object-only output is explicitly unlinked.
- Runtime semantics are Beskid; assembly exports only `beskid_arch_v5_context_init` and `beskid_arch_v5_context_switch`.
- Every typed operation has exactly one ISLE rule and every generated function passes `verify_function`.
- `compiler/runtime_manifest.bsol` is the sole symbol authority; generated `abi.json` carries the exact import/export allowlists, layouts, target/profile identity, and deterministic hashes.
- Trap codes are fixed at 1 `NullReference`, 2 `Bounds`, 3 `ArithmeticOverflow`, 4 `InvalidUtf8`, 5 `OutOfMemory`, 6 `InvalidOrStaleHandle`, 7 `SchedulerDeadlock`, 8 `AbiOrLayoutMismatch`, 9 `UnreachableOrIsleInvariant`, and 10 `RuntimeInternalCorruption`; all terminate through `beskid_rt_v5_trap` with status 101.
- Runtime kits install under `lib/beskid-runtime/abi-5/<target>/<debug|release>/` with `abi.json` at the profile root and target-named artifacts in `static/` and `shared/`.
- No agent edits another agent's checkout, Cargo.lock, generated files, or submodule pointer.

---

### Task 1: ABI-v5 and AST/Salsa contracts

Define generation-safe `AstNodeId`/`AstNodeKey`, `SourceUnitId`, `TypedProgram`, semantic query signatures, `CodegenInput`, the direct ABI-v5 manifest schema, the fixed trap table, layouts, runtime-kit metadata, and retired-pattern tests. Update the normative spec and supersede the 2026-07-11 design before behavioral implementation.

Acceptance: contract tests fail before implementation and pass afterward; manifest generation is deterministic; GitNexus impact output is recorded.

### Task 2: Frontend and LSP without HIR

Index expanded AST units, port resolution/type/control-flow/cast/capture/legality facts to Salsa, replace HIR unit caches and monolithic result consumers, and port all document/LSP features to AST span indexes plus semantic queries. Delete HIR normalization, serialization, derives, and adapters.

Acceptance: analysis, query, spine, document, and LSP tests pass; stale-generation keys cannot resolve; active-source HIR scan is empty.

### Task 3: Exhaustive ISLE-to-CLIF codegen

Replace codegen `Lowerable` implementations and HIR linker indexes with real ISLE rules over AST/Salsa terms. Keep Rust context code limited to query access, FunctionBuilder lifetime management, module handles, and stock CLIF constructors.

Acceptance: every syntax operation is covered exactly once, missing coverage is a compile-time diagnostic with span, CLIF verification is mandatory, and codegen/AOT tests pass.

### Task 4: Beskid ABI-v5 runtime and assembly

Implement trusted runtime intrinsic facts and Beskid runtime modules for lifecycle, traps, TLS, allocation, non-moving mark/sweep GC, roots/barriers, collections, strings, concurrency, dynamic/composition, clocks, callbacks, and OS adapters. Add only the two approved context functions for all targets.

Acceptance: capability, layout, import/export, trap, GC, scheduler, collection, and assembly preservation tests pass; no unapproved intrinsic is callable by user packages.

### Task 5: Shared runtime-kit JIT/AOT integration

Add `beskid_tools runtime-kit build`, static/shared kit production, ABI metadata/hash validation, AOT main and library attach wrappers, JIT lifetime management, exact installed-kit resolution under `lib/beskid-runtime/abi-5/<target>/<debug|release>/`, and deliberately unlinked object-only imports. Linux artifacts are `libbeskid_runtime.a`/`libbeskid_runtime.so`; macOS artifacts are `libbeskid_runtime.a`/`libbeskid_runtime.dylib`; Windows artifacts are `beskid_runtime.lib` and `beskid_runtime.dll` with `beskid_runtime_import.lib`.

Acceptance: the same runtime corpus passes JIT and AOT; debug/release installed-prefix smokes pass; runtime binaries have no Rust provenance.

### Task 6: Coherent CI and distribution

Build one native toolchain bundle per target containing CLI, LSP, both runtime profiles, metadata, checksums, and license. Add manifest-driven packaging for MSI, Homebrew, Debian, AUR, and Snap; fix current path, retry, icon, and component-coherence failures.

Acceptance: all package content/install/smoke tests pass; immutable assets precede rolling aliases; no publication occurs before the three-target matrix is green.

### Task 7: Legacy deletion, documentation, and final verification

Delete all HIR and Rust-runtime crates/sources/dependencies, update GUIDE/GLOSSARY/CHANGELOG/specification, run GitNexus detect-changes, agent-artifact audit, full workspace/corelib/compiler gates, native installed-prefix smokes, actionlint, and a whole-branch review.

Acceptance: retired-pattern scans and native Rust-provenance audits are empty; every required gate is freshly green.
