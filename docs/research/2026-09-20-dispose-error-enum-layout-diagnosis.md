# DisposeError enum-layout diagnosis

Date: 2026-09-20  
Compiler baseline: `compiler-v05-foundations-runtime` at `09b8cb5ce27e7dc5a93542283ceaa68b2a54ed8d`  
Scope: diagnosis only; no compiler, corelib, runtime, or tracked fixture edits.

## Result

**Outcome (a): correct the fixture's unit-value syntax.** The proposed resource
contains `return Result::Ok(unit);`. It must use `return Result::Ok(());`.
`unit` names the primitive type; `()` is its literal value. At an expression
position the former parses as a value path, and no declaration named `unit`
exists in this fixture.

`Result::Error(DisposeError::Failed())` is valid and lowers successfully at this
baseline with only the Foundation Results and Disposable source units, with
the full channel assembly, and with explicit generic and qualified spellings.
The enum-layout and constructor queries return valid facts for both the outer
Result and the imported nullary DisposeError constructor.

The previous task report misattributes its diagnostic span. Its
`EnumConstructorExpression@28:16-28:32` covers 16 source characters;
`Result::Ok(unit)` is 16 characters, whereas `DisposeError::Failed()` is 22.
The proposed implementation reproduces `InvalidEnumLayout` at its success
constructor. Changing only `unit` to `()` makes that implementation lower.
The error does not establish a DisposeError layout defect.

No production layout, query, lowering, runtime, import convention, or disposal
API change is justified. Keep the existing Foundation contract and the
existing channel acceptance harness. A clearer invalid-value diagnostic could
be a separate task; accepting a type name as a literal or weakening the
payload check would be the wrong repair.

## Confirmed code facts

Paths in this table are relative to `compiler-v05-foundations-runtime`.

| Fact | Primary authority | Consequence |
| --- | --- | --- |
| Unit literal syntax is `()`; primitive type syntax includes `unit`. | `crates/beskid_analysis/src/beskid.pest:142` and `:182` | The two spellings serve different syntactic roles. |
| Literal parsing converts `()` to `Literal::Unit`, and formatting writes `()`. | `crates/beskid_analysis/src/syntax/expressions/literal.rs:54-76`; `src/format/expressions_emit.rs:19` | This is the existing language representation, not an inferred new convention. |
| `Disposable.Dispose` returns `Core.Results.Result<unit, DisposeError>` and `DisposeError` has `Failed()` with no payload. | `corelib/packages/foundation/src/Core/Disposable.bd:1-13` | Both relevant declarations are already in the single imported source unit. |
| Result has `Ok(TValue value)` and `Error(TError error)`. | `corelib/packages/foundation/src/Core/Results/Results.bd:6-11` | Applied `Result<unit, DisposeError>` has a unit success payload and nominal error payload. |
| Short type names resolve uniquely across the current unit and explicitly imported public types at the current generation and generic arity; qualified paths use the same module/type registry. | `crates/beskid_queries/src/semantic_contract/layouts/common.rs:254-358` | `use Core.Disposable` exposes its public DisposeError alongside Disposable; no extra error file is missing. |
| Contextual generic constructor applications must resolve to the same nominal declaration as the explicit expected type. | `crates/beskid_queries/src/semantic_contract/layouts/enum_layout.rs:186-313` | The method return annotation authorizes genericless `Result::Ok/Error`; qualification cannot substitute an unrelated enum. |
| `enum_layout_tracked`, `instantiated_enum_layout_for_path`, and `enum_constructor_tracked` provide layout, declaration, variant, and payload-node facts. | Same file `:139`, `:328`, `:463` | These facts are available for both failed and successful probe spellings. |
| Literal semantic typing maps `Literal::Unit` to `SemanticTypeId::UNIT`; the value ABI query composes generation-bound facts. | `crates/beskid_queries/src/semantic_contract/typing.rs:635-652`; `abi/types.rs:310-345` | `()` has a unit value fact. Unresolved `unit` has none. |
| Physical enum layout keeps the unit argument's logical position but gives it no storage field. | `crates/beskid_queries/src/semantic_contract/layouts/enum_layout.rs:14-109`, especially `:40-42` | Erasing storage does not erase the requirement that the supplied expression actually has unit type. |
| The source adapter consumes that physical authority for ISLE layouts and managed allocation plans. | `crates/beskid_codegen/src/isle_adapter/facts_helpers.rs:223-244`; `src/aggregate_static.rs:241-264` | There is no need for an alternate layout or allocation path. |
| ISLE requires a unit semantic fact for an erased unit payload; otherwise it emits InvalidEnumLayout against the parent constructor key. | `crates/beskid_isle/src/context/enums.rs:392-417`, especially `:411-415` | The malformed success payload explains both the error class and its constructor span. |

