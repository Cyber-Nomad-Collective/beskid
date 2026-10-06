# beskid compiler and corelib quality for the 0.6 release loop

Assessment date: 2026-10-04. The compiler receives a provisional **6/10** and
corelib **6.5/10**. The architecture has valuable boundaries and extensive tests,
but successful scaffolds, incomplete runtime semantics, and gaps in acceptance
accounting deserve attention before broad restructuring. Use 0.6 cleanup to
close these contracts while delivering the already planned native BSOL and Rust
Glue capabilities.

These are reviewer judgments, with roughly one point of uncertainty, rather
than benchmark results or a release certification. Web sources establish the
rubric; checked-out source establishes the findings. A confirmed correctness
defect overrides a favorable numerical average.

## Scope and evidence

Inspected root `50bcaa3346413edd2cdae04ef3e8d270a6f36557`, compiler
`887669f55ceee4db8c511be323e048e24ac42292`, corelib
`3f2ab816e5444f5ab7bae3f78ad7dd58d12fdeee`. Existing root changes and untracked
corelib files were preserved. GitNexus was initially consulted but then excluded
at the user's request; no rating depends on its graph.

Sampling covered the typed-codegen boundary, semantic-query organization,
native mod dispatch, Glue, registry materialization, dynamic runtime, corelib
collections, native IO tests, and release gate scripts. This is not exhaustive.
The existing [0.6 design](../superpowers/specs/2026-10-04-beskid-v0-6-release-design.md)
remains the scope reference. This report neither starts an implementation loop
nor authorizes publication.

Fresh checks:

- `bash compiler/scripts/verify-corelib-tests-parity.sh` passed: 80 targets.
- The retired type-system pattern search used by the Rust gate returned no
  matches in compiler Rust sources.
- `cargo fmt --all -- --check` produced differences in 182 files, including
  workspace/vendor content, and warnings about nightly-only settings under the
  configured stable toolchain. Resolve formatter policy before treating this as
  a uniform formatting defect; no formatting was applied.
- An inventory under `compiler/crates` counted 213,759 Rust source lines,
  including tests/generated code, 2,409 test-attribute matches, 28 ignore
  attributes, and no `todo!`/`unimplemented!` occurrences. These are search
  counts, not coverage, correctness, or executed-test counts.
- No full Cargo test, Clippy, corelib runtime, fuzz, or native target matrix was
  executed for this assessment. No readiness claim follows from static evidence.

## Rating rationale

| Dimension | Compiler | Corelib | Rationale |
|---|---:|---:|---|
| Architecture and ownership | 8/10 | 7/10 | Typed input, generation checks, canonical ABI and source authority are strong. Compiler-replaced corelib operations need explicit, navigable contracts. |
| Maintainability | 6/10 | 6/10 | Focused modules coexist with large contract logic, old release comments and scaffolds. Collection policies need greater consistency. |
| Error and semantic completion | 4/10 | 5/10 | Native dispatch has successful stub fallbacks; registry substitution and dynamic mapping need closure. Queue and copy contracts need executable edge cases. |
| Verification design | 7/10 | 8/10 | Domain suites, verifier calls, parity checks and native matrix tests are substantial. Missing-input skips and limited generative evidence weaken confidence. |
| Overall judgment | **6/10** | **6.5/10** | Weighted toward behavior and trustworthiness; not an arithmetic mean. |

Do not judge the compiler by file size alone. The analysis crate accounts for
58,085 lines and queries for 29,680, including tests. The 1,210-line
`types/checker/contracts.rs` is an investigation target, not proof it needs a
split. Extract only around a demonstrated invariant or ownership boundary.

## Findings and target paths

All paths below are relative to the compiler workspace unless stated otherwise.

