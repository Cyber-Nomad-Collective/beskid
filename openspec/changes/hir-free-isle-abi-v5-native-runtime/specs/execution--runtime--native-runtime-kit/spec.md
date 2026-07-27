## ADDED Requirements

### Requirement: Manifest-authoritative native runtime kit
The toolchain MUST generate runtime-kit metadata, symbols, layouts, traps, and hashes from `compiler/runtime_manifest.bsol` and MUST reject artifacts that do not exactly match it.

#### Scenario: Coherent kit resolution
- **GIVEN** an installed ABI-v5 kit for a supported target and profile
- **WHEN** JIT or AOT resolves the kit
- **THEN** target, profile, ABI, allowlists, layouts, and hashes all match before load or link

#### Scenario: Mixed runtime artifacts
- **GIVEN** runtime metadata and binaries from different builds
- **WHEN** the toolchain validates the kit
- **THEN** validation fails before user code runs

### Requirement: Beskid runtime and assembly boundary
The canonical runtime MUST be Beskid source compiled through the production AST/Salsa-to-ISLE-to-CLIF path, and target assembly MUST export only `beskid_arch_v5_context_init` and `beskid_arch_v5_context_switch`.

#### Scenario: Runtime artifact provenance
- **GIVEN** a release runtime binary
- **WHEN** provenance and export audits run
- **THEN** no Rust runtime object or unapproved assembly export is present

### Requirement: Complete canonical runtime corpus
The canonical `beskid-runtime-native` source package MUST implement lifecycle, trap delivery, TLS, allocation, non-moving mark/sweep collection, root frames and barriers, strings, collections, scheduler and concurrency, composition, clocks, callbacks, and the approved target OS adapters. User packages MUST NOT invoke trusted intrinsics directly.

#### Scenario: Canonical runtime capability matrix
- **GIVEN** the canonical runtime source package and ABI-v5 manifest
- **WHEN** runtime capability, layout, trap, GC, scheduler, collection, and intrinsic-access tests run
- **THEN** every required capability is implemented through canonical Beskid source or one approved platform import, and untrusted packages are rejected

#### Scenario: Runtime compilation path
- **GIVEN** a runtime-kit build request
- **WHEN** the canonical runtime is compiled
- **THEN** it passes through the same expanded-AST, Salsa, `CodegenInput`, ISLE, and CLIF-verification path as an application

### Requirement: Canonical clock and process adapter intrinsics
`runtime_manifest.bsol` SHALL declare exactly the canonical-runtime-only
adapter intrinsics `clock_monotonic_nanos`, `clock_realtime_nanos`,
`process_exit`, and `process_getpid`. Their ABI-v5 symbols SHALL be,
respectively, `beskid_rt_v5_intrinsic_clock_monotonic_nanos`,
`beskid_rt_v5_intrinsic_clock_realtime_nanos`,
`beskid_rt_v5_intrinsic_process_exit`, and
`beskid_rt_v5_intrinsic_process_getpid`; their capability identifiers SHALL
be `runtime.adapter.<intrinsic-name>`. The clock intrinsics SHALL return `i64`,
`process_getpid` SHALL return `i32`, and `process_exit(i32)` SHALL be
non-returning. Only the canonical `Runtime/Host/Clocks.bd` and
`Runtime/Host/Process.bd` units may use these names; their exported wrappers
SHALL forward directly to the manifest-owned intrinsic and SHALL NOT use a
host dispatch table, an extern fallback, or a fabricated value.

#### Scenario: Canonical clock wrapper lowers to a target adapter
- **GIVEN** a canonical runtime compilation for an ABI-v5 target
- **WHEN** `ClockMonotonicNanos` or `ClockRealtimeNanos` is lowered
- **THEN** its direct call resolves to the corresponding manifest-declared
  ABI-v5 intrinsic symbol and preserves the monotonic or realtime clock domain

