## Context

Beskid v0.4 has one intended allocation boundary: generated code calls the
manifest-derived ABI-v5 symbol `beskid_rt_v5_managed_object_allocate`, which
validates a compiler-emitted `BeskidAllocationRequest` and creates a zeroed
object with a precise descriptor.  The canonical runtime source corpus is
written in Beskid and is compiled through `TypedProgram` → `CodegenInput` →
ISLE → verified CLIF.  Raw platform allocation is an implementation detail of
that corpus, not a generated-program fallback.

The current standard still contains historical requirements for the Rust
`beskid_runtime`/Abfall implementation.  This change establishes the managed
allocation contract only; the companion ABI-v5 retirement change must replace
those historical implementation anchors before legacy code is deleted.  The
runtime remains Phase A: one mutator executes managed allocation and GC work;
parallel-mutator collection is not enabled by this change.

Stakeholders are code generation (which owns descriptor/request emission),
the canonical runtime (which owns validation, allocation, headers, roots and
collection), ABI tooling (which owns manifest-derived layouts and export
validation), and JIT/AOT hosts (which must load only an exact validated kit).

## Goals / Non-Goals

**Goals:**

- Define one fail-closed ABI-v5 allocation path for aggregate values and
  closure environments.
- Preserve the 40-byte `BeskidTypeDescriptor`, 24-byte
  `BeskidAllocationRequest`, and 16-byte `BeskidObjectHeader` layouts.
- Make descriptor validation deterministic, side-effect-free on rejection,
  and testable from codegen, runtime, JIT and AOT boundaries.
- Specify a Phase-A non-moving tri-colour mark/sweep collector with explicit
  roots and a no-op-compatible write-barrier interface that becomes active
  only under the separately specified Phase-B policy.
- Make every layout, symbol, static datum, and native artifact derive from
  `runtime_manifest.bsol` and prove that generated programs do not link a Rust
  runtime or raw allocator fallback.

**Non-Goals:**

- Escape analysis, object relocation/compaction, a moving collector, or
  concurrent/parallel mutators.
- A second allocation ABI, descriptor ABI bump, per-field runtime offset
  revalidation, or compatibility fallback to Rust `beskid_runtime`.
- Defining platform syscall, scheduler, channel, string, or collection
  semantics beyond the allocation and tracing interfaces they consume.

## Decisions

### One canonical allocation pipeline

`AllocateObject` is the only implementation of
`beskid_rt_v5_managed_object_allocate`.  Closure allocation delegates to it;
aggregate and closure callers differ solely in compiler-emitted descriptor
flags and pointer maps.  The runtime validates the request before reserving
memory, zeroes a successful allocation once, then writes the header once.

Rejected requests (null, malformed, mismatched, or unrepresentable) return a
null pointer and make no observable allocation or root registration.  A valid
request that the platform cannot allocate traps with code `5` and the exact
32-byte UTF-8 message `managed object allocation failed`; it never returns.
This distinguishes caller/ABI errors from resource exhaustion and removes the
previous ambiguous “null or trap” wording.

Alternative considered: make all failures trap.  Rejected because codegen and
kit conformance tests need a deterministic non-allocating validation outcome,
while OOM is not safely recoverable in the canonical runtime.

### Descriptor ownership and layout stability

The compiler emits immutable local static pointer maps, descriptors, and
requests.  `flags & 1 == 1` means aggregate and `flags & 1 == 0` means closure;
all other flag bits are reserved and must be zero until a new ABI version
defines them.  A descriptor is valid only when size includes the 16-byte
header, alignment is a power of two at least eight, pointer-map presence
matches count, and each pointer offset is aligned, starts after the header,
and names a pointer-sized field fully contained in the allocation.

The canonical runtime reads descriptor metadata but never changes it.  This
keeps scanning precise and allows static artifacts to be provenance-audited.
Alternative considered: self-describing mutable descriptors.  Rejected because
they would weaken AOT reproducibility and introduce an unversioned ABI surface.