## Diagnostic chain

The public source entrypoint goes through
`lower_syntax_assembly_entrypoint` in `crates/beskid_codegen/src/prepared_syntax.rs:187`.
It builds the registered typed syntax assembly and `CodegenInput`, selects
reachable source functions/methods, and calls `lower_syntax_program`. It uses
the same path in the external probe as in the production engine fixtures.

For `Result::Error(DisposeError::Failed())`, the outer constructor inherits
the applied `Result<unit, DisposeError>` from the enclosing method's return
annotation. `contextual_enum_candidate_type_path` checks nominal identity
before admitting these generic arguments. The inner non-generic constructor
uses its own `DisposeError` path: the context walker does not treat an outer
enum constructor as transparent. `resolve_type_declaration` finds the public
enum in the imported `Core/Disposable.bd` unit. The resulting semantic layout
contains one `Failed` variant with zero fields, and the constructor fact
contains variant index zero and zero payloads. Its value ABI is POINTER.

For `Result::Ok(unit)`, the outer Result layout and constructor are also valid:
the variant is `Ok`, with one logical field of semantic type UNIT. The
constructor query checks the variant and argument count; that check alone
does not prove the argument expression's value type. The argument parses as
`PathExpression`, and both `node_type` and `value_abi_type` are unavailable.
The generic "until its AST/Salsa port is complete" wording is not evidence
that valid unit literals need a new query implementation: this path names no
value in the source program.

`EnumLayoutFact::scalar_payload_object_layout` emits `None` for this unit
field's physical storage. ISLE's `emit_enum_literal` obtains that valid layout,
allocates the enum, and calls `emit_enum_constructor_payloads`. With a `None`
storage field, the latter explicitly requires
`facts.semantic_type(payload_key) == Some(SemanticTypeId::UNIT)`.
`SyntaxNodeFacts::semantic_type` / `scalar_semantic_type` consume the existing
value ABI facts; the unresolved `unit` path supplies no such fact. ISLE sets
`InvalidEnumLayout` using the outer `Result::Ok` constructor key.

Replacing the argument with `()` produces `LiteralExpression`, with UNIT
returned by both semantic and value ABI queries. The exact same Result layout
then lowers successfully. The check is doing its intended fail-closed work.

## Comparison with the passing Foundation implementation

`crates/beskid_engine/tests/fixtures/foundation_io.bd:67-94` implements
`TestStream: Stream, Closer, Disposable`. Its `Dispose` calls `Close`, then
returns a match whose success branch is `Result::Ok(())` and whose error branch
is `Result::Error(DisposeError::Failed())`. `Close` also consistently uses
`Result::Ok(())`. Its ordinary error paths use `IoError::CloseFailed()` and
other nullary IoError constructors.

The Foundation implementation returns the same Result type and constructs the
same DisposeError as the proposed local resource. Having an error constructor
inside a match arm does not explain the difference: direct returns of that
constructor passed independently. The load-bearing difference is `()` versus
`unit` in the success branch. Core.IO is useful evidence here, not a dependency
to add to the channel fixture.

### Source assembly differences

Both harnesses parse each file using `parse_program_with_source_name`, build
explicit `SourceUnit` lists and `ProgramAssembly`, use entry unit zero,
`AssemblyDiscovery::ImportClosure`, an empty `ModuleIndex`, and the same
source-lowering API, host ISA settings, and target. They then execute the
produced artifact through JIT, object/AOT, and shared native-kit routes.
Different generation numbers identify separate snapshots, not different
semantic authorities.

| Aspect | Channel transfer harness | Foundation IO harness |
| --- | --- | --- |
| Harness | `tests/fiber_value_transfer.rs:33-123` | `tests/foundation_io_native.rs:177-280`, `:282-406` |
| Generation | 71 | 96 |
| Dependency root order | concurrency, foundation | foundation, concurrency |
| Channel units | Fiber, FiberError, Channel, ChannelError, ChannelOptions, Status, TryResult, Hub, HubError, HubReceiveResult, all under `Concurrency/` | None for `foundation_io.bd` |
| Shared Foundation unit | `Core/Results/Results.bd` | `Core/Results/Results.bd` |
| Disposable unit | Must add `Core/Disposable.bd` for the proposed import; the failed task report says it was added | `Core/Disposable.bd` already assembled |
| Other Foundation units | None | `Core/Bytes/{Slice,Convert}.bd`; `Core/Collections/Array.bd`; `Core/Collections/Array/ArrayIter.bd`; `Core/Encoding/{EncodingError,Utf8,Hex,Base64,Encoding,Contract}.bd`; `Core/String/{String,Core,Chars,Utf8}.bd`; `Core/IO/{IO,Reader,Writer,Closer,Stream,IoError}.bd` |
| Host imports relevant here | `use Core.Results`; proposed `use Core.Disposable`; existing Concurrency imports | `use Core.Results`, `use Core.Disposable`, and the six Core.IO imports |
| Total assembled units | Existing 12 including host; 13 with Disposable | 23 including host |

