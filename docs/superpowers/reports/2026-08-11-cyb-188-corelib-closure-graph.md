# CYB-188 — Corelib 61/61 closure graph

Date: 2026-08-11

Research branch: `research/0-4-corelib-failure-graph`

Superproject: `0733294b3f07269182b38e610bf4646889ce61c1`

Compiler/corelib gitlink: `8bbdb593208bfd5e8ecb7df04aba07ddbc50b498`

## Decision

The 41-failure count in [CYB-181 — Recover authoritative 61-target Corelib matrix and bounded harness](https://linear.app/cybernomad-it/issue/CYB-181/v04-recover-authoritative-61-target-corelib-matrix-and-bounded-harness) is a retained 2026-08-09 snapshot, not the current closure denominator. A bounded reconstruction at the pinned current source tip produced **38 passing / 23 failing targets**. The first EOF-bound `--all-targets` process reached 43 targets in exactly 300 seconds; a bounded tail-only replay completed the untouched targets in 214 seconds. No target hung.

The 23 current target failures reduce to four implementation causes:

1. generic call specialization/ABI fact collection (14 targets), owned by [CYB-140 — Generalize generic call ABI-specialization harvesting for reachable corelib helpers](https://linear.app/cybernomad-it/issue/CYB-140/w59a3-generalize-generic-call-abi-specialization-harvesting-for);
2. missing syntax result/storage facts for `LetStatement`, `ReturnStatement`, `AssignExpression`, and match/direct-call results (8 targets after excluding the independent `Yield` failure), requiring one new focused leaf;
3. non-generic scalar-payload enum constructor layout (`Style.Margin::Value`) within one of those targets, requiring one new focused enum-layout leaf rather than reopening the completed generic-`Result` ticket;
4. unlowered trusted `__fiber_yield()` call (1 target), owned by [CYB-31 — Scheduler, concurrency and callbacks](https://linear.app/cybernomad-it/issue/CYB-31/w54-scheduler-concurrency-and-callbacks), with a focused leaf recommended.

[CYB-181](https://linear.app/cybernomad-it/issue/CYB-181/v04-recover-authoritative-61-target-corelib-matrix-and-bounded-harness) remains the sole harness/performance owner. The current CLI repeatedly resolves, materializes, normalizes, and typechecks each target, contrary to the normative one-workspace/one-generation session contract. Deterministic EOF is already correct; the missing harness work is state reuse and complete bounded reporting.

No current failure justifies restoring HIR, compatibility imports, fallback lowering, test skips, or relaxed fail-closed facts.

## Primary-source basis

| Fact | Primary source | Consequence |
|---|---|---|
| The manifest has 61 targets. | `compiler/corelib/beskid_corelib/tests/corelib_tests/corelib_tests.bproj` | 61 is the only valid denominator. |
| The CI gate binds stdin to EOF and invokes `--all-targets --plain`. | `scripts/ci/corelib-gate.sh:78-82` | SIGTTIN/background-PTY behavior is not a compiler-hang family. |
| The current gate has a whole-matrix cap but defaults to 1800 seconds. | `scripts/ci/corelib-gate.sh:79-81` | The release acceptance's sub-five-minute goal is not enforced by this shell gate. |
| The normative matrix must use one resolved/materialized workspace and one generation-bound Salsa/engine session. | `openspec/changes/complete-v0-4-corelib-runtime-contracts/specs/compiler--conformance--test-harnesses-and-fixtures/spec.md:3-25` | Per-target rematerialization is a conformance failure even if 61/61 eventually passes. |
| The design explicitly requires resolve/materialize once and reused state. | `openspec/changes/complete-v0-4-corelib-runtime-contracts/design.md:142-156`; `tasks.md:66-75` | Harness performance has one canonical owner and one clear repair boundary. |
| `Array.AppendAt<T>` calls `EnsureCapacity<T>` and `Set<T>` from a reachable generic helper. | `compiler/corelib/packages/foundation/src/Collections/Array.bd:62-84` | The repeated unavailable `call_abi_signature` diagnostics are one collector cause, not collection-target-specific bugs. |
| `Yield()` contains only the trusted `__fiber_yield()` call. | `compiler/corelib/packages/concurrency/src/Concurrency.bd:1-6` | `ConcurrencyClockTests` exposes one narrow runtime-call lowering gap. |
| `Hub.Register<T>` combines generic `Hub<T>`, `Channel<T>`, and generic `Result<SendOk,HubError>`. | `compiler/corelib/packages/concurrency/src/Concurrency/Hub.bd:8-46` | Its `abi_type unavailable` failures belong to generic ABI specialization, not the hub runtime implementation. |
| `Style.Margin::Value` carries an `i32` payload. | `compiler/corelib/packages/console/src/Console/Style.bd:15-25` | Its current `InvalidEnumLayout` is not the completed CYB-136 generic-`Result` shape. |
| Current collection sources still use `Collections.*` and compatibility allocation, while the active OpenSpec requires `Core.Collections.*` and deletes those paths. | `compiler/corelib/packages/foundation/src/Collections/Array.bd:1-10`; `openspec/changes/complete-v0-4-corelib-runtime-contracts/design.md:158-176` | Matrix correctness and API/runtime completion are distinct release gates. |

Tracker descriptions and relations were read directly from Linear for CYB-181, CYB-188, CYB-140, CYB-31, CYB-136, CYB-137, CYB-138, CYB-141, CYB-156–163, CYB-173–174, CYB-184–186, and CYB-191. No tracker mutation was made.

## Reproduction

The current-tip CLI build completed in 15.28 seconds:

```bash
cd compiler
cargo build -p beskid_cli --release
```

The authoritative bounded run was:

```bash
cd compiler/corelib/beskid_corelib/tests/corelib_tests
timeout --kill-after=10s 300s env \
  BESKID_RUNTIME_PREFIX="$PWD/../../../../target/native-runtime-kit" \
  BESKID_RUNTIME_KIT_PROFILE=release \
  RUST_MIN_STACK=67108864 \
  ../../../../target/release/beskid_cli test \
  --project corelib_tests.bproj --all-targets --plain </dev/null
```

The path above is shown conceptually; the actual invocation used absolute paths rooted at `/Users/mikserek/Projects/beskid/compiler`. The process reached `ConsoleTerminalPlatformTests` at the 300-second cap. The remaining manifest tail was replayed target-by-target with a 40-second per-target cap and a 240-second total cap. That replay finished in 214.47 seconds. The interrupted `ConsoleTerminalPlatformTests` was replayed and passed.

This is diagnostic evidence, not release evidence: OpenSpec requires a single unfiltered 61/61 process after the repairs.

## Current 61-target disposition

| Target | Current | Canonical cause/owner |
|---|---:|---|
| SystemSyscallWriteTests | PASS | No current blocker |
| SystemSyscallApiTests | PASS | No current blocker |
| SystemSyscallErgonomicsTests | PASS | No current blocker |
| SystemOutputWriteLineTests | PASS | No current blocker |
| SystemOutputWriteTests | PASS | No current blocker |
| ConsoleAnsiEscapeTests | PASS | No current blocker |
| ConsoleAnsiStyleChainTests | PASS | No current blocker |
| ConsoleFormatMarkdownTests | PASS | No current blocker |
| ConsoleAnsiSgrGoldenTests | PASS | No current blocker |
| ConsoleControlsPanelTests | PASS | No current blocker |
| ConsoleControlsProgressBarTests | PASS | No current blocker |
| ConsoleControlsLayoutTests | PASS | No current blocker |
| SystemInputReadTests | PASS | No current blocker; EOF binding is effective |
| SystemErrorWriteTests | PASS | No current blocker |
| CoreResultsTests | PASS | No current blocker |
| CoreOptionalTests | PASS | No current blocker |
| CoreBytesTests | PASS | No current blocker |
| CoreEncodingUtf8Tests | FAIL | CYB-140: generic `Assert.Equal` call signature |
| CoreExpressionBodyTests | FAIL | CYB-140: reachable `Array.AppendAt` signature |
| CompilerSdkSurfaceTests | FAIL | CYB-140: reachable `Array.AppendAt` signature |
| CompilerSdkEmitterTests | FAIL | CYB-140: reachable `Array.AppendAt` signature |
| ConcurrencyStatusAbiTests | PASS | No current blocker |
| CollectionsArrayTests | FAIL | CYB-140: reachable `Array.AppendAt` signature |
| CollectionsTier1Tests | PASS | No current blocker; passing does not prove storage semantics |
| CollectionsTests | FAIL | CYB-140: reachable `Array.AppendAt` signature |
| CollectionsListTests | PASS | No current blocker; passing does not prove storage semantics |
| CollectionsMapTests | PASS | No current blocker; passing does not prove storage semantics |
| CollectionsSetTests | FAIL | CYB-140: reachable `Array.AppendAt` signature |
| CollectionsQueueTests | PASS | No current blocker; passing does not prove storage semantics |
| CollectionsStackTests | FAIL | CYB-140: reachable `Array.AppendAt` signature |
| QueryTests | FAIL | CYB-140: generic `Assert.Equal`, array, and query helper signatures |
| SystemFsTests | PASS | No matrix blocker; CYB-185 still owns real host-backed semantics |
| SystemPathTests | PASS | No current blocker |
| SystemTimeTests | PASS | No current blocker |
| ConcurrencyChannelApiTests | PASS | No current blocker |
| ConcurrencyMutexTryLockTests | PASS | No current blocker |
| ConcurrencyClockTests | FAIL | CYB-31 focused leaf: trusted `__fiber_yield()` call |
| ConcurrencyHubRegisterTests | FAIL | CYB-140: generic `Register<T>` ABI type |
| ConcurrencyWaitGroupTests | PASS | No current blocker |
| ConcurrencyFiberHandleTests | PASS | No current blocker |
| ConsoleMessageChannelTests | PASS | No current blocker |
| ConsoleCapabilitiesTests | PASS | No current blocker |
| ConsoleTerminalPlatformTests | PASS | No current blocker |
| ConsoleFacadeTests | PASS | No current blocker |
| ConsoleFormatAttributesTests | FAIL | New syntax-result/storage-facts leaf |
| ConsoleFormatScanTests | PASS | No current blocker |
| ConsoleStyleTests | FAIL | New syntax-result/storage-facts leaf plus new scalar-payload enum-layout leaf |
| ConsoleControlsFrameTests | PASS | No current blocker |
| ConsoleAnsiBuildersTests | PASS | No current blocker |
| ConsoleRenderContextTests | FAIL | New syntax-result/storage-facts leaf: nested direct-call return |
| TextCursorTests | PASS | No current blocker |
| TextParserTests | FAIL | New syntax-result/storage-facts leaf: generic match return/direct-call let |
| TextRegexTests | FAIL | CYB-140: generated generic-call ABI type |
| TextCasingTests | FAIL | New syntax-result/storage-facts leaf: scalar match-expression return |
| TextParserCombinatorTests | FAIL | New syntax-result/storage-facts leaf: direct-call let/enum return |
| PestGrammarParseTests | FAIL | CYB-140: generated generic-call ABI type |
| PestEmitGoldenTests | FAIL | CYB-140: generated generic-call ABI type |
| TextRegexIntegrationTests | FAIL | CYB-140: generated generic-call ABI type |
| CoreMathTests | PASS | No current blocker |
| CoreRandomTests | FAIL | New syntax-result/storage-facts leaf: assignment and local-result facts |
| CoreArgsTests | FAIL | New syntax-result/storage-facts leaf: return, let, and assignment facts |

Totals: **38 PASS / 23 FAIL / 0 unobserved**.

## Failure-family ownership

### 1. Semantic fact/assembly and generic specialization

**Canonical owner:** [CYB-140 — Generalize generic call ABI-specialization harvesting for reachable corelib helpers](https://linear.app/cybernomad-it/issue/CYB-140/w59a3-generalize-generic-call-abi-specialization-harvesting-for).

The dominant diagnostics are one of:

- `call_abi_signature is unavailable until its AST/Salsa port is complete` for reachable generic helpers such as `Array.AppendAt`, `Assert.Equal`, and query operators;
- `abi_type is unavailable until its AST/Salsa port is complete` for `Hub.Register<T>` and generated regex calls.

These are not 14 independent product bugs. CYB-140 already owns specialization harvesting for reachable Corelib helpers, exact ABI derivation, distinct specialization identity, and fail-closed ambiguity. Its acceptance must be expanded from the now-green ProgressBar example to the currently reproduced shapes:

- imported generic helper bodies reached transitively;
- explicit and inferred type arguments;
- generic nominal receivers (`Hub<T>`/`Channel<T>`);
- generated sources with nested qualified generic returns;
- multiple ABI-distinct instantiations in one generation.

No new generic ticket is justified unless a RED-first focused test proves `call_abi_signature` and `abi_type` fail for different semantic causes. Today they are two emitted facts from the same specialization collector boundary.

### 2. Syntax result and storage facts

**Missing leaf (recommended title):** `Complete generation-bound syntax result and storage facts for Corelib statement lowering`.

This leaf should own only exact unavailable facts for:

- direct-call and nested-call results used by `ReturnStatement` or typed `LetStatement`;
- match-expression results returned or assigned to typed locals;
- explicitly mutable local/aggregate/array assignments whose target and value types are already semantically proven;
- deterministic span-bearing rejection when any type, target, or mutability fact is unavailable.

It should not add a generic statement fallback. It should extend the semantic authority behind the already completed narrow work in CYB-145 and CYB-155, with focused RED fixtures for the current `StyleChain.FgRgb`, `RenderContext.MoveTo`, `Parser.Result.IsOk`, `String.Chars`, `Random`, and `Args` shapes. Production remains `TypedProgram -> CodegenInput -> ISLE -> verified CLIF`.

### 3. Enum/control-flow

**Missing leaf (recommended title):** `Materialize exact scalar-payload enum constructor layouts in syntax facts`.

`ConsoleStyleTests::resolve_margin_value` fails with `InvalidEnumLayout` for `Style.Margin::Value(3)`, whose declaration is a non-generic enum with an `i32` payload. [CYB-136 — Materialize concrete generic enum layouts for syntax facts](https://linear.app/cybernomad-it/issue/CYB-136/w59b1-materialize-concrete-generic-enum-layouts-for-syntax-facts) is complete and explicitly scoped to instantiated generic enums such as `Result<i64, SyscallError>`; reopening it would blur two contracts.

The new leaf should prove unit variants, nested nominal payloads, and exact scalar payload width/offset for non-generic imported enums, while keeping unresolved layouts unavailable. It can proceed in parallel with the syntax result/storage leaf, but both must be green before replaying `ConsoleStyleTests`.

### 4. Allocation/rooting

**Current matrix failures:** none demonstrated.

The previously related ANSI allocation/string-handle targets now pass. CYB-156, CYB-157, CYB-158, and CYB-159 must therefore not be treated as current 61/61 blockers solely from stale status. They need focused current-tip acceptance review before closure, because a passing ANSI target does not prove all managed allocation/root/barrier obligations.

[CYB-184 — Implement rooted Core.Collections backing storage](https://linear.app/cybernomad-it/issue/CYB-184/v04-implement-rooted-corecollections-backing-storage) remains a separate normative release requirement. Several collection targets pass against compatibility/count-only behavior that OpenSpec explicitly requires deleting. CYB-184 is not a substitute for CYB-140, and CYB-140 green is not evidence that CYB-184 is complete.

### 5. API/runtime

**Canonical owner:** [CYB-31 — Scheduler, concurrency and callbacks](https://linear.app/cybernomad-it/issue/CYB-31/w54-scheduler-concurrency-and-callbacks).

**Focused leaf (recommended title):** `Lower manifest-authorized Concurrency.Yield through the ABI-v5 runtime kit`.

`ConcurrencyClockTests` passes `NowMillis` and `ProcessorCount` but fails only `yield_invokes_builtin` at the `__fiber_yield()` call. This is narrower than generic spawn legality and broader scheduler implementation. The leaf should prove manifest authorization, exact signature, JIT symbol registration, verified CLIF, and installed-kit execution; it must reject look-alike untrusted declarations.

[CYB-185 — Implement canonical host-backed Core.FS](https://linear.app/cybernomad-it/issue/CYB-185/v04-implement-canonical-host-backed-corefs) and [CYB-186 — Complete Corelib API and purge all stubs](https://linear.app/cybernomad-it/issue/CYB-186/v04-complete-corelib-api-and-purge-all-stubs) remain release requirements even though `SystemFsTests` currently passes. Passing fabricated or heuristic behavior is not normative completion.

### 6. Performance

**Canonical owner:** CYB-181.

The first process consumed the full 300-second diagnostic budget after 43 target starts. The output repeatedly showed `Resolve manifest`, `Resolve dependency graph`, `Materialize dependencies`, normalization, and typechecking for each target. This directly matches the retained CYB-181 diagnosis and violates the one-workspace/one-generation requirement.

Do not create a separate performance ticket yet. Implement or profile OpenSpec task 5.1 first. Split only if bounded profiling then proves two independently actionable causes (for example workspace materialization versus generation-state invalidation) with distinct symbols and acceptance.

### 7. Harness-only

**Canonical owner:** CYB-181.

- Deterministic EOF: working.
- Per-target hang: not reproduced.
- Denominator: correctly derived as 61.
- One-session reuse: not working.
- Sub-five-minute full run: not met.
- Required per-target 120-second timeout/phase attribution and clean cancellation: the shell wrapper provides only a whole-process timeout; the CLI output has phase text but no demonstrated per-target cancellation contract.

The EOF repair should be recorded as already-landed evidence within CYB-181, not copied into another ticket.

## Minimal closure graph

```text
CYB-140 generic specialization/ABI facts ------------------+
new syntax result/storage facts leaf ----------------------+---> CYB-181 fresh single-process 61/61 + <5 min
new scalar-payload enum-layout leaf ------------------------+
CYB-31 focused Concurrency.Yield leaf ----------------------+

CYB-181 correctness evidence ---> CYB-184 rooted collections --+
                              +-> CYB-185 canonical Core.FS ----+--> CYB-186 fail-closed API/stub audit

CYB-181 harness/session reuse -------------------------------> final CYB-181 release evidence
```

For the matrix itself, CYB-140 and the three focused repair leaves are parallel. The only necessary join is the fresh CYB-181 single-process replay. CYB-184/CYB-185/CYB-186 are a separate semantic-completion branch; they must not be hidden under a 61/61 claim.

## Existing-ticket disposition

| Ticket | Recommendation | Reason |
|---|---|---|
| CYB-140 generic specialization | Keep open; make it the sole generic fact owner | Directly reproduced across 14 current failures. |
| CYB-161 Core.Error imports | Close as landed after attaching current focused evidence | `SystemErrorWriteTests` passes. |
| CYB-162 event-bearing field projection | Close as landed after attaching current focused evidence | `ConsoleControlsProgressBarTests` passes. |
| CYB-163 ANSI mutable local | Close as landed after attaching current focused evidence | `ConsoleAnsiEscapeTests` passes all tests. |
| CYB-138 string equality | Close as landed after attaching current focused evidence | ANSI/string equality targets pass. |
| CYB-156–159 allocation chain | Audit acceptance; remove as matrix blockers | ANSI/style-chain targets pass, but broader managed allocation evidence is not established by this research. |
| CYB-173 LambdaExpression | Do not map to this matrix without reproduction | No current diagnostic names `LambdaExpression`. |
| CYB-174 TryExpression/CodeStringLiteral | Do not map to this matrix without reproduction | No current diagnostic names either construct. |
| CYB-136 generic enum layouts | Keep closed; create the narrower non-generic scalar-payload leaf | Current `Margin::Value` shape is outside CYB-136's completed scope. |
| CYB-181 harness/matrix | Keep open; sole correctness/performance/evidence join | Owns EOF, session reuse, budgets, and final report. |
| CYB-184/CYB-185/CYB-186 | Keep separate and ordered | Passing tests do not prove the required real semantics or stub purge. |

## Human decisions with recommendations

1. **Should the map continue to call this “41 failures”?**

   **Recommendation: no.** Preserve 20/41 as dated CYB-181 history, but plan against the current 38/23 baseline. Otherwise already-green targets will retain unnecessary owners and dependency edges.

2. **Should passing stale bug tickets be closed immediately?**

   **Recommendation: close them as already landed only after attaching current-tip focused command, exact pins, and acceptance result.** Do not retain them as release blockers, but do not claim broader acceptance from one transitive pass.

3. **Should generic `call_abi_signature` and generic `abi_type` failures become separate tickets?**

   **Recommendation: keep one CYB-140 owner initially.** Both arise during generic specialization collection. Split only if focused RED tests prove independent semantic defects.

4. **Should the ordinary `Let`/`Return`/`Assign` failures be distributed across each Corelib package?**

   **Recommendation: no.** Create one semantic-authority leaf, because the repeated failing boundary is generation-bound syntax result/storage facts, not the API packages that expose it.

5. **Should the `Style.Margin::Value` enum failure reopen CYB-136?**

   **Recommendation: no.** CYB-136's accepted scope was instantiated generic enums. Create a narrow non-generic scalar-payload enum-layout leaf and preserve CYB-136's historical decision.

6. **Should `Concurrency.Yield` be absorbed into the generic syntax-facts leaf?**

   **Recommendation: no.** It is a trusted runtime intrinsic authority/lowering path with manifest and installed-kit obligations. Keep it under CYB-31 as a focused leaf.

7. **Is 61/61 equivalent to Corelib completion?**

   **Recommendation: explicitly no.** The current `SystemFsTests` and several collection tests pass while OpenSpec still requires real host-backed FS, rooted storage, namespace hard cuts, and stub deletion. Treat matrix correctness and semantic API completion as two gates that join at CYB-186/final release evidence.

8. **Should harness performance be split now?**

   **Recommendation: no.** CYB-181 and OpenSpec task 5.1 already name the cause and acceptance. Profile after state reuse is implemented; split only on evidence of independent residual causes.

9. **May any repair use HIR, compatibility imports, or fallback lowering to reach 61/61?**

   **Recommendation: no.** All new leaves must fail closed and prove the sole production `TypedProgram -> CodegenInput -> ISLE -> verified CLIF` path.

## Resolution comment draft for CYB-188

> Current-tip primary-source research is complete on branch `research/0-4-corelib-failure-graph`; report: `docs/superpowers/reports/2026-08-11-cyb-188-corelib-closure-graph.md`.
>
> The dated CYB-181 baseline was 20/61; the bounded reconstruction at root `0733294b` / compiler `8bbdb593` is now **38/61 pass, 23/61 fail, 0 unobserved**. A five-minute EOF-bound shared run reached 43 targets and a 214-second bounded tail replay covered the rest. No target hung.
>
> The 23 failures collapse to: (1) generic specialization/ABI facts across 14 targets, canonically owned by CYB-140; (2) one missing generation-bound syntax result/storage-facts leaf for direct-call/match results and let/return/assignment lowering; (3) one narrow non-generic scalar-payload enum-layout leaf for `Style.Margin::Value`; and (4) one CYB-31 child for manifest-authorized `Concurrency.Yield`. CYB-181 remains the sole harness/performance and final 61/61 owner. No current failure justifies HIR, compatibility imports, or fallback lowering.
>
> The report also separates matrix correctness from CYB-184 rooted collections, CYB-185 host-backed FS, and CYB-186 stub/API audit: passing current tests does not prove those normative semantics. Recommended join: the four parallel compiler/runtime repairs -> fresh single-process CYB-181 61/61 under five minutes; CYB-181 + CYB-184 + CYB-185 -> CYB-186/final release evidence.
