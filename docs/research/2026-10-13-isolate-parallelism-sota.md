# Isolate-based CPU parallelism for Beskid 0.6.5: state of the art and design recommendations

Research date: 2026-10-13. Scope: peer-reviewed results relevant to the owner's
decision that Beskid 0.6.5 gets CPU parallelism through isolates (one runtime,
heap and GC per worker; values cross only by copy or by move), not through a
shared-heap concurrent GC. The focus is user convenience and logical
understandability: how much a programmer has to write, and how much they have
to hold in their head to know a program is correct.

Baseline facts about Beskid that the recommendations build on: AOT compilation;
tracing mark-sweep non-moving GC per runtime; cooperative fibers
(`Fiber<T> f = spawn (() => ...)`, `f.Join()` returning
`Result<T, FiberError>`, `Cancel`, `Detach`); channels, mutex, waitgroup;
`Result`/`match`; lambdas `(x) => ...`; generics; typed serialization through a
`[Serializable]` Mod; a query layer that type-checks and can carry new rules.
There are no users yet, so the cleanest design wins and no compatibility path is
owed.

Sources are peer-reviewed papers (POPL, PLDI, OOPSLA, ICFP, ECOOP, PPoPP, SPAA,
EuroSys, ISMM, TOPLAS, JACM and SIGPLAN workshops). DOIs were checked against
Crossref on the research date. Language documentation is used only as
secondary illustration and is marked as such. Every design claim below points
back to a numbered source in section 9.

## 1. Executive summary

1. The isolate decision is well supported by the literature. Private heaps per
   worker are the architecture with the best locality and the simplest GC
   (independent, non-blocking collection), at the price of copying messages
   [S20, S21]. The CMU disentanglement line shows that a heap-per-task
   discipline can be made provably space-efficient and fast when tasks do not
   read each other's fresh allocations [S9, S10, S11, S12].
2. The user-facing model that gives the best convenience-to-reasoning ratio is
   structured fork-join: a scope that owns its children, waits for all of them
   on exit, and turns a child failure into a value at the join [S1, S2, S5, S6].
   Determinism falls out of fork-join plus isolation when the only
   communication is the join result [S13, S14, S16].
3. What may cross an isolate boundary should be a static property of the type
   (a capability), not a runtime check. Three capability classes cover all
   published systems and all practical needs: `Shared` (deeply immutable,
   shareable by reference across heaps), `Moved` (isolated, unique, transferred
   by pointer and made inaccessible at the sender), and `Copied` (anything
   `[Serializable]`, transferred by value) [S17, S18, S19, S22, S23, S24, S25].
4. The fluent data-parallel surface (`values.Parallel().Map(...).Where(...).Sum()`)
   is the layer most users will touch. The published implementations split
   collections with adaptive granularity and reduce with associative combiners;
   the correctness story is identical to sequential collections only when
   combiners are associative and lambdas capture only `Shared` or `Copied`
   values [S27, S28, S30, S32, S33].
5. Failure semantics should follow the async-finish model: an exception (here,
   an `Error`) in a child is caught at the enclosing scope, siblings are
   cancelled, and the scope returns a `Result` listing the failures [S4, S5].
   Cancellation is cooperative and flows down the tree, like fiber `Cancel`.
6. Copying is avoided in three ways and in no other: deep-immutable sharing
   [S19, S23], move of uniquely owned buffers [S17, S24, S25], and keeping data
   where it was produced (worker-local reductions, as in Cilk reducers [S3]).
   Compile-time analysis to elide copies for messages that provably stay
   private is possible [S21] but not needed for 0.6.5.

## 2. Structured parallelism: fork-join, async-finish, work stealing

Cilk-5 established the discipline that a parallel program is a sequential
program with `spawn` and `sync` annotations, and that removing the keywords
gives the serial elision with identical semantics [S1]. The scheduler is
randomized work stealing with the work-first principle: the common path (no
steal) costs almost nothing, and provable bounds on time (T1/P + O(T_inf)) and
space (S1 * P) follow from the strict fork-join structure [S2]. Fork-join
therefore gives the programmer a mental model (a tree of calls) and the
runtime a model (a tree of frames) at the same time.

X10 generalized this to async-finish: `async S` starts a child; `finish S`
waits for every async transitively created inside it, and an exception thrown
by any such async is caught at the `finish` and rethrown there (rooted
exceptions) [S4]. Featherweight X10 gives the core calculus and shows that
the model is deadlock-free by construction because the only blocking construct
is `finish`, which waits for children only [S5]. Habanero later added
isolation blocks for the cases where children must share a mutable object
and showed how to keep nested parallelism and isolation composable [S6].

Work-stealing cost is dominated by granularity: splitting into too many tasks
burns overhead; too few loses parallelism. Three published mechanisms remove
the knob from the user. Lazy binary splitting splits a parallel loop only when
the local deque is empty, so splitting adapts to demand [S7]. Heartbeat
scheduling promotes a task to a stealable one only every N cycles of work,
giving a provable overhead bound of about 1/N with no user tuning [S8].
Automatic parallelism management builds on heartbeat in MaPLe and reports that
programs can expose all logical parallelism and still run as fast as
hand-tuned ones [S12b]. The lesson for Beskid: expose a `MinChunk` knob for
the rare cases, default to an adaptive scheme, and never require it.

Relevance to isolates: fork-join and async-finish make no assumption that
children share the parent's heap. Lee and Palsberg's calculus has no shared
heap at all [S5]. Beskid can give fork-join semantics where each child runs in
a worker isolate, and only the join result crosses back.

## 3. Deterministic parallelism

Deterministic Parallel Java proves that a type-and-effect system over named
regions can guarantee that a fork-join program is deterministic: two parallel
branches with non-interfering effects produce the same result as the
sequential program [S13]. The follow-up adds explicit nondeterministic
constructs so that any construct that does not contain an `nd` block is
deterministic by construction [S14]. The user cost is region annotations on
every field and method, which is exactly the cost Beskid avoids by using
isolates: when branches cannot see each other's heap, their effects cannot
interfere, so no effect annotations are needed for the common case.

The Par monad shows the other route: parallel evaluation where the only
communication is through write-once variables (`IVar`) is deterministic and
the entire scheduler can be a library [S15]. LVars generalize this to
monotonic lattice-based variables where many writers may join values and a
reader blocks until a threshold is passed, and proves determinism; the POPL
version adds freezing and handlers for quasi-determinism [S16, S16b].
Concurrent Revisions give a third shape very close to isolates: each task
forks a revision of the shared state, works on its own copy, and the join
merges per-type with a declared merge function, so programs are deterministic
regardless of scheduling [S17b].

