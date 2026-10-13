# Design: attributes on every declaration site and isolate prerequisites (0.6.1)

Paths below are relative to `compiler/` unless they start with `openspec/`,
`docs/` or `corelib/` (which is `compiler/corelib/`). Line numbers were read on
2026-10-13 in the v0.6 release worktree.

## Shared vocabulary

The changes `v062-captures-and-move` through `v065-parallel-sequences` use these
names exactly as written here. This section is the one allocation table of the
program: a later change that needs a new name, diagnostic code, intrinsic or
term registers it here (and, for a diagnostic code, in the registry delta of
this change) and does not redefine one listed here. Names that a later release
introduces are listed in "Names introduced by 0.6.2-0.6.5" so that the later
changes spell them one way.

### Transfer classes

| Class | Meaning | Members in 0.6.1 |
| --- | --- | --- |
| Shared | may be referenced from several heaps because nothing can write it | primitives (`i8` `i16` `i32` `i64` `u8` `u16` `u32` `u64` `f32` `f64` `bool` `char` `word` `unit`), `string`, `[Immutable]` nominal types whose fields are Shared, enums whose variant fields are Shared |
| Moved | has exactly one owner; the owner changes when the value is handed over | `T[]` with `T` Transferable, `[Isolated]` nominal types whose fields are Shared or Moved, enums with at least one Moved field and no Copied field, corelib collections (`List<T>`, `Stack<T>`, `Queue<T>`, `Set<T>`, `Map<K, V>`, `PriorityQueue<T>`, `I64Map<V>`, `StringMap<V>`) |
| Copied | plain data copied on every transfer | `[Copyable]` nominal types whose fields are Shared or Copied, enums with at least one Copied field and no Moved field |
| Never | cannot cross a heap boundary | `pointer`, `never`, function types, `[NeverTransferable]` types (`Fiber<T>`, `Channel<T>`, `Hub<T>`, `Mutex`, `MutexGuard`, `WaitGroup`, `TcpStream`, `TcpListener`, `UdpSocket`, Glue owners), any type with a field of class Never, nominal types without a marker, enums mixing Moved and Copied fields |

`Transferable` is the union Shared | Moved | Copied. The query that computes the
class is `transfer_class` (`crates/beskid_queries/src/semantic_contract/transfer.rs`,
new); its result type is `TransferClass::{Shared, Moved, Copied, Never(reason)}`.

### Marker contracts and attributes (corelib `Core.Parallel`, 0.6.1)

| Name | Kind | Recognized by the compiler | Purpose |
| --- | --- | --- | --- |
| `Transferable` | marker contract, no members | yes, structurally through `transfer_class` | bound `where T: Transferable` |
| `Shared` | marker contract | yes | bound `where T: Shared` |
| `Moved` | marker contract | yes | bound `where T: Moved` |
| `Copied` | marker contract | yes | bound `where T: Copied` |
| `[CompilerDerived]` | attribute on `ContractDefinition` | yes, by name | marks the four contracts above as proven by the compiler, not by declaration |
| `[Immutable]` | attribute on `TypeDefinition` | yes | transitive class immutability (Glacier) |
| `[Isolated]` | attribute on `TypeDefinition` | yes | externally unique record; class Moved |
| `[Copyable]` | attribute on `TypeDefinition` | yes | plain data; class Copied |
| `[NeverTransferable]` | attribute on `TypeDefinition` | yes | isolate-local handle; class Never regardless of fields |
| `[ImmutableStorage]` | attribute on `Field` | yes | the one `T[]` field an `[Immutable]` type may hold when nothing writes it (used by `ReadOnlyArray<T>` in 0.6.3) |
| `[Captures(Bound: C)]` | attribute on `Parameter` | yes (0.6.2) | capture bound on a function-typed parameter |

### Diagnostic codes (block E1234-E1255, closure/spawn band continuation)

