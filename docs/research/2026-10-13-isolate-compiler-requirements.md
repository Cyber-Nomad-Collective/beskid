# Isolate parallelism for Beskid 0.6.5: what the compiler must provide, and what stays in Beskid

Research date: 2026-10-13. Scope: read-only audit of the v0.6 release tree
(`/Users/mikserek/.codex/worktrees/v06-release/beskid`, compiler submodule at
`compiler/`) against the target semantics in
`docs/research/2026-10-13-isolate-parallelism-sota.md` (Transferable =
Shared | Moved | Copied, `move`, P0301-P0303, `[Associative]` /
`[Commutative]` combiners, `Parallel.Scope` / `Task`, fluent `.Parallel()`
pipelines with fusion, ports, cancellation, serial elision). No builds, no
cargo, no git state changes. Every claim about current state cites
`file:line` relative to `compiler/` unless the path starts with `openspec/`
or `docs/`.

The question answered: which general mechanisms the compiler (and the C host
layer of the runtime) must add so that isolates, ports, scopes, parallel
collections and pipelines can be written in Beskid (the canonical runtime
corpus under `runtime/beskid/src/Runtime` plus corelib), with the compiler
owning only static rules and ABI plumbing that source code cannot express.

## 1. Summary of findings

1. The runtime is already structurally "one RuntimeState = one heap = one
   scheduler = one mutator thread", addressed only through thread-local
   state. Generated code never touches a global runtime pointer; every
   runtime entry reads TLS (`Runtime/Bootstrap/Native.bd:51-57`,
   `Runtime/Mem/Gc/State.bd:87-100`). An isolate is therefore a second
   `RuntimeState` on a second OS thread. The compiler needs no change for
   that; the runtime needs an `IsolateCreate` that is `ProcessInit`
   (`Runtime/Bootstrap/Lifecycle.bd:58-174`) minus the process-wide steps.
2. Of the eight hypothesised compiler features, four are confirmed as
   compiler work (auto-derived `Transferable` bound, `move` plus
   use-after-move, capture classification feeding the bound, deep
   immutability), two are amended (closure environment transfer is runtime
   work on top of existing descriptors; atomics belong in manifest
   intrinsics for the runtime corpus, not in user `clif` blocks), one is
   downgraded (the "isolate-safe codegen audit" is a one-day check because
   codegen emits only read-only static data and TLS-mediated runtime calls),
   and one has a zero-compiler-change alternative (attribute bounds on
   function values can start as marker contracts on combiner types).
3. The largest missing compiler mechanism is not in the list: a way to state,
   on a corelib function such as `Scope.Spawn`, that the lambda argument's
   captures must satisfy a bound. This is the Spores design (Miller, Haller,
   Odersky, ECOOP 2014) and it is what turns the existing capture analysis
   (`closures_spawn/closures.rs:191-229`) into P0302/P0303.
4. The largest missing runtime mechanisms are OS-thread creation (no
   `thread_create` intrinsic exists; `runtime_manifest.bsol:147-170` lists
   only `tls_get`, `tls_set`, `thread_yield`), a process-wide worker pool
   (`external_wait.h:320-321` refuses a second init), and a cross-heap value
   transit protocol. The existing `BeskidAbiValue` slot already records an
   owner heap (`Runtime/Mem/AbiValue.bd:1-8, 76-91`), and every object
   header carries a type descriptor with a pointer map
   (`Runtime/Bootstrap/Objects.bd:35-57`), so a descriptor-driven deep copy
   in Beskid is feasible without the serialization Mod.
5. The minimal viable slice is `Parallel.Scope` with `Spawn`/`Join` over
   `Shared` scalars, strings and `[Immutable]` records, all transferred by
   copy, with P0302/P0303 and child failure as `Result`. `move`, ports,
   pointer sharing and fusion follow in that order.

## 2. Current state, by area

### 2.1 Closures and captures (query layer)

- Capture computation exists and is syntax-driven: `closure_captures` walks
  every `PathExpression` under a lambda, resolves it lexically, skips
  declarations inside the lambda, and records one `ClosureCapture`
  `{declaration, slot, class, span}` per outer declaration
  (`crates/beskid_queries/src/semantic_contract/closures_spawn/closures.rs:191-229`).
- Capture classification exists but is binary: `CaptureStorageClass` is
  `TransferableValue | StackReference`
  (`semantic_contract/model/closures.rs:148-151`); a `mut` local or a
  non-managed `pointer` is a `StackReference`, everything else is a
  `TransferableValue` (`closures.rs:258-278`). The word "transferable" here
  means "safe to snapshot by value into the environment", not the isolate
  notion.
- E1233 rejects non-spawn lambdas that capture a stack reference
  (`semantic_contract/legality/captures.rs:1-42`); spawn operands get the
  same judgement as E1225 `StackReferenceEscapesSpawn`
  (`closures_spawn/fiber_ownership.rs:61-73`, `closures_spawn/spawn.rs:195-220`).
- The environment ABI is a deterministic field list with a pointer-map
  requirement (`model/closures.rs:36-57`, `closures.rs:86-111`); codegen
  turns it into artifact-owned static descriptor, pointer map and allocation
  request symbols (`crates/beskid_codegen/src/closure_static.rs:1-60`).
- Lambdas are typed by expected type (`closures_spawn/function_values.rs:14-18`),
  so a corelib `Spawn<T>(() => T body)` parameter types its lambda argument
  without compiler changes.

### 2.2 Use-after-move and affinity

- An affine discipline exists for exactly one type: `Fiber<T>`.
  `spawn_handle_diagnostics` seeds owners from parameters and `let`
  bindings whose type is the corelib `Fiber`, walks uses in source order,
  tracks `if` branches so a consume in one arm does not poison the other,
  treats loops conservatively, lets a `let` alias transfer ownership, and
  reports `UseAfterMove` (`fiber_ownership.rs:171-303`). `Cancel` is the
  only non-consuming method (`fiber_ownership.rs:270-276`).