#### Scenario: Canonical process wrapper does not fabricate host state
- **GIVEN** a canonical runtime compilation that obtains a process identifier
  or terminates the process
- **WHEN** `ProcessGetpid` or `ProcessExit` is lowered
- **THEN** it resolves only to the corresponding manifest-declared ABI-v5
  intrinsic, and the exit path has no continuation

#### Scenario: User source cannot invoke an adapter intrinsic
- **GIVEN** an ordinary user package or a package that copies a canonical
  runtime path
- **WHEN** it calls one of the clock or process adapter intrinsic names
- **THEN** canonical-runtime capability validation rejects the call before
  code generation and does not substitute an extern import

### Requirement: Canonical target-adapter capability boundary
Only the compiler-embedded canonical runtime corpus MAY invoke manifest-declared target-adapter intrinsics. The manifest MUST declare every adapter name, ABI-v5 symbol, capability, parameter types, result type, and target platform import used to implement clocks, process identity, environment, filesystem, or terminal state. User packages and Corelib packages MUST NOT acquire this authority, declare look-alike intrinsics, import legacy dispatch symbols, or call target platform symbols directly.

Target adapters MUST use one ABI-v5 normalization: nullable pointer results represent unavailable string or terminal data; `i32` status results are `0` on success and non-zero on failure; boolean public runtime exports map success to `true` and failure to `false`; and clock values are signed 64-bit nanoseconds. Returned pointer data is runtime-owned and remains valid until the next call on the same runtime thread unless it is copied into managed storage.

#### Scenario: Canonical clocks use only declared adapters
- **GIVEN** the canonical runtime implementation of monotonic and realtime clocks
- **WHEN** its AST/Salsa facts and generated imports are inspected
- **THEN** each call resolves to a manifest-declared canonical target-adapter intrinsic with an `i64` nanosecond result, and no legacy host or dispatch symbol is present

#### Scenario: Untrusted target-adapter call
- **GIVEN** an application or Corelib source unit that declares or invokes a target-adapter intrinsic name
- **WHEN** semantic capability validation runs
- **THEN** validation fails before ISLE lowering and no target platform import is emitted

#### Scenario: Three-target adapter provenance
- **GIVEN** a Linux x86-64, macOS arm64, or Windows x86-64 canonical runtime kit
- **WHEN** platform import and binary provenance audits run
- **THEN** every host adapter resolves only through the target-specific import declared by `runtime_manifest.bsol`

### Requirement: Canonical Process host adapters are manifest-owned
`Runtime/Host/Process.bd` SHALL implement `EnvGet`, `EnvSet`, `EnvGetcwd`,
`FsReadText`, `FsWriteText`, `FsExists`, `FsMkdir`, `FsDelete`, and
`TtyWinsize` exclusively as direct wrappers around canonical-runtime-only
intrinsics declared by `runtime_manifest.bsol`. The manifest declaration for
each adapter MUST contain its source intrinsic name, ABI-v5 symbol,
`runtime.adapter.<intrinsic-name>` capability, exact parameter and result
types, and one target-specific platform import for every supported target.
The ABI-v5 intrinsic symbols MUST be named
`beskid_rt_v5_intrinsic_<intrinsic-name>`.

The source intrinsic names SHALL be `env_get`, `env_set`, `env_getcwd`,
`fs_read_text`, `fs_write_text`, `fs_exists`, `fs_mkdir`, `fs_delete`, and
`tty_winsize`. Nullable pointer results SHALL mean that the requested string,
working directory, file content, or terminal dimensions are unavailable.
Mutation and boolean query adapters SHALL use the common target-adapter status
normalization: `i32` zero is success, non-zero is failure, and the public
boolean wrapper maps only zero to `true`. Every returned pointer remains
runtime-owned until the next invocation of the same adapter on the same
runtime thread unless copied into managed storage.

