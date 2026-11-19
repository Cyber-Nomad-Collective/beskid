## Why

Isolate parallelism (`v062-captures-and-move` through `v065-parallel-sequences`) needs compiler and runtime groundwork that is useful on its own and carries no parallel API. The research of 2026-10-13 (docs/research/2026-10-13-isolate-compiler-requirements.md, docs/research/2026-10-13-pony-semantics-for-beskid.md) found that attributes are accepted only on items and fields: parameters (`beskid.pest:335`), lambdas (`beskid.pest:424`) and other declaration sites cannot carry them, attribute target names are free identifiers, and no emission site for E1509 or E1510 exists. The same research lists runtime work that changes no observable behavior: the worker pool initializes once per process (`external_wait.h:320-321`), `ProcessInit` bundles composition launch with environment limits (`Lifecycle.bd:58-174`), the manifest has no thread or atomic intrinsics, region lookup sees one heap (`State.bd:136-150`) and type descriptors cannot tell an immutable leaf from a mutable graph (`Objects.bd:59-61`). The owner placed attributes on every declaration site and these prerequisites in 0.6.1 (decision entries of 2026-10-13, isolate rulings 1-13 and Pony rulings D1-D14), so that 0.6.2 to 0.6.5 add only the parallel surface.

## What Changes

- **Attributes on every declaration site.** Parameters, an explicit receiver (`this`), lambdas and lambda parameters, `let` bindings, type parameters, enum variants, contract members, `impl` blocks, constants, attribute declarations and modules accept attributes. The grammar, syntax model, formatter, LSP (hover, completion, semantic tokens) and the Mod attribute surface cover each site.
- **Closed attribute target catalogue and enforcement.** Target names are a closed PascalCase list of grammar productions; E1509 for names outside it, E1508 for duplicates, E1510 for every use on a site the declaration does not list, including undeclared attributes. Compiler-recognized attributes (`Export`, `Extern`, `Runtime`, the new markers) declare their targets in corelib like user attributes and are recognized only through their corelib declaration.
- **Compiler-derived marker contracts.** `Core.Parallel` declares `Transferable`, `Shared`, `Moved` and `Copied` with `[CompilerDerived]`; the compiler proves them structurally through `transfer_class` and rejects declared conformance.
- **`transfer_class` query.** Shared (primitives, `string`, `[Immutable]` records, Shared enums), Moved (`T[]`, `[Isolated]` records, collections), Copied (`[Copyable]` records), Never (`pointer`, function values, `[NeverTransferable]` handles, unmarked types). Generic parameters take their class from their bound. In 0.6.1 it is exercised by generic bounds only. Nothing spawns.
- **Marker attributes.** `[Immutable]` is explicit and transitive in the style of Glacier (ICSE 2017): fields Shared, assignment only in the struct literal (E1244, E1245), with a corelib-only `[ImmutableStorage]` array field exemption for `ReadOnlyArray<T>` (0.6.3). `[Isolated]` and `[Copyable]` constrain field classes (E1247); `[Copyable]` is independent of `[Serialize]`. `[NeverTransferable]` marks `Fiber`, `Channel`, `Hub`, `Mutex`, `MutexGuard`, `WaitGroup`, network sockets and Glue owners, and a rule rejects `[Copyable]`, `[Isolated]` or `[Immutable]` on them (E1246). Identity-only handles with process-wide ids are ordinary `[Immutable]` records (D13).
- **Generic methods and method type inference.** Methods declare their own type parameters and `where` bounds; member access accepts type arguments (`values.Parallel().Map<i64>(f)`); a call infers missing method type parameters from the receiver, the non-lambda arguments and a lambda's synthesized result, in that order (E1202, E1203, E1204, E1229 as today). This is the prerequisite for the fluent forms `s.Spawn(() => ...)` (0.6.3) and `values.Parallel().Map((x) => ...)` (0.6.5).
- **Memory model text.** `string` is Shared and the runtime's string data setter is construction-only (ruling 4). Field reads through typed receivers follow three rules and no adaptation table; `box` and `trn` are not adopted (D12).
- **Diagnostic code block.** E1234–E1255 reserved for transfer, capture and move diagnostics; variants for E1234–E1249 exist from 0.6.1, with E1244–E1247 emitted in 0.6.1 and the rest owned by the release named in the registry table.
- **Runtime groundwork, no new behavior.**
  - `thread_create`/`thread_join` and five atomic intrinsics (`atomic_word_load`, `atomic_word_store`, `atomic_word_compare_exchange`, `atomic_word_fetch_add`, `atomic_fence`) in the manifest and the three platform hosts, with wrappers in `Native.bd`.
  - A process-wide, reference-counted worker pool.
  - `ProcessInit` split into process setup and `IsolateCreate`/`IsolateDestroy`; the process still creates exactly one instance.
  - The main fiber's panic message is copied out before the heap is released (`beskid_rt_v5_isolate_panic_message`).
  - `TYPE_DESCRIPTOR_IMMUTABLE` on descriptors of Shared nominal types and the string record (D6).
  - `host_processor_count` intrinsic and `__host_processor_count` corelib service on Linux, macOS and Windows, exposed as `Concurrency.HostProcessorCount()`; `Concurrency.ProcessorCount()` keeps returning the scheduler's mutator count (1). 0.6.3 uses the host count as the default of `BESKID_ISOLATES_MAX`.
