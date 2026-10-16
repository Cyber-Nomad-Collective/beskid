# Pony semantics for Beskid: what to adopt, adapt and reject to close the parallelism scope (0.6.1 to 0.6.5)

Research date: 2026-10-13. Read-only study. Scope: the owner's request to
"investigate the semantics of Pony to fit them into Beskid to close the scope
for parallelism". Inputs: `docs/research/2026-10-13-isolate-parallelism-sota.md`
(SOTA), `docs/research/2026-10-13-isolate-compiler-requirements.md` (REQ), the
OpenSpec changes `v061-attributes-and-isolate-prerequisites` through
`v065-parallel-sequences`, the two decision entries of 2026-10-13 in
`docs/reports/2026-10-04-v06-decisions.md` (13 locked rulings), the Pony and
ORCA primary sources listed in section 4, the `ponyc` runtime source, and the
compiler tree at `compiler/` (paths below are relative to `compiler/` unless
they start with `openspec/` or `docs/`). No builds, no cargo, no commits.

Beskid's static model as locked: transfer classes Shared (`[Immutable]`,
primitives, `string`), Moved (`T[]`, `List<T>`, `[Isolated]`, `move x` with
use-after-move), Copied (`[Copyable]`), Never (`Fiber`, `Channel`, locks,
`pointer`, function values, Glue handles); `[Captures(C)]` on function
parameters (Spores); a non-moving mark-sweep collector per heap.

## 0. Results in brief

1. Pony's six reference capabilities answer one question: which aliases of an
   object may exist, locally (same actor) and globally (other actors). Only
   `iso`, `val` and `tag` are sendable, because for those the local and global
   answers coincide [P1, Table 1]. Beskid's Shared/Moved classes are `val`/`iso`
   stated per type rather than per reference. That is a deliberate narrowing
   and it removes the two concepts users measurably struggle with (`box`,
   `trn`) and the whole viewpoint-adaptation table (section 1.3, 1.9, 2.2).
2. `[Isolated]` plus `move` is not enough for sound pointer hand-over. Pony's
   `iso` is sound because every alias-creating operation on an `iso` either
   consumes the source or yields a `tag` that cannot read or write [P1 sec. 2].
   Beskid's locked plan tracks consumption per binding only. Today's corelib
   already violates external uniqueness: `List<T>.Push` returns a new record
   that shares the old `T[]` storage when capacity allows
   (`corelib/packages/foundation/src/Core/Collections/List.bd:24-27`,
   `Core/Collections/Storage.bd:10-15`). Handing one of those lists to another
   isolate by pointer while the other is still reachable is a data race. The
   fix is the Pony rule in Beskid clothing: a Moved-class value is consumed
   when it is stored, passed to an owning parameter, captured, returned or
   `move`d; every other use of a Moved value read out of a place is a
   non-escaping borrow (section 2.3). This belongs in 0.6.2, where the
   proposal already states "the move analysis supplies `iso`".
3. The 0.6.5 open question is closed by ORCA with the `ponyc` source as
   witness (section 2.4). For a handed-over mutable graph: the sender traces
   it at send time and protects every object in it individually (LRC++ per
   object); the receiver traces it at receive time (FRC++ per object); the
   receiver's collector traces through foreign mutable objects at every one
   of its collections (to find its own objects stored inside); the owner's
   collector never traces into it, it marks each LRC>0 object shallow (live,
   not scanned). Immutable graphs are the mirror image: the owner traces
   them, non-owners do not. Beskid already has the pieces: span mark and
   scanned bitmaps (`Runtime/Mem/Gc/Marking.bd:24-25, 203`) give shallow
   marking for free; the foreign early return at `Marking.bd:116-119` is the
   one place that changes; descriptors need one flag bit for immutable types
   (`Runtime/Bootstrap/Objects.bd:55-61`, emitted at
   `crates/beskid_codegen/src/aggregate_static.rs:52,85,507`); write barriers
   need no change (`Runtime/Mem/Gc/Collection.bd:36-46`).
4. Pony's causality requirement has a narrow and cheap Beskid reading: all
   count messages for an owner go through that owner's one FIFO mailbox and
   are enqueued synchronously before the application message that depends on
   them. Port rings do not need to be merged with the mailbox (section 2.4.4).
5. Beskid does not need Pony's actor cycle detector [P3]: isolates are owned
   by scopes and never detached (ruling 8 and SOTA 9.3). Object cycles across
   heaps need no special treatment in ORCA [P2 sec. 5.6]. The one leak ORCA
   would leave in Beskid (two exited heaps keeping each other alive) is
   removed by adopting a child's heap regions into the parent at join, which
   the non-moving collector permits and which also makes a Moved task result
   O(1) (section 2.5).
6. `recover`, `trn`, `box`, ephemeral annotations and viewpoint adaptation
   are not adopted as user-visible features. Their one essential use, turning
   a freshly built mutable graph into a shareable immutable one, becomes a
   corelib function with a `move` parameter (`ReadOnlyArray.Freeze(move
   data)`), which is exactly Pony's `consume val x` / Gordon's isolated to
   immutable conversion [P1 Def. 2, P9].
7. Thirteen rulings: eleven confirmed, two amended (ruling 6 gains the alias
   discipline and heap adoption; ruling 7 gains `Freeze`). Section 3 lists
   the per-release deltas, the diagnostics, and 14 decisions to lock.

One correction to the brief: no mechanised proof of ORCA exists. Franco,
Clebsch, Drossopoulou, Vitek and Wrigstad (ESOP 2018) prove soundness and
completeness on paper in a model that is parametric in the host language and
type system [P4]; the paper does not mention Coq or Isabelle, and no artefact
was found.

## 1. Pony semantics from primary sources

### 1.1 Reference capabilities as deny properties

Clebsch, Drossopoulou, Blessing and McNeil (AGERE 2015, DOI verified) define a
capability not by what the reference may do but by what it denies to other
references to the same object, split into local aliases (held by the same
actor) and global aliases (held by other actors) [P1 sec. 2]:

| | Deny global read/write aliases | Deny global write aliases | Allow all global aliases |
| --- | --- | --- | --- |
| Deny local read/write aliases | **iso** | | |
| Deny local write aliases | **trn** | **val** | |
| Allow all local aliases | ref | box | **tag** |
| | (mutable) | (immutable) | (opaque) |

Derived facts, all from [P1 sec. 2]:

- Permissions follow from denials. Denying global read and write makes a
  reference safe to write (mutable: `iso`, `trn`, `ref`). Denying only global
  writes makes it safe to read (immutable: `val`, `box`). Allowing everything
  globally makes it opaque (`tag`): identity comparison and asynchronous calls
  only.
- Sendability is the diagonal. "When the local alias deny properties are the
  same as the global alias deny properties, it does not matter which actor
  holds the reference", so `iso`, `val` and `tag` are sendable. `ref`, `box`
  and `trn` are not, because the sender could keep an alias the receiver's
  view does not account for (`box` is rejected as a behaviour parameter for
  exactly this reason).
- Empty cells are a theorem, not a choice: no capability may deny locally what
  it allows globally.
- `trn` is the novel one: write-unique but not read-unique, so an object can
  be mutated through one reference while `box` aliases read it, and later be
  converted to `val` without a copy (the BookingManager example).
- `iso` and `trn` form static regions: every mutable object reachable from an
  `iso` is reachable only through it; immutable objects reachable from it are
  either globally immutable or reachable only through it.

Theorems: a well-formed heap ensures data-race freedom (Theorem 1) and
well-formedness is preserved (Theorem 2); the authors note the result is
stronger than race freedom, it makes behaviours atomic [P1 sec. 7].

### 1.2 Aliasing, ephemeral types, `consume`, destructive read

- Creating a new alias may not violate the deny properties of the aliased
  reference. The alias type of `iso` is `tag`, of `trn` is `box`; the others
  alias as themselves (Pony tutorial, Aliasing; [P1 sec. 2]).
