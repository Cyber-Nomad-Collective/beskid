## 1. Spec

- [x] 1.1 Validate with `openspec validate v061-attributes-and-isolate-prerequisites --strict` and regenerate `openspec/catalog.json`.
- [ ] 1.2 Keep the "Archive order and delta chain" table of design.md true: any edit to a chained requirement in this change is carried into the later links (v062-v065) in the same commit.
- [x] 1.3 Record the refinement of the 2026-10-09 `expected_type` ruling (a function-typed parameter whose unbound generics appear only in its result supplies its parameter types) as a decision entry in `docs/reports/2026-10-04-v06-decisions.md`.

## 2. Attributes everywhere (metaprogramming capability)

- [x] 2.1 Attribute target catalogue: one ordered list in `beskid_analysis`; E1509 for names outside it; E1508 for duplicates; declarations without targets accept nothing. Switch the serialization Mod to `TypeDefinition`, `EnumDefinition`, `Field`. (Requirements: Project kind and attribute rules; Attribute target catalogue)
- [x] 2.2 Grammar and syntax model: `AttributeList?` on `AttributeDeclaration`, `ImplBlock`, `ConstantDefinition`, `Parameter`, `LambdaExpression`, `LambdaParameter`, type parameters, `EnumVariant`, `ContractAssociatedType`, `ContractEmbedding`, both `LetStatement` forms; new `ReceiverParameter` production; `attributes` field on every node; `ast_derive`/`reflect_gen` regeneration. (Attributes on every declaration site)
- [x] 2.3 E1510 legality fact in the query layer for every attribute use, including undeclared attributes. (Attribute use target enforcement)
- [x] 2.4 Corelib declarations with targets for `Export`, `Extern`, `Runtime`, `CompilerDerived`, `Immutable`, `Isolated`, `Copyable`, `NeverTransferable`, `ImmutableStorage`, `Captures`; by-name recognition resolves to the corelib declaration only. (Compiler-recognized attributes declare their targets in corelib)

## 3. Marker contracts and transfer classes (contracts capability)

- [x] 3.1 `Core.Parallel` marker contracts `Transferable`, `Shared`, `Moved`, `Copied` with `[CompilerDerived]`; E1607 on declared conformance and on other derived contracts; E1003 on members. (Compiler-derived marker contracts; Conformance satisfaction and diagnostics) (implemented on v06x/lang d46d87a8, v06x/par corelib 1487f95; verified by gate 3 on Linux x64)
- [x] 3.2 `transfer_class` query (`semantic_contract/transfer.rs`) with the ten rules, generic substitution, bound-derived parameter classes, marker exclusivity; hook in `prove_applied_conformance` and `implementation_bounds_hold`; E1610 reason text. (Transfer class query)
- [x] 3.3 `[Immutable]`: E1244 field rule, E1245 assignment and `[ImmutableStorage]` escape rule as a legality collector beside `legality/values.rs`; corelib-only `[ImmutableStorage]`. (Immutable types)
- [x] 3.4 `[Isolated]` and `[Copyable]` field rules, E1247; independence from `[Serialize]`. (Isolated and Copyable types)
- [x] 3.5 `[NeverTransferable]` on `Fiber`, `Channel`, `Hub`, `Mutex`, `MutexGuard`, `WaitGroup`, `TcpStream`, `TcpListener`, `UdpSocket` and Glue owners; E1246. (Never-transferable handle types) (implemented on v06x/lang corelib df4c6e2; verified by gate 3 on Linux x64)
- [x] 3.6 `[Isolated]` on `List`, `Stack`, `Queue`, `Set`, `Map`, `PriorityQueue`, `I64Map`, `StringMap`, `HashTable`. (Collections are Isolated types) (implemented on v06x/lang corelib df4c6e2; verified by gate 3 on Linux x64)
- [ ] 3.7 Memory model text: proven immutability through the class query, string construction-only setter invariant with a runtime corpus review test, the three field-read rules. (Cross-fiber sharing; String immutability invariant; Field reads through typed receivers) (open: runtime-corpus string setter review test not written, request R-rt-1)

## 3a. Generic methods and inference (type-system capabilities)

- [x] 3a.1 Grammar: `GenericParameters?` and `WhereClause?` on `ImplMethodDefinition`, `GenericArguments?` on `MemberAccess`; `generics` and `where_clause` on `MethodDefinition`, `type_args` on `MemberExpression`; formatter emit. (Generic methods and method type arguments)
- [x] 3a.2 Query layer: `generic_callable_parameters` returns owner then own type parameters; explicit type arguments read from a member-access callee as from a path callee; E1204 on count mismatch; E1229 on a repeated owner name; method `where` bounds on own and owner type parameters, proven at the call (E1610). (Generic methods and method type arguments)
- [x] 3a.3 Inference order in `specialization_for_call_in_environment`: receiver, explicit, non-lambda arguments, then lambda arguments with synthesized results; `expected_type` supplies parameter types of a function-typed parameter whose unbound generics appear only in its result; `lambda_source_identity` synthesizes a block body's result from its `return` expressions when no result is expected; E1203 naming the unbound parameter. (Method type argument inference)
- [ ] 3a.4 Hover and signature help show own type parameters and their bindings. (hover implemented on v06x/lang 243190ba; signature help bindings still open)

