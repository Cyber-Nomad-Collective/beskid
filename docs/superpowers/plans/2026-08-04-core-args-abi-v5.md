# Core.Args ABI-v5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Foundation `Core.Args` work through manifest-owned ABI-v5 adapters on every supported native target without granting ordinary code or Corelib generic runtime-intrinsic authority.

**Architecture:** The canonical `Core/Args/Args.bd` source alone receives two `CorelibService` imports: `__args_count() -> i64` and `__args_get(i64) -> string`. The ABI manifest declares target adapters, generation produces the import/export/provenance facts, and AOT/JIT inject explicit process arguments into those adapters. No ISLE special case, Rust runtime router, ambient global, or empty-vector fallback is permitted.

**Tech Stack:** Rust workspace, Beskid manifest generator, C native adapters for Linux/macOS/Windows, Cranelift ISLE, OpenSpec, Bash release gates.

## Global Constraints

- The only production lowering path is `TypedProgram → CodegenInput → ISLE → verifier-clean CLIF`.
- Corelib services are granted only to byte-identical canonical source at its canonical physical path; copied, symlinked, altered, and user sources fail closed.
- ABI-v5 adapters are manifest-owned and generated; handwritten allowlists, raw imports, and compatibility fallbacks are prohibited.
- Native executable argument vectors include `argv[0]`; Windows input is converted from UTF-16 under one defined error policy.
- JIT receives arguments only through an explicit execution API; shared/library output rejects `Core.Args` use with a stable diagnostic.
- Every target matrix claim requires installed debug and release kit evidence for Linux x86-64, macOS arm64, and Windows x86-64.
- Do not delete ABI-v3 dispatch/router code until direct ABI-v5 replacements and behavior/provenance tests pass.

---

### Task 1: Make the Core.Args contract normative

**Files:**
- Modify: `openspec/specs/core-library--foundation-and-primitives--core-args/spec.md`
- Create: `openspec/changes/core-args-abi-v5/proposal.md`
- Create: `openspec/changes/core-args-abi-v5/tasks.md`
- Create: `openspec/changes/core-args-abi-v5/specs/core-library--foundation-and-primitives--core-args/spec.md`
- Modify: `openspec/catalog.json`
- Test: `openspec validate core-args-abi-v5 --strict`

**Interfaces:**
- Consumes: selected private service signatures `__args_count() -> i64`, `__args_get(i64) -> string`.
- Produces: SHALL requirements for source authority, bounds, string ownership, AOT argv capture, Windows conversion, JIT injection, shared-output rejection, and three-target provenance.

- [ ] **Step 1: Write the failing OpenSpec scenarios**

```markdown
#### Scenario: non-canonical source has no Args ABI import
- **WHEN** a copied, symlinked, altered, or user-authored source spells `__args_count`
- **THEN** code generation fails without an ABI import or runtime fallback
```

- [ ] **Step 2: Validate the delta before implementation**

Run: `openspec validate core-args-abi-v5 --strict`

Expected: failure until every requirement has a scenario and the proposal declares the changed Core.Args behavior.

- [ ] **Step 3: Specify the selected contract**

```markdown
`All()` SHALL enumerate `0..Count()` through `__args_get`; each returned
element SHALL be a managed, independently retained string. `__args_all` SHALL
NOT be an ABI service.
```

- [ ] **Step 4: Rebuild and validate the catalog**

Run: `openspec validate --all --strict`

Expected: all catalog entries validate and `openspec/catalog.json` reflects the change.

- [ ] **Step 5: Commit**

```bash
git add openspec
git commit -m "spec: define Core.Args ABI-v5 services"
```

### Task 2: Grant exact source-scoped Corelib service authority

**Files:**
- Modify: `crates/beskid_abi/src/runtime_source.rs`
- Modify: `crates/beskid_queries/src/semantic_contract.rs`
- Modify: `crates/beskid_codegen/src/isle_adapter/facts_node.rs`
- Test: `crates/beskid_abi/src/runtime_source.rs`
- Test: `crates/beskid_codegen/tests/codegen_input.rs`

**Interfaces:**
- Consumes: Task 1 canonical path and signatures.
- Produces: `CorelibService` imports for only canonical `Core/Args/Args.bd`: `__args_count: [] -> I64`, `__args_get: [I64] -> STRING`.

- [ ] **Step 1: Write authority-denial tests**

