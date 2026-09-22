# Compiler 0.5 undeveloped-area assessment

Date: 2026-09-19

Scope: read-only case analysis of the checked-out `compiler` submodule at
`0fd6b56f749880ccae097769372f03d918dcff49`, plus the normative 0.5 OpenSpec
changes. This note does not assert build health: no compiler command was run.

## Verdict

The compiler is not at a 0.5 implementation boundary. The required delivery
chain is presently **Foundations -> Networking -> HTTP/release evidence**, and
the first two changes have every implementation and verification task open;
the HTTP change directory is absent. Focus should therefore begin with the
foundation migration rather than with socket or HTTP APIs.

| Priority | Undeveloped area | Evidence | Why it blocks 0.5 | Uncertainty |
| --- | --- | --- | --- | --- |
| Critical | Foundation ownership, generic transport, deadlines, and scoped cleanup | The Foundations proposal says the current ABI is scalar-only, external wakes are worker-local, timers are absent, and `use` is import-only ([proposal](../../openspec/changes/beskid-v0-5-foundations/proposal.md#L3-L5)). Its 35 implementation/verification checklist items remain unchecked, including bindable `spawn`, `use`, traced ABI values, owner-routed wake, timers, Core.IO, and JIT/AOT/native evidence ([tasks](../../openspec/changes/beskid-v0-5-foundations/tasks.md#L6-L35)). | Networking depends on generic resource channels, owner-routed completion, monotonic deadlines, disposal, and Core.IO ([networking proposal](../../openspec/changes/beskid-v0-5-networking/proposal.md#L9-L12)). Starting reactor work first would create a competing completion/lifetime path. | High confidence that the planned work is incomplete; task checkboxes are planning state, not executable proof of total absence. |
| Critical | Portable networking runtime and public surface | All 20 Networking tasks are unchecked: manifest socket operations, one reactor/socket table, `Network` corelib, DNS, TCP, UDP, and three-target conformance ([tasks](../../openspec/changes/beskid-v0-5-networking/tasks.md#L6-L29)). The proposal explicitly says the current standard has no public DNS/TCP/UDP or socket lifecycle ABI ([proposal](../../openspec/changes/beskid-v0-5-networking/proposal.md#L3-L7)). | This is the release feature and its platform ABI/runtime is not available to HTTP or user code. | High. Existing general AOT support does not establish a network reactor. |
| Critical | HTTP/release change set and final delivery gate | The release design requires a third `beskid-v0-5-http` change to own HTTP/1.1, examples, catalog traceability, and final evidence ([release split](../superpowers/specs/2026-07-20-beskid-v0-5-release-split-design.md#L7-L22)). Only `beskid-v0-5-foundations` and `beskid-v0-5-networking` directories exist under `openspec/changes` (repository inventory, 2026-09-19). | There is no authoritative, executable HTTP implementation plan or final acceptance owner in the checkout. | High for absence of the directory; it might be intentionally pending or held outside this checkout. |
| High | Generated ISLE coverage for closure-bearing concurrency and ordinary language parity | A production entrypoint test intentionally rejects a capturing lambda with `MissingRuleOrFact` ([test](../../compiler/crates/beskid_codegen/tests/parsed_project_isle_harness.rs#L462-L475)); the direct ISLE regression similarly rejects `spawn ((...) => ...)` ([test](../../compiler/crates/beskid_codegen/tests/isle_adapter/diagnostics_fail_closed.rs#L115-L131)). The living coverage plan identifies closure/lambda, captured spawn, composition, compound assignment, full match patterns, collection loops, and member/field-chain gaps ([coverage plan](../../compiler/docs/isle-lowering-coverage.md#L92-L114)). | 0.5 needs `spawn` with rooted captures and cleanup paths. Failure-closed behavior prevents unsafe fallback, but blocks supported source shapes. | Medium: the coverage document is internally stale about `NodeKind`; the executable tests are the primary evidence for captured forms. |
| High | Glue Rust/.NET code generation | The backend type defines Rust and .NET artifacts as “never produced” in 0.4 ([backend](../../compiler/crates/beskid_codegen/src/backend.rs#L77-L97)); the CLI rejects every non-CLIF backend ([build command](../../compiler/crates/beskid_cli/src/commands/build.rs#L104-L115)). The 0.5 glue proposal calls this follow-on implementation work and requests `GlueTag` emission fixtures ([proposal](../../openspec/changes/extend-extern-import-extraction-glue-0-5/proposal.md#L43-L63)). | Any 0.5 scope that includes language-specific interop generation cannot ship through the current compiler path. | High for CLI/codegen unavailability; release inclusion should be confirmed because it is a parallel 0.5 initiative rather than part of the networking dependency chain. |
| High | Glue execution/toolchain validation | The mod host explicitly observes glue annotations but invokes no glue contract and returns the input unchanged ([phase](../../compiler/crates/beskid_analysis/src/mod_host/glue.rs#L117-L143)). Toolchain probing is declared a 0.4 scaffold and returns no version, hash, or target information ([toolchain](../../compiler/crates/beskid_abi/src/toolchain.rs#L1-L14), [probe](../../compiler/crates/beskid_abi/src/toolchain.rs#L120-L146)); corelib lists Rust/.NET emitters, full probing, stdio, and runtime integration as 0.5 scope ([corelib glue](../../compiler/corelib/packages/glue/readme.md#L7-L25)). | Even after an emitter exists, the compiler lacks the trustworthy external-tool execution gate and contract invocation required to build or link generated artifacts. | High for present scaffolding; same release-scope qualification as the preceding row. |
| Medium | Cross-target link/JIT capability beyond the three staged hosts | AOT rejects native platform shims outside x86_64 Linux/macOS/Windows ([platform objects](../../compiler/crates/beskid_aot/src/api/platform_objects.rs#L190-L239)); shared export flags reject targets other than Linux/Windows ([link policy](../../compiler/crates/beskid_aot/src/linker/policy.rs#L72-L92)); JIT user extern resolution fails on non-Unix hosts when `extern_dlopen` is off ([engine](../../compiler/crates/beskid_engine/src/engine.rs#L130-L140)). | 0.5 requires Linux/macOS/Windows network conformance, so the supported matrix needs native-kit evidence and the JIT policy needs deliberate coverage rather than accidental host behavior. | Medium: the planned release only requires these three targets, which the first AOT branch covers; the gap is breadth and evidence, not necessarily a release blocker. |

## Recommended focus order

1. Close Foundations end-to-end: parser/semantic contracts, generated ISLE facts/rules,
   canonical runtime ownership, corelib, then JIT/AOT/native proofs. Do not retain scalar or
   worker-local compatibility routes; the normative change prohibits them
   ([Foundations proposal](../../openspec/changes/beskid-v0-5-foundations/proposal.md#L15-L21)).
2. Complete captured-lambda and captured-spawn lowering within that work, with the existing
   fail-closed tests changed only after independent execution evidence exists.
3. Implement one manifest-authorized networking reactor plus `Network` public API; run the
   required Linux epoll, macOS kqueue, and Windows IOCP matrix
   ([Networking tasks](../../openspec/changes/beskid-v0-5-networking/tasks.md#L25-L29)).
4. Create the missing HTTP change before implementation, then use it to own final catalog and
   release evidence as the accepted release split requires.
5. Treat Glue backend generation as a separately scheduled 0.5 track unless product scope
   explicitly makes it release-critical.

## Recent trajectory and evidence caveat

Recent compiler history is concentrated on ABI-v5 and fiber correctness (for example,
`edf39dab` “Use tail transfers for Linux fiber completion” and `cc8f0150` “diagnose Linux
fiber main”), not networking or HTTP. The compiler has no `*0.5*` tag (its tags remain in the
0.4 line), while the root changelog labels the v0.5 work an “executable planning baseline”
([changelog](../../CHANGELOG.md#L1357-L1363)). This supports prioritizing the foundation proof
matrix, but git messages alone are not proof of behavior. The superproject worktree is dirty
(`AGENTS.md`, `CLAUDE.md`, and the `compiler` gitlink), so this assessment intentionally does
not attribute those uncommitted changes to 0.5 readiness.
