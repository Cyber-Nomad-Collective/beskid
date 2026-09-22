# F6 Cranelift 0.136.0 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the compiler to stable Cranelift 0.136.0 and prove Windows x86_64 JIT can execute discontiguous code/data without the recorded relocation overflow.

**Architecture:** All seven Cranelift crates move as one stable family. A single engine-native-ISA owner derives JIT flags and frontend configuration from the target ISA; preparation and final emission consume it, while AOT retains its existing policy. The recorded 0.128 Windows witness is the baseline: its provider API cannot be tested externally because `JITMemoryKind` is private there. After the stable migration exposes that type, a test-only portable forced-far provider proves the real pre-policy and final production builder behavior.

**Tech Stack:** Rust 2024, stable Cranelift 0.136.0/Wasmtime v49.0.0, Cranelift ISLE, JIT/Object modules, Windows MSVC and Linux/macOS native harnesses.

**Spec:** `/Users/mikserek/Projects/beskid/.superpowers/sdd/2026-09-21-f6-native-descriptor-contract/f6-cranelift-136-migration-design.md`.

## Global Constraints

- Update exactly the seven Cranelift workspace dependencies to stable `0.136.0` in one lockfile-resolved migration; no RC, dual family, patch fork, compatibility aliases, or hand-edited checksums.
- `--locked` is required for every acceptance command; the lockfile must resolve a coherent 0.136.0 family and `cargo tree --locked -d` must not show duplicate Cranelift packages.
- One engine owner decides native JIT ISA flags: preserve frame pointers, `use_colocated_libcalls=false`, `is_pic=true` only for x86_64 native JIT, `is_pic=false` for other supported JIT architectures. AOT does not inherit JIT-only policy.
- Target ISA/frontend configuration is the only pointer-width authority for new frontend/stack APIs; never use host pointer width or a hard-coded `I64` substitute.
- Keep typed-program source authority, ABI-v5, Core.IO ownership, workers, and fixtures unchanged. This is a codegen/JIT migration, not a fallback route.
- Forced-far allocation is test support only. It must use portable reservation/commit/protection with RAII release; it must fail explicitly when placement cannot be established and must not silently skip a required x86_64 gate.
- A Windows JIT pass requires the formerly failing Foundation witness to execute source/AOT/shared/JIT with result `42`. Static/shared success is not a JIT substitute.
- Do not push, merge, publish, change credentials/guest configuration, or promote OpenSpec/CHANGELOG until all target evidence is independently reviewed.

## Review Focus

- A dependency-only bump must not leave a second native ISA construction site without x64 PIC.
- FunctionBuilder finalization and stack pseudo-instructions must use target-derived frontend configuration, not host width.
- Trusted versus untrusted `MemFlagsData` semantics must remain unchanged.
- Forced-far tests must measure displacement outside signed 32-bit range in both directions before asserting behavior.
- `object` 0.37 reader and Cranelift object 0.40 writer must be proven compatible through emitted bytes, not preemptively shimmed.

### Task 1: Lock the real 0.128 Windows witness and provider API boundary

**Files:**
- Modify: F6 JIT migration evidence report only

**Interfaces:**
- Produces: exact retained baseline evidence for the existing real Windows witness and a verified upgrade ordering constraint.

- [ ] **Step 1: Retain the existing real Windows JIT baseline**

Record the exact bcd36 Windows selector for
`foundation_contract_witnesses_preserve_distinct_receivers_through_forwarding_and_collection`:
source/AOT/shared return `42`; JIT fails in `compiled_blob.rs` with
`TryFromIntError(PosOverflow)`. Retain source closure, target, toolchain, and
route evidence. This is the 0.128 behavior baseline; do not replace it with a
cross-compile or a synthetic panic.

- [ ] **Step 2: Prove the external provider obstruction**

Compile a throwaway test-only import of `cranelift_jit::{JITMemoryProvider,
JITMemoryKind}` at 0.128. Expected: E0432 because the trait's required kind is
declared in private `cranelift_jit::memory` and is not re-exported. Remove the
throwaway source after recording the error; do not use a private upstream path,
fork, or patch.

- [ ] **Step 3: Record the migration ordering ruling**

Add the evidence ruling: 0.128 real native witness is the red baseline;
deterministic provider coverage begins only after 0.136 exposes the required
public type, before the PIC policy owner is changed. No compiler source,
dependency, or lockfile change is committed in this task.

### Task 2: Migrate stable Cranelift family and target frontend APIs

**Files:**
- Modify: `compiler/Cargo.toml`, `compiler/Cargo.lock`
- Modify: `crates/beskid_isle/src/{context.rs,lib.rs,emitter.rs,clif_primitives.rs,dispatch.rs,context/calls.rs,context/roots.rs,context/cleanup.rs}`
- Modify: `crates/beskid_isle/build.rs`
- Modify: `crates/beskid_codegen/src/module_emission/trampolines.rs`
- Modify: affected ISLE/codegen tests and assertions

**Interfaces:**
- Consumes: stable `TargetFrontendConfig` derived from target ISA.
- Produces: verified 0.136-compatible CLIF construction without host-width inference.

- [ ] **Step 1: Update all seven requirements together and resolve normally**

Set every workspace Cranelift requirement to `"0.136.0"`, run Cargo resolution,
and inspect the resulting lockfile. Do not edit checksums manually or upgrade
the direct `object=0.37.3` reader merely because Cranelift's writer uses 0.40.

- [ ] **Step 2: Run all-target check to obtain the API red list**

Run:

```bash
cargo check --locked -p beskid_isle -p beskid_codegen -p beskid_engine -p beskid_aot --all-targets
```