| Code | `SemanticIssueKind` variant | Condition | First release that emits it |
| --- | --- | --- | --- |
| E1234 | `UseAfterMove` | a Moved-class or `Fiber` value is used after it was consumed | 0.6.2 |
| E1235 | `CapturedLocalAssignedInBoundLambda` | a lambda passed to a `[Captures]` parameter assigns a captured local | 0.6.2 |
| E1236 | `CaptureNotTransferable` | a lambda passed to a `[Captures]` parameter captures a value whose class is not accepted by the bound; names the first offending field | 0.6.2 |
| E1237 | `MovedCaptureWithoutMove` | a `[Captures]` lambda captures a Moved value without `move` | 0.6.2 |
| E1238 | `CapturesArgumentNotLiteral` | the argument to a `[Captures]` parameter is not a lambda literal or a function item | 0.6.2 |
| E1239 | `MoveOfNonOwningName` | `move` applied to a name that is not an owning Moved-class name | 0.6.2 |
| E1240 | `MoveInLoopWithoutReassignment` | a Moved value is consumed inside a loop and not reassigned before the next iteration | 0.6.2 |
| E1241 | `BorrowEscapes` | a borrowed Moved value is stored, returned, captured or passed to a `move` parameter | 0.6.2 |
| E1242 | `ImplicitAliasOfMovedValue` | a Moved value is stored, passed to a `move` parameter or returned while it is still owned by a live name and no `move` was written | 0.6.2 |
| E1243 | `DestructiveReadWithoutEmpty` | `move x.f` on a field whose type has no canonical empty value | 0.6.2 |
| E1244 | `ImmutableFieldNotShared` | a field of an `[Immutable]` type is not Shared (and is not an `[ImmutableStorage]` array field) | 0.6.1 |
| E1245 | `ImmutableFieldAssignment` | assignment to a field of an `[Immutable]` object outside its struct literal, including an `[ImmutableStorage]` field passed to a `mut` parameter | 0.6.1 |
| E1246 | `MarkerOnNeverTransferable` | `[Copyable]`, `[Isolated]` or `[Immutable]` on a `[NeverTransferable]` type or on a type with a `pointer`, function-typed or Never field | 0.6.1 |
| E1247 | `MarkerFieldClassMismatch` | a field of an `[Isolated]` type is neither Shared nor Moved, or a field of a `[Copyable]` type is neither Shared nor Copied; names the field | 0.6.1 |
| E1248 | `CapturesBoundNotMarker` | the `Bound` argument of `[Captures]` does not name one of the four marker contracts, or `[Captures]` sits on a parameter that is not function-typed | 0.6.2 |
| E1249 | `InjectInsideIsolateBody` | an `inject` field is read lexically inside a task body (defined term) | 0.6.3 |
| E1250-E1255 | reserved | unassigned; 0.6.2-0.6.5 need no new code (checked 2026-10-13); a later need is allocated in this table and in this change's registry delta | none |

Codes used but not allocated here: E1510 `AttributeTargetNotAllowed` and E1509
`UnknownAttributeDeclarationTarget` (existing, `diagnostic_kinds/code.rs:21-22`),
E1610 `GenericBoundNotSatisfied` (existing, `code.rs:39`) for an unsatisfied
marker bound and for a non-transferable element, port or task result type,
E1214 `ImmutableAssignment`, E1225 and E1233 (unchanged), E1101 for runtime
names that user code cannot reach (`IsolateCreate`, `__isolate_spawn`,
`__port_send`), and for method type arguments (requirement "Generic methods and
method type arguments") E1202 `TypeMissingTypeAnnotation`, E1203
`TypeMissingTypeArguments`, E1204 `TypeGenericArgumentMismatch` and E1229
`TypeGenericParameterConflict` (existing, `code.rs:80-83`).

### Runtime manifest intrinsics and exports (`runtime_manifest.bsol`)

| Manifest name | Symbol | Signature | Beskid wrapper (`Runtime/Bootstrap/Native.bd`) |
| --- | --- | --- | --- |
| `thread_create` | `beskid_rt_v5_intrinsic_thread_create` | `(entry: pointer, argument: pointer, handle_out: pointer) -> i32` | `ThreadCreate` |
| `thread_join` | `beskid_rt_v5_intrinsic_thread_join` | `(handle: pointer) -> i32` | `ThreadJoin` |
| `atomic_word_load` | `beskid_rt_v5_intrinsic_atomic_word_load` | `(address: pointer, order: u8) -> usize` | `AtomicWordLoad` |
| `atomic_word_store` | `beskid_rt_v5_intrinsic_atomic_word_store` | `(address: pointer, value: usize, order: u8) -> void` | `AtomicWordStore` |
| `atomic_word_compare_exchange` | `beskid_rt_v5_intrinsic_atomic_word_compare_exchange` | `(address: pointer, expected: usize, desired: usize, order: u8) -> usize` (returns the observed value) | `AtomicWordCompareExchange` |
| `atomic_word_fetch_add` | `beskid_rt_v5_intrinsic_atomic_word_fetch_add` | `(address: pointer, delta: usize, order: u8) -> usize` (returns the previous value) | `AtomicWordFetchAdd` |
| `atomic_fence` | `beskid_rt_v5_intrinsic_atomic_fence` | `(order: u8) -> void` | `AtomicFence` |
| `worker_pool_init` (existing, semantics changed) | `beskid_rt_v5_intrinsic_worker_pool_init` | `(worker_count: usize) -> i32`; shares the process pool and counts the caller | `WorkerPoolInit` |
| `worker_pool_shutdown` (existing, semantics changed) | `beskid_rt_v5_intrinsic_worker_pool_shutdown` | `() -> void`; stops the threads when the last instance releases | `WorkerPoolShutdown` |
| export `beskid_rt_v5_isolate_create` | | `(config: pointer) -> pointer` | `IsolateCreate` (`Runtime/Bootstrap/Lifecycle.bd`) |
| export `beskid_rt_v5_isolate_destroy` | | `(runtime: pointer) -> void` | `IsolateDestroy` |
| export `beskid_rt_v5_isolate_panic_message` | | `(runtime: pointer, data_out: pointer, length_out: pointer) -> u8` | `IsolatePanicMessage` |
| export `beskid_rt_v5_region_owner` | | `(address: pointer) -> pointer` | `RegionOwner` (`Runtime/Mem/Gc/RegionMap.bd`, new) |
| `host_processor_count` | `beskid_rt_v5_host_processor_count` | `() -> usize`; the host's logical processor count, at least 1 | `HostProcessorCount` |
| corelib service `__host_processor_count` | `beskid_rt_v5_host_processor_count` | `() -> usize` | corelib `Concurrency.HostProcessorCount() -> i64` |

`host_processor_count` follows the `thread_yield` precedent (intrinsic and
corelib service bound to one host symbol, `runtime_manifest.bsol:170-180,
829-838`). It is a separate query from `Concurrency.ProcessorCount()`, which
keeps returning the scheduler's mutator count through `__fiber_processor_count`
and the `fiber_processor_count` export (always 1, `Runtime/Fiber/Fiber.bd:148-152`).

Memory order codes: 0 relaxed, 1 acquire, 2 release, 3 acquire-release, 4
sequentially consistent (the C11 `memory_order` ordering without `consume`).

Type descriptor flag: `TYPE_DESCRIPTOR_IMMUTABLE = 4` next to
`TYPE_DESCRIPTOR_ARRAY = 1` and `TYPE_DESCRIPTOR_UTF8_VIEW = 2`
(`Runtime/Bootstrap/Objects.bd:59-61`). Accessor `TypeDescriptorImmutableFlag()`.

### Defined terms

- **Runtime instance.** One `RuntimeState` record with its own heap, scheduler,
  callback registry and one attached mutator thread (`Lifecycle.bd:58-174`). An
  isolate (0.6.3) is a runtime instance that is not the primary one.
- **Owner (of an object).** The runtime instance whose heap allocated the
  object. Ownership never changes while the object lives (heap adoption at join,
  D7, moves whole regions, not objects).
- **Foreign reference.** A managed pointer held by a runtime instance whose
  target lies in a region owned by a different runtime instance.
- **Owning name.** A local or parameter that holds the single owner's reference
  to a Moved-class value: a `let` bound to an owned expression, a parameter
  declared `move`, or a receiver declared `move this`.
- **Borrowed name (borrow).** A name that reads a Moved-class value without
  owning it: a parameter of Moved type without `move`, a `let` bound to a place
  read (`list.storage`, `arr[i]`), or `this` in a method without `move this`.
  A borrow may be read and mutated and may not escape (0.6.2).
- **Owned expression.** A call result, a struct literal, an array literal or
  `move x`; it has no name and may be bound, stored, passed to a `move`
  parameter or returned.
- **Consuming use.** A use that ends an owning name: `move x`, passing `x` to a
  `move` parameter, storing `x` into a field or element, returning `x`,
  capturing `x` in a `[Captures]` lambda, `let y = x` (0.6.2).
- **Moved place.** A place (name or field) whose value has been consumed and
  not yet reassigned; reading it is E1234.
- **Canonical empty value.** `Option::None` for `Option<T>`, the empty array
  for `T[]`, the empty collection for `List<T>`; a destructive read `move x.f`
  leaves it behind (0.6.2).
- **Construction.** Evaluation of the struct literal that creates a record
  (`beskid.pest:468`); there is no constructor body.
- **Many heaps, one mutator each.** The Phase A restatement: a process holds
  one heap per runtime instance; each heap has one allocator, one collector and
  one mutator thread; one object is written by at most one runtime instance at
  any time.
- **Host logical processor count.** The number of logical processors the
  operating system reports as online for the process (`host_processor_count`).
  It is not the scheduler's mutator count (`ProcessorCount()`, 1 per runtime
  instance).