| Priority and area | Current evidence | Target single path and acceptance | Risk |
|---|---|---|---|
| P0 Acceptance accounting | [corelib_spine_harness.rs](../../compiler/crates/beskid_tests_projects/src/spine/corelib_spine_harness.rs#L98) allows an empty selection and skips missing catalog files at lines 111–114. The parity script compares names. This does not establish that today's files are missing. | Release mode requires every declared input and records selected, executed, passed, failed and skipped counts. Required missing/skipped cases fail. Preserve intentional local subset runs as explicitly local. | Medium; prevents false green results. |
| P0 Resolver correctness | [registry.rs](../../compiler/crates/beskid_analysis/src/projects/workflow/registry.rs#L35) falls back to the first active version when the requested version is absent; the resulting lock sets `artifact_digest: None`. Several fetch/parse errors become `Ok(None)`. | One strict resolver: exact requested coordinate or actionable failure, integrity-bound lock/materialization, staged writes and rollback. Fixture registry tests for absent/yanked versions, corrupt artifacts and offline/locked behavior. Verify caller treatment of `None` before claiming end-to-end successful builds. | High; dependency identity and reproducibility. |
| P0 Native mod and Rust Glue | [native.rs](../../compiler/crates/beskid_analysis/src/mod_host/native.rs#L73) logs load failures and later delegates to an inner stub; generator dispatch unconditionally delegates at lines 130–140. [stub.rs](../../compiler/crates/beskid_analysis/src/mod_host/invoker/stub.rs#L92) returns an empty successful generator outcome. [glue.rs](../../compiler/crates/beskid_analysis/src/mod_host/glue.rs) observes annotations and returns the program unchanged. | Production invocation either produces validated output or a terminal error. Restrict mock invokers to explicit tests. Rust Glue must generate, build, link and execute through the shared boundary, including failure/cleanup paths. | High; false completion and foreign ownership. |
| P0 Dynamic and serialization foundation | [Dynamic.bd](../../compiler/runtime/beskid/src/Runtime/Dynamic/Dynamic.bd#L32) initializes the shape word to zero; mapping exports at lines 49–58 ignore `mapping` and return the stored payload. | Real registered shape identity, checked conversions, defined mapping dispatch and traced lifetime. Native tests with forced collection, incompatible shapes and allocation failure before using this as serialization infrastructure. A GC defect remains a hypothesis until reproduced. | High; wrong values and lifetime correctness. |
| P1 Queue storage policy | [Queue.bd](../../compiler/corelib/packages/foundation/src/Core/Collections/Queue.bd#L19) appends on enqueue and advances head on dequeue; it resets storage only when emptied. | Choose bounded reuse/compaction under sustained nonempty churn, retain FIFO semantics and managed-reference clearing. Assert capacity tracks peak live count under a defined bound; measure native behavior. | Medium; long-lived memory growth. |
| P1 Copy consistency | [Array.CopyRange](../../compiler/corelib/packages/foundation/src/Core/Collections/Array.bd#L87) loops forward without range preflight; [Slice.Copy](../../compiler/corelib/packages/foundation/src/Core/Bytes/Slice.bd#L45) validates ranges and chooses direction. | Specify alias/overlap, negative length and invalid-range behavior first. Share the policy, with typed barriers preserved. Test same-array forward/backward overlap and failure mutation behavior. If overlap is forbidden, reject it explicitly. | Medium; data semantics. |
| P1 Semantic maintenance | `beskid_queries/src/semantic_contract` is already split into focused clusters; checker contract logic still has substantial mutable context. Separate implementations are a drift lead, not proof of competing authorities. | One owner per semantic fact, diagnostics/lowering consuming the same meaning; cold and incremental facts agree after edits. Refactor only reproduced drift or a boundary that simplifies these invariants. | High if changing semantic ownership. |
| P2 Formatting and docs | Stable toolchain plus unstable rustfmt settings; backend text promises 0.5 generation while Rust/.NET still return `NotImplementedFor0_4`. Corelib aggregate README and IO checkpoint comments also drift. | Reproducible pinned tooling and accurate capability/error documentation. Keep formatting changes separate from semantic changes. | Low; review noise and misleading guidance. |

The principal strengths should be preserved. [CodegenInput](../../compiler/crates/beskid_codegen/src/codegen_input.rs#L45)
validates roots, target and canonical manifest, and protects composition generation.
[ISLE emitters](../../compiler/crates/beskid_isle/src/emitter.rs) and trampoline
emitters call stock `verify_function`. Runtime matrix scripts explicitly execute
several ignored tests: **28 ignores do not mean 28 abandoned tests**. Native IO
tests and canonical authority rejection tests are valuable evidence mechanisms.

Corelib methods such as `Array.Append`, `Clear` and `Capacity` have compiler-owned
lowering. Their apparent source no-op bodies are not sufficient evidence of
broken execution. Make the source-to-query-to-ISLE contract visible and test it
through native execution; do not replace these with generic helper abstractions
without preserving rooted growth, descriptors and write barriers.

## Web based criteria

The following recommendations adapt primary-source practices to beskid; they
are not claims that beskid currently implements those practices.

1. Require a minimized regression test that fails before the correction and
   passes afterward. State the property, and test library behavior near its
   implementation. [Rust compiler testing guidance](https://rustc-dev-guide.rust-lang.org/tests/adding.html)
2. Make semantic query dependencies explicit and test deterministic cold versus
   incremental results. The equivalence gate is our inference from the model,
   rather than an instruction about Salsa's exact API.
   [rustc query evaluation model](https://rustc-dev-guide.rust-lang.org/queries/query-evaluation-model-in-detail.html)
3. Keep stock CLIF verification mandatory, while separately checking source
   semantics and runtime ownership. The verifier checks IR integrity and typing;
   it does not certify the Beskid-to-CLIF translation. Current online docs show
   0.137 development; this checkout pins Cranelift 0.136.
   [Cranelift verifier](https://docs.wasmtime.dev/api/cranelift_codegen/verifier/index.html)
4. Add bounded structure-aware generation and differential oracles for valid
   programs and malformed parser inputs. Reduce failures and retain their seeds.
   Use OpenSpec to settle platform/resource/float differences before reporting
   disagreement as a defect.
   [Wasmtime fuzzing](https://docs.wasmtime.dev/contributing-fuzzing.html),
   [Rust Fuzz structured inputs](https://rust-fuzz.github.io/book/cargo-fuzz/structure-aware-fuzzing.html)
5. Audit unsafe boundaries by proof obligation: initialization, alignment,
   aliasing, lifetime, callable signature and library lifetime. The crate scan
   found no proptest/quickcheck/cargo_fuzz references; this does not exclude
   custom generators or external campaigns. SAFETY comment counts likewise
   cannot establish soundness.
   [Rust unsafe guidance](https://doc.rust-lang.org/std/keyword.unsafe.html)

Miri may help isolated Rust pointer code, but cannot certify Beskid AOT/corelib
execution and has FFI limitations. Native ownership/GC tests are essential here.
[Miri limitations](https://github.com/rust-lang/miri/)

## Running the 0.6 cleanup loop

Use Tracker SQLite for delivery records and OpenSpec for normative behavior.
Suggested workstream names below are planning labels, not created tasks.

1. **Acceptance owner: establish the baseline.** Reconcile shipped 0.5.2, current
   main and existing drafts once. Freeze root/compiler/corelib revisions, target,
   tool versions and kit/artifact digests. Run the real baseline gates and record
   failures separately from environment prerequisites and historical defects.
   Fix missing-input/skipped-test accounting first.
2. **Domain owner: select one vertical slice.** Prefer resolver integrity, native
   mod/Glue closure, dynamic shape/lifetime correctness, then collection contracts.
   Each task has one invariant, source evidence, scope, native reproducer, owner
   and acceptance commands. Update OpenSpec before observable changes.
3. **Implementer: complete the migration.** Lock behavior with a failing test,
   establish the canonical path, migrate all callers and delete superseded paths
   in the slice. Do not declare success when a stub or compatibility fallback
   still serves required production behavior. Use isolated branches/worktrees;
   parallelize only slices that do not share semantic/runtime ownership.
4. **Verifier: run increasing gates.** Targeted tests first, then impacted domain
   suites, CLIF verification, corelib parity and native runtime tests. Add bounded
   generative tests for changed parser/layout/collection/serialization semantics.
   Run the full Rust/corelib and Linux x64, macOS arm64, Windows x64 acceptance
   matrix before accepting the release candidate, including explicit ignored
   matrix cases. Do not rely on bare `cargo test`: default members exclude the
   test sink crates, and CI excludes `beskid_e2e_tests` from its workspace run.
5. **Independent reviewer: close the slice.** Compare behavior with the spec,
   inspect failure propagation and ownership, and check that dead paths and all
   callers are gone. Record the regression's before/after result, commands,
   source identities and artifact hashes. Reassess unresolved risks and select
   the next slice.

Track required scenarios executed, unexpected skips, unresolved correctness
defects, production stub fallbacks, minimized regressions, native target results,
and compile/test duration or peak memory for affected workloads. Avoid LOC
reduction, raw test count or a rising subjective score as acceptance criteria.

The exit condition is source-bound evidence for all required 0.6 obligations:
every required matrix cell passes, no unexplained missing/skipped inputs, no
successful production fallback for required capabilities, Rust Glue compiles and
executes, native BSOL has parser/writer/schema/typed round-trip and parity evidence,
and installation journeys use the frozen artifacts. Cleanup should support this
closure; an unrelated compiler redesign should not become a prerequisite.
