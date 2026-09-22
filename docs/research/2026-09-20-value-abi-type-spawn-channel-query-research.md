# Spawned generic channel result: `value_abi_type` query-port research

## Scope

This note investigates the confirmed source-lowering failure for a spawned
closure whose expression body calls the generic channel facade:

```beskid
Fiber<Result<SendOk, ChannelError>> parked =
    spawn (() => Channel.Send<OwnedResource>(beforeCommit, CreateOwnedResource(32_i64, parkedDisposal)));
```

The observed failure is
`Verification(semantic query \`value_abi_type\` is unavailable until its AST/Salsa port is complete)`.
The canonical reproduction is recorded by the blocked F3 fixture task in
[`task-1-report.md`](../../.superpowers/sdd/2026-09-20-f3-disposable-channel/task-1-report.md).
The same result for a block-bodied lambda rules out expression-body syntax as
the cause.

## Facts

| Fact | Primary source | Consequence |
| --- | --- | --- |
| `spawn` must derive `Fiber<T>` from the entry callable return type; its closure captures must be safe across the fiber boundary. | [`openspec/.../fibers-and-spawn/spec.md:109-150`](../../openspec/specs/language-meta--evaluation--fibers-and-spawn/spec.md) | The closure result cannot be guessed or erased merely because its ABI is a pointer. |
| `Channel.Send<T>` is a generic source function returning `Result<SendOk, ChannelError>` and transports its payload through `ChannelValue<T>`. | [`Channel.bd:39-45`](../../compiler-v05-foundations-runtime/corelib/packages/concurrency/src/Concurrency/Channel.bd) | The reproducer is a normal direct generic source call, not a new channel runtime operation. |
| `closure_signature_for_node` obtains the lambda result exclusively with `value_abi_type` on the normalized body; captures separately obtain their declaration ABI types. | [`closures_spawn.rs:64-110`](../../compiler-v05-foundations-runtime/crates/beskid_queries/src/semantic_contract/closures_spawn.rs) | The unavailable fact blocks signature, spawn legality/handle construction, and therefore lowering before the channel operation runs. |
| `value_abi_type_tracked` composes syntax facts; its only generic-call-relevant candidate is `call_abi_signature(...).result`, then it fails closed. | [`abi/types.rs:311-348`](../../compiler-v05-foundations-runtime/crates/beskid_queries/src/semantic_contract/abi/types.rs) | The defect is incomplete query fact coverage, not permission to add a type-checker fallback. |
| Direct generic call ABI is based on a concrete `GenericSpecializationInstance` in the semantic layer. | [`abi/signatures.rs:138-182`](../../compiler-v05-foundations-runtime/crates/beskid_queries/src/semantic_contract/abi/signatures.rs); [`abi/specialization.rs:85-103`](../../compiler-v05-foundations-runtime/crates/beskid_queries/src/semantic_contract/abi/specialization.rs) | A repaired result fact must reuse this specialization authority, including its source identity and substitutions. |
| ISLE adapter code has an item-specialization-aware helper which asks `generic_call_specialization_in_environment` before the public call specialization. | [`facts_helpers.rs:173-185`](../../compiler-v05-foundations-runtime/crates/beskid_codegen/src/isle_adapter/facts_helpers.rs) | This is codegen context, not semantic query authority; it cannot be imported into `beskid_queries` or used as a fallback for closure typing. |
| Lowering consumes `closure_signature` directly for lambda entries and spawn trampolines. | [`facts_node.rs:739-772`](../../compiler-v05-foundations-runtime/crates/beskid_codegen/src/isle_adapter/facts_node.rs); [`trampolines.rs:206-230`](../../compiler-v05-foundations-runtime/crates/beskid_codegen/src/module_emission/trampolines.rs) | No ISLE rule, runtime service, or channel implementation change can cure this failure correctly. |
| Existing tests prove direct-call `value_abi_type`, generic specialization, and scalar spawn lambdas, but no imported `Channel.Send<OwnedResource>` lambda result. | [`contextual_casts_abi.rs:140-148`](../../compiler-v05-foundations-runtime/crates/beskid_queries/tests/semantic_facts/contextual_casts_abi.rs); [`generic_inference.rs:10-45`](../../compiler-v05-foundations-runtime/crates/beskid_queries/tests/semantic_facts/generic_inference.rs); [`closures_and_spawn.rs:392-428`](../../compiler-v05-foundations-runtime/crates/beskid_queries/tests/semantic_facts/closures_and_spawn.rs) | This is missing fact coverage at the semantic seam, not a lack of generic-call machinery. |

## Classification