- An unaliased (ephemeral) type, written `T iso^` in the language and `iso◦`
  in the paper, types a value that currently has no other name: the result
  of `consume x`, of a constructor, or of a destructive read. `iso^` is a
  subtype of everything; `iso^ <: iso` only when no second alias is made
  (tutorial, Capability Subtyping).
- `consume x` empties a local or parameter; later reads are compile errors
  until the variable is reassigned. Fields cannot be consumed, because
  another alias of the containing object could observe the hole (tutorial,
  Consume and Destructive Read).
- Destructive read: assignment returns the previous value of the left-hand
  side, so `b = (buddy = consume a)` moves the old field value into `b` and
  the new value into the field in one expression, and the field is never
  empty [P1 sec. 2, tutorial].
- Passing an argument is alias creation, so passing an `iso` without
  consuming it hands the callee a `tag`.

### 1.3 Viewpoint adaptation and safe-to-write

Reading a field combines the capability of the path (origin) with that of
the field (tutorial, Combining Capabilities; [P1 sec. 5]):

| origin \ field | iso | trn | ref | val | box | tag |
| --- | --- | --- | --- | --- | --- | --- |
| iso | iso | tag | tag | val | tag | tag |
| trn | iso | box | box | val | box | tag |
| ref | iso | trn | ref | val | box | tag |
| val | val | val | val | val | val | tag |
| box | tag | box | box | val | box | tag |
| tag | n/a | n/a | n/a | n/a | n/a | n/a |

The two rows that matter for Beskid: through an `iso` origin only `iso` and
`val` fields stay readable (anything else degrades to `tag`), and through a
`val` origin everything readable is `val` (deep immutability). Safe-to-write
is the dual: storing into a field through an origin is legal only if no alias
of the stored object could violate the origin's deny properties, which is why
`list1.next = list2` with `list2: List ref` is rejected even if the field is
declared `ref` [P1 sec. 2, Table 4]. Temporary identifiers (an expression
that is not bound) let Pony read and write through `iso` paths without
creating aliases, which earlier external-uniqueness systems did not allow.

### 1.4 `recover` and automatic receiver recovery

- `recover e end` evaluates `e` in a scope that can see only sendable
  variables (`iso`, `val`, `tag`) from the enclosing scope. Because nothing
  non-sendable can enter, no alias of the result can exist outside, so the
  result's capability may be lifted: mutable results (`iso`, `trn`, `ref`)
  default to `iso`, readable results (`val`, `box`) to `val`, and an explicit
  `recover val ... end` picks the target [P1 Def. 2, tutorial, Recovering
  Capabilities]. This is Gordon et al.'s recovery rule for `isolated` and
  `immutable` [P9], extended to Pony's lattice.
- Automatic receiver recovery: calling a `ref` method on an `iso` receiver
  would alias the receiver as `tag`. The compiler skips the alias when every
  argument at the call site is sendable and the result is sendable or
  unused, so `let s = recover String end; s.append("hi")` type-checks
  (tutorial, Recovering Capabilities).

### 1.5 Behaviours, functions, causal messaging

- `fun` is synchronous with a receiver capability; `be` is asynchronous,
  returns nothing, and may be called on a `tag` receiver because the call
  site neither reads nor writes the receiver. Inside the behaviour the actor
  sees itself as `ref` [P1 sec. 2, tutorial, Actors].
- Behaviour parameters must be sendable (section 1.1). An actor runs one
  behaviour at a time, so behaviours are atomic (Theorem 1 corollary).
- Causal delivery: a message arrives before any message it may have caused,
  when both have the same destination. Pony gets this from synchronous
  enqueue (`send` returns only after the message is in the target queue) plus
  FIFO mailboxes plus program order within an actor [P2 sec. 3.1, P5 sec. 3].
  ORCA depends on it (section 1.6.5).

### 1.6 ORCA in detail

Sources: Clebsch, Franco, Drossopoulou, Yang, Wrigstad, Vitek, OOPSLA 2017
[P2, DOI verified]; Clebsch and Drossopoulou, ICOOOLPS 2015 [P5]; Franco et
al., ESOP 2018 [P4, DOI verified]; the `ponyc` runtime `src/libponyrt/gc/gc.c`
read on 2026-10-13 [P15] where the paper's pseudocode is ambiguous.

#### 1.6.1 Ownership and counts

- Every object is owned by the actor that allocated it; ownership is fixed
  for the object's lifetime [P4 sec. 3]. The owner is derived from the
  object's address (`chunk(p).owner`) [P2 Fig. 11].