## 4. Diagnostic code block

- [x] 4.1 `SemanticIssueKind` variants and codes E1234–E1249 in `diagnostic_kinds/code.rs`; emission only for E1244–E1247; registry table. (Diagnostic codes owned in analysis sources)

## 5. Runtime groundwork

- [x] 5.1 Manifest intrinsics `thread_create`, `thread_join` with target bindings; C implementations on Linux, macOS, Windows; `ThreadCreate`/`ThreadJoin` wrappers in `Native.bd`. (Thread intrinsics) (implemented on v06x/runtime a1ad12eb..2a3f0e0d; verified by gate 3 on Linux x64)
- [x] 5.2 Manifest intrinsics `atomic_word_load`, `atomic_word_store`, `atomic_word_compare_exchange`, `atomic_word_fetch_add`, `atomic_fence`; C11 implementations; wrappers in `Native.bd`; `clif` allowlist unchanged. (Atomic intrinsics) (implemented on v06x/runtime a1ad12eb..2a3f0e0d; verified by gate 3 on Linux x64)
- [x] 5.3 Process-wide reference-counted worker pool in `external_wait.h`; `worker_pool_init`/`worker_pool_shutdown` semantics. (Process-wide worker pool shared by runtime instances) (implemented on v06x/runtime a1ad12eb..2a3f0e0d; verified by gate 3 on Linux x64)
- [x] 5.4 `IsolateCreate`/`IsolateDestroy` split out of `ProcessInit` in `Lifecycle.bd`; limits inherited; `ProcessInit`/`ProcessShutdown` as wrappers; manifest exports. (Runtime instance lifecycle split; Lifecycle and region exports in the manifest) (implemented on v06x/runtime a1ad12eb..2a3f0e0d; verified by gate 3 on Linux x64)
- [x] 5.5 Panic message copy-out before heap release; `beskid_rt_v5_isolate_panic_message`. (Panic message survives heap release) (implemented on v06x/runtime a1ad12eb..2a3f0e0d; verified by gate 3 on Linux x64)
- [x] 5.6 Process-wide region-to-owner map (`Runtime/Mem/Gc/RegionMap.bd`), registration on create and growth, atomic publication, `beskid_rt_v5_region_owner`. (Process-wide region-to-owner map) (implemented on v06x/runtime a1ad12eb..2a3f0e0d; verified by gate 3 on Linux x64)
- [x] 5.7 `TYPE_DESCRIPTOR_IMMUTABLE` emitted in `aggregate_static.rs` for Shared nominal types and set on the string record; `TypeDescriptorImmutableFlag()`. (Heap objects carry type descriptors for scanning) (implemented on v06x/runtime a1ad12eb..2a3f0e0d; verified by gate 3 on Linux x64)
- [x] 5.7a `host_processor_count` intrinsic and `__host_processor_count` corelib service, C implementations on three targets (`sysconf(_SC_NPROCESSORS_ONLN)`, `GetActiveProcessorCount`), `HostProcessorCount` wrapper, `Concurrency.HostProcessorCount()`; `ProcessorCount()` unchanged. (Host logical processor count intrinsic) (implemented on v06x/runtime a1ad12eb..2a3f0e0d; verified by gate 3 on Linux x64)
- [x] 5.8 Spec restatements only, no code: non-moving collector rule, foreign reference definition and stop rule, Phase A per heap in the GC and scheduler contracts. (Non-moving collector; Foreign references; Ship Phase A GC before parallel mutators; Phase A single GC mutator on scheduler threads) (spec delta in this change)

## 6. Tooling

- [x] 6.1 Formatter emit for every new attribute site and corpus coverage. (Attribute sites in the formatter corpus)
- [x] 6.2 LSP hover on attributes and transfer class, semantic tokens at every site, site-filtered attribute completion, target catalogue completion. (Hover, navigation, and references; Rename, signature help, symbols, and tokens)

## 7. Evidence

- [ ] 7.0 Surface tests for generic methods: explicit arguments on path and member-access callees, E1204, E1229, E1610 on method bounds, inference from receiver, non-lambda arguments, expression and block lambda bodies, E1203. (open: generic-method surface fixtures not added; query tests cover the behaviour)
- [ ] 7.1 Surface tests: one parse and format test per attribute site, E1508/E1509/E1510 negatives, marker and `[Immutable]`/`[Isolated]`/`[Copyable]`/`[NeverTransferable]` positives and negatives, transfer class table test, E1610 reason text.
- [ ] 7.2 Runtime tests on three targets: thread create/join, the five atomics, second `IsolateCreate` on a second thread, pool sharing, panic copy-out, region owner lookups; the full corelib and projects suites unchanged with the split lifecycle.