This is an **implementation defect in semantic-query coverage**.  It is not a
missing feature in `Channel`, the runtime queue, cleanup lowering, ABI-v5, or
the generated ISLE rules.  The generic call is already an authorized direct
call shape and codegen already has an adapter-local specialization route; the
pre-codegen lambda signature cannot rely on that adapter state.

It is also not justification for a second type checker.  The public query
facade explicitly requires generation-bound facts, and `value_abi_type` is
documented as a source-value/declared-storage ABI fact
([`queries.rs:278-281`](../../compiler-v05-foundations-runtime/crates/beskid_queries/src/semantic_contract/queries.rs)).
`with_registered_syntax` keeps these queries tied to the supplied current
`AstNodeKey` ([`queries.rs:5-14`](../../compiler-v05-foundations-runtime/crates/beskid_queries/src/semantic_contract/queries.rs)).

## Smallest authoritative design

1. Keep `closure_signature_for_node` unchanged as the single lambda-result
   consumer. It must continue to request `value_abi_type` for the normalized
   body and must not inspect source type syntax, `CodegenInput`, or ISLE state.
2. In `crates/beskid_queries/src/semantic_contract/abi/types.rs`, add the
   missing **call-result ABI candidate** to `value_abi_type_tracked` for a
   current direct generic call. It must be derived from the existing
   `GenericCallSpecialization.signature.result` / `GenericSpecializationInstance`
   route, then be ordered with the other source facts before the final
   unavailable error.
3. Factor only if needed: if both `call_abi_signature` and the specialization
   query would otherwise repeat the same calculation, extract one
   crate-private helper in `abi/signatures.rs` or `abi/specialization.rs` and
   have both queries call it. Do **not** copy the adapter's
   `generic_call_specialization_in_context` implementation and do **not**
   expose a backend context parameter in the semantic-query API.
4. Preserve failure closure: unresolved/stale calls, dynamic calls, calls with
   unproven generic substitutions, and pointer-shaped values without a
   direct-call specialization remain unavailable. A result `POINTER` proves
   calling convention only; source identity continues to come from
   `generic_source_expression_identity` where Fiber payload ownership needs it
   ([`calls/generics.rs:231-299`](../../compiler-v05-foundations-runtime/crates/beskid_queries/src/semantic_contract/calls/generics.rs)).

The exact factor point must be selected by the first RED semantic test:

* If `generic_call_specialization(call)` is `Some` while
  `call_abi_signature(call)`/`value_abi_type(call)` is unavailable, port that
  existing specialization result directly as the missing candidate.
* If both are unavailable, extend the existing specialization helper's
  source-backed direct-call proof; do not make `value_abi_type` inspect
  `Channel` names, result names, or codegen specializations.

That diagnostic split prevents a superficially small but duplicate inference
path.

## Required tests and file ownership

| Slice | Files | Required proof |
| --- | --- | --- |
| Semantic RED/green | `crates/beskid_queries/tests/semantic_facts/closures_and_spawn.rs` (or a focused sibling) plus the existing multi-unit assembly pattern in `imported_generics.rs` | Assemble the application source, `Concurrency/Channel.bd`, `Results.bd`, and the disposable resource definition. Assert the concrete `Channel.Send<OwnedResource>` body call has the specialized ABI result; assert `value_abi_type(body) == Some(POINTER)` and `closure_signature(lambda).callable.result == POINTER`. Also assert a stale key returns `None` and an unresolved/dynamic generic call remains unavailable. |
| Query implementation | `crates/beskid_queries/src/semantic_contract/abi/types.rs`; only factor `abi/signatures.rs`/`abi/specialization.rs` if the RED facts show shared logic is necessary | One generation-bound source fact. No changes to `closures_spawn.rs` unless its existing call is demonstrably unable to consume the repaired fact. |
| End-to-end acceptance | Restore the F3 cancellation fixture/harness changes described in `task-1-report.md`; `crates/beskid_engine/tests/fixtures/channel_receipt_value_transfer.bd`; `crates/beskid_engine/tests/fiber_value_transfer.rs` | The pre-commit and post-commit cancellation cases lower and execute through JIT/AOT/native-kit without changing the public channel surface. |
| Codegen regression | Existing focused `beskid_codegen` ISLE/facts tests only if the query test passes but lowering does not | Confirm generated ISLE consumes the unchanged `closure_signature`/`value_abi_type` path. Do not add an ISLE-specific type fallback. |

## Recommended execution order

1. Add the query-level RED test first and inspect the two fact values described
   above.
2. Implement the smallest shared semantic helper/candidate that makes only the
   proven direct generic call available.
3. Run the focused semantic facts suite, then the blocked engine fixture.
4. Resume the F3 fixture task only after the query test and the direct
   reproducer are green.  Do not fold this port into Core.IO, channel runtime,
   cleanup lowering, or a compatibility API.
