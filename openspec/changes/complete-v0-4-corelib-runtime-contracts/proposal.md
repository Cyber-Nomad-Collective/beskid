## Why

Beskid 0.4 cannot claim a complete Corelib or native runtime while collection
types retain count-only storage placeholders, `Core.FS` can manufacture success
from host stubs, and most of the 61-target Corelib matrix can stall without a
target-level failure. The accepted standard also still contains public
`Collections.*`, `runtime_manifest.toml`, ABI-v3 dispatch, Rust C-unwind
runtime, and optional `arrays_backing` obligations that contradict the
canonical ABI-v5 runtime already being completed.

This change fixes the contract before implementation continues. It depends on
`hir-free-isle-abi-v5-native-runtime`, which already removes the ABI-v3 kernel
shrink requirement and defines the coherent native-kit boundary. This change
does not duplicate that removal; it completes the collection, managed-store,
filesystem, Result, harness, and release-evidence obligations needed for the
0.4 Corelib slice.

## What Changes

- **BREAKING** Move the collection API from `Collections.*` to
  `Core.Collections.*` as a hard cut, with no aliases, compatibility exports,
  or dual source trees; keep methods inline on their owning public types.
- Require real `T[]` backing storage for `List`, `Map`, `Set`, `Queue`, and
  `Stack`, and one manifest-owned typed grow operation that preserves element
  descriptors, values, rooting, and pointer-map semantics.
- Keep bounds-checked direct ISLE address calculation as the sole array get/set
  path; forbid `array_get` and `array_set` ABI exports, dispatch tags, or host
  fallbacks.
- Require managed aggregate construction and pointer-field mutation to retain
  the owner through the complete store lifetime and execute the canonical
  write barrier before any allocation or safepoint can observe the edge.
- Require `Result<Unit,E>` to type-check, lower, match, and execute as a normal
  `Result` specialization so filesystem mutations do not substitute boolean
  success payloads.
- Replace `Core.FS` heuristics with a typed filesystem status channel and
  manifest-owned Linux x86-64, macOS arm64, and Windows x86-64 adapter
  bindings. `Exists` becomes `Result<bool, FsError>`: a missing path is
  `Ok(false)`, while adapter failure is an error.
- Retire `runtime_manifest.toml`, ABI-v3 generated registries/dispatch,
  Rust-host C-unwind runtime authority, and optional `arrays_backing`
  semantics in favor of `runtime_manifest.bsol` ABI-v5 authority.
- Make test-first RED evidence, bounded single-process harness execution, a
  fresh 61/61 Corelib matrix, and native debug/release static/shared kit proof
  on all three supported targets blocking 0.4 release prerequisites.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `core-library--foundation-and-primitives--core-collections`: Canonical
  namespace, concrete storage, typed growth, direct indexing, and behavior.
- `core-library--foundation-and-primitives--core-fs`: Typed public API,
  status mapping, existence semantics, and target-adapter authority.
- `core-library--foundation-and-primitives--core-results`: Complete
  `Result<Unit,E>` specialization behavior.
- `core-library--stability-and-api-shape--corelib-api-shape`: Hard-cut
  `Core.Collections.*` namespace and owning-type method placement.
- `execution--abi-and-host--builtins-and-symbols`: ABI-v5 Bsol authority and
  removal of legacy registry/runtime obligations.
- `execution--abi-and-host--abi-versioning-and-compatibility`: Managed
  aggregate construction roots and pointer-store barriers.
- `execution--runtime--runtime-feature-flags`: Mandatory array storage and
  removal of semantic runtime feature gates.
- `language-meta--memory-model--memory-and-references`: Direct array indexing,
  typed growth, and managed pointer publication rules.
- `compiler--conformance--test-harnesses-and-fixtures`: RED evidence, bounded
  harness execution, 61-target matrix, and three-target kit proof.

## Impact

- Public source using `Collections.*` must migrate atomically to
  `Core.Collections.*`; no compatibility import is provided.
- `Core.FS.Exists` changes from `bool` to `Result<bool, FsError>`, and
  filesystem mutation success changes from boolean payloads to `Unit`.
- Runtime manifest generation, ISLE lowering, canonical runtime source,
  target host objects, Corelib packages, fixtures, and installed-kit release
  gates must land as one dependency-ordered migration.
- Rollback is to the preceding complete compiler/runtime/Corelib bundle. A
  mixed ABI-v5 kit or reintroduction of a host/dispatch fallback is not a valid
  rollback.