- **ORCA groundwork (Clebsch et al., OOPSLA 2017, https://doi.org/10.1145/3133896).** A process-wide region-to-owner map (`beskid_rt_v5_region_owner`), the normative non-moving collector rule, the foreign-reference definition with the stop rule, and the Phase A restatement "many heaps, one mutator each; one allocator and one collector per heap; one mutator per object".

## Capabilities

### Modified Capabilities
- `language-meta--metaprogramming--metaprogramming`: target catalogue, sites, enforcement, compiler-recognized attributes.
- `language-meta--contracts-and-effects--contracts`: derived markers, `transfer_class`, `[Immutable]`, `[Isolated]`, `[Copyable]`, `[NeverTransferable]`.
- `language-meta--memory-model--memory-and-references`: proven immutability, string invariant, field-read rules.
- `execution--runtime--memory-and-gc-runtime-contract`: Phase A per heap, descriptor flag, non-moving rule, foreign references, region map.
- `execution--runtime--fiber-scheduler-and-stacks`: per-instance scheduler, lifecycle split, shared worker pool.
- `execution--abi-and-host--builtins-and-symbols`: thread and atomic intrinsics, lifecycle exports, host processor count.
- `language-meta--type-system--method-dispatch`: generic methods and method type arguments.
- `language-meta--type-system--type-inference`: method type argument inference.
- `execution--runtime--panic-io-and-syscalls`: panic message copy-out.
- `compiler--semantic-pipeline--diagnostic-code-registry`: E1234–E1255 block.
- `core-library--foundation-and-primitives--core-collections`: collections carry `[Isolated]`.
- `tooling--lsp--intellisense-capabilities-and-behavior`, `tooling--formatter--verification-and-traceability`: attribute sites and class hover.

Spec deltas are in `specs/`; the shared vocabulary, grounding, the archive order and delta chain, and open issues are in `design.md`.

## Impact

Grammar, syntax and formatter crates, `beskid_queries` (attributes, contracts, transfer, legality), `beskid_codegen` (descriptor flag), `beskid_lsp`, the Mod attribute surface, corelib (`Core.Parallel` markers, attribute declarations, collection and handle markers), the Beskid runtime (`Lifecycle.bd`, `Native.bd`, `Objects.bd`, new `RegionMap.bd`) and the C host on three targets. Target release: 0.6.1. No 0.6.0 release case depends on it.

## Compatibility, Migration and Reversion

No users exist. Attributes at sites not declared in an attribute's target list, which compiled silently before, now fail with E1510; lowercase target names in the serialization Mod fail with E1509 until renamed. Declared conformance to the four marker contracts is rejected.