- **Task body.** A lambda literal or function item passed to a `[Captures]`
  parameter. In 0.6.3-0.6.5 every operation that runs code on another isolate
  (`Scope.Spawn`, `Scope.SpawnTry`, `Scope.Isolate`, pipeline and
  `ParallelSeq` operator lambdas) takes its code through such a parameter.
- **Method type parameter.** A type parameter declared by a method
  (`Task<T> Spawn<T>(...)`), in addition to the type parameters the method
  inherits from its owner type.

### Names introduced by 0.6.2-0.6.5

| Name | Release | Meaning |
| --- | --- | --- |
| `move` (keyword, parameter and receiver modifier, `MoveExpression`), `exchange` (builtin) | 0.6.2 | ownership transfer and destructive read |
| `affine_ownership` | 0.6.2 | the per-callable query fact behind E1234-E1243 |
| `Isolate`, `Task<T>`, `TaskFailure`, `TaskError`, `ParallelError`, `ScopeOptions`, `ReadOnlyArray<T>` | 0.6.3 | `Core.Parallel` types; `Isolate`, `Task<T>` and `TaskFailure` are `[Immutable]` over process-wide ids or plain data (D13) |
| `Scope` | 0.6.3 | `Core.Parallel` scope handle; `[NeverTransferable]` |
| `__isolate_spawn`, `__isolate_join`, `__isolate_join_message`, `__isolate_join_finish` | 0.6.3 | isolate builtins, unreachable from user code (E1101) |
| `BESKID_ISOLATES_MAX` | 0.6.3 | process bound on live runtime instances; default the host logical processor count |
| isolate main fiber | 0.6.3 | the fiber that runs an isolate's entry |
| pool isolate | 0.6.3 | an isolate of the process-wide pool bounded by `BESKID_ISOLATES_MAX` |
| elision (serial elision) | 0.6.3 | running a task body on the calling isolate when no pool isolate is free |
| foreign reference table (foreign table) | 0.6.3 | per-heap native table `{count, epoch, immutable}` keyed by foreign object address (ORCA FRC), `Runtime/Mem/Gc/Foreign.bd` |
| heap adoption | 0.6.3 | relinking a joined task's heap regions into the parent heap |
| `Port<T>`, `PortError`, `SendOk`, `PipelineStage<T>` | 0.6.4 | `Core.Parallel` port and pipeline types; `Port<T>` and `PortError` are `[Immutable]` |
| `__port_create`, `__port_send`, `__port_receive`, `__port_close` | 0.6.4 | port builtins, unreachable from user code (E1101) |
| local reference count table (local table) | 0.6.4 | per-heap native table `{count, epoch, immutable}` keyed by the address of an object this heap owns (ORCA LRC), `Runtime/Mem/Gc/Foreign.bd` |
| INC, DEC | 0.6.4 | reference-count messages posted to the owner mailbox |
| heap retention | 0.6.4 | keeping an exited isolate's heap mapped, with no mutator and no collector, until adoption |
| hand-over | 0.6.5 | passing a Moved graph by pointer with count entries at send and receive |
| `ParallelSeq<T>`, `Associative<T>`, `Commutative<T>`, `SumI64`, `SumF64`, `MaxI64`, `MinI64`, `Concat`, `Count` | 0.6.5 | data-parallel sequence and combiners |