```rust
assert!(!canonical_corelib_service_sources(copied_args).contains(&CorelibService::ArgsCount));
assert!(build_typed_program(user_source).runtime_imports().is_empty());
```

- [ ] **Step 2: Run the focused tests to establish denial**

Run: `cargo test -p beskid_abi runtime_source -- --nocapture`

Expected: failure because Args has no canonical service entries.

- [ ] **Step 3: Add the two canonical services through the existing authority table**

```rust
CorelibService::ArgsCount => AbiSignature::new([], AbiType::I64),
CorelibService::ArgsGet => AbiSignature::new([AbiType::I64], AbiType::String),
```

- [ ] **Step 4: Prove verified CLIF imports only for the canonical source**

Run: `cargo test -p beskid_codegen --test codegen_input core_args -- --nocapture`

Expected: canonical calls carry `CorelibService`; copied and user sources fail closed.

- [ ] **Step 5: Commit**

```bash
git add crates/beskid_abi crates/beskid_queries crates/beskid_codegen
git commit -m "feat(abi): authorize canonical Core.Args services"
```

### Task 3: Model and generate the manifest-owned target adapters

**Files:**
- Modify: `runtime_manifest.bsol`
- Modify: `crates/beskid_manifest/src/model.rs`
- Modify: `crates/beskid_manifest/src/v5.rs`
- Modify: `crates/beskid_manifest/src/codegen.rs`
- Modify: `crates/beskid_abi/src/generated/abi_v5_contract.rs`
- Test: `crates/beskid_manifest/tests/abi_v5_source_authority.rs`

**Interfaces:**
- Consumes: Task 2 service signatures.
- Produces: generated `beskid_rt_v5_args_count` and `beskid_rt_v5_args_get` bindings with exact target implementation and OS-import facts.

- [ ] **Step 1: Write invalid-manifest tests**

```rust
assert_rejected("args binding missing aarch64-apple-darwin export");
assert_rejected("args_get has [] instead of [I64]");
assert_rejected("duplicate args_count adapter binding");
```

- [ ] **Step 2: Run generator validation**

Run: `cargo test -p beskid_manifest abi_v5 -- --nocapture`

Expected: failure until bindings become first-class manifest facts.

- [ ] **Step 3: Add a single adapter-binding model and manifest entries**

```text
corelib_service __args_get [i64] -> string
  adapter beskid_rt_v5_args_get
  targets linux-x86_64, macos-aarch64, windows-x86_64
```

- [ ] **Step 4: Regenerate and verify checked-in artifacts**

Run: `cargo run -p beskid_manifest --example generate_v5 -- . && cargo test -p beskid_manifest abi_v5_source_authority`

Expected: generated Rust/C/JSON artifacts are fresh and audit metadata contains both exact bindings.

- [ ] **Step 5: Commit**

```bash
git add runtime_manifest.bsol crates/beskid_manifest crates/beskid_abi/src/generated
git commit -m "feat(manifest): generate Core.Args ABI-v5 adapters"
```

### Task 4: Implement native AOT adapters and process entry handoff

**Files:**
- Modify: `crates/beskid_abi/assembly/x86_64-unknown-linux-gnu/platform_host.c`
- Modify: `crates/beskid_abi/assembly/aarch64-apple-darwin/platform_host.c`
- Modify: `crates/beskid_abi/assembly/x86_64-pc-windows-msvc/platform_host.c`
- Modify: `crates/beskid_aot/src/api.rs`
- Test: `crates/beskid_aot/tests/runtime_kit_build.rs`
- Test: `crates/beskid_abi/tests/runtime_kit_resolution.rs`

**Interfaces:**
- Consumes: generated Task 3 symbols and target binding facts.
- Produces: ordered managed argument vector made available before executable `Main`; `args_count`/`args_get` exports in every debug/release kit.

- [ ] **Step 1: Write a target-independent adapter harness**

```rust
assert_eq!(run_args_fixture(["program", "--color", "é"]), ["program", "--color", "é"]);
assert_bounds_failure(run_args_fixture(["program"]), 1);
```

- [ ] **Step 2: Prove it fails without a generated target export**

Run: `cargo test -p beskid_abi runtime_kit_resolution::args -- --nocapture`

Expected: missing `beskid_rt_v5_args_count`/`get` export failure.

- [ ] **Step 3: Implement the three adapters and AOT launcher handoff**