For Beskid the important conclusion is that an isolate fork-join whose only
inputs are `Shared`/`Copied`/`Moved` values and whose only output is the join
result is deterministic in the DPJ sense with zero annotations. Channels and
`Parallel.Unordered` are the explicit `nd` constructs of [S14]. Reductions
remain deterministic only if the combiner is associative and commutative;
Cilk reducers show how to keep the serial order and need associativity only
[S3]. Beskid should expose both: `Reduce` (associative only, serial-order
result) and `ReduceUnordered` (associative and commutative, cheaper).

## 4. Ownership and capabilities for safe sharing and transfer

This is the largest body of relevant work and it converges on a small set of
reference capabilities.

Kilim (ECOOP 2008) introduced isolation types for actor messages in Java: a
message must be a tree, and sending it transfers ownership so the sender can
no longer access it; a lightweight static analysis checks this [S17]. Haller
and Odersky's capabilities for uniqueness and borrowing give Scala actors
unique references that can be transferred by message with no copy, plus
borrowed references that cannot escape [S18]. LaCasa (OOPSLA 2016) builds on
object capabilities and affinity so that a boxed object is accessible only
through a single capability and can be consumed by sending it to another
actor, with a soundness proof [S19]. Gordon et al. (OOPSLA 2012) is the most
directly reusable system: four qualifiers, `writable`, `readable`,
`immutable` and `isolated`, with the rules that an `isolated` reference is an
externally unique cluster that can be transferred or frozen to `immutable`,
and deeply `immutable` data may be shared by reference between parallel tasks
[S22]. Pony's deny capabilities restate the same lattice in terms of what
other aliases are denied (`iso`, `trn`, `ref`, `val`, `box`, `tag`) and prove
data-race freedom for actors with zero-copy messaging of `iso` and `val`
values [S23]. ORCA then shows that with those capabilities a per-actor
garbage collector can share immutable and transferred objects across actor
heaps without stopping the world, using message-carried reference counts
[S23b]. Castegren and Wrigstad's reference capabilities for Encore add
composition of capabilities and locking disciplines [S24], and Encore's
active objects deliver the model with futures [S24b].

Milano, Turcotti and Myers (PLDI 2022) address the user-effort problem: instead
of annotating every reference, they infer regions and let a region be moved
whole as long as it is "isolated" (no references into it from outside); a
flexible type system tracks when a region becomes isolated again after
mutation [S25]. This is the design that Swift's region-based isolation adopted
for `sending` parameters (secondary illustration: Swift Evolution SE-0414).
Behaviour-Oriented Concurrency (OOPSLA 2023) replaces actors with behaviours
that declare the set of `cown`s (concurrent owners) they need; the runtime
schedules behaviours so that a behaviour runs when it holds all its cowns, giving
deadlock freedom and ordering guarantees without locks [S26].

Dala shows the same three-way split (`iso`, `imm`, `local`) is enough even for
a dynamic language, and that the check can be done at runtime at message time
[S26b]. Singularity's channel contracts show a systems-level version: messages
live in an exchange heap, are owned by exactly one process at a time, and
sending moves them with no copy; the static checker ensures the sender does not
use them afterwards [S27b].

Synthesis. Every one of these systems ends with the same three classes of
cross-boundary value:

| Class | Papers | Transfer cost | Static rule |
| --- | --- | --- | --- |
| Deeply immutable | Gordon `immutable` [S22], Pony `val` [S23], Dala `imm` [S26b] | pointer share | type is transitively immutable |
| Isolated / unique | Kilim [S17], Haller `@unique` [S18], LaCasa [S19], Gordon `isolated` [S22], Pony `iso` [S23], Milano regions [S25], Singularity [S27b] | pointer move; sender loses access | value has exactly one owner; no external references into it |
| Plain data by value | Erlang terms [S20, S21], every actor language | copy proportional to size | type is serializable |

Beskid already has `[Serializable]` for the third class. The design in
section 8 adds the first two.

## 5. Heap-per-task and disentanglement

The CMU hierarchical-heap line is the closest published analysis of what
Beskid is about to do. Hierarchical memory management (ICFP 2016) gives each
fork-join task its own heap, nests heaps in the task tree, and shows that a
task's heap can be collected independently if the program is strictly pure
[S9]. The PPoPP 2018 paper extends this to mutable state by promoting objects
that become reachable from an ancestor heap [S9b]. Disentanglement (POPL 2020)
names the key property: a task never reads an object allocated by another
concurrent task, which holds for all determinacy-race-free programs and for
many racy ones; under disentanglement, a task's fresh allocations stay private
and collection can be local [S10]. The POPL 2021 result proves that
disentangled programs can be collected with provable space bounds and the
MaPLe implementation shows speedups competitive with C++ while using little
more memory than sequential [S11]. Entanglement detection (ICFP 2022) checks
the property at runtime at near-zero cost, so a violation becomes an error
rather than silent corruption [S12]. PLDI 2023 then shows how to allow
entanglement when a program really wants shared mutable state, at a measured
cost [S12c]. POPL 2024 extends disentanglement to futures and to interaction
[S12d], and DisLog gives a separation logic for proving disentanglement
[S12e]; TypeDis (POPL 2026, cited by [S12e] follow-up) proposes a type system
for it.

What this means for Beskid isolates: an isolate is a heap that is
disentangled by construction, because nothing allocated inside it is reachable
from outside until it is moved or copied out at the join. The CMU results say
that this is the regime in which the simplest GC is also the fastest. The cost
Beskid pays, which MaPLe does not, is that the join result must be copied or
moved rather than left in place; MaPLe's hierarchical heaps let the parent
adopt the child heap on join. Beskid can recover most of this with move
semantics: when a child returns a `Moved` value, the runtime transfers the
child's heap pages (or the single allocation) into the parent runtime rather
than copying. The non-moving GC is an asset here: pointers do not need
rewriting when a block changes owner, which is the same property ORCA relies
on [S23b].

## 6. Actor and isolate models; message-passing cost