### Phase-A collector and root discipline

The collector owns one non-moving heap and uses `gc_word` values white `0`,
gray `1`, and black `2`; unknown values are normalized to white during a
collection.  Root frames, registered global roots, and explicit external root
handles are the only tracing roots.  Allocation does not itself root a value;
lowering must use the manifest-approved root-frame surface whenever a value
survives an allocation-capable call.

`gc_write_barrier` is exported through the same manifest contract in Phase A.
It preserves ordering and records the required edge when marking is active,
but Phase A never enables multiple concurrent mutators.  Enabling Phase B is
outside this change and requires its own standard update and stress evidence.
Alternative considered: retain the Rust/Abfall collector as an internal
backend.  Rejected because it preserves two runtime authorities and contradicts
the ABI-v5 native-runtime retirement objective.

### Source-of-truth and conformance boundaries

`runtime_manifest.bsol` is the sole source for symbol names, ABI signatures,
layout constants, generated bindings, allowlists, and runtime-kit hashes.
OpenSpec is the sole source for observable allocation semantics.  The Beskid
runtime source implements the contract; tests prove it; generated ABI material
and package artifacts are derived evidence only.

Conformance is layered: unit tests cover validation and marking; compiler tests
cover static-data emission; runtime-kit tests cover canonical source and
archive provenance; JIT/AOT empty-prefix smokes cover exact-kit loading.  A
failure in any layer fails closed rather than selecting a legacy archive or
Rust-runtime fallback.

## Risks / Trade-offs

- [Canonical collector lacks a complete runtime source implementation] → Land
  allocation, roots, tracing, sweeping, and barriers together with reachability,
  cycle, pressure, and denial tests before any legacy runtime deletion.
- [Descriptor corruption could cause invalid scanning] → Validate every
  descriptor/request before allocation; keep descriptors immutable and include
  malformed fixture coverage in every supported target kit.
- [Phase-B assumptions leak into Phase A] → Keep one-mutator execution as the
  default and make Phase-B activation require a separate normative change and
  stress gate.
- [ABI/layout drift between source, codegen, and artifacts] → Generate all
  bindings and verifier inputs from the manifest; require artifact hash,
  allowlist, layout, and empty-prefix smoke gates.
- [Partial migration accidentally loads Rust runtime] → Keep provenance scans
  and Cargo dependency inspection as blocking release gates; delete fallback
  paths only after every consumer has migrated.

## Migration Plan

1. Add this design and tighten the allocation delta to its resolved validation
   and OOM rules; add supersession deltas that replace historical Rust/Abfall
   implementation requirements with the canonical ABI-v5 runtime authority.
2. Validate all OpenSpec changes and regenerate only the catalog content owned
   by this change after reconciling the existing unrelated dirty catalog work.
3. Implement manifest/layout tests first, then canonical allocation, roots,
   marking, sweeping, and barrier tests in isolated runtime work packages.
4. Migrate aggregate and closure static-data emission; prove JIT/AOT use the
   exact generated runtime kit and have no raw allocator or Rust-runtime
   fallback.
5. Build debug and release kits on Linux x86-64, macOS arm64, and Windows
   x86-64; run empty-prefix JIT/AOT smokes and provenance scans.
6. Only after all consumer migration and matrix evidence are green, remove the
   legacy runtime/bridge/host dependencies and their obsolete documentation.

Rollback before legacy deletion is a source-level revert of the change and its
derived kit artifacts; no mixed runtime kit is accepted.  After deletion,
rollback is a release rollback to the prior complete compiler/runtime set, not
reintroduction of a fallback path.

## Open Questions

None.  The OOM behavior, descriptor flags, Phase-A boundary, artifact authority,
and retirement sequence are deliberately fixed by this design.  Platform-specific
allocator and trap mechanics remain implementation details constrained by the
manifest and the same observable contract.