- Each actor keeps two tables: LRC entries for its own objects that have been
  shared (the owner's count of outside interest), and FRC entries for
  foreign objects it holds (its own stake). Counts are weighted and deferred:
  they count stakes, not paths or aliases [P4 sec. 3.3].
- Two logical counters exist only in the proof: AMC (application messages
  that can reach the object) and OMC (pending INC/DEC messages).
- Invariants [P2 sec. 4.1, P4 sec. 3]:
  - I1: if an actor may write to an object, no other actor may read or write
    it (type system). Consequence: no write barriers and no synchronisation
    while tracing.
  - I2: immutability is persistent and deep (type system).
  - I3: every live object is protected at its owner (LRC>0 if any non-owner
    or message can reach it).
  - I4: any object reachable from a foreign actor is protected at that actor
    (FRC>0).
  - I5: LRC + OMC = FRC + AMC (the ESOP paper refines this so that it holds at
    every step; the OOPSLA paper admits it only holds at procedure
    boundaries, sec. 5.5).

#### 1.6.2 Send

For every object reachable from the message arguments [P2 Fig. 11, P15]:

- Owned object: LRC++ (create the entry if needed), stamp the epoch, and if
  the static view is not `tag` and the object is not known immutable, push
  it so that its fields are traced (recursing through the whole mutable
  graph). If the view is `val`, set the entry's immutable flag and do not
  recurse ("an immutable data structure need only be traced by the owner of
  the immutable objects it contains", sec. 5).
- Foreign object: FRC-- if the count can bear it; if FRC would hit zero,
  inflate it by a constant (`GC_INC_MORE`) and send an INC for the owner
  (`acquire`) before the application message is enqueued. If a mutable object
  is being sent as `val` for the first time (an `iso` that became `val`),
  the owner is told of the status change. Recurse only if the view is
  mutable (`gc.c`: `if (mutability == PONY_TRACE_MUTABLE || might_reference_actor(t)) recurse`).
- `tag` views are counted (the object is kept alive) but never traced.

#### 1.6.3 Receive

Mirror of send [P2 sec. 4.5.2, P15]: own object received back: LRC--;
foreign object: FRC++ (plus the owning actor's reference count), and the
receiver inflates its apparent heap usage so that an actor that only
handles foreign objects still collects and eventually sends DECs. Tracing at
receive does not recurse into opaque or immutable structures (the one
exception: an object received as immutable that was earlier held as mutable
is traced once more to upgrade it).

#### 1.6.4 A collection cycle, and who traces what

Between behaviours (no stack to scan) the actor runs [P2 Fig. 9-10, P15]:

1. roots: push the actor's fields.
2. `markimmut`: for every owned, shared, immutable object with LRC>0: mark it
   and trace its substructure. The owner traces shared immutable graphs.
3. `traverse`: mark from the roots. A local object is marked and traced
   unless the view is `tag`. A foreign object is recorded in the FRC table
   with the current epoch and its owner is marked live; it is traced through
   only if the view is mutable (`gc.c`), because a non-owner may have stored
   its own objects inside a mutable foreign graph, whereas an immutable
   foreign graph is the owner's job.
4. `sweeporcs`: every owned LRC>0 object not reached above is marked shallow
   (kept, not scanned); entries with LRC 0 are dropped. The owner never traces
   into a shared mutable graph: "such objects are simply marked as reachable
   and need not be traced any further. This is a key element of the system:
   it protects such objects from collection by the owning actor when some
   other actor is in the process of mutating them" [P5 sec. 6].
5. Foreign objects not reached: send one combined DEC per owner for the
   FRC held, drop the entries.
6. finalise and free; chunks with no live objects return to the global pool.

The responsibility matrix that follows (and that section 2.4 maps to
Beskid):

| Graph kind | Sender at send | Receiver at receive | Receiver's GC | Owner's GC |
| --- | --- | --- | --- | --- |
| mutable (`iso`) | trace whole graph, LRC++ each object | trace whole graph, FRC++ each object | trace through it | never trace; shallow-mark each LRC>0 object |
| immutable (`val`) | mark root(s) immutable, LRC++ root(s), no recursion | FRC++ root(s), no recursion | keep, no recursion | trace it (`markimmut`) |
| opaque (`tag`) | LRC++ or FRC--, no recursion | FRC++, no recursion | keep, no recursion | shallow-mark |

Why the mutable graph needs per-object protection: the owner will not look
inside it, so a sub-object with no entry of its own would be swept while the
receiver still reaches it through the root. Why the immutable graph needs
only root protection within one owner: the owner traces from the shared root
during `markimmut`. An immutable aggregate whose objects have several owners
has several roots (one per owner), found by recursing at receive time [P2
Fig. 14, sec. 5.1].

#### 1.6.5 Why no barriers, and why causality

- No read or write barriers: I1 means the only actor that can mutate an
  object is the one that holds it mutably, and that actor's collector is
  the only one that traces through it. Count changes happen at send and
  receive, never on field assignment [P5 sec. 6, P2 sec. 4].
- Causality matters for INC and DEC: B holds o (owned by A) with FRC 1, sends
  o to C (so B sends INC(o, n) to A, then the application message to C), and
  C later drops o and sends DEC(o, 1) to A. If DEC could overtake INC, A would
  free o while B still holds it [P2 sec. 5.4]. Causal delivery to A, plus
  FIFO at A, orders INC before DEC without acknowledgements [P5 sec. 6].

#### 1.6.6 Cycles

- Object cycles: none needed. Counts are stakes, not paths, so a cycle of
  unreachable objects owned by n actors is freed after each of the n actors
  completes one collection and sends its DECs [P2 sec. 5.6].
- Actor cycles: actors are themselves reference counted (an actor is
  collectable when its own count is 0 and its queue is empty) and a cycle of
  blocked actors that reference each other needs the concurrent cycle
  detector of Clebsch and Drossopoulou (OOPSLA 2013, DOI verified): actors
  report "blocked" with a view of their references, the detector confirms
  the cycle with a second round and collects it, no barriers or locks [P3,
  P5 sec. 5.1.2]. Pony can disable it (`--ponynoblock`), at the cost of
  never collecting cyclic dead actors (tutorial, GC appendix).

### 1.7 Formal results

- AGERE 2015: data-race freedom and preservation, pen-and-paper [P1].
- Clebsch's thesis (Imperial, October 2017) is the integrated account of the
  type system and runtime co-design [P6]. Steed's 2016 MSc thesis
  ("A Principled Design of Capabilities in Pony") formalises the capability
  lattice; it is not peer-reviewed and was not re-read for this document
  (unverified).
- ORCA: Franco et al. ESOP 2018 give a model parametric in the host language
  and type system, invariants I1 to I8 (I5 counts non-negative, I6 no
  dangling accessible paths, I7 queue effects never drive counts negative,
  I8 actor contents agree with the model), and prove soundness (live objects
  are not collected) and completeness (all garbage is eventually identified)
  [P4]. Pen-and-paper; no mechanisation found.

### 1.8 Later work that bears on the mapping

- Encore/Kappa (Castegren and Wrigstad, ECOOP 2016, DOI resolved through
  doi.org/DataCite, not Crossref): capabilities as composable building blocks
  (exclusive, safe, subordinate, locked, and so on) with locking disciplines,
  showing that Pony's lattice is one point in a larger design space [P7].
- Gordon et al. (OOPSLA 2012): `writable`, `readable`, `immutable`,
  `isolated`; recovery of `isolated` and `immutable` from methods whose
  inputs are all isolated or immutable, the origin of `recover` [P9].
- Milano, Turcotti, Myers (PLDI 2022): regions inferred rather than
  annotated; a region may be moved when it is isolated (no external
  references), and the type system tracks when it becomes isolated again
  after mutation [P10]. This is the inference-heavy alternative to `iso` and
  the model Swift followed (SE-0414, secondary).
- Verona (Arvidsson et al., OOPSLA 2023, DOI verified): objects partitioned
  into a forest of isolated regions; a thread mutates within one active
  region at a time (its "window of mutability"), memory management is per
  region, and a smaller capability set (`iso`, `mut`, `imm`, `readonly`)
  replaces Pony's six [P11]. Behaviour-Oriented Concurrency (Cheeseman et
  al., OOPSLA 2023, DOI verified): behaviours declare the `cown`s they need
  and run when they hold them all, deadlock-free and ordered [P8]. Both are
  by Pony's designers and both move away from per-reference capabilities
  toward regions, which supports Beskid's per-type choice.

### 1.9 Ergonomics evidence

- The Pony project's own learning guide states that reference capabilities
  are the biggest stumbling block and that many learners conclude the
  language has too much type system or is too hard [P16].
- A 2023 Pony office-hours recap reports that attendees could explain `val`,
  `ref`, `iso` and `tag` from permissions, but struggled with `box` and
  `trn`, which only make sense in the deny framing [P17].
- Glacier's user study (Coblenz et al., ICSE 2017) found class-level
  transitive immutability (what Beskid's `[Immutable]` is) understood and
  used correctly more often than reference-level immutability (what `box`
  and viewpoint adaptation are) [P12, from REQ 3.4; DOI from memory].
- Verona's authors replaced the six capabilities by four plus regions [P11],
  and BoC replaced actors by behaviours over cowns [P8].

Conclusion for Beskid: keep the diagonal (`iso`, `val`, `tag`) and drop the
off-diagonal (`ref` as a special thing, `box`, `trn`) and the adaptation
table. The remaining concepts can be expressed with one keyword (`move`), two
type attributes (`[Immutable]`, `[Isolated]`) and one parameter modifier.

## 2. Mapping onto Beskid

### 2.1 Where Beskid already is Pony-shaped

| Beskid (locked) | Pony | Evidence |
| --- | --- | --- |
| one heap, one mutator per runtime instance; TLS-resolved | one heap per actor; one behaviour at a time | `Runtime/Mem/Gc/State.bd:87-100`; `Runtime/Sync/Channel.bd:52-54` ("foreign workers are not permitted to mutate this heap") |
| non-moving mark-sweep, stop-the-world per heap | non-moving, per actor, between behaviours | `Runtime/Mem/Gc/Collection.bd:1`; `Marking.bd:1-10` |
| foreign pointers ignored by marking | foreign objects handled by `mark_remote_obj` | `Marking.bd:116-119` (early return when the region is not in this heap) |
| descriptor-driven tracing with pointer maps | compiler-synthesised trace functions | `Marking.bd:146-181`; [P2 sec. 4.5.3] |
| per-binding affine analysis for `Fiber` | `consume` and ephemeral types | `crates/beskid_queries/src/semantic_contract/closures_spawn/fiber_ownership.rs:171-303` |
| `let` alias transfers ownership | `consume` into a new name | `fiber_ownership.rs:280-299` |
| branch-aware consumption, loops conservative | consumed variable is empty until reassigned | `fiber_ownership.rs:251-269` |
| captures of a lambda handed to `spawn` are one-shot | behaviour arguments | `fiber_ownership.rs:240-249` |
| write barrier only shades during marking | none | `Collection.bd:36-46` |
| external root handles `{pointer, generation}` | n/a | `Runtime/Mem/Gc/RootsHandles.bd:189-249` |
| value slot records owner heap | object address encodes owner | `Runtime/Mem/AbiValue.bd:7-8`; [P2 Fig. 11 line 2] |

Not Pony-shaped today and relevant: field assignment is legal on any field
(`crates/beskid_analysis/src/beskid.pest:422-431`, no field-level `mut`);
records are built by struct literal (`beskid.pest:468`), so there is no
constructor body to exempt; type descriptors carry only the array and UTF-8
view flags (`Objects.bd:59-61`, `aggregate_static.rs:507`); region lookup
sees only the current heap (`State.bd:136-150`).

### 2.2 Concept by concept

| Pony concept | Verdict | Beskid form |
| --- | --- | --- |
| `val` | adopt, per type | Shared: primitives, `string`, `[Immutable]` records, `ReadOnlyArray<T>` with `T : Shared` |
| `iso` | adapt | Moved: `T[]`, `List<T>`, `[Isolated]` records; `move`; plus the alias discipline of 2.3 (owning vs borrowed places) |
| `ref` | adopt as the default | every non-transferable type; no annotation; never crosses a boundary |
| `box` | reject | per-type immutability (Glacier) replaces read-only views; a "cannot store or send this" guarantee comes from borrowed parameters, not from a capability |
| `trn` | reject | build a Moved graph, then `Freeze` it by `move` into a Shared type (2.2.4) |
| `tag` | adapt, no new class | identity-only handles are `[Immutable]` records over process-wide ids (`Port<T>`, `Isolate`, `Task<T>` handles); they derive Shared through `transfer_class`; `Fiber`/`Channel` stay Never because their ids are scheduler-local (REQ 2.8) |
| viewpoint adaptation | adopt the two rows that survive, as three rules | 2.2.1 |
| `consume` | adopt | `move x` on an owning local or parameter; `let y = x` on a Moved value transfers ownership (already the Fiber rule) |
| destructive read | adapt | `move x.f` allowed when the field type has a canonical empty value (`Option<T>`, `T[]`, `List<T>`): the field is left empty; otherwise `exchange(x.f, move v)` returns the old value |
| ephemeral `iso^` | adopt silently | an "owned expression": call result, struct literal, `move x`; may be bound, stored, passed to a `move` parameter, returned; no syntax |
| `recover` | adapt | corelib functions with `move` parameters that return Shared (`ReadOnlyArray.Freeze(move T[])`); the compiler's uniqueness guarantee replaces the sendable-only scope |
| automatic receiver recovery | not needed | there are no receiver capabilities; methods on `[Isolated]` types take a borrowed or owning `this` (2.3) |
| sendable = diagonal | adopt | `Transferable = Shared | Moved | Copied`; Copied is Beskid's addition for plain data (Erlang-style), which Pony lacks |
| behaviours | adapt | `Port<T>.Send` into a long-lived isolate's receive loop (0.6.4); no actor classes |
| atomic behaviours | partially | fibers inside an isolate are cooperative; the ORCA requirement is only I1, which the transfer classes give |
| causal delivery | adopt narrowly | count messages for one owner go through that owner's FIFO mailbox, enqueued synchronously (2.4.4) |
| ORCA LRC/FRC/INC/DEC | adopt | 2.4 |
| `markimmut` and shallow marking | adopt | 2.4.2 |
| cycle detector (MAC) | reject | structured scopes; heap adoption at join (2.5) |

#### 2.2.1 Viewpoint adaptation collapses to three rules

Because immutability and isolation are properties of types, not references,
the origin of a field read is known from the receiver's type and the result
from the field's type. Only two origins carry a guarantee:

1. Field of an `[Immutable]` object: its type is Shared by construction
   (0.6.1 rule), so the result is Shared. This is Pony's `val` row.
2. Field of Shared type read through an `[Isolated]` object: Shared. Pony's
   `iso`/`val` cell.
3. Field of Moved type read through an `[Isolated]` object (or an element of
   a `T[]` with `T` Moved): the result is a borrow, a non-owning name that
   may be read and mutated but not stored, captured, returned or `move`d.
   Pony gives `iso` for the unbound path and `tag` for a bound alias; Beskid
   gives a borrow for both, which is more permissive for reads and equally
   safe, because the borrow cannot escape (2.3).

There is no fourth case: an `[Immutable]` type cannot have Moved fields, and
ordinary types have no rules. No table is shown to users.

#### 2.2.2 `consume`, `move`, and places

Pony distinguishes variables (consumable) from fields (destructively
readable). Beskid's `move` should follow the same split: `move x` for owning
locals and parameters; `move x.f` only for fields whose type has a canonical
empty value, leaving the field empty; `exchange(x.f, move v)` for the rest.
The reason is the same as Pony's: another alias of `x` may read `x.f` after
the move, so the field must hold a valid value. Arrays and lists have an
obvious empty; a `[Isolated]` field of a user type does not.

#### 2.2.3 Ephemeral values need no syntax

A Pony `iso^` is a value with no name. In Beskid every expression that is not
a place (a call result, a struct literal, `move x`) produces an owned value;
binding it with `let` creates the owning name, passing it to a `move`
parameter transfers it, storing it into a field or element transfers it,
returning it transfers it to the caller. Reading a place of Moved type
produces a borrow. The analysis is the existing one in `fiber_ownership.rs`
with two additions: a borrow category, and consumption at stores, owning
parameters and returns (2.3).

#### 2.2.4 `recover` becomes `Freeze`

How Beskid builds an immutable record today: by struct literal, with every
field value already available (`beskid.pest:468`); after 0.6.1 every field of
an `[Immutable]` type must be Shared, so a record cannot contain a mutable
array. The gap Pony fills with `recover` is "build a collection by mutation,
then share it". The minimal Beskid answer, needing no new rule, is a corelib
function whose parameter is owning:

```beskid
pub type ReadOnlyArray<T> {
    T[] items,

    /// The caller gives up the array; no other alias can exist, so the
    /// result may be shared by pointer.
    pub static ReadOnlyArray<T> Freeze(move T[] items) {
        return ReadOnlyArray<T> { items: items };
    }
    pub i64 Count() { return Array.Len<T>(this.items); }
    pub T Get(i64 index) { return Array.Get<T>(this.items, index); }
}
```

`ReadOnlyArray<T>` is `[Immutable]` with one exemption the compiler must
grant: its single field is a `T[]` (Moved type) that no method writes. The
transfer class of `ReadOnlyArray<T>` is Shared when `T` is Shared (ruling 7).
This is Pony's `consume val x` and Gordon's isolated-to-immutable step [P9]:
uniqueness at the moment of freezing is what makes the result safe to share.
A general `Freeze<T>(move T) where T: Moved` into "an immutable view of T"
would need read-only views (`box`) and is rejected; `[Immutable]` types with
`ReadOnlyArray` fields cover the collections case.

### 2.3 Is `[Isolated]` plus `move` enough? No: the alias discipline

Pony's `iso` is sound because of three rules working together [P1 sec. 2]:
(a) a new alias of an `iso` is a `tag` (so the only way to keep using the
object under a new name is `consume`), (b) storing into a field through an
`iso` path requires the stored value to be unaliased (safe-to-write), and
(c) passing an argument is alias creation, so passing an `iso` without
`consume` gives the callee a `tag`. Beskid's locked plan has only the
`consume` half: `move x` kills the binding `x`, and after `move x` "no
binding in the sender can reach the moved graph" (v062 proposal). Bindings
are not the only paths. Three counterexamples in today's Beskid:

1. Field alias before the move. `this.cache = data; s.Spawn(() => Work(move data));`
   The binding is dead, the field still points at the graph. In 0.6.3 this
   is harmless (the graph is copied); in 0.6.5 the field and the child
   isolate share a mutable array.
2. Corelib aliasing. `List<T>.Push` returns `List<T> { storage: nextStorage,
   count: ... }` (`List.bd:24-27`) and `Storage.AppendAt` appends in place
   when `Array.Len(storage) == logicalEnd` and returns the same array
   (`Storage.bd:10-15`). `List<T> l2 = l.Push(x);` then `move l2` into an
   isolate leaves `l` sharing the storage. Every "linear" corelib collection
   has this shape.
3. Callee retention. `Register(list)` where `Register` stores its parameter
   into a field. The caller's binding is untouched, and both reach the
   array.

So the per-binding analysis must become a per-place discipline for Moved
class values, which is Haller and Odersky's uniqueness with borrowing
(ECOOP 2010) and Pony's aliasing rule restated:

- Owning names: a `let` or parameter declared with `move` (`move T[] data`),
  a `let` bound to an owned expression, a field of an `[Isolated]` or
  ordinary type holding a Moved value (the containing object owns it).
- Borrowed names: a parameter of Moved type without `move`; a `let` bound to
  a place read (`let s = list.storage`, `let e = arr[i]` when `T` is Moved);
  `this` in a method unless declared `move this`.
- Consuming uses (require an owning name; kill it): `move x`; passing `x` to
  a `move` parameter; storing `x` into a field or element; returning `x`;
  capturing `x` in a `[Captures(Transferable)]` lambda (needs explicit
  `move`, the REQ P0305 rule); `let y = x` (transfer, as today for Fiber).
- Borrow restrictions: a borrowed name may be read, mutated, passed to a
  borrowed parameter, and used as a method receiver; it may not be
  consumed (new diagnostic, 3.2).
- Revival: assigning to a consumed binding makes it owning again (Pony's
  "empty until written"; 0.6.2 tasks already mention reassignment in loops).
- Returning: a function may return an owned expression or an owning name;
  returning a borrowed name is an error. Fluent chains (`list.Push(a).Push(b)`)
  work because each call result is owned.

What this means for corelib: `List<T>` and the other linear collections
declare their self-returning methods on an owning receiver (`move this`), so
`List<T> l2 = l.Push(x)` consumes `l`, which is what the doc comment already
promises ("callers keep using the returned value", `List.bd:3-4`). Code that
reads `l` after `l.Push` becomes a compile error (it was reading a stale
count anyway). Alternatively the collections become in-place mutators (`unit
Push(T)` on a borrowed `this`); either is sound, the first keeps today's
fluent style. Decision 3.4-D3.

Answers to the three questions in the brief:

- Can a Moved graph hold internal aliases and cycles? Yes. External
  uniqueness (Clarke and Wrigstad, ECOOP 2003) is exactly "one external
  owner, free internal aliasing", and ORCA traces with epoch marks so
  cycles and shared sub-objects are visited once [P2 Fig. 11 line 9].
  `Transit.bd` (0.6.3) needs the same visited table.
- Can a moved `T[]` alias an element reachable elsewhere? If `T` is Shared,
  yes, that is the point of sharing (each element gets an FRC entry at
  receive, or is covered by the scope root in 0.6.3). If `T` is Moved, no:
  storing an element consumes the stored name, and reading an element yields
  a borrow, so the only external path to an element is through the array.
  `[Isolated]` fields that are neither Shared nor Moved are already rejected
  by `transfer_class` (0.6.1), so a Moved graph never contains a `Fiber`
  handle, a `pointer`, or an ordinary mutable record.
- Does Beskid need `iso`'s alias tracking? It needs the consequences (stores,
  passes and returns consume; reads borrow), not the mechanism (capability
  per reference, alias types `iso!`, ephemeral `iso^`). The checks are
  syntactic and local to a callable, like `fiber_ownership.rs`.

Rulings affected: ruling 6's 0.6.2 line ("the move analysis supplies `iso`")
is confirmed in intent and amended in content: the analysis must include the
place discipline above, or 0.6.5 hand-over is unsound. Nothing else in 0.6.2
changes.

### 2.4 Closing the 0.6.5 question: who traces a handed-over mutable graph

#### 2.4.1 The ORCA answer, restated for Beskid

Take parent P handing a `List<Node>` graph G (all objects allocated in P's
heap) to child C by pointer.

1. At hand-over (send), P walks G with its descriptors (`TraceObjectFields`,
   `Marking.bd:148-181`) and gives every object in G an LRC entry
   (count 1, epoch stamped). Shared sub-objects (strings, `[Immutable]`
   records) get an entry and are not entered. Cost: one visit per object of
   G, no allocation. For a `T[]` of primitives it is one object.
2. At receive, C walks G the same way and records an FRC entry per object
   (owner P). For Shared sub-objects C records the root entry only.
3. C's collector (`ProcessMarkWork`, `Marking.bd:247-264`) reaches a pointer
   into P's regions. Today `GcMarkGray` returns (`Marking.bd:116-119`).
   Instead: resolve the owner through the process-wide region map (0.6.1),
   stamp C's FRC entry for the object with the current epoch (so unreached
   entries can be decremented afterwards), and if the object's descriptor is
   not flagged immutable, trace its fields with `TraceObjectFields`, because
   C may have stored C-owned objects into G. If the descriptor is immutable,
   stop: P traces it.
4. P's collector, before sweeping: for every LRC>0 entry whose descriptor is
   immutable, mark and trace (ORCA `markimmut`); for every LRC>0 entry whose
   descriptor is mutable, set both the mark bit and the scanned bit in the
   span bitmap (`SPAN_MARK_BITS`, `SPAN_SCANNED_BITS`, `Marking.bd:24-25`)
   so `DrainSpan` (`Marking.bd:203`) skips it; for large objects set the
   header state to black directly (`Marking.bd:127-133, 232`). P never reads
   G's fields while C may be mutating them. This is the "shallow" bit of
   `sweeporcs` [P2 Fig. 10].
5. When C's collector finds entries not stamped this epoch, it sends one DEC
   per owner with the summed counts through P's mailbox and drops them. When
   P's LRC for an object reaches 0 and the object is locally unreachable, the
   next P collection frees it.
6. If C hands G onward to D, C decrements its FRC entries (or inflates and
   sends INC to P when a count would reach 0), and D records FRC entries at
   receive; P's LRC is untouched until a DEC arrives.

The 0.6.4 proposal's "the receiver's collector converts the foreign
references it recorded into decrements" is step 5, and its "external count
table whose entries are GC roots" must be read as "shallow roots for mutable
entries, traced roots for immutable entries", which is the amendment to
ruling 6.

#### 2.4.2 Fit with the existing code

| Need | Exists | Change |
| --- | --- | --- |
| owner of a foreign pointer | `FindHeapRegionContaining` walks one heap (`State.bd:136-150`) | 0.6.1 process-wide region-to-owner map (already in v061) |
| mutable vs immutable type at runtime | descriptor flags: array, UTF-8 view only (`Objects.bd:59-61`; `aggregate_static.rs:507`) | one flag bit `TYPE_DESCRIPTOR_IMMUTABLE`, set for `[Immutable]` types and for the string record; arrays never have it; `ReadOnlyArray<T>` has it on the record, and its backing array is reached only through it, so P traces into the array during `markimmut` and C stops at the record |
| shallow marking | span `mark` and `scanned` bitmaps; large-object header state | set both bits; no new state |
| per-object counts | handle slots `{pointer, generation}` (`RootsHandles.bd:189-249`) | a new address-keyed table with `{count, epoch, immutable}` per entry (`Runtime/Mem/Gc/Foreign.bd`), one for LRC (own objects) and one for FRC (per owner) |
| reading foreign metadata | `ManagedObjectForReference` reads this heap's span directory (`Marking.bd:35-74`) | call it with the owner's heap pointer; read span words with the 0.6.1 atomic load intrinsic, since the owner's sweep may concurrently flip other bits in the same word; the bit for an object with LRC>0 is stable because the owner never frees it |
| write barriers | `GcWriteBarrier(parent, child)` shades `child` in the current heap only during marking (`Collection.bd:36-46`); `ArrayWriteBarrier` (`Runtime/Data/Collections.bd:233-238`) | none: a store of a C-owned child into a P-owned parent shades the child in C's heap, which is correct; P's collector does not look inside the parent object (I1) |
| never mark a foreign header | `GcMarkGray` writes the mark word of large objects (`Marking.bd:132`) | the foreign path must never write into the owner's heap or span directory; all marking state for foreign objects lives in C's FRC table |
| Phase A (one mutator per heap) | `Channel.bd:52-54` | preserved: C mutates objects that live in P's regions, but P's allocator and collector never touch those objects' contents, and C never allocates in P's regions |

What does change in Phase A terms is the spec sentence: "one mutator per
heap" becomes "one mutator per object at any time, and one allocator and
collector per heap". That is I1, and it should be written into
`memory-and-gc-runtime-contract` in 0.6.1 next to the non-moving rule.

#### 2.4.3 Scope captures (0.6.3) are a special case that stays

Shared captures rooted by the scope frame in P and treated as leaves by C
are sound without counts: an immutable object cannot come to point at a
C-owned object, and any sub-object C copies a reference out of is also
reachable from the rooted root, so P keeps it alive while the scope lives.
The 0.6.3 design is a correct ORCA specialisation (a count of 1 held by the
frame and released at join). The recording of foreign references during C's
marking (v063 task 2.4) is the FRC table of 2.4.2, so it should be built as
that table from the start.

#### 2.4.4 Causality in Beskid

ORCA needs INC(o) to reach the owner before any DEC(o) that depends on it.
Pony's argument [P2 sec. 3.1, 5.4] needs only: sends are synchronous
enqueues, each receiver's queue is FIFO, and program order within a sender.
Beskid's owner mailbox (`external_wait.h:76-135`, REQ 2.7) is a locked FIFO
with synchronous posting. The rule for Beskid is therefore local: every INC
and DEC addressed to owner P is posted to P's mailbox, and an INC is posted
before the application message that needs it is enqueued on any port. Port
rings can stay separate from the mailbox: in the B, C, A scenario the INC is
in A's mailbox before B's port send completes, C's DEC is posted after C
dequeued that message, and A's mailbox is FIFO, so INC precedes DEC. Ruling
11 (fiber-cooperative receive, bounded ports) is unaffected.

### 2.5 Cross-isolate cycles

- Object cycles across heaps: no special treatment, as in ORCA [P2 sec. 5.6].
  They can only arise through mutable hand-over (C stores a C object into a P
  object, then hands the graph back), and every participant's next collection
  sends its DECs.
- Isolate cycles: Pony needs the MAC cycle detector because actors are
  reference counted and never structurally owned [P3]. Beskid isolates are
  owned by a `Scope` and cannot be detached (ruling 8, SOTA 9.3); a long-lived
  0.6.4 isolate is a `Pipeline` stage owned by a scope. Isolate lifetime is
  therefore structural and no detector is needed. Reject MAC.
- Zombie heaps: the 0.6.4 proposal keeps an exited isolate's heap alive until
  its LRC entries reach zero. Two exited heaps whose only remaining objects
  point at each other would never be collected (nobody runs their
  collections). Recommendation: at join, the parent adopts the child's heap
  regions: relink the regions into the parent heap's chain
  (`HEAP_FIRST_REGION`, `State.bd:140-147`), update the region-to-owner map,
  merge count tables (child FRC entries that name the parent are deleted
  together with the parent's matching LRC entries; child FRC entries naming
  third parties are added to the parent's FRC table; child LRC entries become
  parent LRC entries). The non-moving collector means no pointer is
  rewritten, the same property ORCA relies on. This removes zombies for
  every scope child, makes a Moved or Shared task result O(1) (no copy, no
  count traffic), and is the MaPLe join-adopt that SOTA 5 identified as the
  copy-avoidance target. Cost: the parent inherits the child's garbage until
  its next collection, which is bounded by `BESKID_HEAP_MAX` per isolate
  (ruling 9). Heap retention remains only for 0.6.4 long-lived isolates that
  are cancelled while a sibling still holds references; those are joined by
  their scope too, so adoption covers them as well.

## 3. Scope deltas, diagnostics, syntax, decisions

### 3.1 Deltas per release

0.6.1 `v061-attributes-and-isolate-prerequisites`

- Add: parameter modifier `move` in the grammar (`Parameter` gains an optional
  `move` before the type; `this` may be written `move this`). It is a
  modifier like `mut`, not an attribute, because it changes the calling
  convention of ownership, and 0.6.2's rules need it in place.
- Add: `TYPE_DESCRIPTOR_IMMUTABLE` flag emitted for `[Immutable]` types and
  the string record (`aggregate_static.rs`); runtime accessor in
  `Objects.bd`.
- Add to the memory spec, beside the non-moving rule and the foreign
  reference definition: I1 as a normative sentence ("an object that one
  runtime instance may write is not readable or writable by any other"),
  and "one allocator and one collector per heap; one mutator per object".
- Add: `[Immutable]` is allowed on `ReadOnlyArray<T>` with an array field
  because no method writes it (an explicit compiler exemption, or a
  corelib-only `[ImmutableStorage]` attribute on that field; recommend the
  field attribute, since 0.6.1 adds attributes on fields and it names the
  obligation).
- Keep: everything else as proposed.

0.6.2 `v062-captures-and-move`

- Amend "`move x` and use-after-move" to the place discipline of 2.3:
  owning and borrowed names, consumption at stores, owning parameters,
  returns and captures, borrow restrictions, revival by assignment.
- Add: `move x.f` for fields with a canonical empty (`Option<T>`, `T[]`,
  `List<T>`), and `exchange(place, move value)` as a builtin returning the
  old value (the destructive read).
- Add: corelib collections (`List`, `Queue`, `Stack`, `Set`, `Map`,
  `PriorityQueue`, `HashTable`, `I64Map`, `StringMap`) declare their
  self-returning methods on `move this`; `Array.Append` and friends take a
  borrowed array. This is corelib work and the first real test of the rule.
- Add diagnostics (3.2).
- Remove: nothing.

0.6.3 `v063-isolates-and-scope`

- Add: `ReadOnlyArray.Freeze(move T[])` (ruling 7 amended: `ReadOnlyArray`
  ships with its freeze constructor; there is no other way to build one).
- Add: the FRC table (`Runtime/Mem/Gc/Foreign.bd`) as the structure in which
  the child's marking records foreign references (task 2.4), so 0.6.4 adds
  counts to an existing table instead of replacing a list.
- Add: heap adoption at join for child isolates (2.5), which replaces "all
  task results are still copied" for Moved and Shared results. Copied
  results are deserialised as planned. If adoption is judged too large for
  0.6.3, it moves to 0.6.5 and results stay copied; the decision is D7.
- Keep: scope-frame rooting of Shared captures; `Transit.bd` for Copied.

0.6.4 `v064-ports-and-pipelines`

- Amend: "external count table whose entries are GC roots" becomes "LRC
  table; mutable entries are shallow roots, immutable entries are traced
  roots" (2.4.1 step 4).
- Add: the causality rule of 2.4.4 as a normative sentence on the mailbox.
- Add: `Port<T>` and `Isolate` handles are `[Immutable]` records over
  process-wide ids (Pony `tag`); their Shared class is derived, not special.
- Remove: "heap retention after isolate exit" for scope-owned isolates once
  adoption exists; keep it only as the fallback described in 2.5.

0.6.5 `v065-parallel-sequences`

- Replace task 2.4 "Design and implement pointer hand-over" by the protocol
  of 2.4.1 with its six steps and the table of 2.4.2; the design is done.
- Add: owner-side `markimmut` and shallow marking before sweep; child-side
  tracing through foreign mutable objects; INC/DEC on forward hand-over.
- Add: a `TypeDescriptorImmutable` check in `Transit.bd` so that the copier
  and the tracer agree on what is a leaf.
- Keep: cost table Shared O(1), Moved O(1) for hand-over plus O(objects) for
  tracing at send and receive (state this honestly: a `List<Node>` of a
  million nodes costs two walks, not zero; a `u8[]` costs one entry).

### 3.2 Diagnostics (continuing the closure/spawn block at E1234, ruling 5)

Numbers are proposals; the registry owns the final assignment.

| Code | Condition | Release |
| --- | --- | --- |
| E1234 | use of a Moved-class or `Fiber` value after it was consumed (replaces the Fiber-only `UseAfterMove` rendering) | 0.6.2 |
| E1235 | `[Captures]` lambda assigns a captured local | 0.6.2 |
| E1236 | `[Captures]` lambda captures a value that is not Transferable (names the first offending field) | 0.6.2 |
| E1237 | `[Captures]` lambda captures a Moved value without `move` | 0.6.2 |
| E1238 | `[Captures]` argument is not a lambda literal or function item | 0.6.2 |
| E1239 | `move` applied to a name that is not an owning Moved-class name (a Shared, Copied, ordinary or borrowed name) | 0.6.2 |
| E1240 | Moved value consumed inside a loop without reassignment before the next iteration | 0.6.2 |
| E1241 | borrowed Moved value escapes: stored into a field or element, returned, captured, passed to a `move` parameter | 0.6.2 |
| E1242 | Moved value stored, passed to a `move` parameter or returned without being owned at that point (the implicit-alias case; the help says "write `move x`") | 0.6.2 |
| E1243 | `move x.f` on a field whose type has no canonical empty value (help: `exchange`) | 0.6.2 |
| E1244 | field of an `[Immutable]` type is not Shared (except an `[ImmutableStorage]` array field) | 0.6.1 |
| E1245 | assignment to a field of an `[Immutable]` object outside its struct literal | 0.6.1 |
| E1246 | `[Copyable]` or `[Isolated]` on a never-transferable type (`Fiber`, `Channel`, locks, Glue owners, `pointer` fields) | 0.6.1 |
| E1247 | method on an `[Isolated]` type returns `this` or a field of Moved type from a borrowed receiver | 0.6.2 |

### 3.3 Fluent examples of the Pony-derived surface

Syntax follows corelib conventions (`pub type`, type-first locals, lambdas,
`match`). Names are proposals.

Freeze a built collection and share it (Pony `recover`):

```beskid
use Core.Collections;
use Core.Parallel;

ReadOnlyArray<string> LoadWords(string path) {
    string[] words = Array.Empty<string>();
    for (string line in File.Lines(path)) {
        Array.Append<string>(words, line.Trim());
    }
    return ReadOnlyArray.Freeze(move words);      // words is dead from here
}

i64 CountLong(ReadOnlyArray<string> words) {      // Shared: passed by pointer
    return words.Parallel().Where((w) => w.Length() > 8).Count();
}
```

Hand a mutable graph over and get it back (Pony `iso` round trip):

```beskid
[Isolated]
pub type Index {
    List<string> terms,
    i64[] offsets,
}

Result<Index, ParallelError> BuildAndSort(move Index index) {
    return Parallel.Scope((s) => {
        Task<Index> t = s.Spawn(() => Sorter.Sort(move index));  // O(1) hand-over in 0.6.5
        return t.Join()?;                                        // owned result, adopted at join
    });
}
```

Borrow versus own in signatures (Haller and Odersky's rule, Pony's `tag`
alias made useful):

```beskid
i64 Checksum(u8[] data) {                 // borrowed: may read and mutate, cannot keep
    mut i64 sum = 0;
    for (u8 b in data) { sum = sum + b; }
    return sum;
}

pub type Archive {
    List<u8[]> blocks,

    pub Archive Add(move this, move u8[] block) {   // owning receiver and parameter
        this.blocks = this.blocks.Push(move block); // store consumes `block`
        return this;
    }
}

unit Use(u8[] buffer, Archive archive) {
    i64 c = Checksum(buffer);                // fine: borrowed
    Archive a2 = archive.Add(move buffer);   // archive and buffer are dead; a2 owns both
    Log.Info(c + " " + buffer.Length());     // error[E1234]: `buffer` consumed by `move buffer`
}
```

Destructive read of a field (Pony `b = (f = consume a)`):

```beskid
[Isolated]
pub type Stage {
    Option<u8[]> pending,

    pub Option<u8[]> Take(move this) {
        return move this.pending;                       // field left as Option::None
    }
    pub u8[] Swap(mut this, move u8[] next) {
        return exchange(this.pending, Option::Some(move next)).UnwrapOr(Array.Empty<u8>());
    }
}
```

Long-lived isolate with an inbox (Pony actor with a behaviour; 0.6.4):

```beskid
[Immutable]
pub type Job { string id; ReadOnlyArray<u8> payload; }

Result<i64, ParallelError> RunWorkers(List<Job> jobs) {
    return Parallel.Scope((s) => {
        Port<Job> inbox = s.Port<Job>();              // the handle is Shared (Pony tag)
        Port<i64> done = s.Port<i64>();
        s.Spawn(() => {
            mut i64 n = 0;
            for (Job j in inbox) { Store.Write(j); n = n + 1; }   // receive loop = behaviours
            done.Send(n);
        });
        for (Job j in jobs) { inbox.Send(j); }       // Job is Shared: pointer, one INC per batch
        inbox.Close();
        return done.Receive()?;
    });
}
```

Diagnostics the user sees for the new cases:

```text
error[E1242]: `block` must be moved to be stored
  --> src/Archive.bd:9:38
   |
 9 |         this.blocks = this.blocks.Push(block);
   |                                        ^^^^^ a Moved value stored here keeps a second owner alive
   = note: `u8[]` is a Moved type; a stored value must have exactly one owner
   = help: write `this.blocks.Push(move block)`

error[E1241]: borrowed value `data` cannot escape
  --> src/Keep.bd:3:22
   |
 2 | unit Keep(u8[] data, Archive a) {
   |           --------- `data` is borrowed here (no `move` on the parameter)
 3 |     a.blocks = a.blocks.Push(move data);
   |                              ^^^^^^^^^ moved here
   = help: declare the parameter `move u8[] data` and move it at the call site
```

### 3.4 Decisions to lock, with recommendations

- D1 Alias discipline in 0.6.2. Recommend yes, full form of 2.3 (owning and
  borrowed names; stores, owning passes, returns and captures consume;
  reads borrow). Without it 0.6.5 hand-over is unsound; with it 0.6.5 flips
  the runtime only.
- D2 Spelling of the owning parameter. Recommend the `move` modifier on
  parameters and on `this` (`move T[] data`, `move this`), mirroring the
  call-site `move x`. Alternative `[Owned]` attribute: rejected because
  ownership changes the calling contract and should look like `mut`, not
  metadata.
- D3 Corelib collections. Recommend owning receivers on the self-returning
  methods (keeps the fluent linear style and the documented contract).
  Alternative: in-place mutators on a `mut this`. Either way `List<T>` stops
  sharing storage across two live values.
- D4 Destructive read. Recommend `move x.f` for fields of `Option<T>`, `T[]`,
  `List<T>` (leaves the empty value), plus `exchange(place, move v)` as a
  builtin. Reject Pony's "assignment returns the old value" because Beskid
  assignment is an expression with `+=`/`-=` forms (`beskid.pest:430`) and
  silently changing its value is a trap.
- D5 Freeze. Recommend `ReadOnlyArray.Freeze(move T[])` in 0.6.3 and no
  general `Freeze<T>`. Revisit after `[Isolated]` types have been used.
- D6 Descriptor immutability flag in 0.6.1. Recommend yes; it is one word in
  `aggregate_static.rs` and the runtime cannot otherwise tell a leaf from a
  graph.
- D7 Heap adoption at join. Recommend 0.6.3 if the count-table merge is
  small enough (it is a table rename when no third party is involved);
  otherwise 0.6.5, with task results copied in between.
- D8 Owner-side treatment of LRC>0 entries. Recommend ORCA exactly: trace
  immutable entries, shallow-mark mutable entries. Lock as the answer to
  v065 task 2.4.
- D9 Receiver-side tracing. Recommend ORCA exactly: trace through foreign
  mutable objects, stop at foreign immutable objects; record FRC entries in
  the receiver's table only; never write into the owner's heap or span
  directory; read owner metadata with atomic loads.
- D10 Causality. Recommend the narrow rule of 2.4.4; no merging of port
  rings into the mailbox.
- D11 Cycle detector. Recommend none; isolates are structured. Document the
  only residual leak (long-lived isolate cancelled while a sibling holds
  references, before adoption) and let adoption at scope exit close it.
- D12 Viewpoint adaptation. Recommend the three rules of 2.2.1 as spec text
  with no table; `box` and `trn` are not adopted and the spec says why
  (per-type immutability, Glacier evidence).
- D13 `tag`. Recommend no new class: handles are `[Immutable]` records over
  process-wide ids; `Fiber`/`Channel` stay Never.
- D14 Honest cost table. Recommend publishing Moved hand-over as O(1)
  transfer plus O(objects) tracing at send and receive, and Shared as O(1)
  plus O(roots) at receive; it is still far cheaper than copying and users
  of parallel streams fail precisely when costs are hidden (SOTA [S33]).

### 3.5 What Beskid deliberately does not take from Pony, and why

- Per-reference capabilities (`ref`, `box`, `trn`, viewpoint adaptation,
  alias types, ephemeral annotations). Beskid's transfer class is a property
  of a type; a reference carries nothing. This removes the two capabilities
  learners cannot explain [P17], the annotation burden the Glacier study
  measured [P12], and the whole adaptation table, at the cost of one
  expressiveness gap (mutate-then-freeze an arbitrary record), which `Freeze`
  on arrays and literal construction of `[Immutable]` records cover.
- `recover` blocks. The guarantee they provide (no outside alias) is what
  `move` already provides for Moved values; a corelib function with a `move`
  parameter is the whole feature.
- Actors and behaviours as language constructs. Isolates plus ports plus
  fibers give the same model as library code, and scopes give structured
  lifetimes that actors lack; failure flows up and cancellation flows down
  (ruling 8).
- The actor cycle detector [P3]. Structured ownership makes it unnecessary.
- Collecting only between behaviours. Beskid collects at allocation with a
  rooted stack (`Runtime/Mem/Gc/Allocation.bd`, REQ 2.7); ORCA does not
  require Pony's choice, only I1.
- Assignment returning the old value. Replaced by `exchange`.
- Pony's lack of a plain-data copy class. Beskid keeps Copied (`[Copyable]`),
  the Erlang path, because small messages are common and copying them is
  cheaper than counting them (SOTA [S20, S21]).

## 4. Sources

Primary, peer reviewed. DOIs marked (C) resolved through the Crossref API on
2026-10-13; (D) resolved through doi.org (DataCite registrant); (M) from
memory, not re-resolved; (U) no DOI found.

- [P1] Sylvan Clebsch, Sophia Drossopoulou, Sebastian Blessing, Andy McNeil.
  Deny Capabilities for Safe, Fast Actors. AGERE 2015.
  https://doi.org/10.1145/2824815.2824816 (C). Text read from the authors'
  extended version with proofs (ponylang.io/media/papers/fast-cheap-with-proof.pdf).
- [P2] Sylvan Clebsch, Juliana Franco, Sophia Drossopoulou, Albert Mingkun
  Yang, Tobias Wrigstad, Jan Vitek. Orca: GC and Type System Co-Design for
  Actor Languages. OOPSLA 2017, PACMPL 1, article 72.
  https://doi.org/10.1145/3133896 (C).
- [P3] Sylvan Clebsch, Sophia Drossopoulou. Fully Concurrent Garbage
  Collection of Actors on Many-Core Machines. OOPSLA 2013.
  https://doi.org/10.1145/2509136.2509557 (C).
- [P4] Juliana Franco, Sylvan Clebsch, Sophia Drossopoulou, Jan Vitek,
  Tobias Wrigstad. Correctness of a Concurrent Object Collector for Actor
  Languages. ESOP 2018, LNCS 10801, pp. 885-911.
  https://doi.org/10.1007/978-3-319-89884-1_31 (C). Text read from the
  authors' copy (janvitek.org/pubs/esop18.pdf), titled there "Soundness of a
  Concurrent Collector for Actors".
- [P5] Sylvan Clebsch, Sebastian Blessing, Juliana Franco, Sophia
  Drossopoulou. Ownership and Reference Counting based Garbage Collection in
  the Actor World. ICOOOLPS 2015 (workshop). (U); read from
  doc.ic.ac.uk/~scd/icooolps15_GC.pdf.
- [P6] Sylvan Clebsch. Pony: Co-Designing a Type System and a Runtime. PhD
  thesis, Imperial College London, October 2017.
  https://www.ponylang.io/media/papers/codesigning.pdf (U; not peer reviewed).
- [P7] Elias Castegren, Tobias Wrigstad. Reference Capabilities for
  Concurrency Control. ECOOP 2016, LIPIcs 56, article 5.
  https://doi.org/10.4230/LIPIcs.ECOOP.2016.5 (D).
- [P8] Luke Cheeseman, Matthew J. Parkinson, Sylvan Clebsch, Marios Kogias,
  Sophia Drossopoulou, David Chisnall, Tobias Wrigstad, Paul Lietar. When
  Concurrency Matters: Behaviour-Oriented Concurrency. OOPSLA 2023.
  https://doi.org/10.1145/3622852 (C).
- [P9] Colin S. Gordon, Matthew J. Parkinson, Jared Parsons, Aleks
  Bromfield, Joe Duffy. Uniqueness and Reference Immutability for Safe
  Parallelism. OOPSLA 2012. https://doi.org/10.1145/2384616.2384619 (C).
- [P10] Mae Milano, Joshua Turcotti, Andrew C. Myers. A Flexible Type System
  for Fearless Concurrency. PLDI 2022. https://doi.org/10.1145/3519939.3523443 (C).
- [P11] Ellen Arvidsson, Elias Castegren, Sylvan Clebsch, Sophia
  Drossopoulou, James Noble, Matthew J. Parkinson, Tobias Wrigstad.
  Reference Capabilities for Flexible Memory Management. OOPSLA 2023, PACMPL
  7, article 270. https://doi.org/10.1145/3622846 (C).
- [P12] Michael Coblenz, Whitney Nelson, Jonathan Aldrich, Brad Myers, Joshua
  Sunshine. Glacier: Transitive Class Immutability for Java. ICSE 2017.
  https://doi.org/10.1109/ICSE.2017.52 (M).
- [P13] Dave Clarke, Tobias Wrigstad. External Uniqueness Is Unique Enough.
  ECOOP 2003. https://doi.org/10.1007/978-3-540-45070-2_9 (M).
- [P14] Philipp Haller, Martin Odersky. Capabilities for Uniqueness and
  Borrowing. ECOOP 2010. https://doi.org/10.1007/978-3-642-14107-2_17
  (resolved in the SOTA document).

Secondary (not peer reviewed), used for language-level definitions and
implementation ground truth:

- [P15] ponyc runtime, `src/libponyrt/gc/gc.c` (main branch, read 2026-10-13):
  `mark_remote_object` recurses when `mutability == PONY_TRACE_MUTABLE` (or
  the type might reference an actor) and returns for `OPAQUE`;
  `ponyint_gc_markimmutable` traces owned immutable objects with `rc > 0`;
  `send_local_object` increments `rc` and recurses unless the object is
  known immutable; `send_remote_object` decrements or inflates with
  `GC_INC_MORE` and calls `acquire_object`; `recv_local_object` decrements,
  `recv_remote_object` increments.
- Pony tutorial (tutorial.ponylang.io), chapters Reference Capabilities,
  Consume and Destructive Read, Recovering Capabilities, Combining
  Capabilities, Aliasing, Capability Subtyping, Passing and Sharing, Actors.
- [P16] ponylang.io/learn/reference-capabilities (learning guide).
- [P17] ponylang.io blog, Last Week in Pony, 25 June 2023 (office-hours recap).
- Pony runtime FAQ (ponylang.io/faq/runtime) on message ordering.

Repository inputs: `docs/research/2026-10-13-isolate-parallelism-sota.md`;
`docs/research/2026-10-13-isolate-compiler-requirements.md`;
`openspec/changes/v061-attributes-and-isolate-prerequisites` through
`v065-parallel-sequences`; `docs/reports/2026-10-04-v06-decisions.md`
(entries of 2026-10-13); compiler files cited inline under `compiler/`.