The Erlang implementation papers quantify the heap-architecture trade-off that
Beskid has just chosen. Johansson, Sagonas and Wilhelmsson compared private
heaps, a shared heap, and a hybrid heap (private heaps plus a shared message
area) in the same runtime [S20]. Private heaps give cheap, independent GC and
good locality but pay for copying every message and for touching the data
twice; a shared heap makes send O(1) but the collector must be stopped for all
processes. The hybrid, where the compiler decides which allocations may become
messages and places them in a shared area, is the subject of the TOPLAS
message-analysis paper [S21] and the Science of Computer Programming paper on
the resulting memory manager [S21b]. The results are directly reusable:
most messages in real Erlang programs are small, so copying is cheap, and the
analysis pays off only for large terms. Beskid should therefore make copying
the default for `[Serializable]` values, make large-buffer transfer a move,
and consider message-analysis-style escape analysis only after measurements.

Savina gives a benchmark suite for actor runtimes that includes message-heavy
microbenchmarks (ping-pong, fork-join throughput, chameneos) and larger ones
[S28b]; it is the right suite to port when 0.6.5 measures isolate send cost.

Encore's active objects attach a future to every asynchronous call and the
COORDINATION 2018 paper gives a formalized design where futures can be
forwarded instead of chained, which removes a round trip and a copy per hop
[S24c]. This is relevant for pipelines: a stage that only forwards a result
should hand its output port to the next stage rather than joining and
re-sending.

Dart isolates are the industrial model closest to this decision (separate
heaps, message copying, with the later addition of isolate groups that share a
heap for immutable program structure). No peer-reviewed description exists;
the Dart documentation is a secondary illustration only. Erlang's history and
rationale for process isolation and "let it crash" is peer-reviewed in HOPL III
[S20b].

## 7. Data-parallel collections and pipelines

NESL introduced nested data parallelism and the flattening transformation that
turns nested parallel collection operations into flat vector operations with a
cost model (work and depth) that the programmer can read off the source
[S29]. Futhark carries this into a modern optimizing compiler: the language is
purely functional over arrays, nested parallelism is flattened or mapped onto
hardware, and in-place updates are allowed through uniqueness types, which is
the same uniqueness idea as section 4 [S30]. Stream fusion shows that a chain
of `map`/`filter`/`fold` on a sequence can be compiled to a single loop with
no intermediate structures when the combinators are written against a stream
representation [S31]; Steno does the same for LINQ-style declarative queries in
an imperative runtime, removing iterator allocation and virtual dispatch [S31b].
These two tell Beskid how to make `values.Parallel().Map(f).Where(p).Sum()`
cheap: fuse the pipeline into one per-chunk loop before parallelizing.

Scala's generic parallel collection framework defines the operations in
terms of splitters (split a collection into parts for workers) and combiners
(merge partial results), so a single framework parallelizes every collection
type and user-defined ones [S32]. The programmer's model is "same methods as
the sequential collection, same result when combiners are associative."

Java 8 streams give the empirical warning. Khatchadourian et al. analysed
34 open-source projects and found that parallel streams are rarely used and
that performance is the dominant reason for stream-related fixes [S33]. Their
ICSE 2019 refactoring tool decides automatically when a stream can be safely
parallelized (no side effects, no ordering dependency) and reports an average
3.49x speedup when it applies; the static analysis conditions it checks
(operations are stateless, the pipeline has no ordering constraint that forces
sequential work, the source is efficiently splittable) are the conditions a
Beskid query-layer rule should check [S33b].

## 8. Comparison table

| Model | Safety guarantee | Determinism | User effort | Runtime cost | Fit for Beskid isolates |
| --- | --- | --- | --- | --- | --- |
| Cilk fork-join, work stealing [S1, S2, S3] | Serial elision; races possible on shared memory | Deterministic if race-free | Two keywords | Near-zero spawn cost, provable bounds | High. Shape of `Parallel.Scope`; isolates remove the race case |
| X10/Habanero async-finish [S4, S5, S6] | Deadlock-free by construction; rooted exceptions | Deterministic if effects disjoint | Two keywords plus isolation blocks | Same as Cilk | High. Failure semantics to copy |
| DPJ effects [S13, S14] | Proven determinism | Deterministic by default; `nd` explicit | High: region annotations everywhere | None at runtime | Low as a mechanism; its theorem holds for free under isolates |
| LVars / Par monad [S15, S16] | Determinism via monotonic variables | Deterministic (quasi with freeze) | Monadic style | Library scheduler | Medium. Model for `Join` results and reductions only |
| Concurrent Revisions [S17b] | Isolation plus per-type merge | Deterministic | Declare merge per type | Copy-on-write snapshots | Medium. Pattern for merging per-isolate state at join |
| Kilim / Haller-Odersky / LaCasa [S17, S18, S19] | Message ownership transfer, no shared aliases | Not addressed | Mark message types or unique params | Zero-copy send | High. Basis of `Moved` |
| Gordon et al. / Pony / ORCA [S22, S23, S23b] | Data-race freedom via capabilities; shared immutables | Not addressed | Qualifier per reference | Zero-copy for `iso`/`val`; distributed GC | High. Basis of `Shared` and `Moved`; ORCA's non-moving assumption matches Beskid GC |
| Region isolation (Milano et al.) [S25] | Data-race freedom with inferred regions | Not addressed | Low: regions inferred | None at runtime | High as the inference strategy for `Moved` |
| Behaviour-Oriented Concurrency [S26] | Deadlock-free, ordered access to cowns | Partial | Declare required cowns | Scheduler bookkeeping | Medium. Later alternative to mutexes across isolates |
| Hierarchical heaps / disentanglement [S9-S12e] | Space-efficient independent GC when tasks are disentangled | Deterministic if race-free | None; runtime detects violation | Near-zero detection cost | Very high. Theoretical backing for heap-per-isolate; shows join-adopt as the copy-avoidance target |
| Erlang private heaps [S20, S21] | Process isolation; let it crash | Nondeterministic (messages) | None | Copy per message, independent GC | Very high. Measured trade-off Beskid has chosen |
| Parallel collections / fusion [S29-S32] | Same result as sequential if combiners associative | Deterministic for ordered ops | Call `.Parallel()` | Split and combine overhead; fusion removes temporaries | Very high. The fluent layer |
| Java streams (empirical) [S33, S33b] | None beyond library contract | Only if stateless | Call `.parallel()` | Often negative without analysis | Cautionary. Motivates static checks on lambdas |