## Grounding

### Attribute sites in the grammar (`crates/beskid_analysis/src/beskid.pest`)

Sites that accept `AttributeList?` today:

| Line | Production |
| --- | --- |
| 281 | `ModuleDeclaration = { AttributeList? ~ Visibility? ~ KwMod ~ Path ~ ";" }` |
| 283 | `InlineModule = { AttributeList? ~ Visibility? ~ KwMod ~ Identifier ~ "{" ... }` |
| 318 | `FunctionDefinition` |
| 332 | `ImplMethodDefinition` (also used for inline type methods through `TypeBody`, line 349) |
| 344 | `Field` |
| 350 | `TypeDefinition` |
| 352 | `EnumDefinition` |
| 357 | `ContractDefinition` |
| 360 | `ContractMethodSignature` |
| 381 | `TestDefinition` |

Sites that do not:

| Line | Production | 0.6.1 target kind |
| --- | --- | --- |
| 273 | `AttributeDeclaration = { Visibility? ~ KwAttribute ~ Identifier ~ AttributeTargetList? ~ "{" ... }` | `AttributeDeclaration` |
| 295 | `GenericParameters = { "<" ~ Identifier ~ ("," ~ Identifier)* ~ ">" }` | `TypeParameter` |
| 335 | `Parameter = { BulkKeyword? ~ MutKeyword? ~ BeskidType ~ Identifier }` | `Parameter` |
| 355 | `EnumVariant = { Identifier ~ ("(" ~ FieldList? ~ ")")? }` | `EnumVariant` |
| 322 | `ImplBlock` | `ImplBlock` |
| 319 | `ConstantDefinition` | `ConstantDefinition` |
| 404-405 | `TypedLetStatement`, `InferredLetStatement` | `LetStatement` |
| 424 | `LambdaExpression = { LambdaParameters ~ "=>" ~ LambdaBody }` | `LambdaExpression` |
| 427 | `LambdaParameter = { BeskidType ~ Identifier \| Identifier }` | `LambdaParameter` |
| 361-362 | `ContractAssociatedType`, `ContractEmbedding` (contract members other than methods) | `ContractAssociatedType`, `ContractEmbedding` |

The receiver `this` has no grammar production: methods declare no receiver
parameter and `this` is inserted as a local by the resolver
(`crates/beskid_analysis/src/resolve/resolve_refs/items_statements.rs:58`).
0.6.1 adds an explicit receiver production so that attributes (0.6.1) and the
`move`/`mut` receiver modifiers (0.6.2, D2) have a place to attach:
`ReceiverParameter = { AttributeList? ~ (MutKeyword | MoveKeyword)? ~ "this" }`
as an optional first entry of `ParameterList` inside `ImplMethodDefinition`.
A method without a `ReceiverParameter` keeps today's implicit receiver.

Target names today are free identifiers (`AttributeTarget = { Identifier }`,
line 275; `syntax/items/attribute.rs:36`). Corelib uses PascalCase node kinds
(`FluentStep(TypeDefinition)`, `FluentChain(MethodDefinition)`,
`FluentInner(Field)`, `corelib/packages/compiler-sdk/src/Beskid/Fluent.bd:4-16`;
`InternalSymbol(MethodDefinition)`, `Beskid/Compiler/InternalSymbol.bd:25`),
while the serialization Mod uses lowercase `type`, `enum`, `field`
(`corelib/mods/serialization_mod/Src/SerializationMod/Attributes.bd:11, 30`).
E1509 and E1510 exist as kinds (`analysis/diagnostic_kinds/code.rs:21-22`,
`diagnostic_kinds.rs:59-66` with an `allowed` list) and have no emission site
in `crates/` outside the kind catalogue (grep on 2026-10-13). The
ffi-and-extern spec already requires E1510 for `Extern` on a non-contract.
`Export` and `Extern` are recognized by name without a corelib declaration
(`semantic_contract/glue.rs:339, 404`, `legality/externs.rs:49`).

### Contracts and bounds