The probe tested three assembly profiles: host + Results + Disposable;
that profile plus all ten channel units; and that profile plus all remaining
Foundation IO harness units. The malformed success expression fails even in
the complete Foundation profile. The corrected counter resource succeeds in
the minimal and channel profiles. This rules out the additional Foundation
units as a remedy. Removing Disposable entirely produces a different
`MissingRuleOrFact` failure in the probe's match expression, so the required
source-unit addition must still be retained when the acceptance task resumes.

## Experiments and observed results

No tracked source file was modified. A standalone Rust harness in
`/tmp/beskid-dispose-layout.TL5NuQ/` links the current compiler libraries and
calls `lower_syntax_assembly_entrypoint`. Fixtures reside beside it outside
both repositories. The canonicalized source path printed by macOS is
`/private/tmp/beskid-dispose-layout.TL5NuQ/`.

| Probe | Profile | Result |
| --- | --- | --- |
| `direct.bd`: local Disposable method returning only `Result::Error(DisposeError::Failed())`, called from entrypoint | minimal, channel | PASS source lowering |
| Original proposed resource with token, shared counter, conditional failed Dispose, and `Result::Ok(unit)` | channel | FAIL InvalidEnumLayout at success constructor, `@10:16-10:32` |
| `counter.bd`: identical resource with only the argument changed to `()` | minimal, channel | PASS source lowering |
| `unit-keyword.bd`: free function returning only `Result::Ok(unit)` | minimal, complete Foundation | FAIL InvalidEnumLayout at `@3:44-3:60` |
| `unit-literal.bd`: same free function returning `Result::Ok(())` | minimal | PASS source lowering |
| `qualified.bd`: explicit `Result<unit, DisposeError>::Error`, fully qualified `Core.Results.Result<unit, Core.Disposable.DisposeError>::Error(Core.Disposable.DisposeError::Failed())`, and a match-arm error constructor | minimal, channel | PASS source lowering |
| Existing, untouched `foundation_io.bd`, entry `RunFoundationFixture` | complete Foundation | PASS source lowering |
| `direct.bd` with `Core/Disposable.bd` deliberately omitted | missing-unit control | FAIL MissingRuleOrFact at match expression, not the reproduced success-constructor error |

The free-function pair minimizes the failure to this difference; resource
fields, contracts, channels, cancellation, receiver dispatch, and imported
error construction are unnecessary to trigger it:

```beskid
use Core.Disposable;
use Core.Results;
Result<unit, DisposeError> Make() { return Result::Ok(unit); }
i64 RunProbe() {
    return match Make() { Result::Ok(_) => 0_i64, Result::Error(_) => 1_i64, };
}
```

The green version substitutes `Result::Ok(())` in `Make`. The counter probe
preserves the original failed-disposal expression:

```beskid
type OwnedResource: Disposable {
    i64 token,
    i64[] disposalCount,
    pub Result<unit, DisposeError> Dispose() {
        i64[] count = disposalCount;
        if count[0] != 0_i64 { return Result::Error(DisposeError::Failed()); }
        count[0] = 1_i64;
        return Result::Ok(());
    }
}
```

Query observations from the exact database used by source lowering:

| Expression | AST kind | enum layout / constructor | value ABI |
| --- | --- | --- | --- |
| `Result::Ok(unit)` | EnumConstructorExpression | Available: Ok field UNIT, Error field nominal DisposeError; variant 0, one payload | POINTER |
| Its `unit` argument | PathExpression | Not an enum | Unavailable |
| `Result::Ok(())` | EnumConstructorExpression | Same semantic enum layout and constructor shape | POINTER |
| Its `()` argument | LiteralExpression | Not an enum | UNIT |
| `Result::Error(DisposeError::Failed())` | EnumConstructorExpression | Available Result layout; variant 1, one payload | POINTER |
| Its `DisposeError::Failed()` argument | EnumConstructorExpression | Available imported DisposeError layout; Failed with zero fields, variant 0, zero payloads | POINTER |

The host-only `node_type` fact for the enum constructors is unavailable in both
passing and failing cases. Their valid `enum_constructor` facts supply POINTER
through the existing `value_abi_type` query. This is expected by the current
composition of facts; it is not a new generic Result inference defect.

### Exact commands

First refreshed baseline libraries without editing sources:

```sh
cd /Users/mikserek/Projects/beskid/compiler-v05-foundations-runtime
cargo test -p beskid_engine --test fiber_value_transfer --no-run
```

