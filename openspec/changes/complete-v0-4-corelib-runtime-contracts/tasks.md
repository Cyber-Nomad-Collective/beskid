## 1. Validate and establish RED evidence

- [x] 1.1 Create the proposal, design, tasks, and complete capability deltas.
- [x] 1.2 Validate this change strictly and validate the repository OpenSpec
  standard without running compiler or Cargo commands.
- [ ] 1.3 Add failing namespace and API-shape tests proving
  `Core.Collections.*` is required, `Collections.*`/`System.FS` are rejected,
  and receiver methods are declared only on owning types.
- [ ] 1.4 Add failing `Result<Unit,E>` construction, match, predicate, map, and
  propagation tests plus `Core.FS` mutation signature tests.
- [ ] 1.5 Add failing collection storage/grow/bounds/overflow/GC tests and
  managed aggregate construction-root/store-barrier tests.
- [ ] 1.6 Add failing real-filesystem tests for empty and non-empty files,
  missing paths, permission denial, invalid input, generic I/O failure,
  mutation results, and the `Exists` tri-state.
- [ ] 1.7 Add failing canonical-source, untrusted-intrinsic, manifest-binding,
  target-import, no-fabricated-success, retired-pattern, and binary-provenance
  tests.
- [ ] 1.8 Capture the current matrix hang/failure report with target and phase
  attribution; do not treat a timeout, filter, skip, or retry as passing RED.

## 2. Introduce replacement authorities

- [ ] 2.1 Add manifest-owned `BeskidFsStatus`, typed filesystem intrinsic
  signatures, and exactly one Linux x86-64, macOS arm64, and Windows x86-64
  binding for every filesystem adapter; regenerate derived ABI artifacts.
- [ ] 2.2 Add `beskid_rt_v5_array_grow_rooted` and its rooted finish protocol to
  the manifest and canonical Beskid runtime with descriptor/overflow/ownership
  validation and no mutation on failure.
- [ ] 2.3 Complete direct ISLE `Len`/`Get`/`Set` lowering with bounds and address
  overflow checks; emit the canonical barrier for pointer elements and no
  element-access ABI imports.
- [ ] 2.4 Complete managed aggregate construction roots and pointer-field
  store/barrier ordering through generation-bound facts and verified CLIF.
- [ ] 2.5 Complete `Result<Unit,E>` semantic, layout, ISLE, JIT, and AOT support
  without a boolean compatibility payload.
- [ ] 2.6 Implement canonical filesystem wrappers and real target host adapter
  objects; preserve typed statuses and deny all non-canonical callers.

## 3. Migrate public Corelib and consumers

- [ ] 3.1 Move collection source to `Core.Collections.*`, place public receiver
  methods inline on their owning types, and migrate all Corelib/test consumers.
- [ ] 3.2 Replace count-only `List`, `Map`, `Set`, `Queue`, and `Stack` bodies
  with real typed array storage, preserving documented ordering and bounds.
- [ ] 3.3 Route all collection growth through the single typed grow operation;
  keep the result rooted until its owner field store and barrier complete.
- [ ] 3.4 Change filesystem mutations to `Result<Unit, FsError>` and `Exists`
  to `Result<bool, FsError>`; map every manifest status without heuristic
  probes or fabricated success.
- [ ] 3.5 Update all current tests, examples, generated fixtures, and
  informative docs to the hard-cut namespaces and signatures.

## 4. Delete superseded paths

- [ ] 4.1 Delete public `Collections.*` and `System.FS` sources/re-exports and
  reject both names in production and fixture scans.
- [ ] 4.2 Delete `array_get`, `array_set`, legacy `array_new` compatibility,
  count-only collection bodies, and alternate grow/copy implementations.
- [ ] 4.3 Delete `runtime_manifest.toml`, v3 registry/dispatch/tag/envelope,
  Rust C-unwind runtime/host/bridge, extern fallback, and fabricated FS paths
  after every caller has migrated.
- [ ] 4.4 Delete `arrays_backing` and every semantic feature combination that
  permits required arrays without storage.

## 5. Bound and diagnose the harness

- [ ] 5.1 Resolve/materialize Corelib once per matrix and reuse the same
  generation-bound Salsa/engine state without per-target project rebuilds.
- [ ] 5.2 Add per-target start/end/duration/phase reporting, a 120-second
  per-target timeout, a 30-minute whole-matrix timeout, and clean cancellation
  that names the active target.
- [ ] 5.3 Make the release gate reject filters, smoke mode, missing-target
  skips, ignored tests, retries, stale reports, and a denominator other than
  the current manifest's 61 targets.

## 6. Verify and release

- [ ] 6.1 Make all focused RED suites green through the production
  `TypedProgram` -> `CodegenInput` -> ISLE -> verified CLIF path.
- [ ] 6.2 Record a fresh, unfiltered 61/61 Corelib matrix within both budgets,
  with no hangs, skips, ignored tests, retries, or stale evidence.
- [ ] 6.3 Build and install debug and release ABI-v5 kits natively on Linux
  x86-64, macOS arm64, and Windows x86-64; verify both static and shared
  artifacts in every kit.
- [ ] 6.4 Run installed-empty-prefix JIT and AOT smokes, manifest hash/layout/
  allowlist checks, target-import audits, and forbidden-provenance scans for
  every target/profile kit.
- [ ] 6.5 Run full OpenSpec, compiler workspace, Corelib, package, and release
  gates; update catalog/changelog/traceability evidence and run GitNexus
  changed-scope analysis before integration.