`where T: Contract` bounds (`beskid.pest:316-318`); proof at calls
(`semantic_contract/contracts.rs:1709-1760`); `prove_applied_conformance`
requires a nominal `TypeDefinition` (`contracts.rs:1677-1700`), so primitives
and arrays cannot satisfy any bound today. Marker contracts with zero members
parse (`beskid.pest:357`). `TypeDefinition` has no `where` clause
(`beskid.pest:350`).

### Immutability and fields

`mut` is binding-level only (`beskid.pest:335, 404-405`); E1214 covers
single-segment locals (`analysis/rules/staged/type_checking.rs:105-121`).
Any field is assignable; assignment targets are paths
(`semantic_contract/legality/values.rs:509-523`). Records are built by struct
literal only (`beskid.pest:468-470`). Arrays are mutable in place
(`Array.Set<T>(T[] values, ...)` writes `values[index] = value`,
`corelib/packages/foundation/src/Core/Collections/Array.bd:60-63`).

### Strings

`string` is a `PrimitiveType` (`beskid.pest:293`). The runtime copies bytes on
creation (`Runtime/Data/Strings.bd:1-16`) and exposes one mutator of an
existing record, `beskid_rt_v5_utf8_record_set_data`
(`Runtime/Data/Utf8ViewRecord.bd:27-30`, `runtime_manifest.bsol:2060`), used
only while a record is being constructed.

### Runtime

- `RuntimeState` lifecycle: `ProcessInit` allocates heap, callbacks, attaches
  the thread, `SchedInit`, `ApplyEnvironmentLimits`, `WorkerPoolInit(4)`,
  composition launch (`Runtime/Bootstrap/Lifecycle.bd:58-174`; limits at 142,
  pool at 143, composition at 156-172). `ThreadAttach` refuses a thread that
  already has TLS state (`Lifecycle.bd:245-272`).
- Worker pool refuses a second init: `if (beskid_worker_count || ...) return -1`
  (`crates/beskid_abi/assembly/common/external_wait.h:320-321`); threads are
  created with `pthread_create`/`CreateThread` and joined with
  `pthread_join`/`WaitForSingleObject` (`external_wait.h:326-343`).
- Manifest intrinsics style: `intrinsic "raw_word_load" { symbol = ... capability = ... params = [...] returns = usize }` (`runtime_manifest.bsol:150`);
  target-bound style with `os_imports` (`thread_yield`, lines 170-179);
  existing `worker_pool_init`/`worker_pool_shutdown` (lines 272-273).
- Type descriptor flags `ARRAY = 1`, `UTF8_VIEW = 2` (`Runtime/Bootstrap/Objects.bd:59-61`),
  emitted from `crates/beskid_codegen/src/aggregate_static.rs`.
- Region lookup walks one heap: `FindHeapRegionContaining(heap, address)`
  (`Runtime/Mem/Gc/State.bd:136-150`); `GcMarkGray` returns early when the
  region is not in this heap (`Runtime/Mem/Gc/Marking.bd:110-119`).
- Collector: mark-sweep over span bitmaps, no object is moved
  (`Marking.bd:24-25, 203`; `Collection.bd`).
- Panic: message string allocated in the panicking heap and stored in the
  fiber record (`Runtime/Io/Syscalls.bd:126-128`).
- Phase A spec: `openspec/specs/execution--runtime--fiber-scheduler-and-stacks/spec.md:51-72`,
  `execution--runtime--memory-and-gc-runtime-contract/spec.md:10-30`.

### Corelib

- `List<T>` is `{ T[] storage, i64 count }` with self-returning methods
  (`corelib/packages/foundation/src/Core/Collections/List.bd:12-27`); the other
  collections follow the same shape (`Stack.bd:19-24`, `Queue.bd:20-25`,
  `Set.bd:29`, `Map.bd:23`, `PriorityQueue.bd:43-48`, `I64Map.bd:39`,
  `StringMap.bd:39`).
- Handle types: `Fiber<T> { i64 handle }` (`corelib/packages/concurrency/src/Concurrency/Fiber.bd:5-6`),
  `Channel<T>` (`Channel.bd:17`), `Hub<T>` (`Hub.bd:9`), `Mutex` (`Mutex.bd:8`),
  `MutexGuard` (`MutexGuard.bd:2`), `WaitGroup` (`WaitGroup.bd:2`),
  `TcpStream`, `TcpListener`, `UdpSocket`
  (`corelib/packages/network/src/Network/Tcp/TcpStream.bd:21`,
  `Tcp/TcpListener.bd:14`, `Udp/UdpSocket.bd:14`).

### Method calls and generic inference

- Grammar (`crates/beskid_analysis/src/beskid.pest`): `PathSegment = { Identifier ~ GenericArguments? }`
  (line 285), so a call on a local receiver written as a path (`s.Spawn<i64>(...)`)
  already parses with type arguments on its last segment. `MemberAccess = { "." ~ Identifier }`
  (line 450) admits none, so a call on a call result (`values.Parallel().Map<i64>(...)`)
  cannot carry them. `ImplMethodDefinition` (line 332) and `ContractMethodSignature`
  (line 360) have no `GenericParameters` and no `WhereClause`; `FunctionDefinition`
  has both (line 318). `TypeBound = { Identifier ~ ":" ~ Path }` (line 316) takes a
  `Path`, whose segments admit `GenericArguments`, so `where C: Associative<T>` parses.