- This is a per-binding flow analysis of the shape the design asks for
  ("the same shape as Milano et al.'s isolated regions and Haller-Odersky's
  consumed uniques", SOTA doc section 9.2). It is hard-wired to `Fiber` and
  to method-call syntax; there is no `move` keyword in the grammar
  (`crates/beskid_analysis/src/beskid.pest:445` allows only `-` and `!` as
  prefixes; `beskid.pest:68` lists keywords) and no notion of a "Moved
  type".

### 2.3 Contracts, generic bounds, markers

- `where T: Contract` bounds exist on functions and `impl` blocks
  (`beskid.pest:316-318`, `contracts.rs:1355-1420`), and are proven at each
  call from substitutions (`contracts.rs:1709-1760`).
- Conformance is nominal and declared only: a type conforms through
  `type X : C` or `impl X : C` (`contracts.rs:947-978`), and
  `prove_applied_conformance` requires a `GenericSourceTypeIdentity::Nominal`
  with a `TypeDefinition` (`contracts.rs:1678-1700`). Primitives, arrays
  and function types can never satisfy a bound; there is no structural or
  auto-derived conformance.
- Marker contracts are expressible (`ContractDefinition` allows zero items,
  `beskid.pest:357`), and an empty contract's method check passes trivially.
- `TypeDefinition` has no `where` clause (`beskid.pest:350`), so `Port<T>`
  cannot constrain `T` at the declaration; constructor functions can.

### 2.4 Attributes

- User-declared attributes with target lists exist (`beskid.pest:270-277`;
  corelib precedent `corelib/packages/compiler-sdk/src/Beskid/Fluent.bd:4-16`,
  `pub attribute FluentStep(TypeDefinition) {...}`). Mods can also declare
  attributes (`corelib/mods/serialization_mod/Src/SerializationMod/Attributes.bd:7-30`
  declares `Serialize` and `SerializeField`).
- The compiler recognises a few attributes by name (`Export`, `Extern`:
  `semantic_contract/glue.rs:339`, `legality/externs.rs:49`,
  `syntax_facts.rs:346`). Diagnostic kinds `UnknownAttributeDeclarationTarget`
  (E1509) and `AttributeTargetNotAllowed` (E1510) are declared
  (`crates/beskid_analysis/src/analysis/diagnostic_kinds/code.rs:21-22`),
  but no emission site for E1510 was found outside the kind catalogue in
  this pass; treat target checking of user attributes as unverified.
- Parameters cannot carry attributes (`beskid.pest:335`), and lambdas cannot
  (`beskid.pest:424`). Only items and fields can.

### 2.5 Immutability

- Bindings: `mut` on `let` and parameters (`beskid.pest:335, 404-406`).
  E1214 `ImmutableAssignment` fires for reassignment of a non-`mut` local,
  single-segment path only
  (`crates/beskid_analysis/src/analysis/rules/staged/type_checking.rs:105-121`).
- Fields: no `readonly`, no field-level mutability; `x.f = v` is a legal
  assignment to any field (assignment targets are paths,
  `legality/values.rs:509-523`). Methods have no `mut this` receiver
  distinction (`beskid.pest:332`).
- Arrays `T[]` are mutable (write barrier export
  `runtime_manifest.bsol:124`); `List<T>` is a record over `T[]` plus count
  with linear-style "return the updated list" methods
  (`corelib/packages/foundation/src/Core/Collections/List.bd:1-30`). Strings
  are runtime records whose bytes are copied on creation
  (`Runtime/Data/Strings.bd:1-16`).
- No mutable globals exist in the language: `const` is an integer literal
  only (`beskid.pest:319`).

### 2.6 Codegen and ISLE: statics, runtime access, spawn, clif blocks

- Spawn lowering allocates the closure environment in the current heap
  (`beskid_rt_v5_closure_environment_allocate` with a static request symbol,
  `beskid_rt_v5_closure_capture_store` for pointer fields,
  `crates/beskid_isle/src/context/calls/closures.rs:33-66`), then calls
  `fiber_spawn(entry, environment)` and boxes the handle
  (`crates/beskid_isle/src/context/calls.rs:28-80`). Eager `spawn Entry(args)`
  uses a managed start environment (`context/spawn_arguments.rs:14-45`).
- All static data is read-only and image-local: string literals are
  declared `writable = false` (`crates/beskid_codegen/src/module_emission/data.rs:197-213`),
  aggregate, array and closure plans are descriptor/request constants
  (`closure_static.rs:40-60`). There is no mutable global data emission.
- Generated code reaches runtime state only through exported symbols
  (`beskid_rt_v5_managed_object_allocate`, `..._closure_environment_root_current`,
  etc.); the runtime resolves the heap through TLS
  (`Runtime/Bootstrap/Roots.bd:111-115`, `Runtime/Mem/Gc/State.bd:87-100`).
  The compiler never materialises a CLIF TLS global
  (`crates/beskid_abi/assembly/aarch64-apple-darwin/platform_tls.c:1-13`).
- `clif { }` blocks admit an allowlist of opcodes
  (`crates/beskid_analysis/src/clif_surface.rs:31-75`); loads and stores are
  `load/uload8/.../store/istore8/...` only (`clif_surface.rs:156-159`) and
  must address a `payload %N` of a managed array
  (`crates/beskid_isle/src/context/clif_block.rs:518-548`). No
  `atomic_load`, `atomic_store`, `atomic_rmw`, `atomic_cas` or `fence`.

### 2.7 Runtime (Beskid corpus) and C host

- `RuntimeState` is a 64-byte caller-supplied record; `ProcessInit`
  allocates the heap, callback registry, attaches the calling thread,
  initialises the scheduler, applies environment limits, starts a worker
  pool of 4 and launches the composition container
  (`Lifecycle.bd:58-174`). The executable host allocates the record on the
  stack and calls it once (`crates/beskid_abi/assembly/common/executable_bootstrap.c:37-56`).
- Thread binding: `ThreadAttach` allocates a TLS record pointing at the
  runtime and refuses if the thread already has one (`Lifecycle.bd:245-272`,
  refusal at `:251`). Nothing prevents a second `RuntimeState` on another
  thread; the scheduler table hangs off the runtime record
  (`Runtime/Fiber/Scheduler/Core.bd:29-55`), and the Phase-A mutator token
  is per scheduler (`Core.bd:375-390`).
- Process-global host state: argument storage
  (`platform_host.c:24-73`), the worker pool with init-once guard
  (`crates/beskid_abi/assembly/common/external_wait.h:262-267, 320-321`),
  the owner mailbox list (`external_wait.h:67-75`), the child process
  transport, environment and network locks. The worker pool is the only one
  that would break a second `ProcessInit`.
- Cross-thread signalling already exists for host workers: owners are
  identified by id, commands are posted under a lock and consumed by the
  owning scheduler via `owner_post` / `owner_pop` / `owner_wait` with a
  condition variable (`external_wait.h:76-135`), and one atomic CAS is used
  for wait claims (`external_wait.h:184-191`). `External.bd` turns these
  into fiber-cooperative waits with tokens (`Runtime/Fiber/Scheduler/External.bd:1-20`).
- GC: collection is stop-the-world per heap, triggered at allocation
  (`Runtime/Mem/Gc/Allocation.bd:338-370`, `Collection.bd:150-184`).
  Marking ignores any pointer that is not inside one of this heap's regions
  (`Marking.bd:110-119`), so a foreign-heap pointer stored in a local object
  is neither traced nor freed by the receiver. External root handles exist
  (`RootsHandles.bd:177-188, 252-260`).
- Value transit: `BeskidAbiValue` is a 40-byte slot `{tag, payload,
  descriptor, owner_heap, owner_state}` and liveness checks that the owner
  heap is the current heap (`AbiValue.bd:1-8, 76-91`). Channels move values
  between fibers through these slots (`Runtime/Sync/Channel.bd:159-185`)
  and the lock comment states the invariant: "foreign workers are not
  permitted to mutate this heap" (`Channel.bd:51-58`).
- Panics: a fiber panic stores an owned message string in the panicking
  heap and switches to the scheduler; a panic outside a fiber or in a
  detached fiber is a process trap (`Runtime/Io/Syscalls.bd:98-140`). Traps
  write to stderr and `_exit(101)` (`platform_host.c:201`).
- Type descriptors: `{size, alignment, pointer_map, pointer_count, flags}`
  with array and UTF-8-view flags (`Objects.bd:35-57`); every object header
  stores its descriptor (`Objects.bd:17-24`).

### 2.8 Serialization, Mods, corelib concurrency

- `[Serialize]` is a Mod attribute; the Mod has a declared-type eligibility
  pass that recurses through primitives, arrays and nominal arguments and
  rejects `pointer`, `never`, associated types, `This` and function types
  (`corelib/mods/serialization_mod/Src/SerializationMod/Eligibility.bd:46-80`).
  The contract it generates is `Serializable<E>` with `WriteTyped(E, limits)`
  (`corelib/packages/serialization/src/Core/Serialization/Contracts.bd:66-69`).
  Mods expose `Shape` facts with field ownership to analyzers
  (`corelib/packages/compiler-sdk/src/Beskid/Compiler/Semantic.bd:21-57`)
  but no capture facts.
- Corelib `Fiber<T>` is a record over an `i64` handle calling `__fiber_*`
  builtins (`corelib/packages/concurrency/src/Concurrency/Fiber.bd:1-45`);
  `Channel<T>` likewise over `__channel_*`
  (`corelib/packages/concurrency/src/Concurrency/Channel.bd:13-36`).
  Builtins are resolved by path through a generated table
  (`closures_spawn/intrinsics.rs:6-37`,
  `crates/beskid_analysis/src/generated/builtins.inc.rs:322, 702`). Handles
  are plain `i64` indices into the owning scheduler's tables: they are
  isolate-local by construction and must never be Transferable.
- The fluent `Query` operators exist but are pre-closure skeletons
  (`corelib/packages/foundation/src/Query/Operators.bd:1-35`). Nothing named
  `Isolate`, `Port`, `Parallel` or `Scope` exists in runtime or corelib.

### 2.9 Specification constraints

- Phase A: one GC mutator per scheduler thread, Phase B (parallel mutators
  on one heap) opt-in and not default
  (`openspec/specs/execution--runtime--fiber-scheduler-and-stacks/spec.md:51-72`,
  `execution--runtime--memory-and-gc-runtime-contract/spec.md:10-30`,
  `core-library--concurrency--concurrency-package/spec.md:123-129`).
  Isolates preserve Phase A per heap; the specs must say "many heaps, each
  with one mutator".
- `Core.Threading` is the only preemptive OS-thread surface and thread
  start must establish a runtime heap session
  (`core-library--concurrency--core-threading/spec.md:10-80`); an isolate
  is exactly such a session.
- Cross-fiber sharing: "Values MUST NOT be shared across fibers by alias
  unless immutability is proven or synchronization uses `Channel<T>`"
  (`language-meta--memory-model--memory-and-references/spec.md:26-33`), and
  closures must not capture `mut` bindings
  (`language-meta--evaluation--lambdas-and-closures/spec.md:18-24`).
  `StackReferenceEscapesSpawn` is normative
  (`language-meta--evaluation--fibers-and-spawn/spec.md:43-55`).
- Diagnostic codes are owned in analysis sources
  (`compiler--semantic-pipeline--diagnostic-code-registry/spec.md:38`); the
  catalogue today uses `E`, `W`, `T` prefixes only
  (`diagnostic_kinds/code.rs`, e.g. E1225, E1233, E1301-E1308). A `P`
  prefix would be new.

## 3. Capability analysis

Each subsection: exists / gap / options with sources / recommendation /
owner, files, effort (S under 2 days, M under 2 weeks, L more), risk,
dependencies.

### 3.1 Auto-derived `Transferable` bound (Shared | Moved | Copied)

Exists. Nominal declared conformance and where-bound proofs (2.3); the
serialization Mod's eligibility recursion shows the exact traversal shape
(`Eligibility.bd:46-80`); `aggregate_layout` facts give field types.

Gap. No structural or compiler-derived conformance. `i64 : Transferable`
cannot be stated today because bounds require a nominal declaration
(`contracts.rs:1678-1700`). Nothing computes a transfer class.

Options.

1. Rust auto traits: `Send`/`Sync` are derived structurally from fields
   with explicit opt-outs; RustBelt proves the resulting discipline sound
   with respect to data races only together with ownership typing (Jung,
   Jourdan, Krebbers, Dreyer, POPL 2018). Lesson: structural derivation is
   safe when the thing derived is a property closed under composition
   (deep immutability, plain data) and when the leaves fail closed.
2. Gordon et al. (OOPSLA 2012): `immutable` is deep and inferred through
   field qualifiers; `isolated` is an externally unique cluster; both are
   checked by a type system, not derived per declaration. Pony/ORCA restate
   the same lattice (Clebsch et al., OOPSLA 2017).
3. Swift `Sendable` (SE-0302, secondary): a marker protocol with implicit
   conformance for structs/enums of Sendable members, explicit for
   classes; `@unchecked` escape hatch. Same shape as option 1 with
   nominal opt-in for reference types.

Recommendation. One compiler query, `transfer_class(identity) ->
Shared | Moved | Copied | NotTransferable(reason)`, with these rules:
primitives, `unit`, `char`, `string` are Shared; `pointer` and function
types are not transferable; `T[]` is Moved when `T` is transferable
(arrays are mutable, so sharing one by pointer would be a data race, and
copying one hides lost writes); a nominal type is Shared when it carries
`[Immutable]` and every field is Shared, Moved when it carries `[Isolated]`
and every field is Shared or Moved, Copied when it carries `[Copyable]`
(or `[Serialize]`, owner's choice; see 3.5) and every field is Shared or
Copied; anything else is not transferable with the first offending field
named. Generic parameters take their class from a `where T: Transferable`
(or `Shared`/`Moved`/`Copied`) bound. The four names are corelib marker
contracts with no methods, recognised by the compiler through an
attribute on the contract (`[CompilerDerived]`), the same way `Export` and
`Extern` are recognised by name today (`glue.rs:339`, `externs.rs:49`), and
`prove_applied_conformance` consults `transfer_class` when the contract is
one of them. This keeps the corelib the owner of the names and the
compiler the owner of the derivation.

Owner and files. Compiler. New
`crates/beskid_queries/src/semantic_contract/transfer.rs` (query plus
Salsa tracked wrapper), hook in `contracts.rs:1678-1700`
(`prove_applied_conformance`) and `contracts.rs:1603-1640`
(`implementation_bounds_hold`), new `SemanticIssueKind` variants in
`crates/beskid_analysis/src/analysis/diagnostic_kinds*`; corelib
`packages/concurrency` (or a new `parallel` package) declares the four
contracts and the three attributes. Effort M. Risk: low; the recursion is
the same as the serialization Mod's. Depends on 3.4 for the `[Immutable]`
leaf to be sound.

### 3.2 `move` and use-after-move

Exists. The Fiber-only affine analysis (`fiber_ownership.rs:171-303`).

Gap. No keyword; the analysis seeds owners only from `Fiber` identities
(`fiber_ownership.rs:129-169`) and consumes on any use except `Cancel`.
Moved types need: an explicit `move x` expression (consume at that point),
consumption when a Moved value is passed to a parameter bounded by `Moved`
or returned from a task body, and P0301 on any later use.

Options.

1. Wadler's linear types (1990) and uniqueness typing: every use consumes;
   too strict for a GC language where most values are shared.
2. Clarke and Wrigstad's external uniqueness (ECOOP 2003): the unique
   reference is the only one from outside the aggregate; inside aliases
   are free. This is precisely the `[Isolated]` type: fields may alias
   each other, but the record has one external owner. Haller and Odersky
   (ECOOP 2010) add consumption on message send and borrowing with a
   capability that cannot escape.
3. Milano, Turcotti, Myers (PLDI 2022): infer regions; a region may be
   moved when no reference into it exists from outside; the type system
   tracks when a region becomes isolated again. Lowest annotation burden,
   highest implementation cost (region inference over all locals).

Recommendation. Option 2 with an explicit `move`, which is what the SOTA
design already chose. Syntactically: `MoveExpression = KwMove ~ Path` as a
`PrimaryExpression` alternative, allowed only where the path names a local
or parameter whose class is Moved (anything else is an error naming the
class). Semantically: generalise `spawn_handle_diagnostics` into an
`affine_ownership` fact whose owner seeds are (a) `Fiber` bindings as today
and (b) bindings of Moved class; consuming uses are `move x`, passing `x` to
a `Moved`-bounded parameter, returning `x` from a lambda whose result is
`Moved`-bounded, and (for Fiber) `Join`/`Detach`. The existing branch and
loop handling is reused verbatim. P0301 replaces the existing
`UseAfterMove` rendering for Fibers too, so one rule owns affinity.

Owner and files. Compiler. `beskid.pest` (keyword at `:68`, expression at
`:445`/`PrimaryExpression`), AST and syntax-index kinds
(`crates/beskid_analysis/src/syntax*`, the `ast_derive`/`reflect_gen`
crates regenerate node kinds), `fiber_ownership.rs` generalised,
`legality/gate/control.rs:40-60` rendering, formatter emit, LSP syntax
highlighting. Effort M. Risk: medium; the syntactic flow analysis is
conservative in loops and may reject legitimate code (acceptable, it
already does for Fibers). Depends on 3.1 for class lookup.

### 3.3 Capture classification feeding the bound ("spore" parameters)

Exists. Capture lists per lambda (`closures.rs:191-229`), the
`StackReference` judgement for `mut` locals (`closures.rs:258-278`), E1233
and E1225 rendering.

Gap. The compiler has no way to know that the lambda passed to
`Scope.Spawn` or `ParallelSeq.Map` must have transferable captures. Today
the only capture-bounded site is the `spawn` keyword. A corelib function
cannot express "my function-typed parameter's captures must satisfy X".

Options.

1. Spores (Miller, Haller, Odersky, ECOOP 2014): a spore is a closure whose
   captured variables are listed in its type and may be constrained by a
   type-class-like bound (`Spore[A, B] { type Captured <: Serializable }`).
   Only spore literals are accepted where a spore is required, because
   only a literal exposes its captures. Cloud Haskell static pointers
   (Epstein, Black, Peyton Jones, Haskell 2011) are the degenerate case:
   a closure with no environment, serialisable as a code address.
2. Effect/region bounds on function types (Lucassen and Gifford, POPL
   1988): the function type carries the effect set; a bound restricts it.
   Heavier: needs function types with capture annotations everywhere.
3. Check at the call site only: the compiler recognises specific corelib
   functions by name (as it does `Fiber` and `Export`). Fast but
   non-general and against the brief.

Recommendation. Option 1, expressed as a parameter attribute:
`pub Task<T> Spawn<T>(this, [Captures(Transferable)] () => T body) where
T: Transferable`. Rule at every call whose callee parameter carries
`[Captures(C)]`: if the argument is a lambda literal, every capture's
declared type (`abi_type` plus source identity of the declaration) must
have a class accepted by `C`; a `mut` capture is P0302 (with the
"use a reduction" help); a class failure is P0303 naming the type and the
three ways to satisfy it; a Moved capture without `move` is a new
P0305 ("capture requires `move`"); a Moved capture with `move` consumes
(3.2). If the argument is a function item value (`FunctionItemValue`,
no environment) it passes. Any other function value (a local holding a
closure record, a field, a call result) is rejected with P0306 ("captures
of a closure value cannot be checked; pass the lambda literal"), which is
the Spores restriction and keeps the rule syntactic. Copies happen once
per isolate, in the runtime, when the environment is transferred (3.5).

Owner and files. Compiler. `beskid.pest:335` (`Parameter` gains
`AttributeList?`), syntax model, a new legality fact
`legality/captures.rs` (extend E1233 collector) reading
`closure_environment` and `transfer_class`, call-site hook where argument
facts are issued (`calls/` where `contract_witnesses_for_call` runs,
`contracts.rs:1709`). Effort M. Risk: low; it composes existing facts.
Depends on 3.1 and 3.2.

### 3.4 Deep immutability (`[Immutable]`)

Exists. Binding-level `mut` and E1214 for locals (2.5). No field or type
immutability. Strings are immutable records in practice (bytes copied on
creation, `Strings.bd:1-16`) and should be declared Shared by the
compiler, not derived.

Gap. A type marked `[Immutable]` must be transitively immutable: every
field's type Shared, and no assignment anywhere whose target is a field of
that type (including through `this`). Arrays cannot appear in such a type
until a frozen array exists.

Options.

1. Reference immutability (Potanin, Östlund, Zibin, Ernst, "Immutability",
   LNCS 7850, 2013, survey): `readonly` references, viewpoint adaptation,
   fine-grained but annotation-heavy; Gordon et al. (OOPSLA 2012) is the
   concurrency-oriented instance.
2. Class-level transitive immutability: Glacier (Coblenz et al., ICSE
   2017) marks a class `@Immutable`, requires all fields to be of
   immutable types and final, forbids assignment after construction, and
   reports in a user study that the annotation is understood and used
   correctly more often than reference immutability.
3. Freezing (Gordon's `isolated` to `immutable` conversion): build
   mutable, then freeze; needs the isolated cluster of 3.2 first.

Recommendation. Option 2 for 0.6.5 (it matches the SOTA doc's open
question 1: explicit marker now, inference later), option 3 as the natural
follow-up once `[Isolated]` exists (freeze a moved cluster into a Shared
value). Rules: at the declaration, each field type must be Shared (P0304a);
in every unit, an `AssignExpression` whose target path has a member access
and whose receiver identity (`generic_source_expression_identity`) is an
`[Immutable]` nominal is P0304b, except inside the type's own struct
literal (construction is by literal, so there is no constructor body to
exempt). Events (`+=`, `-=`) on an immutable type's fields are rejected by
the same rule. Methods need no receiver annotation because the assignment
rule is global.

Owner and files. Compiler. `transfer_class` leaf (3.1), a new
`legality/immutability.rs` collector run per unit beside
`legality/values.rs`, diagnostics. Corelib declares
`pub attribute Immutable(TypeDefinition) {}`. Effort M (the assignment
scan is one more pass over `AssignExpression` nodes). Risk: low. No
dependency beyond 3.1.

### 3.5 Closure environment transfer (copy, move, share across heaps)

Exists. Environments are heap objects with a static descriptor and pointer
map (`closures.rs (isle):33-66`, `closure_static.rs`); every object header
carries a descriptor (`Objects.bd:17-24, 35-57`); arrays carry an element
descriptor (`Objects.bd:69-80`); `BeskidAbiValue` records owner heap and
descriptor (`AbiValue.bd:1-8`); channels already move values between
fibers through these slots (`Channel.bd:159-185`).

Gap. No operation copies or hands over an object graph from one heap to
another. The closure record `{header, code pointer, environment pointer}`
is per heap; the code pointer is process-wide (one AOT image), the
environment is not.

Options.

1. Serialize with the Mod (`WriteTyped`) and deserialize in the target.
   Needs an encoder, limits and generated code per type; function values
   and environments are explicitly ineligible (`Eligibility.bd:76`).
2. Descriptor-driven structural deep copy in the runtime (Erlang's
   `copy_struct`; Johansson, Sagonas, Wilhelmsson ISMM 2002 measure the
   cost and show small messages dominate; Carlsson et al. TOPLAS 2006
   show escape analysis can elide copies later). The copier walks the
   pointer map of each object, allocates in the target heap, keeps a
   visited table for sharing and cycles, copies scalars bit-wise, copies
   string payloads, and refuses any descriptor it does not understand.
   Non-pointer-map words (native `pointer`, `i64` handles) are copied as
   bits, which is exactly why the static rule (3.1) must exclude them.
3. Zero-copy hand-over (Moved) and pointer sharing (Shared): ORCA
   (Clebsch et al., OOPSLA 2017) keeps per-actor heaps and shares `val`
   and `iso` objects by reference with message-carried reference counts;
   the non-moving collector is a precondition, which Beskid satisfies
   (`Marking.bd:110-119` already ignores foreign pointers).

Recommendation. Option 2 now, written in Beskid in the runtime corpus
(`Runtime/Mem/Transit.bd`), used for Copied, for Moved (the sender's
binding is dead by 3.2, so copy-then-discard is observationally a move),
and for Shared (the SOTA doc's open question 2 already allows Shared as
copy with identical semantics). The transit record is a native
(`SystemAllocate`) buffer holding the root descriptor and a copied object
graph in a target-neutral form, or simply a direct heap-to-heap copy
performed by the receiving thread while the sender is parked at the port
(the receiver reads the sender's heap; the sender is at a safepoint and
not allocating, which keeps Phase A per heap intact). Option 3 is the 0.7
upgrade for large buffers; it needs sender-side external roots
(`RootsHandles.bd:252-260`) and a receiver-side "foreign root" list so
that `GcMarkGray`'s early return (`Marking.bd:116-119`) becomes "keep
alive in the owner". The compiler contributes nothing to any of these
except the static class (3.1); the environment pointer map and descriptor
symbols it already emits are sufficient.

Owner and files. Runtime (Beskid) `Runtime/Mem/Transit.bd` (new),
`Runtime/Mem/AbiValue.bd` (a transit state in which `owner_heap` is the
destination heap), `runtime_manifest.bsol` exports for
`beskid_rt_v5_transit_copy_in`; corelib `Port<T>` calls it through
builtins like `__channel_send`. Effort M. Risk: medium (cycle handling,
UTF-8 view records, arrays of nominal elements). Depends on 3.7.

### 3.6 Attribute bounds on function values (`[Associative]`, `[Commutative]`)

Exists. Function items as values (`function_values.rs:10-13`,
`FunctionItemValue` with the declaration key), attributes on functions
(`beskid.pest:318`), where-bounds on nominal types (2.3).

Gap. No way to require that a function-typed argument's provenance carries
an attribute. Lambdas cannot carry attributes at all (`beskid.pest:424`).

Options.

1. Marker contracts on combiner types, zero compiler change:
   `pub contract AssociativeCombiner<T> { T Combine(T a, T b); }`,
   `pub contract CommutativeCombiner<T> : AssociativeCombiner<T> {}`;
   `Reduce<T, C>(T seed, C combiner) where C: AssociativeCombiner<T>`.
   Corelib ships `Sum`, `Max`, `Min`, `Concat`, `Union` as such types.
   The user writes a type instead of a function. This is Cilk's reducer
   object (Frigo et al., SPAA 2009) and Scala's `Combiner` (Prokopec et
   al., Euro-Par 2011) in Beskid clothing.
2. Parameter attribute `[Requires(Associative)]` on the function-typed
   parameter (same grammar change as 3.3); the check accepts a
   `FunctionItemValue` whose declaration carries `[Associative]` and
   rejects lambdas and other closure values. This is a property
   declaration, not a proof, exactly as the SOTA doc says (section 9.2,
   rule 5); effect systems that would prove associativity do not exist in
   practice.

Recommendation. Option 1 for the MVP (no compiler work, and it generalises:
the combiner can hold state such as a worker-local buffer). Option 2 once
3.3's parameter attributes exist, as sugar so that `ReduceUnordered(seed,
Merge)` with a plain function works. Effort S (option 1, corelib only),
S (option 2, compiler, after 3.3). Risk: none for option 1.

### 3.7 Isolate-safe codegen and runtime audit

Exists. See 2.6 and 2.7: generated code is thread-agnostic given an
attached thread; static data is read-only; runtime state is TLS-resolved.

Gap, compiler side. Only verification: confirm no emission path declares
writable data (`module_emission/data.rs`, `aggregate_static.rs`,
`array_static.rs`, `closure_static.rs`), confirm trampolines read nothing
process-global (`module_emission/trampolines/spawn.rs`), and confirm the
`CurrentThreadState() == 0` paths in runtime exports fail closed when an
unattached thread calls generated code (they return null and the generated
`trapz` fires, `calls.rs (isle):60-66`).

Gap, runtime side (this is where the work is).

1. `ProcessInit` bundles process-wide and per-runtime work
   (`Lifecycle.bd:58-174`): worker pool init (`:143`, init-once in C at
   `external_wait.h:321`), environment limits (`:142`), composition launch
   (`:156-172`). Split into `IsolateCreate(config)` (heap, callbacks,
   thread attach, scheduler, limits inherited) and keep `ProcessInit` as
   the main-thread wrapper that also owns the pool and composition.
2. No thread creation intrinsic (`runtime_manifest.bsol:147-170`). Add
   `thread_create(entry, argument) -> handle`, `thread_join(handle)`,
   implemented per target in `platform_host.c` (precedent:
   `pthread_create` for the network reactor, `network_posix.h:270`).
3. Worker pool must become process-wide and reference counted, or isolates
   must share the main runtime's pool by owner id (host requests already
   route by `owner` scheduler id, `external_wait.h:200-212`).
4. Isolate entry must run inside a fiber on the isolate's scheduler so that
   panics become join outcomes (`Syscalls.bd:116-121` traps the process
   when no fiber is current). The isolate's panic message lives in the
   isolate heap (`Syscalls.bd:126`); the join protocol copies its bytes
   into the parent before the heap is discarded.
5. Cancellation: reuse the cancelled-slot word (`Fiber.bd:4-12`) at the
   isolate level and check it in the scheduler loop at the same safepoints
   fibers use.
6. Composition (`inject global::`) inside an isolate: either an isolate
   has no composition container and injected fields fail closed at
   runtime, or a static rule forbids `inject` reads in isolate bodies.
   Recommend the runtime fail-closed path for 0.6.5 and a static rule later.

Owner. Compiler S (audit only). Runtime M (items 1, 4, 5 in Beskid),
ABI/C M (items 2, 3 on three targets). Risk: medium, the C work is
target-triplicated. No dependencies; this is the first runtime phase.

### 3.8 Atomics

Exists. The C host uses `stdatomic.h` and `__atomic_compare_exchange_n`
(`platform_host.c:9`, `external_wait.h:184-191`). The Beskid runtime corpus
has `raw_word_load/store` intrinsics on native memory and `thread_yield`
(`runtime_manifest.bsol:150-151, 170`) but no atomic or fence intrinsic.
User `clif` blocks admit no atomic opcodes (`clif_surface.rs:31-75,
156-159`).

Gap. Any lock-free structure shared between isolate threads (port queues,
cancellation flags, the mutator token if it ever becomes cross-thread)
needs atomic operations with acquire/release ordering (Boehm and Adve,
PLDI 2008, for why plain loads and stores are not enough under compiler
and hardware reordering).

Options.

1. Manifest intrinsics for the canonical runtime corpus:
   `atomic_load_word(address, order)`, `atomic_store_word`,
   `atomic_cas_word`, `atomic_fetch_add_word`, `fence(order)`, implemented
   in C per target. Zero codegen change; usable only by the runtime
   corpus (same trust boundary as `raw_word_load`).
2. Extend the `clif` allowlist with `atomic_load`, `atomic_store`,
   `atomic_rmw`, `atomic_cas`, `fence` under the existing payload
   provenance discipline (`clif_block.rs:518-548`). Lets corelib authors
   write atomics on managed arrays, but a managed array lives in one heap
   and cannot be shared between isolates, so the only legitimate use would
   be intra-isolate (where fibers are cooperative and need no atomics).
3. Implement ports entirely in C on top of the owner mailbox
   (`external_wait.h:76-135`), no Beskid atomics at all.

Recommendation. Option 1 (keeps the port queue in Beskid, which is the
brief) with option 3's mailbox as the wake-up path: a port is a native
ring of transit records guarded by atomic CAS, and the receiving isolate
parks through the existing external wait (`External.bd`), woken by
`owner_post` from the sending thread. Option 2 is deferred; the hypothesis
"atomics in clif blocks" is amended to "atomic manifest intrinsics".

Owner. ABI/C S per target (five functions), runtime S (wrappers in
`Runtime/Bootstrap/Native.bd`). Risk: low. No dependencies.

## 4. The eight-feature hypothesis, tested

| Hypothesised compiler feature | Verdict | Evidence and amendment |
| --- | --- | --- |
| Auto-derived `Transferable` bound | Confirmed, compiler | No structural conformance exists (`contracts.rs:1678-1700`); needs `transfer_class` plus compiler-recognised marker contracts (3.1) |
| `move` plus use-after-move | Confirmed, compiler | Keyword absent (`beskid.pest:445`); Fiber-only affine analysis to generalise (`fiber_ownership.rs:171-303`) (3.2) |
| Capture classification feeding the bound | Confirmed and sharpened | Captures and `mut` detection exist (`closures.rs:191-278`); the missing general mechanism is a `[Captures(C)]` parameter bound, Spores-style (3.3) |
| Closure environment transfer | Amended: runtime, not compiler | Descriptors and pointer maps already emitted; the copy is a Beskid runtime routine over object headers (3.5) |
| Attribute bounds on function values | Amended: optional | Marker contracts on combiner types need no compiler change; `[Requires(A)]` is later sugar after parameter attributes exist (3.6) |
| Deep immutability | Confirmed, compiler | Only local `mut` exists (`type_checking.rs:105-121`); Glacier-style transitive `[Immutable]` with a global field-assignment rule (3.4) |
| Isolate-safe codegen audit | Downgraded to S | Codegen emits read-only statics and TLS-mediated calls (`data.rs:206`, `platform_tls.c`); the real audit is `ProcessInit` and host statics (3.7) |
| Atomics | Amended: manifest intrinsics | Neither clif nor runtime has atomics; add C-backed intrinsics for the runtime corpus, defer clif opcodes (3.8) |

Missing from the hypothesis and added: parameter attributes (grammar,
`beskid.pest:335`), thread creation and join intrinsics, a process-wide
worker pool, `IsolateCreate` split from `ProcessInit`, cross-isolate panic
and cancellation protocol, composition inside isolates, a diagnostic code
block, OpenSpec changes, LSP and formatter updates for the new keyword and
parameter attributes, and a `[CompilerDerived]`-style way for corelib to
name the contracts the compiler derives.

## 5. Things the design should state explicitly

1. Isolate-local handle types (`Fiber<T>`, `Channel<T>`, `Mutex`,
   `WaitGroup`, `Hub`, network handles) are never Transferable. The opt-in
   markers guarantee this by default; document it so nobody adds
   `[Copyable]` to `Channel<T>`.
2. `T[]` and `List<T>` are Moved-class, so capturing them needs `move`.
   The fluent layer never exposes this to users because `ParallelSeq`
   splits and moves chunks internally; only hand-written `Scope.Spawn`
   bodies see P0305. A frozen array type (`ReadOnlyArray<T>` with no
   writers, Shared when `T` is Shared) is a S corelib addition that removes
   most of the friction and should ship with the MVP.
3. `string` is Shared by compiler fiat; this depends on the runtime never
   exposing a mutator for an existing string record
   (`beskid_rt_v5_utf8_record_set_data` exists in the manifest and must
   stay construction-only). Record that invariant in the memory spec.
4. Shared, Moved and Copied all copy in 0.6.5. The cost table in the SOTA
   doc (section 9.5) should be published with "0.6.5: O(size) for all
   three; pointer sharing and hand-over are 0.7". The static rules do not
   change when the runtime upgrades.
5. Diagnostic codes: the catalogue has no `P` prefix. Either reserve a new
   `P03xx` block in the diagnostic registry spec or use `E1234-E1240`
   continuing the closures/spawn block. The registry spec requires codes
   to be owned in analysis sources either way.
6. Determinism statement and serial elision: `Parallel.SerialElision` is a
   corelib switch (run bodies inline on the calling isolate). Because
   capture rules are the same in both modes, the compiler needs nothing.
7. Mods: the capture rule cannot be a Mod analyzer (no capture facts in
   `Semantic.bd`). The `[Immutable]` declaration-level field check could
   be, but one authority is better; keep both rules in the query layer.

## 6. Phased implementation plan

Phase 0, spec and codes (docs, S). OpenSpec change
`v065-isolate-parallelism`: new provisional capability
`core-library--concurrency--isolates-and-parallel` with SHALL requirements
for the three classes, the capture rule, failure semantics and the cost
table; amendments to `fiber-scheduler-and-stacks` (Phase A per heap, many
heaps), `memory-and-references` (cross-isolate sharing), `fibers-and-spawn`
(spawn stays intra-isolate), `channels-and-synchronization` (ports),
`diagnostic-code-registry` (code block). Regenerate `openspec/catalog.json`.

Phase 1, compiler (M total, in this order because each feeds the next):

1. `transfer_class` query and compiler-derived marker contracts (3.1).
2. `[Immutable]` transitive rule (3.4).
3. Parameter attributes in the grammar (`beskid.pest:335`), syntax model,
   formatter (3.3 prerequisite).
4. `[Captures(C)]` call-site rule, P0302/P0303/P0306 (3.3).
5. `move` keyword and generalised affine analysis, P0301/P0305 (3.2).
6. Codegen audit (3.7, compiler half) and tests in `beskid_tests_surface`.

Phase 2, runtime and host (M total):

1. Atomic and thread intrinsics in the manifest and three `platform_host.c`
   files (3.8, 3.7 item 2).
2. Process-wide worker pool (3.7 item 3).
3. `IsolateCreate`/`IsolateDestroy` split from `ProcessInit` (3.7 item 1),
   isolate main fiber, panic message hand-back, cancellation slot
   (3.7 items 4, 5), composition fail-closed (item 6).
4. `Transit.bd` descriptor-driven copy (3.5).
5. Ports: native ring plus owner mailbox wake-up, fiber-cooperative receive
   through `External.bd` (3.8 recommendation).
6. Exports and builtins (`__isolate_spawn`, `__isolate_join`,
   `__port_create/send/receive/close`) registered in the builtin table.

Phase 3, corelib (M total):

1. `Core.Parallel` package: `Isolate`, `Port<T>`, `Scope`, `Task<T>`,
   `ParallelError`, `TaskError`, marker contracts, attributes,
   `ReadOnlyArray<T>`.
2. `Parallel.Scope` fork-join over an isolate pool, failure aggregation in
   spawn order, `SerialElision`.
3. `ParallelSeq<T>`: splitter over `List<T>`/`T[]`, per-chunk fused loop
   (`Where`/`Map`/`Sum` as one pass per chunk), combiner contracts,
   `Reduce`/`ReduceUnordered`, `Chunk`/`MinChunk`, adaptive splitting.
4. `Pipeline` with stages over ports.
5. Savina-style ping-pong and fork-join benchmarks under
   `corelib/beskid_corelib/tests`.

Minimal viable slice (end-to-end, smallest coherent set): Phase 0; Phase 1
steps 1-4 (no `move`); Phase 2 steps 1-4 and the two builtins
`__isolate_spawn`/`__isolate_join` (no ports); Phase 3 steps 1-2 with
`Spawn` restricted to Shared and Copied captures. That gives
`Parallel.Scope((s) => { Task<i64> t = s.Spawn(() => Work(config)); return
t.Join()?; })` with P0302/P0303 diagnostics, deterministic failure
reporting, one copy per worker of each capture, and no change to fibers.
`move`, ports, pipelines, pointer sharing and fusion are additive on top.

## 7. Sources

Primary (peer reviewed). DOIs marked (R) were resolved in the companion
SOTA document on 2026-10-13; DOIs marked (M) are from memory and were not
re-resolved during this read-only pass.

- Philip Wadler. Linear types can change the world! IFIP TC 2 Working
  Conference on Programming Concepts and Methods, 1990. No DOI.
- Dave Clarke, Tobias Wrigstad. External Uniqueness Is Unique Enough.
  ECOOP 2003, LNCS 2743. https://doi.org/10.1007/978-3-540-45070-2_9 (M)
- Philipp Haller, Martin Odersky. Capabilities for Uniqueness and
  Borrowing. ECOOP 2010. https://doi.org/10.1007/978-3-642-14107-2_17 (R)
- Colin S. Gordon, Matthew J. Parkinson, Jared Parsons, Aleks Bromfield,
  Joe Duffy. Uniqueness and Reference Immutability for Safe Parallelism.
  OOPSLA 2012. https://doi.org/10.1145/2384616.2384619 (R)
- Mae Milano, Joshua Turcotti, Andrew C. Myers. A Flexible Type System for
  Fearless Concurrency. PLDI 2022. https://doi.org/10.1145/3519939.3523443 (R)
- Ralf Jung, Jacques-Henri Jourdan, Robbert Krebbers, Derek Dreyer.
  RustBelt: Securing the Foundations of the Rust Programming Language.
  POPL 2018 (PACMPL 2, art. 66). https://doi.org/10.1145/3158154 (M)
- Alex Potanin, Johan Östlund, Yoav Zibin, Michael D. Ernst. Immutability.
  In Aliasing in Object-Oriented Programming, LNCS 7850, 2013.
  https://doi.org/10.1007/978-3-642-36946-9_9 (M)
- Michael Coblenz, Whitney Nelson, Jonathan Aldrich, Brad Myers, Joshua
  Sunshine. Glacier: Transitive Class Immutability for Java. ICSE 2017.
  https://doi.org/10.1109/ICSE.2017.52 (M)
- Jeff Epstein, Andrew P. Black, Simon Peyton Jones. Towards Haskell in the
  Cloud. Haskell Symposium 2011. https://doi.org/10.1145/2034675.2034690 (M)
- Heather Miller, Philipp Haller, Martin Odersky. Spores: A Type-Based
  Foundation for Closures in the Age of Concurrency and Distribution.
  ECOOP 2014, LNCS 8586. https://doi.org/10.1007/978-3-662-44202-9_13 (M)
- John M. Lucassen, David K. Gifford. Polymorphic Effect Systems. POPL
  1988. https://doi.org/10.1145/73560.73564 (M)
- Hans-J. Boehm, Sarita V. Adve. Foundations of the C++ Concurrency Memory
  Model. PLDI 2008. https://doi.org/10.1145/1375581.1375591 (M)
- Sylvan Clebsch, Juliana Franco, Sophia Drossopoulou, Albert Mingkun Yang,
  Tobias Wrigstad, Jan Vitek. Orca: GC and Type System Co-Design for Actor
  Languages. OOPSLA 2017. https://doi.org/10.1145/3133896 (R)
- Erik Johansson, Konstantinos Sagonas, Jesper Wilhelmsson. Heap
  Architectures for Concurrent Languages using Message Passing. ISMM 2002.
  https://doi.org/10.1145/773039.512440 (R)
- Richard Carlsson, Konstantinos Sagonas, Jesper Wilhelmsson. Message
  Analysis for Concurrent Programs Using Message Passing. TOPLAS 28(4),
  2006. https://doi.org/10.1145/1146813 (R)
- Sriram Srinivasan, Alan Mycroft. Kilim: Isolation-Typed Actors for Java.
  ECOOP 2008. https://doi.org/10.1007/978-3-540-70592-5_6 (R)
- Matteo Frigo, Pablo Halpern, Charles E. Leiserson, Stephen Lewin-Berlin.
  Reducers and Other Cilk++ Hyperobjects. SPAA 2009.
  https://doi.org/10.1145/1583991.1584017 (R)
- Aleksandar Prokopec, Phil Bagwell, Tiark Rompf, Martin Odersky. A Generic
  Parallel Collection Framework. Euro-Par 2011.
  https://doi.org/10.1007/978-3-642-23397-5_14 (R)
- Duncan Coutts, Roman Leshchinskiy, Don Stewart. Stream Fusion. ICFP
  2007. https://doi.org/10.1145/1291151.1291199 (R)
- Jonathan K. Lee, Jens Palsberg. Featherweight X10. PPoPP 2010.
  https://doi.org/10.1145/1693453.1693459 (R)

Secondary illustration only: Rust Reference, "Special types and traits:
auto traits" (`Send`/`Sync` derivation and negative impls); Swift Evolution
SE-0302 "Sendable and @Sendable closures" and SE-0414 "Region based
Isolation"; Dart isolate documentation (message copying rules).

Repository inputs: `docs/research/2026-10-13-isolate-parallelism-sota.md`;
the compiler files cited inline under `compiler/`; OpenSpec capabilities
cited inline under `openspec/specs/`.
