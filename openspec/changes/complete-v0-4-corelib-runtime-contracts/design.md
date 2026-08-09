## Context

The current source has two partially connected designs. ABI-v5 already
declares `BeskidArray`, `BeskidArrayElementDescriptor`, rooted typed array
allocation, and array write barriers in `runtime_manifest.bsol`; however the
public collection source remains under `Collections.*`, collection methods are
largely placeholder-shaped, and historical specs still permit header-only
arrays through `arrays_backing`. Array literal lowering has a typed rooted
path, while dynamic collection growth has no manifest-owned operation.

`Core.FS` is already the intended public namespace, but its mutation helpers
return `Result<bool, FsError>`, `Exists` collapses status to `bool`, and the
canonical `Runtime/Host/Process.bd` filesystem wrappers currently return
fabricated null/false values. The manifest has filesystem intrinsic names, but
its current pointer/i32 shapes do not provide a complete typed read result or
distinguish a missing path from an adapter failure at the Corelib boundary.

The current Corelib project contains exactly 61 `Lib`/`Test` targets. The
single-process CLI matrix shares one engine but has no per-target timeout; the
spine harness permits ten minutes per entry and one hour overall. Release
evidence therefore needs both a bounded, diagnosable harness and a fresh full
matrix after semantics are implemented.

Normative behavior remains owned by OpenSpec. `runtime_manifest.bsol` owns ABI
names, signatures, layouts, capabilities, target bindings, allowlists, and kit
hash inputs. The canonical Beskid runtime owns adapter wrappers and managed
storage. Corelib owns public typed APIs. ISLE owns safe array access lowering.
No generated artifact or host implementation becomes a second authority.

## Goals / Non-Goals

**Goals:**

- Establish one public `Core.Collections.*` API and one implementation for
  each collection operation.
- Specify descriptor-preserving dynamic growth without an element-access ABI.
- Close managed construction root and barrier gaps for aggregate and
  collection pointer fields.
- Establish a complete typed `Core.FS` contract backed only by manifest-owned
  adapters on the three supported targets.
- Make `Result<Unit,E>`, the 61-target matrix, and the full native-kit matrix
  explicit release prerequisites.
- Delete every conflicting legacy obligation and implementation path after
  consumers migrate.

**Non-Goals:**

- Hash-table storage for `Map` or `Set`, concurrent collection mutation, a
  moving collector, memory-mapped files, directory enumeration, filesystem
  watching, asynchronous filesystem APIs, or targets beyond the existing
  three ABI-v5 triples.
- A compatibility namespace, an `array_get`/`array_set` ABI, a Rust host
  dispatcher, a source-tree kit fallback, or a semantic build feature that
  changes required collection behavior.
- Choosing platform-specific OS APIs in OpenSpec. Each selected target binding
  and its ordered OS-import allowlist are manifest data validated by the kit.

## Decisions

### Hard-cut the collection namespace and keep owning methods inline

All public collection modules, types, constructors, and methods move to
`Core.Collections.*`. `Collections.*` is rejected as unresolved after the
migration. Public receiver methods live inside the owning `pub type`; module
free functions remain only for genuine namespace constructors/helpers that do
not take a receiver. This prevents a compatibility facade from becoming a
second API implementation.

### Use one typed grow operation and direct ISLE element access

`runtime_manifest.bsol` declares
`beskid_rt_v5_array_grow_rooted(array: pointer, minimum_capacity: usize,
root_handle_out: pointer) -> pointer`. The runtime derives the immutable
element descriptor from the owned source array, validates stride, alignment,
pointer map, length, capacity, ownership, and all arithmetic, then returns a
rooted array whose initialized values and descriptor are unchanged. The source
array is never modified on failure. A successful no-reallocation result is
also rooted and follows the same finish protocol, so callers have one lifetime
rule.

Array `Len`, `Get`, and `Set` do not call a runtime element-access export. ISLE
loads the manifest-frozen header, checks bounds and address arithmetic, and
performs the typed load/store. A pointer-bearing `Set` publishes the edge via
the canonical array barrier; scalar stores do not call it. `Append` and each
collection growth path delegate to the one grow operation and retain the
returned root until the new storage pointer is stored and barred into its
owning aggregate.

Alternative considered: generate type-specific `array_get`/`array_set`
exports. Rejected because it duplicates type and bounds authority already
available to typed ISLE lowering and recreates a broad dispatch ABI.

### Root managed aggregates through construction and pointer publication

Generated aggregate construction establishes a manifest-approved root before
evaluating any allocation-capable initializer that must survive, retains the
new owner until every field is stored, and releases the construction root once
on every terminal path. Each pointer field store is followed by the canonical
write barrier before an allocation or safepoint may observe the object.
Ordinary pointer-field assignment retains the owner and new value for the same
store/barrier interval. Scalar fields require no barrier.

Alternative considered: rely on temporary Cranelift SSA values as implicit
roots. Rejected because the runtime traces only manifest-approved root
authority, not arbitrary machine temporaries.

### Treat `Result<Unit,E>` as a real specialization

`Unit` is a valid success type for `Result`; its `Ok(Unit)` case carries the
normal discriminant and no fabricated boolean payload. Construction, matching,
predicates, mapping, error propagation, and ABI-independent enum layout follow
the same semantic pipeline as every other `Result<T,E>` specialization.
Filesystem mutations return `Result<Unit, FsError>`.

### Normalize filesystem outcomes once