- Syntax model: `MethodDefinition` has no generics field
  (`syntax/items/method_definition.rs:19-33`); `MemberExpression` is `{ target, member }`
  (`syntax/expressions/member_expression.rs:12-17`).
- Query layer (`crates/beskid_queries/src/semantic_contract/`):
  `generic_callable_parameters` gives a method only the generics of its owner type
  or `impl` block (`calls/generics/callables.rs:104-145`);
  `generic_call_instantiation_tracked` reads explicit type arguments only from a
  `Path` callee (`calls/generics/tracked.rs:6-20`, `callables.rs:73-98`).
  `specialization_for_call_in_environment` (`abi/specialization/inference.rs:7-300`)
  binds owner generics from the instantiated receiver (lines 94-117), then explicit
  arguments (lines 119-185), then infers the rest from the proven source identity of
  each argument (`specialized_source_expression_identity`, lines 187-250) by
  structural unification over nominal arguments, arrays and function types
  (`infer_source_substitutions`, lines 396-497); a conflict is
  `generic_binding_conflict` (E1229). A lambda argument's identity is
  `lambda_source_identity` (`closures_spawn/function_values.rs:260-316`): typed
  parameters and an expression body synthesize; untyped parameters and a block
  body read the lambda's expected function type (`lambda_expected_function`,
  lines 318-334), and a block body without one is `unit`.
- `expected_type` binds a callee parameter's generics only by explicit type
  arguments or the instantiated receiver, never by sibling inference, to avoid a
  cycle through argument typing (`expected_type.rs:14-21, 342-347`; decision of
  2026-10-09, refined 2026-10-12). A callee parameter `(T) => U` with `U` unbound
  is therefore unavailable as a whole today, although `T` is known from the
  receiver.

### Processor count

`Concurrency.ProcessorCount()` returns `__fiber_processor_count()`
(`corelib/packages/concurrency/src/Concurrency.bd:13-16`), a corelib service bound
to the export `fiber_processor_count` (`runtime_manifest.bsol:818-827`), which
returns the constant 1 (`Runtime/Fiber/Fiber.bd:148-152`). Nothing reports the
host's processor count; `BESKID_ISOLATES_MAX` (0.6.3, ruling 9) needs it as its
default.

## Rationale

- Attributes on every site: parameters are the one site 0.6.2 cannot do
  without (`[Captures]`, REQ 3.3); lambdas and lambda parameters follow for
  0.6.5 property markers (REQ 3.6 option 2); the rest closes the surface once
  so that no later change reopens the grammar.
- Target enforcement with a closed target catalogue: free identifiers make
  E1509 unenforceable and let the Mod and corelib disagree on spelling. The
  catalogue is the PascalCase node-kind names already used by corelib.
- Compiler-recognized marker contracts: structural derivation is sound when
  the derived property is closed under composition and the leaves fail closed
  (Rust auto traits; Jung et al., RustBelt, POPL 2018; Swift SE-0302). Keeping
  the names in corelib and the derivation in the compiler follows the
  `Export`/`Extern` precedent (REQ 3.1).
- `[Immutable]` as class-level transitive immutability: Glacier (Coblenz et
  al., ICSE 2017) found class immutability understood and applied correctly
  more often than reference immutability; Gordon et al. (OOPSLA 2012) is the
  concurrency instance (ruling 1, REQ 3.4).
- `[Copyable]` independent of `[Serialize]` (ruling 2): transit is
  descriptor-driven runtime work and must not depend on an active Mod.
- Never-transferable handles (ruling 3): their `i64` ids index scheduler-local
  tables (REQ 2.8), so a structurally Shared record would be wrong. The
  explicit `[NeverTransferable]` attribute, plus the field rule for
  `pointer`/function types, makes the denial checkable instead of a comment.
- `string` Shared by fiat (ruling 4) depends on the construction-only setter
  invariant, so the memory spec states it.
- Codes E1234+ (ruling 5): the registry has `E`, `W`, `T` prefixes only.
- ORCA groundwork (ruling 6 as amended): the region-to-owner map, the
  non-moving rule and the foreign-reference definition are the parts of ORCA
  (Clebsch et al., OOPSLA 2017) that change no behavior and that 0.6.3-0.6.5
  build on. D6 adds the descriptor flag because the runtime cannot otherwise
  tell a leaf from a graph when tracing a foreign object (Pony doc 2.4.2).
- D12: the viewpoint-adaptation table collapses to three rules because
  immutability and isolation are properties of types (Pony doc 2.2.1); `box`
  and `trn` are not adopted because learners cannot explain them (ponylang
  office hours 2023) and Glacier measured the annotation cost.
- D13: process-wide ids are plain data, so identity-only handles derive
  Shared through `[Immutable]`; nothing special is needed.
- Method type parameters and inference (owner placement of every prerequisite in
  0.6.1): the fluent forms the research locked (`s.Spawn(() => ...)`,
  `values.Parallel().Map((x) => ...)`) need method-level generics, type arguments
  on member access and inference of a method type parameter from a lambda result.
  The inference order (receiver, explicit arguments, non-lambda arguments, lambda
  results) is local type inference in the style of Pierce and Turner (TOPLAS 2000)
  and C# phased method type inference (ECMA-334, 12.6.3): a lambda's parameters
  are checked against types already fixed, and its result is synthesized. The
  2026-10-09 rule that a callee parameter is never bound by sibling inference
  stands; the only refinement is that a function-typed parameter whose unbound
  generics appear only in its result still supplies its parameter types, so
  there is no cycle.