## 9. Design recommendations for Beskid 0.6.5

### 9.1 Layers

Four layers, each defined in terms of the one below it.

1. `Isolate` and ports. An `Isolate` is a runtime with its own heap and GC on
   a worker thread. `Port<T>` is a typed one-directional channel between
   isolates; `T` must satisfy `Transferable` (section 9.2). This is the only
   primitive the runtime implements; everything above it is library code in
   corelib.
2. `Parallel.Scope`. Structured fork-join over isolates. `Scope.Spawn` returns
   a `Task<T>`; the scope's closing brace joins every task, so no task can
   outlive its scope [S1, S4, S5]. The scope returns `Result<T, ParallelError>`
   where `ParallelError` carries every child failure [S4].
3. `Parallel` collections. `values.Parallel()` returns `ParallelSeq<T>` with the
   same methods as `List<T>` plus `Reduce`/`ReduceUnordered`/`Chunk`/`Stages`.
   Implemented over `Parallel.Scope` with splitter/combiner [S32] and fused
   per-chunk loops [S31].
4. `Pipeline`. Stages connected by ports, each stage an isolate; built with
   `Parallel.Pipeline`. Forwarding of outputs instead of join-and-resend
   [S24c].

Fibers stay as they are: cooperative concurrency inside one isolate. A
`Scope` child body may spawn fibers freely; they die with the isolate.

### 9.2 Static rules: what crosses a boundary

Introduce one marker trait, `Transferable`, with exactly three ways to satisfy
it, checked in the query layer:

- `Shared`: a type is `Shared` when every field is `Shared` and the type has no
  mutating methods and no interior mutability. Primitives, `string`, and
  user types marked `[Immutable]` whose fields pass the check are `Shared`.
  Transfer is pointer sharing between heaps; the receiving isolate's GC treats
  the object as an external root and the sender's GC keeps it alive by a
  per-isolate reference count attached to the port message, as in ORCA [S23b].
  (Secondary illustration: Pony `val` [S23], Gordon `immutable` [S22].)
- `Moved`: a type is `Moved` when it is a unique-ownership type (`Buffer<T>`,
  `Owned<T>`, and user types marked `[Isolated]` whose fields are all
  `Shared` or `Moved`). Passing a `Moved` value to `Spawn`, `Send` or returning
  it from a task consumes the binding; any later use is a compile error. The
  analysis is per-binding flow analysis, the same shape as Milano et al.'s
  isolated regions [S25] and Haller-Odersky's consumed uniques [S18]. Transfer
  is a pointer hand-over; the non-moving GC means no fix-ups [S23b].
- `Copied`: any `[Serializable]` type. Transfer is serialize, send bytes,
  deserialize in the target heap, cost proportional to size [S20].

Rules the query layer enforces:

1. Every lambda passed to `Scope.Spawn`, `Parallel.Map` and friends may capture
   only `Transferable` bindings. A captured `Shared` is shared; a captured
   `Moved` is consumed at the spawn site; a captured `Copied` is copied once
   per isolate, not once per element (the runtime copies captures when it
   creates each worker, which also makes the cost visible: one copy per worker).
2. A captured mutable local (`i64 count` assigned inside the lambda) is an
   error. The message names the binding and offers `Reduce`. This is the
   Java-streams failure mode made impossible [S33b].
3. `Port<T>` requires `T : Transferable`. `Send` of a `Moved` consumes.
4. The return type of a task body must be `Transferable`. Returning a `Moved`
   moves it to the joiner.
5. `Parallel.Reduce(seed, combine)` requires `combine` to be marked
   `[Associative]`; `ReduceUnordered` requires `[Associative, Commutative]`.
   The marker is a declaration, not a proof; corelib provides the standard
   ones (`Sum`, `Max`, `Min`, `Concat`, `Union`) pre-marked, like Cilk's
   reducer library [S3]. A user combiner without the marker is a compile error.
6. Unsafe escape hatch: none in 0.6.5. There is no `unsafe` way to share a
   mutable object across isolates. BoC-style cowns [S26] are the candidate for
   a later release if a need appears.

### 9.3 Failure and cancellation

Follow X10 rooted exceptions [S4] and Featherweight X10's finish semantics
[S5], expressed with `Result`:

- A task body returns `Result<T, E>` or `T`. A body that returns `Error`, or
  that panics, marks the task failed.
- When any task in a scope fails, the scope cancels its siblings (cooperative:
  each worker isolate observes `Cancel` at its next safepoint, the same points
  fibers use) and waits for them to stop. The scope then returns
  `Result::Error(ParallelError::Failed(failures))` with every failure, in task
  spawn order, so the result is deterministic regardless of which failed first.
- `Scope.Spawn` returns `Task<T>`; `task.Join()` inside the scope returns
  `Result<T, TaskError>` and lets the parent handle one failure locally without
  failing the scope (`TaskError::Failed(e)`, `TaskError::Cancelled`).
- `Scope.Cancel()` cancels all children; the scope then returns
  `Result::Error(ParallelError::Cancelled)`.
- Nothing escapes a scope: no detached isolates. `Detach` exists for fibers
  inside an isolate, not for isolates. Long-lived workers are `Pipeline`
  stages owned by a scope that lives as long as the program section that needs
  them. This is the invariant that makes "errors flow up, cancellation flows
  down" a theorem rather than a convention.
- A worker isolate that is cancelled or fails has its heap discarded whole; no
  finalizers run on another isolate's behalf. This is Erlang's fault
  containment [S20b] and is possible only because the heap is private.

### 9.4 Determinism

State the guarantee in the docs exactly:

A `Parallel.Scope` or `Parallel` collection pipeline whose task bodies use no
`Port`, no `ReduceUnordered`, no `Unordered()`, no clock or random source, and
no I/O, produces the same result as its serial elision on every run. Proof
sketch: isolates make task effects disjoint [S10, S13]; join results are
write-once [S15]; ordered reductions with associative combiners preserve the
serial order [S3]. The four named constructs are the explicit `nd` constructs
of [S14] and are easy to grep for.

Provide `Parallel.SerialElision = true` as a build or test switch that runs
every scope on the calling isolate in program order, so a test suite can
compare results, as Cilk programs do [S1].

### 9.5 Cost model and copy avoidance

Document the costs in one table in the user docs; users of parallel streams
fail precisely because this is hidden [S33].