Expected: changed `MemFlags`, stack operation, frontend finalization, and ISLE
options APIs fail until the target-context migration is applied.

- [ ] **Step 3: Apply the coupled API migration**

Use `MemFlagsData` for construction and preserve each trusted/untrusted value.
Thread ISA-derived `TargetFrontendConfig` through emitter/context/primitives;
call `FunctionBuilder::finalize(isa.frontend_config())`; pass ISA-derived
pointer type to stack load/store helpers. Complete the new ISLE `CodegenOptions`
fields explicitly with `emit_logging=false`, `split_match_arms=false`, and
`match_arm_split_threshold=None`. Replace vacuous text-count assertions with
structural CLIF/root-slot assertions.

- [ ] **Step 4: Verify compiler/semantic migration**

Run focused ISLE/codegen tests, stock verifier checks, then the all-target
check. Assert memory flags retain original trust semantics and target config is
not synthesized from host width.

- [ ] **Step 5: Commit the coherent API/dependency slice**

```bash
git add Cargo.toml Cargo.lock crates/beskid_isle crates/beskid_codegen
git commit -m "feat(codegen): migrate to Cranelift 0.136"
```

### Task 3: Add portable forced-far coverage, then establish one native JIT ISA policy owner

**Files:**
- Modify: `crates/beskid_engine/src/jit_module.rs`
- Modify: `crates/beskid_engine/src/services/jit_preparation.rs`
- Modify: focused engine JIT policy/regression tests

**Interfaces:**
- Consumes: 0.136 public `JITMemoryKind` and migrated target frontend context.
- Produces: test-only portable forced-far provider plus one crate-private native JIT ISA constructor consumed by preparation and `JITBuilder::with_isa`.
- Produces: target-architecture policy test coverage.

- [ ] **Step 1: Write forced-far provider and old-policy regression on 0.136**

With 0.136's public provider interface, add a test-only RAII provider: Unix
uses mmap/mprotect/munmap and Windows uses reserve/commit/protect/free APIs.
Measure a displacement beyond signed `i32` before compiling both low-to-high
and high-to-low direct/tail transfer cases. Run it before policy changes.
Expected: the pre-policy custom ISA fails finalization/relocation; setup failure
is explicit, never a skip.

- [ ] **Step 2: Add policy tests before implementation**

Assert x86_64 native JIT selects PIC, all native JIT targets disable colocated
libcalls and preserve frame pointers, and AArch64 selects non-PIC. Assert both
existing construction callers use the same policy owner.

- [ ] **Step 3: Implement the single owner**

Create one crate-private helper that begins with existing production settings,
looks at the ISA builder target architecture, sets the JIT-specific flags, and
returns the finished native ISA. Replace both construction sites with it; keep
their contextual error messages and `JITBuilder::with_isa` symbol behavior.

- [ ] **Step 4: Run green forced-far and architecture tests**

Require both distance directions, direct/tail transfers, function/data identity,
near/far behavior, and callable function pointers. Retain existing AArch64
relocation regressions. A test through `JITBuilder::new` alone is insufficient.

- [ ] **Step 5: Commit provider, policy owner, and green regressions**

```bash
git commit -m "fix(engine): centralize native JIT ISA policy"
```

### Task 4: Run native target matrix and release evidence review

**Files:**
- Modify: F6 evidence reports/ledger only after commands complete
- Modify: CHANGELOG/OpenSpec only after all supported-target and release gates are complete

**Interfaces:**
- Consumes: Tasks 1–3 and rebuilt exact runtime kits.
- Produces: verified Windows JIT closure or a precise remaining migration defect.

- [ ] **Step 1: Audit resolved graph and artifact boundaries**

Run:

```bash
cargo tree --locked -d
cargo test --locked -p beskid_isle
cargo test --locked -p beskid_codegen
cargo test --locked -p beskid_aot
cargo test --locked -p beskid_engine
cargo check --locked --workspace --all-targets
cargo fmt --check
```

Expected: one coherent Cranelift family; object writer/reader interaction is
validated with real emitted ELF/COFF/Mach-O bytes rather than type shims.

- [ ] **Step 2: Prove the former Windows witness green**

On exact Windows source closure and rebuilt runtime kit, run:

```bash
cargo test --locked -p beskid_engine --test foundation_io_native foundation_contract_witnesses_preserve_distinct_receivers_through_forwarding_and_collection -- --exact --nocapture --test-threads=1
```

Expected: source, AOT, shared, and JIT all return `42`; no `PosOverflow`,
verifier, or runtime-kit provenance failure.

- [ ] **Step 3: Run full cross-platform gates**

Run full Foundation, external wait, owner transport, source-origin authority,
F4 native lifecycle gates, rebuilt static/shared kits, then the serial runtime
gate on Windows/Linux/macOS. Linux execution requires the exact isolated
build-box route; emitted Windows executable/COFF/UCRT proof remains a separate
required cell.

- [ ] **Step 4: Independent full review and controlled promotion**

Review dependency graph, single policy ownership, memory semantics, far-test
validity, native logs, and generated output. Update F6 ledger first. Do not
promote OpenSpec completion markers or CHANGELOG until all Linux, Windows
binary/UCRT, and full release evidence requirements are independently green.

## Self-Review

- Task 1 preserves the real old failure and proves why deterministic provider coverage begins only after the stable API migration.
- Task 2 handles all coupled API changes and preserves target authority.
- Task 3 gives preparation and final emission one JIT policy owner.
- Task 4 requires the formerly failing Windows JIT witness and every target gate; no static/shared substitution exists.

## Execution Handoff

Use the already authorized subagent-driven implementation and independent review after each task. The current Linux host route and Windows emitted-binary proof remain separate release obligations; they are not workarounds for the JIT migration.