The canonical wrappers MUST NOT fabricate `NativePointer(0)`, `false`, a
no-op mutation result, a host dispatch lookup, a generated dispatch tag, an
extern fallback, or a process-global backing table. Missing manifest entries,
missing selected-target imports, unsupported target implementations, null
required input pointers, and failed target-adapter status results MUST fail
closed at the boundary; they MUST NOT be represented as a successful wrapper
result. Only the compiler-embedded canonical runtime corpus may invoke these
intrinsics.

#### Scenario: Environment wrapper provenance reaches verified CLIF
- **GIVEN** a canonical runtime compilation containing `EnvGet`, `EnvSet`, or
  `EnvGetcwd`
- **WHEN** the expanded syntax facts are lowered through `CodegenInput`, ISLE,
  and CLIF verification
- **THEN** each wrapper has a direct call to its exact manifest-declared
  ABI-v5 intrinsic, retains the originating syntax span, and produces neither
  a legacy dispatch reference nor an alternate host import

#### Scenario: Filesystem and terminal wrappers preserve normalized failure
- **GIVEN** a canonical runtime compilation containing `FsReadText`,
  `FsWriteText`, `FsExists`, `FsMkdir`, `FsDelete`, or `TtyWinsize`
- **WHEN** the selected target adapter reports unavailable data or a non-zero
  status
- **THEN** the public wrapper reports unavailable/failure according to the
  manifest-declared normalization and does not manufacture a successful
  pointer, boolean, filesystem state, or terminal value

#### Scenario: Missing Process adapter authority fails closed
- **GIVEN** a selected target lacks one Process adapter's manifest capability
  or target-specific platform import
- **WHEN** canonical runtime lowering or runtime-kit validation encounters
  that adapter
- **THEN** compilation or kit validation fails before link/load with the
  intrinsic name, capability, and target in its diagnostic, and no fallback
  dispatch route or fabricated wrapper is emitted

#### Scenario: Untrusted Process adapter invocation is rejected
- **GIVEN** Corelib or an application source unit declares or invokes an
  `env_*`, `fs_*`, or `tty_winsize` target-adapter intrinsic
- **WHEN** semantic capability validation runs
- **THEN** validation rejects the source before ISLE lowering, including when
  it copies a canonical runtime path or ABI-v5 symbol spelling

#### Scenario: Installed target kits prove Process adapter provenance
- **GIVEN** installed Linux x86-64, macOS arm64, and Windows x86-64 ABI-v5
  runtime kits
- **WHEN** their Process adapter imports and linked artifacts are audited
- **THEN** every declared adapter resolves only to the manifest-selected
  target import, all wrapper call paths have syntax-to-ISLE-to-verified-CLIF
  evidence, and the artifacts contain no legacy dispatch, Rust host, bridge,
  or fallback provenance

### Requirement: Fixed runtime-kit installation layout
Runtime kits MUST install under `lib/beskid-runtime/abi-5/<target>/<debug|release>/` with `abi.json` at the profile root and target-named artifacts in `static/` and `shared/`.

#### Scenario: Installed-prefix smoke
- **GIVEN** a packaged toolchain installed to an empty prefix
- **WHEN** runtime-kit discovery runs without source-tree fallbacks
- **THEN** JIT and AOT use the exact installed target/profile kit

#### Scenario: Three-target, two-profile artifact matrix
- **GIVEN** Linux x86-64, macOS arm64, and Windows x86-64 release lanes
- **WHEN** debug and release runtime kits are built and installed
- **THEN** each lane contains the manifest-matched static and shared artifacts and passes JIT and AOT installed-prefix smokes without a source-tree or Rust-runtime fallback

### Requirement: Binary provenance is a release gate
The release pipeline MUST inspect every produced runtime and linked application artifact for manifest allowlist conformance and forbidden Rust/bridge/host/unwind provenance.

#### Scenario: Forbidden linked provenance
- **GIVEN** a candidate runtime or linked application binary containing a forbidden symbol family or object provenance
- **WHEN** the release provenance audit runs
- **THEN** the build fails before packaging and reports the artifact and matched provenance