| Operation | Cost |
| --- | --- |
| `Scope.Spawn` onto a pooled worker isolate | one message; captures copied once per worker |
| Creating a new worker isolate | runtime and heap creation; pooled and reused by default |
| Passing `Shared` | O(1), reference-count message |
| Passing `Moved` | O(1), pointer hand-over, sender binding dead |
| Passing `Copied` | O(size), serialize and deserialize |
| `Parallel.Map` over `List<T>` with `T : Shared` | input shared, output chunks moved back, one concatenation |
| `Parallel.Map` with `T : Copied` | input chunks copied out, output chunks copied back |
| `Reduce` | per-worker partial, one combine tree, no element copies beyond input |

Copying is avoided only when the type says so. Three recommendations keep the
copies rare in practice:

1. Make the common collection element types `Shared` by default: `string`,
   numbers, tuples of them, `[Immutable]` records. Then `Map`/`Where`/`Sum`
   over typical data copies nothing in.
2. Make `Buffer<u8>`, `Array<T>` with `T : Shared`, and `Owned<T>` the `Moved`
   types, so I/O buffers and large arrays move.
3. Keep partial results where they were produced: `Reduce` combines inside
   workers first, and `Collect()` moves chunk buffers rather than appending
   element by element (the Scala combiner discipline [S32]).

Message analysis in the style of [S21], which would place provably-escaping
allocations in a shared area, is deferred until Savina-style measurements
[S28b] show that copies dominate.

### 9.6 Granularity and chunking

Default to an adaptive scheme: split a `ParallelSeq` in halves while a
worker's queue is empty (lazy binary splitting [S7]) and stop splitting below
a heartbeat-derived threshold [S8, S12b]. Expose `Chunk(n)` for users who know
their per-element cost and `MinChunk(n)` as a floor; do not expose thread
counts on the fluent API. `Parallel.Workers(n)` exists on the scope only.

## 10. Fluent Beskid examples

Syntax follows current corelib conventions: type-first declarations, `use`
imports, `List.New<T>()`, lambdas `(x) => ...`, `match` expressions with
`Result::Ok`/`Result::Error`. Names of new APIs are proposals.

### 10.1 Parallel collection pipeline

```beskid
use Core.Collections.List;
use Core.Parallel;

i64 SumOfSquaresOfEvens(List<i64> values) {
    return values
        .Parallel()
        .Where((x) => x % 2 == 0)
        .Map((x) => x * x)
        .Sum();
}
```

`i64` is `Shared`; nothing is copied in. `Where` and `Map` fuse into one
per-chunk loop [S31]; `Sum` is a pre-marked associative combiner [S3]. The
result equals the serial elision on every run (section 9.4).

### 10.2 Reduction with a user combiner

```beskid
[Immutable]
struct Stats { i64 count; f64 total; f64 max; }

[Associative, Commutative]
Stats Merge(Stats a, Stats b) {
    return Stats { count: a.count + b.count, total: a.total + b.total,
                   max: a.max > b.max ? a.max : b.max };
}

Stats Summarize(List<f64> samples) {
    return samples
        .Parallel()
        .Map((s) => Stats { count: 1, total: s, max: s })
        .ReduceUnordered(Stats { count: 0, total: 0.0, max: -1.0e308 }, Merge);
}
```

Without `[Associative, Commutative]` on `Merge`, `ReduceUnordered` is a
compile error naming the missing marker. `Reduce` (ordered) needs only
`[Associative]` and keeps the serial order of combination.

### 10.3 Structured scope with heterogeneous tasks

```beskid
use Core.Parallel;
use Core.Results;

Result<Report, ParallelError> BuildReport(Shared<Config> config, Owned<Buffer<u8>> raw) {
    return Parallel.Scope((s) => {
        Task<Index> index   = s.Spawn(() => Indexer.Build(config));          // config is Shared
        Task<Parsed> parsed = s.Spawn(() => Parser.Parse(move raw));          // raw is Moved
        Task<i64> words     = s.Spawn(() => Parser.CountWords(config.path)); // string is Shared
        return Report.Assemble(index.Join()?, parsed.Join()?, words.Join()?);
    });
}
```

The scope joins all three tasks before returning, even on an early `?` exit
[S4, S5]. `raw` cannot be used after `move raw`; a later `raw.Length()` in the
parent is a compile error (section 10.7).

### 10.4 Partial failure handled locally

```beskid
Result<List<Page>, ParallelError> FetchAll(List<Url> urls) {
    return Parallel.Scope((s) => {
        List<Task<Page>> tasks = urls.Map((u) => s.Spawn(() => Fetch(u)));
        List<Page> pages = List.New<Page>();
        for (Task<Page> t in tasks) {
            match t.Join() {
                Result::Ok(p) => pages.Add(p),
                Result::Error(TaskError::Failed(e)) => Log.Warn("fetch failed: " + e.Message()),
                Result::Error(TaskError::Cancelled) => {},
            };
        }
        return pages;
    });
}
```

Joining a task individually consumes its failure, so the scope does not fail.
A failure that is never joined fails the scope at the closing brace and
cancels siblings.

### 10.5 Scope-level failure and cancellation

```beskid
Result<i64, ParallelError> FirstOrFail(List<Job> jobs) {
    Result<i64, ParallelError> r = Parallel.Scope((s) => {
        for (Job j in jobs) {
            s.Spawn(() => j.Run()?);  // body returns Result<i64, JobError>
        }
        return 0;
    });
    return match r {
        Result::Ok(v) => Result::Ok(v),
        Result::Error(ParallelError::Failed(failures)) => {
            // failures are in spawn order, deterministic regardless of timing
            Log.Error(failures.Count() + " jobs failed; first: " + failures[0].Message());
            return Result::Error(ParallelError::Failed(failures));
        },
        Result::Error(ParallelError::Cancelled) => Result::Error(ParallelError::Cancelled),
    };
}
```

```beskid
Result<Found, ParallelError> Search(List<Shard> shards, Needle needle) {
    return Parallel.Scope((s) => {
        Port<Found> hits = s.Port<Found>();
        for (Shard sh in shards) {
            s.Spawn(() => match sh.Find(needle) { Option::Some(f) => hits.Send(f), Option::None => {} });
        }
        Found first = hits.Receive()?;   // first hit wins (explicitly nondeterministic: uses a Port)
        s.Cancel();                      // cooperative cancel of the remaining shards
        return first;
    });
}
```