Result: success, 6.77 seconds, existing third-party macOS deployment-target
linker warnings only. The external harness build command is retained as
`bash /tmp/beskid-dispose-layout.TL5NuQ/build.sh`; its `rustc --edition=2024`
invocation links `beskid_analysis`, `beskid_queries`, `beskid_codegen`,
`beskid_engine`, and matching `cranelift_native`/`cranelift_codegen` artifacts
from this worktree's `target/debug/deps`. Initial selection of newer unrelated
Cranelift artifacts produced a Rust crate-identity mismatch; using the matching
cached pair fixed the probe build without source or dependency changes.

The fast reproducer and its green comparison are:

```sh
PROBE_FACTS=1 /tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/unit-keyword.bd
PROBE_FACTS=1 /tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/unit-literal.bd
```

The first exits 1 in roughly 0.7 seconds with:

```text
FAIL syntax ISLE lowering failed: syntax ISLE emission failed: Lowering(InvalidEnumLayout at /private/tmp/beskid-dispose-layout.TL5NuQ/unit-keyword.bd#g71:n35 EnumConstructorExpression@3:44-3:60)
```

The second exits 0 with `PASS source lowering`. Other exact invocations:

```sh
/tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/direct.bd
/tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/direct.bd channel
/tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/counter.bd channel
/tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/counter.bd
/tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/qualified.bd channel
/tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/qualified.bd
/tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/unit-keyword.bd foundation
/tmp/beskid-dispose-layout.TL5NuQ/probe /tmp/beskid-dispose-layout.TL5NuQ/direct.bd missing
/tmp/beskid-dispose-layout.TL5NuQ/probe /Users/mikserek/Projects/beskid/compiler-v05-foundations-runtime/crates/beskid_engine/tests/fixtures/foundation_io.bd foundation RunFoundationFixture
```

The existing Foundation runtime gate was independently rerun:

```sh
cd /Users/mikserek/Projects/beskid/compiler-v05-foundations-runtime
cargo test -p beskid_engine --test foundation_io_native foundation_io_closer_stream_and_scoped_cleanup_are_native_safe -- --nocapture
```

Result: **1 passed, 0 failed, 13 filtered out; 35.02 seconds**. Source lowering,
native-kit construction, JIT, AOT, and the shared native-kit executable all
passed the existing harness. Third-party linker deployment-target warnings
were nonfatal.

## Follow-up brief

Resume the original fixture-and-harness task. Correct the prior research
example to `Result::Ok(())`, retain `Core/Disposable.bd` in the explicit
assembly, and implement the planned single local `OwnedResource: Disposable`
with its shared counter and unchanged `DisposeError::Failed()` error path.
Retain the existing tests of close-after-drain, abandoned receipt recovery,
pre-commit cancellation, and post-commit cancellation, with receiver-owned
explicit disposal as the only counter mutation.

No semantic/layout production regression test is required to justify a fix:
the valid construct already passes. The acceptance fixture is the appropriate
regression surface. If a red-before-green step is needed, temporarily use
the erroneous unit argument in that fixture, observe its exact success-branch
InvalidEnumLayout, then replace it with `()` before completing acceptance.
Do not turn the temporary external harness into a second maintained compiler
lowering route.

Run the originally planned focused acceptance command, then the whole
`fiber_value_transfer` test target. Preserve the existing JIT/AOT/native-kit
assertions and all ownership observations. Do not add Core.IO, a duplicated
DisposeError, a dynamic-call route, a replacement type query, or a permissive
layout fallback. Stop on a newly reproduced production failure and classify
its actual source span separately.

## Limits and repository hygiene

The four-scenario acceptance expansion was previously reverted, so this
diagnosis does not claim a byte-identical reproduction of its old node id
`n239`, nor does it claim those runtime scenarios now pass. It reproduces the
proposed implementation's failure, identifies the exact successful versus
failing payload facts, and demonstrates that the supposed failing error
constructor works on the current baseline.

GitNexus query/context were used for navigation. The root index reported eight
commits behind and returned definitions from other checkouts; every cited
authority was therefore verified directly in this worktree. No index rebuild,
symbol edits, commits, pushes, or external-service writes were performed.

The compiler worktree remained clean, with `git diff --check` passing. The
root checkout was already dirty on entry; those existing files were preserved.
The only task output added inside the root is this requested research report.
Durable notes are outside the repository at
`/Users/mikserek/.agents/knowledge/dispose-error-layout.md`; probe sources and
binaries remain explicitly outside both repositories under the temporary
directory above. No scratch material was staged or pushed. Shared changelog
integration is left to the controller to avoid competing edits to its existing
dirty CHANGELOG.md.