- Host processor count separate from `ProcessorCount()`: the latter is the
  scheduler's mutator count, which stays 1 per runtime instance under Phase A;
  reusing it for the isolate bound would change its meaning.
- Thread and atomic intrinsics (REQ 3.8 option 1): atomics belong to the
  runtime corpus, not to user `clif` blocks, because a managed array lives in
  one heap. Plain loads and stores are not enough under reordering (Boehm and
  Adve, PLDI 2008).

## Archive order and delta chain

The changes archive in this order: every open `v06-*` change at the 0.6.0
release, then `v061-attributes-and-isolate-prerequisites`, `v062-captures-and-move`,
`v063-isolates-and-scope`, `v064-ports-and-pipelines`, `v065-parallel-sequences`.
A `MODIFIED` block replaces the whole requirement, so each later block below is
the earlier change's resulting text plus its own edit. An edit that changes the
text of an earlier link must change that link's change in the same commit.

| Capability | Requirement | Chain |
| --- | --- | --- |
| `compiler--semantic-pipeline--diagnostic-code-registry` | Diagnostic codes owned in analysis sources: Decision [D-COMP-SEM-0003] | base, then `v06-function-values` (E1230/E1231, E2101 band, E1233, E1209 and their scenarios), then v061 (E1234-E1255 table, E1509/E1510 paragraph, two scenarios), then v062 (0.6.2 emission paragraph, two scenarios), then v063 (0.6.3 E1249 paragraph, one scenario) |
| `language-meta--evaluation--lambdas-and-closures` | Capture and closure lifetime | base, then `v06-function-values` (E1233 text), then v062 (borrowed and moved captures, two scenarios) |
| `language-meta--memory-model--memory-and-references` | Cross-fiber sharing | base, then v061 (proof by transfer class), then v063 (crossing an isolate boundary, three scenarios; the v061 sentence "nothing in this release moves a value between heaps" is removed on purpose) |
| `language-meta--memory-model--memory-and-references` | Locals mut and assignment | base, then v062 (`move` modifier, two scenarios), then v064 (`move` over a type parameter bounded by `Transferable`, one scenario) |
| `execution--runtime--fiber-scheduler-and-stacks` | Runtime instance lifecycle split | added by v061, then modified by v063 (the v061 sentence "Exactly one instance SHALL exist per process in this release" is replaced on purpose; two scenarios added) |
| `execution--runtime--memory-and-gc-runtime-contract` | Span-batched tri-color mark-sweep collection and barrier exports: Decision [D-EXEC-RT-0006] | base, then v062 (incremental cycle table: scheduling, atomicity, guarded field and element stores, `beskid_rt_v5_gc_write_barrier`; one scenario; the 0.6.0 rows "non-incremental" and "SHALL NOT call `gc_write_barrier` for field stores" are replaced on purpose) |
| `execution--runtime--memory-and-gc-runtime-contract` | Heap growth pacing and committed-size cap | base, then `v06-runtime-limits` (uncapped default and `BESKID_HEAP_MAX`; its text already equals the base on 2026-10-13), then v062 (mark trigger, completion before growth, two-cycle retry under cap pressure; three scenarios) |
| `execution--runtime--memory-and-gc-runtime-contract` | Span-queued marking and per-span sweep | base, then REMOVED by v062 and replaced by the v062 ADDED requirement "Span-queued incremental marking and per-span sweep" (its two other scenarios carried over; "No write-barrier call is emitted for a managed field store" dropped on purpose) |