### 10.6 Chunking and worker knobs

```beskid
List<Thumb> Thumbnails(List<Shared<Image>> images) {
    return images
        .Parallel()
        .Chunk(4)                 // expensive per element: small chunks
        .Map((img) => Resize(img, 128))
        .Collect();               // moves per-chunk buffers back, one concatenation
}

List<i64> Hashes(List<string> lines) {
    return lines
        .Parallel()
        .MinChunk(4096)           // cheap per element: never split below 4096
        .Map((l) => Hash.Fnv(l))
        .Collect();
}

Parallel.Scope((s) => { ... }, ScopeOptions { workers: 4 });
```

With neither knob the runtime uses lazy splitting with a heartbeat floor
[S7, S8, S12b].

### 10.7 Moving buffers and compile errors for unsafe captures

```beskid
Result<Digest, ParallelError> HashInBackground(Owned<Buffer<u8>> data) {
    return Parallel.Scope((s) => {
        Task<Digest> t = s.Spawn(() => Sha256.Hash(move data));
        Log.Info("queued " + data.Length());   // error
        return t.Join()?;
    });
}
```

```text
error[P0301]: use of moved value `data`
  --> src/Hash.bd:4:34
   |
 3 |         Task<Digest> t = s.Spawn(() => Sha256.Hash(move data));
   |                                                    --------- `data` moved into the task here
 4 |         Log.Info("queued " + data.Length());
   |                              ^^^^ value used after move
   = note: `Owned<Buffer<u8>>` is a Moved type; it has exactly one owner at a time
   = help: read `data.Length()` before the spawn, or pass a `Shared` snapshot
```

```beskid
i64 CountMatches(List<string> lines, string needle) {
    i64 count = 0;
    lines.Parallel().ForEach((l) => { if (l.Contains(needle)) { count = count + 1; } });
    return count;
}
```

```text
error[P0302]: lambda passed to `Parallel.ForEach` captures mutable local `count`
  --> src/Count.bd:3:55
   |
 3 |     lines.Parallel().ForEach((l) => { if (l.Contains(needle)) { count = count + 1; } });
   |                                                                 ^^^^^ assigned inside a parallel body
   = note: parallel bodies run in separate isolates; a captured local cannot be shared
   = help: use a reduction:
           lines.Parallel().Where((l) => l.Contains(needle)).Count()
```

```beskid
struct Cache { Map<string, i64> entries; }   // mutable, not [Immutable], not [Serializable]

List<i64> Lookup(List<string> keys, Cache cache) {
    return keys.Parallel().Map((k) => cache.entries.Get(k)).Collect();
}
```

```text
error[P0303]: captured value `cache` of type `Cache` is not Transferable
  --> src/Lookup.bd:4:40
   |
 4 |     return keys.Parallel().Map((k) => cache.entries.Get(k)).Collect();
   |                                        ^^^^^ captured here
   = note: a type is Transferable when it is Shared ([Immutable] with Shared fields),
           Moved ([Isolated] / Owned<T> / Buffer<T>), or Copied ([Serializable])
   = help: mark `Cache` [Immutable] and build it before the parallel section,
           or mark it [Serializable] to copy it once per worker
```

### 10.8 Pipelines with stages and ports

```beskid
Result<i64, ParallelError> Ingest(Owned<FileReader> reader) {
    return Parallel.Pipeline<Owned<Buffer<u8>>, Record, Record, i64>()
        .Source(() => reader.Chunks(1 << 20))                 // yields Moved buffers
        .Stage(2, (buf) => Decoder.Decode(move buf))           // 2 isolates, buffers move in
        .Stage(4, (rec) => Enricher.Enrich(rec))               // Record is Copied ([Serializable])
        .Sink((rec) => Store.Write(rec))                       // one isolate
        .Run()
        .Map((stats) => stats.written);
}
```

Each stage's output port is handed to the next stage, so a stage never joins
and re-sends [S24c]. Stage parallelism is explicit because stage order is an
ordering constraint the framework cannot infer [S33b]; `Stage(n, f)` with
`n > 1` reorders records unless `.Ordered()` is requested, which buffers per
input index.

### 10.9 Serial elision for tests

```beskid
test parallel_sum_matches_serial {
    List<i64> values = Fixtures.Numbers(100000);
    i64 serial = values.Where((x) => x % 2 == 0).Map((x) => x * x).Sum();
    i64 parallel = values.Parallel().Where((x) => x % 2 == 0).Map((x) => x * x).Sum();
    Assert.Equal<i64>(parallel, serial, "parallel equals serial elision");
}
```

Under `Parallel.SerialElision = true` the second expression runs on the
calling isolate in program order [S1].

## 11. Open questions for the owner

1. Should `[Immutable]` be inferred for structs whose fields are all `Shared`
   and that declare no mutating methods, or always explicit? Inference matches
   Milano et al.'s goal of low annotation burden [S25]; explicitness matches
   Gordon et al. [S22]. Recommendation: explicit in 0.6.5, inference considered
   after the marker has been used in corelib.
2. Whether `Shared` sharing across heaps (reference-count messages, ORCA
   style [S23b]) ships in 0.6.5 or `Shared` is implemented as copy first with
   identical semantics. The static rules do not change; only the cost table
   does. Recommendation: ship the semantics now and pointer sharing behind the
   same API when the GC root-tracking is ready.
3. Whether `Port<T>` receive is a fiber-cooperative wait (recommended: yes,
   so an isolate can serve many ports with fibers) and whether ports are
   bounded by default (recommended: bounded, capacity 64, like current channel
   limits).

## 12. Sources

Peer-reviewed sources. DOIs checked against the Crossref API on 2026-10-13
unless noted.

- [S1] Matteo Frigo, Charles E. Leiserson, Keith H. Randall. The
  Implementation of the Cilk-5 Multithreaded Language. PLDI 1998.
  https://doi.org/10.1145/277650.277725
- [S2] Robert D. Blumofe, Charles E. Leiserson. Scheduling Multithreaded
  Computations by Work Stealing. Journal of the ACM 46(5), 1999.
  https://doi.org/10.1145/324133.324234
- [S3] Matteo Frigo, Pablo Halpern, Charles E. Leiserson, Stephen
  Lewin-Berlin. Reducers and Other Cilk++ Hyperobjects. SPAA 2009.
  https://doi.org/10.1145/1583991.1584017