```c
int64_t beskid_rt_v5_args_count(void);
struct BeskidStr beskid_rt_v5_args_get(int64_t index);
```

- [ ] **Step 4: Verify every installed kit flavor and native executable**

Run: `cargo test -p beskid_abi runtime_kit_resolution::args && cargo test -p beskid_aot runtime_kit_build::args`

Expected: Linux/macOS/Windows debug and release artifacts expose only generated, provenance-valid symbols.

- [ ] **Step 5: Commit**

```bash
git add crates/beskid_abi/assembly crates/beskid_aot
git commit -m "feat(runtime): capture ABI-v5 Core.Args vectors"
```

### Task 5: Define explicit JIT execution arguments and Corelib behavior

**Files:**
- Modify: `crates/beskid_engine/src/jit_module.rs`
- Modify: `crates/beskid_engine/src/lib.rs`
- Modify: `crates/beskid_tests/src/runtime/parity.rs`
- Test: `crates/beskid_engine/tests/args_execution.rs`

**Interfaces:**
- Consumes: Task 3 generated bindings and Task 4 managed vector contract.
- Produces: explicit JIT API accepting `&[String]`; stable diagnostic when shared/library outputs use `Core.Args`.

- [ ] **Step 1: Write failing JIT injection and rejection tests**

```rust
assert_eq!(engine.run_with_args(program, ["jit", "--flag"])? , expected);
assert_stable_error(build_shared_with_core_args(program), "Core.Args requires executable arguments");
```

- [ ] **Step 2: Run the focused tests**

Run: `cargo test -p beskid_engine args_execution -- --nocapture`

Expected: no API exists and shared output currently has no stable rejection.

- [ ] **Step 3: Add one explicit JIT argument-vector API**

```rust
pub fn run_with_args(&mut self, entry: &str, args: &[String]) -> Result<RunResult, EngineError>;
```

- [ ] **Step 4: Verify no Rust dispatch/router fallback is registered**

Run: `cargo test -p beskid_engine args_execution && cargo test -p beskid_tests runtime::parity::args`

Expected: explicit injection succeeds; missing injection and shared use fail deterministically.

- [ ] **Step 5: Commit**

```bash
git add crates/beskid_engine crates/beskid_tests
git commit -m "feat(jit): inject Core.Args explicitly"
```

### Task 6: Run Corelib and release gates, then hand off retirement work

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `openspec/changes/core-args-abi-v5/tasks.md`
- Modify: `openspec/catalog.json`
- Test: `scripts/verify-hir-free-abi-v5.sh`

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: evidence showing Core.Args is resolved; a precise residual list for HIR semantic migration and ABI-v3 dispatch retirement.

- [ ] **Step 1: Run the focused Foundation gate**

Run: `cargo test -p beskid_tests --lib CoreArgsTests -- --nocapture`

Expected: all Args tests pass via verified CLIF and installed ABI-v5 adapters.

- [ ] **Step 2: Run Corelib and exact-kit gates**

Run: `just corelib-test && cargo test -p beskid_abi runtime_kit_resolution && cargo test -p beskid_aot runtime_kit_build`

Expected: no missing Args specialization, no foreign source import, and no provenance deviation.

- [ ] **Step 3: Run release evidence checks**

Run: `openspec validate --all --strict && scripts/verify-hir-free-abi-v5.sh`

Expected: Core.Args findings are gone; remaining HIR/ABI-v3 records are retained as separately scoped release blockers.

- [ ] **Step 4: Run GitNexus changed-scope analysis and commit evidence**

Run: `detect_changes(scope: "compare", base_ref: "main")`

Expected: only manifest, source authority, target adapter, entrypoint, JIT, test, OpenSpec, catalog, and changelog flows are affected.

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md openspec
git commit -m "test: record Core.Args ABI-v5 release evidence"
```

## Follow-on 0.4 plans

After Task 6, execute separate reviewed plans in this order: (1) syntax-side call/import coverage and deletion of the 674-record legacy codegen/link-plan subtree, (2) analysis `SyntaxProgramAssembly`/`TypedProgram` authority migration covering 2,478 records, (3) domain-by-domain direct ABI-v5 runtime coverage and ABI-v3 router/Cargo deletion, then (4) complete hosted three-target, distribution, documentation, and Linear sign-off gates. None may be marked complete from this plan's focused evidence.