The manifest owns one `BeskidFsStatus` value set: `Ok = 0`, `NotFound = 1`,
`PermissionDenied = 2`, `IOError = 3`, `InvalidInput = 4`, and
`AlreadyExists = 5`. `fs_read_text(path, text_out) -> i32` writes a
runtime-owned string pointer only on `Ok`; an empty file is a valid non-null
empty string. Mutation adapters return the same status. `fs_exists(path) ->
i32` is tri-state at the public boundary: `Ok` means `Ok(true)`, `NotFound`
means `Ok(false)`, and every other status becomes `Error(FsError)`.

Corelib validates empty paths as `InvalidPath` before adapter invocation and
maps `InvalidInput` to the same public error. Other target-specific failures
are normalized by the canonical adapter; Corelib does not inspect OS error
numbers. No wrapper may turn null, an unknown status, missing authority, or an
adapter failure into success.

### Give only canonical runtime adapters host authority

Each filesystem intrinsic has exactly one binding for
`x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and
`x86_64-pc-windows-msvc`. A binding names the intrinsic, ABI-v5 symbol,
`runtime.adapter.*` capability, exact signature, selected implementation, and
ordered allowed OS imports. Only compiler-embedded canonical runtime source
may invoke it. Corelib and applications cannot declare look-alikes or import
OS symbols. Rust host dispatch, generated dispatch tags, extern fallbacks,
process-global tables, and fabricated results are forbidden.

### Make release evidence fresh, bounded, and complete

Before production edits, focused collection, `Result<Unit,E>`, aggregate
root/barrier, filesystem status, authority-denial, and harness regressions must
exist and fail for the intended reason. The matrix driver resolves/materializes
the workspace once, reuses the generation-bound Salsa/engine state, emits
per-target start/end/duration records, enforces a 120-second target budget and
30-minute whole-matrix budget, and cancels remaining work cleanly on timeout.

The release run accepts no target filter, smoke mode, missing-target skip,
ignored test, retry-masked failure, or stale report. It must record 61/61 from
the current manifest. Native kit evidence is produced natively on Linux
x86-64, macOS arm64, and Windows x86-64 for debug and release. Each kit must
contain validated static and shared artifacts and must pass installed-prefix
JIT and AOT smokes plus allowlist and forbidden-provenance audits.

## Deleted Legacy Obligations and Paths

The migration removes these exact normative obligations:

- `BUILTIN_SPECS is sole Cranelift import source: Decision [D-EXEC-ABI-0003]`.
- `Runtime builtins use C-unwind exports: Decision [D-EXEC-ABI-0004]`.
- `Manifest-generated registries: Decision [D-EXEC-ABI-0007]`, including
  `compiler/runtime_manifest.toml`, kernel/dispatch registries, bridge anchors,
  and v3 dispatch entrypoints.
- `Cargo features are separate from ABI version: Decision [D-EXEC-RT-0014]`,
  insofar as it authorizes runtime semantic feature gates.
- `arrays_backing gates array element storage: Decision [D-EXEC-RT-0015]` in
  full, including header-only/null-backed arrays.
- The ABI-v3 kernel-shrink obligation is removed by the prerequisite
  `hir-free-isle-abi-v5-native-runtime` change and is not duplicated here.
- Public `Collections.*`, `System.FS`, `array_get`, `array_set`, legacy
  `array_new` compatibility allocation, count-only collection bodies,
  heuristic filesystem stubs, Rust host/bridge dispatch, and source-tree kit
  fallbacks are deleted from active production paths and conformance fixtures.

## Risks / Trade-offs

- [A hard namespace cut breaks existing source] -> Migrate Corelib, tests,
  examples, docs, and fixtures in one wave; reject aliases so completion is
  mechanically auditable.
- [Growth can lose descriptor or pointer edges] -> Derive metadata from the
  owned source array, validate all arithmetic before allocation, keep both
  arrays rooted during copy, and require forced-GC pointer-map tests.
- [Aggregate stores can expose unrooted values] -> Require construction roots,
  store/barrier ordering, exceptional-path release tests, and verified-CLIF
  inspection before deleting legacy lowering.
- [OS errors drift across targets] -> Normalize once in target adapters and
  test each public status on native runners; unknown statuses fail closed as
  `IOError` with no successful payload.
- [Harness timeouts hide slowness] -> Record the active target and phase,
  retain diagnostics, forbid retries in release evidence, and keep both
  per-target and whole-matrix budgets visible in the report.
- [Concurrent active OpenSpec changes overlap] -> Apply and archive the
  prerequisite ABI-v5 change first, then rebase this delta and validate the
  final effective standard before implementation release sign-off.

## Migration Plan

1. Validate this change and the prerequisite ABI-v5 changes; add focused RED
   tests and capture the current failing/hanging evidence without claiming a
   green baseline.
2. Introduce manifest status/layout/grow bindings, generated ABI artifacts,
   semantic facts, direct ISLE rules, canonical runtime operations, and target
   adapter objects behind the failing tests.
3. Migrate aggregate construction, collection packages, `Result<Unit,E>`,
   `Core.FS`, tests, examples, and all consumers to the new authorities.
4. Delete the exact legacy requirements and production paths listed above;
   run retired-pattern and binary-provenance scans.
5. Run fresh focused verification, the unfiltered 61-target matrix, and every
   native debug/release static/shared kit cell with installed-prefix JIT/AOT
   smokes before 0.4 sign-off.

Rollback before deletion reverts the complete source and generated-artifact
wave. After deletion, rollback selects the last complete release bundle. It
never reinstates an alias, Rust host dispatcher, fabricated result, or mixed
runtime kit.

## Open Questions

None. The public namespaces, grow signature, status values, adapter authority,
supported target set, time budgets, matrix denominator, and release evidence
are fixed by this change. Platform API selection remains manifest-owned
implementation data constrained by the target allowlists.