- [S4] Philippe Charles, Christian Grothoff, Vijay Saraswat, Christopher
  Donawa, Allan Kielstra, Kemal Ebcioglu, Christoph von Praun, Vivek Sarkar.
  X10: An Object-Oriented Approach to Non-Uniform Cluster Computing. OOPSLA
  2005. https://doi.org/10.1145/1103845.1094852
- [S5] Jonathan K. Lee, Jens Palsberg. Featherweight X10: A Core Calculus for
  Async-Finish Parallelism. PPoPP 2010. https://doi.org/10.1145/1693453.1693459
- [S6] Jisheng Zhao, Roberto Lublinerman, Zoran Budimlic, Swarat Chaudhuri,
  Vivek Sarkar. Isolation for Nested Task Parallelism. OOPSLA 2013.
  https://doi.org/10.1145/2509136.2509534
- [S7] Alexandros Tzannes, George C. Caragea, Rajeev Barua, Uzi Vishkin. Lazy
  Binary-Splitting: A Run-Time Adaptive Work-Stealing Scheduler. PPoPP 2010.
  https://doi.org/10.1145/1693453.1693479
- [S8] Umut A. Acar, Arthur Chargueraud, Adrien Guatto, Mike Rainey, Filip
  Sieczkowski. Heartbeat Scheduling: Provable Efficiency for Nested
  Parallelism. PLDI 2018. https://doi.org/10.1145/3192366.3192391
- [S8b] Umut A. Acar, Vitaly Aksenov, Arthur Chargueraud, Mike Rainey.
  Provably and Practically Efficient Granularity Control. PPoPP 2019.
  https://doi.org/10.1145/3293883.3295725
- [S9] Ram Raghunathan, Stefan K. Muller, Umut A. Acar, Guy Blelloch.
  Hierarchical Memory Management for Parallel Programs. ICFP 2016.
  https://doi.org/10.1145/2951913.2951935
- [S9b] Adrien Guatto, Sam Westrick, Ram Raghunathan, Umut A. Acar, Matthew
  Fluet. Hierarchical Memory Management for Mutable State. PPoPP 2018.
  https://doi.org/10.1145/3178487.3178494
- [S10] Sam Westrick, Rohan Yadav, Matthew Fluet, Umut A. Acar.
  Disentanglement in Nested-Parallel Programs. POPL 2020 (PACMPL 4, art. 47).
  https://doi.org/10.1145/3371115
- [S11] Jatin Arora, Sam Westrick, Umut A. Acar. Provably Space-Efficient
  Parallel Functional Programming. POPL 2021 (PACMPL 5, art. 18).
  https://doi.org/10.1145/3434299
- [S12] Sam Westrick, Jatin Arora, Umut A. Acar. Entanglement Detection with
  Near-Zero Cost. ICFP 2022 (PACMPL 6). https://doi.org/10.1145/3547646
- [S12b] Sam Westrick, Matthew Fluet, Mike Rainey, Umut A. Acar. Automatic
  Parallelism Management. POPL 2024 (PACMPL 8, art. 38).
  https://doi.org/10.1145/3632880
- [S12c] Jatin Arora, Sam Westrick, Umut A. Acar. Efficient Parallel
  Functional Programming with Effects. PLDI 2023 (PACMPL 7, art. 170).
  https://doi.org/10.1145/3591284
- [S12d] Jatin Arora, Stefan K. Muller, Umut A. Acar. Disentanglement with
  Futures, State, and Interaction. POPL 2024 (PACMPL 8, art. 53).
  https://doi.org/10.1145/3632895 (DOI from a citing paper, not re-resolved)
- [S12e] Alexandre Moine, Sam Westrick, Stephanie Balzer. DisLog: A
  Separation Logic for Disentanglement. POPL 2024 (PACMPL 8, art. 11).
  https://doi.org/10.1145/3632853
- [S13] Robert L. Bocchino Jr., Vikram S. Adve, Danny Dig, Sarita V. Adve,
  Stephen Heumann, Rakesh Komuravelli, Jeffrey Overbey, Patrick Simmons,
  Hyojin Sung, Mohsen Vakilian. A Type and Effect System for Deterministic
  Parallel Java. OOPSLA 2009. https://doi.org/10.1145/1640089.1640097
- [S14] Robert L. Bocchino Jr., Stephen Heumann, Nima Honarmand, Sarita V.
  Adve, Vikram S. Adve, Adam Welc, Tatiana Shpeisman. Safe Nondeterminism in
  a Deterministic-by-Default Parallel Language. POPL 2011.
  https://doi.org/10.1145/1926385.1926447
- [S15] Simon Marlow, Ryan Newton, Simon Peyton Jones. A Monad for
  Deterministic Parallelism. Haskell Symposium 2011.
  https://doi.org/10.1145/2034675.2034685
- [S16] Lindsey Kuper, Ryan R. Newton. LVars: Lattice-based Data Structures
  for Deterministic Parallelism. FHPC 2013.
  https://doi.org/10.1145/2502323.2502326
- [S16b] Lindsey Kuper, Aaron Turon, Neelakantan R. Krishnaswami, Ryan R.
  Newton. Freeze After Writing: Quasi-Deterministic Parallel Programming with
  LVars. POPL 2014. https://doi.org/10.1145/2535838.2535842
- [S17] Sriram Srinivasan, Alan Mycroft. Kilim: Isolation-Typed Actors for
  Java. ECOOP 2008, LNCS 5142. https://doi.org/10.1007/978-3-540-70592-5_6
- [S17b] Sebastian Burckhardt, Alexandro Baldassin, Daan Leijen. Concurrent
  Programming with Revisions and Isolation Types. OOPSLA 2010.
  https://doi.org/10.1145/1869459.1869515
- [S18] Philipp Haller, Martin Odersky. Capabilities for Uniqueness and
  Borrowing. ECOOP 2010. https://doi.org/10.1007/978-3-642-14107-2_17
- [S19] Philipp Haller, Alex Loiko. LaCasa: Lightweight Affinity and Object
  Capabilities in Scala. OOPSLA 2016. https://doi.org/10.1145/2983990.2984042
- [S20] Erik Johansson, Konstantinos Sagonas, Jesper Wilhelmsson. Heap
  Architectures for Concurrent Languages using Message Passing. ISMM 2002.
  https://doi.org/10.1145/773039.512440