Every other requirement of the program is touched by one change only. Header
names are unique per capability across all five changes, so no `ADDED` header
collides with an earlier `ADDED` one. Capabilities that several changes extend
with distinct requirements: `core-library--concurrency--isolates-and-parallel`
and `execution--runtime--isolates-and-transit` (created by v063, extended by v064
and v065), `execution--runtime--memory-and-gc-runtime-contract` (v061, v062, v063, v064,
v065), `language-meta--memory-model--memory-and-references` (v061, v062, v063,
v064, v065), `execution--runtime--fiber-scheduler-and-stacks` (v061, v063),
`execution--runtime--panic-io-and-syscalls` (v061 adds, v063 modifies
D-EXEC-RT-0008), `language-meta--evaluation--fibers-and-spawn` (v062, v063),
`core-library--foundation-and-primitives--core-collections` (v061, v062),
`tooling--lsp--intellisense-capabilities-and-behavior` (v061 modifies two
requirements, v062 a third), `tooling--formatter--verification-and-traceability`
(v061, v062). Requirements that a later release supersedes in behavior are
release-qualified in their text (for example 0.6.3 "Heap adoption at join",
0.6.4 "Heap retention and adoption after isolate exit" and 0.6.5 "Adoption at
join in every case"), so archiving keeps all three without contradiction.

Of the open `v06-*` changes only `v06-function-values` touches a requirement of
this program. Three blocks of this change and one of v062 were rebased on the
current base text on 2026-10-13 because the base had moved since drafting:
D-EXEC-RT-0003 and D-EXEC-RT-0005 (base now states that Phase B is not
implemented in 0.6.0), "Conformance satisfaction and diagnostics" (base gained
the `FunctionSignature` and `impl` conformance text and three scenarios) and, in
v062, "Inline public collection methods" (base now states the
`Core.Collections.*` namespace rule; the stale "Fluent wrapper does not change
storage" scenario is gone). The chain was checked on 2026-10-13 by a dry archive
of every open `v06-*` change and then v061-v065 in a scratch copy of
`openspec/`: v061-v065 archive cleanly and the final specs contain every line of
their deltas except the two replacements named in the table above.

On 2026-10-13 incremental marking was added to v062 (owner decision). It
modifies D-EXEC-RT-0006 and "Heap growth pacing and committed-size cap", whose
v062 blocks start from the base text and from the `v06-runtime-limits` result,
and replaces "Span-queued marking and per-span sweep". No later change modifies
these three requirements. The ADDED requirements of v063 ("Heap adoption at
join"), v064 ("Owner external count table", "Receiver side increments and
collector-driven decrements") and v065 ("Owner collector treats counted entries
by mutability", "Receiver collector traces through foreign mutable objects",
and "Moved hand-over at receive" in `execution--runtime--isolates-and-transit`)
were edited in place for the incremental cycle; they remain single-change
requirements. The dry archive was repeated after these edits.

## Open issues

1. Attribute parameter types are not checked semantically today (no use of
   `AttributeParameter` in `beskid_queries`). `[Captures(Bound: Transferable)]`
   (0.6.2) therefore relies on the by-name rule, not on the declared parameter
   type. A later change may add parameter typing.
2. The serialization Mod spells targets `type`, `enum`, `field`. With the
   closed catalogue these become E1509 at Mod load. The Mod must switch to
   `TypeDefinition`, `EnumDefinition`, `Field` (task 2.2). The Mod SDK facade
   `Syntax.AttributeTargetValue` accepts any string and is unchanged.
3. `[ImmutableStorage]` exemption soundness: `Array.Set<T>(T[] values, ...)`
   mutates through a non-`mut` parameter. The rule here forbids assignment,
   escape and `mut`-parameter passing of the field; it cannot forbid every
   corelib element write through a borrowed read. `ReadOnlyArray<T>` (0.6.3)
   is corelib-reviewed code; the exemption is corelib-only until a frozen
   array representation exists.
4. Ruling 6 names "many heaps, one mutator each"; the Pony doc (2.4.2) sharpens
   this to "one allocator and one collector per heap; one mutator per object"
   once 0.6.5 lets a receiver mutate objects in an owner's regions. Both
   sentences are written; the second is the invariant 0.6.5 relies on.
5. The Pony doc's 0.6.1 delta places the `move` parameter modifier in 0.6.1.
   The owner's scope for this change puts `move` in 0.6.2 (D2). 0.6.1 adds
   only the `ReceiverParameter` production so that 0.6.2 can attach the
   modifier without reopening the method grammar.
6. `thread_create`'s entry pointer convention: the entry receives one `pointer`
   argument and returns `pointer`; the C host adapts it to `void *(*)(void *)`
   or `LPTHREAD_START_ROUTINE`. The handle is an opaque `pointer` stored by the
   host in a `SystemAllocate`d cell so that both targets fit.

## Implementation rulings (2026-10-13, from the runtime groundwork slice)

- `process_state_root` joins the intrinsic vocabulary: it returns the native block of process-wide words (region map, recorded environment limits). Runtime code has no other process-wide storage.
- The provenance audit admits manifest-declared `beskid_rt_v5_*` exports whose names contain `panic` (e.g. `beskid_rt_v5_isolate_panic_message`); Rust-mangled panic symbols stay rejected.
- On Windows the atomic intrinsics use `Interlocked*` (sequentially consistent for every order byte) because MSVC `/std:c11` has no `stdatomic.h`; this satisfies every requested order and is the specified Windows mapping.
- `BeskidRuntimeState.tls_key` (offset 48, unused) becomes `instance`, a pointer to the native instance record holding the main fiber and the panic copy; the state record stays 64 bytes.
- Regions leave the region-to-owner map before their memory is unmapped, so a reused address never names a dead instance.
- Region map chunks are not freed while the process runs; slots are reused, bounded by the peak number of live regions.
- Thread-entry scenarios that need a Beskid function address are covered at the C level in 0.6.1; the Beskid-level ones move to 0.6.3, which adds compiler-made entry addresses.

## Implementation rulings (2026-10-13, from the language-surface slice)

- The compiler-recognized attribute table also contains `GlueHandle`, `RustOwner` and `CleanupConversion`; all recognized attributes are declared in the corelib module `Core.Attributes`, and a test keeps the module and the compiler table identical.
- Marker attributes live in `Core.Attributes` until a `Core.Parallel` module exists (0.6.3), then move there.
- Attribute name resolution order: the declaring unit, then imported units, then `Core.Attributes`, then any declaration in the assembly (this admits Mod-declared attributes such as `Serialize`). A user declaration in scope shadows a recognized name.
- Follow-ups for this change: Glue and `Export` code paths must recognize attributes through the resolved declaration, not the bare name; signature help shows call-site type-parameter bindings; the E1229 shadowing message gets its own wording; `TypeParameter` spans include their attributes.