- [S20b] Joe Armstrong. A History of Erlang. HOPL III, 2007.
  https://doi.org/10.1145/1238844.1238850
- [S21] Richard Carlsson, Konstantinos Sagonas, Jesper Wilhelmsson. Message
  Analysis for Concurrent Programs Using Message Passing. ACM TOPLAS 28(4),
  2006. https://doi.org/10.1145/1146813
- [S21b] Konstantinos Sagonas, Jesper Wilhelmsson. Efficient Memory Management
  for Concurrent Programs that Use Message Passing. Science of Computer
  Programming 62(2), 2006 (extends ISMM 2004).
  https://doi.org/10.1016/j.scico.2006.02.006
- [S22] Colin S. Gordon, Matthew J. Parkinson, Jared Parsons, Aleks
  Bromfield, Joe Duffy. Uniqueness and Reference Immutability for Safe
  Parallelism. OOPSLA 2012. https://doi.org/10.1145/2384616.2384619
- [S23] Sylvan Clebsch, Sophia Drossopoulou, Sebastian Blessing, Andy McNeil.
  Deny Capabilities for Safe, Fast Actors. AGERE 2015 (SPLASH workshop).
  https://doi.org/10.1145/2824815.2824816
- [S23b] Sylvan Clebsch, Juliana Franco, Sophia Drossopoulou, Albert Mingkun
  Yang, Tobias Wrigstad, Jan Vitek. Orca: GC and Type System Co-Design for
  Actor Languages. OOPSLA 2017 (PACMPL 1, art. 72).
  https://doi.org/10.1145/3133896
- [S24] Elias Castegren, Tobias Wrigstad. Reference Capabilities for
  Concurrency Control. ECOOP 2016, LIPIcs 56.
  https://doi.org/10.4230/LIPIcs.ECOOP.2016.5
- [S24b] Stephan Brandauer, Elias Castegren, Dave Clarke, Kiko
  Fernandez-Reyes, Einar Broch Johnsen, Ka I Pun, S. Lizeth Tapia Tarifa,
  Tobias Wrigstad, Albert Mingkun Yang. Parallel Objects for Multicores: A
  Glimpse at the Parallel Language Encore. SFM 2015, LNCS 9104.
  https://doi.org/10.1007/978-3-319-18941-3_1
- [S24c] Kiko Fernandez-Reyes, Dave Clarke, Elias Castegren, Huu-Phuc Vo.
  Forward to a Promising Future. COORDINATION 2018, LNCS 10852.
  https://doi.org/10.1007/978-3-319-92408-3_7
- [S25] Mae Milano, Joshua Turcotti, Andrew C. Myers. A Flexible Type System
  for Fearless Concurrency. PLDI 2022. https://doi.org/10.1145/3519939.3523443
- [S26] Luke Cheeseman, Matthew J. Parkinson, Sylvan Clebsch, Marios
  Kogias, Sophia Drossopoulou, David Chisnall, Tobias Wrigstad, Paul Lietar.
  When Concurrency Matters: Behaviour-Oriented Concurrency. OOPSLA 2023
  (PACMPL 7). https://doi.org/10.1145/3622852
- [S26b] Kiko Fernandez-Reyes, Isaac Oscar Gariano, James Noble, Erin
  Greenwood-Thessman, Michael Homer, Tobias Wrigstad. Dala: A Simple
  Capability-Based Dynamic Language Design for Data Race-Freedom. Onward!
  2021. https://doi.org/10.1145/3486607.3486747
- [S27b] Manuel Fahndrich, Mark Aiken, Chris Hawblitzel, Orion Hodson, Galen
  Hunt, James R. Larus, Steven Levi. Language Support for Fast and Reliable
  Message-based Communication in Singularity OS. EuroSys 2006.
  https://doi.org/10.1145/1217935.1217953
- [S28b] Shams M. Imam, Vivek Sarkar. Savina: An Actor Benchmark Suite. AGERE
  2014. https://doi.org/10.1145/2687357.2687368
- [S29] Guy E. Blelloch, Jonathan C. Hardwick, Siddhartha Chatterjee, Jay
  Sipelstein, Marco Zagha. Implementation of a Portable Nested Data-Parallel
  Language. PPoPP 1993. https://doi.org/10.1145/173284.155343
- [S30] Troels Henriksen, Niels G. W. Serup, Martin Elsman, Fritz Henglein,
  Cosmin E. Oancea. Futhark: Purely Functional GPU-Programming with Nested
  Parallelism and In-Place Array Updates. PLDI 2017.
  https://doi.org/10.1145/3062341.3062354
- [S31] Duncan Coutts, Roman Leshchinskiy, Don Stewart. Stream Fusion: From
  Lists to Streams to Nothing at All. ICFP 2007.
  https://doi.org/10.1145/1291151.1291199
- [S31b] Derek G. Murray, Michael Isard, Yuan Yu. Steno: Automatic
  Optimization of Declarative Queries. PLDI 2011.
  https://doi.org/10.1145/1993498.1993513
- [S32] Aleksandar Prokopec, Phil Bagwell, Tiark Rompf, Martin Odersky. A
  Generic Parallel Collection Framework. Euro-Par 2011, LNCS 6853.
  https://doi.org/10.1007/978-3-642-23397-5_14
- [S33] Raffi Khatchadourian, Yiming Tang, Mehdi Bagherzadeh, Baishakhi Ray.
  An Empirical Study on the Use and Misuse of Java 8 Streams. FASE 2020, LNCS
  12076. https://doi.org/10.1007/978-3-030-45234-6_5
- [S33b] Raffi Khatchadourian, Yiming Tang, Mehdi Bagherzadeh, Syed Ahmed.
  Safe Automated Refactoring for Intelligent Parallelization of Java 8
  Streams. ICSE 2019. https://doi.org/10.1109/ICSE.2019.00072

Secondary illustration only (not peer-reviewed): Swift Evolution SE-0414
"Region based Isolation" (applies [S25]); Dart isolate documentation; Daan
Leijen, Structured Asynchrony with Algebraic Effects, TyDe 2017
(https://doi.org/10.1145/3122975.3122977), a workshop paper that formalizes
scoped asynchronous tasks with handlers and is the closest published
treatment of structured-concurrency scoping; no OOPSLA/PLDI paper on
structured concurrency cancellation semantics was found, so the failure
semantics in section 9.3 rest on the async-finish papers [S4, S5].
