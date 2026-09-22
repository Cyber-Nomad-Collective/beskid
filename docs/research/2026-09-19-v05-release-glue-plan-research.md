# 0.5 closure plan: release acceptance, Glue/FFI, and platform evidence

Date: 2026-09-19  
Scope: checked-in OpenSpec, compiler, corelib, and Woodpecker sources at the
current checkout, plus primary external specifications and vendor documentation.
This is a planning/research record; it does not claim that an implementation
or a release gate has run successfully.

## Decision summary

The release has one critical serial route:

```text
Foundations -> Networking -> HTTP/release acceptance
```

`beskid-v0-5-http` is the required final owner, but is absent from
`openspec/changes/`. It must be authored and validated before HTTP work begins;
it is not safe to make the release gate an informal checklist or to let
Networking self-certify the final release.

Glue is explicitly deferred to v0.6. v0.5 remains the
Foundations -> Networking -> HTTP/release-acceptance program and retains the
existing fail-closed Glue backends. No Glue generator, bridge, toolchain, or
Glue acceptance evidence is a v0.5 release condition. The pending Glue
proposals with `0-5` names are historical planning inputs; a later v0.6 owner
must supersede them with complete SHALL requirements and scenarios before
implementation.

| Area | Present design | Gap | Release classification | Decision needed |
| --- | --- | --- | --- | --- |
| HTTP/release owner | The accepted release split reserves `beskid-v0-5-http` for HTTP/1.1, examples, documentation, catalog rebuild, and Tracker evidence. | No change directory, deltas, implementation plan, or acceptance checklist exists. | Critical serial blocker. | Create the third change before coding. |
| Rust Glue | `BackendKind::RustSource`, `BackendArtifact::RustSource`, Interop contracts, and seven Glue contracts exist. | Backend and CLI fail closed; no extraction, emitter, bridge, tool execution, artifact contract, or e2e test exists. | v0.6 scope; excluded from v0.5. | Retain fail-closed behavior. |
| .NET Glue | Equivalent `DotNetProject` seam and `Dotscope` tool capability exist. | Same missing pipeline, plus no signature reader/writer implementation or project/artifact model. | v0.6 scope; excluded from v0.5. | Retain fail-closed behavior. |
| Cross-target evidence | Woodpecker builds three native release bundles and validates checksums/source identity. | Evidence proves package construction, not the new runtime/network/HTTP behavior on each target. | Critical completion gate for the v0.5 serial route. | Extend per-target behavioral evidence rather than add a second release system. |

## Codebase facts

| Fact | Checked-in evidence | Consequence |
| --- | --- | --- |
| The release split explicitly assigns HTTP/1.1, graceful shutdown, examples, documentation, catalog traceability, and final evidence to a third change after Foundations and Networking. | [`docs/superpowers/specs/2026-07-20-beskid-v0-5-release-split-design.md`](../superpowers/specs/2026-07-20-beskid-v0-5-release-split-design.md) | HTTP/release closure has a named responsibility boundary, but no currently executable owner. |
| Only Foundations and Networking 0.5 changes exist. | [`openspec/changes/`](../../openspec/changes/) inventory | The third accepted change has not been created in this checkout. |
| The compiler exposes `clif`, `glue-rust`, and `glue-dotnet`; non-CLIF backends return `NotImplementedFor0_4`. | [`compiler/crates/beskid_codegen/src/backend.rs`](../../compiler/crates/beskid_codegen/src/backend.rs) | Replacing the stubs requires a full source-backend artifact path, not merely enabling a CLI flag. |
| `beskid build --backend` rejects both Glue choices before resolution/lowering. | [`compiler/crates/beskid_cli/src/commands/build.rs`](../../compiler/crates/beskid_cli/src/commands/build.rs) | CLI routing/output semantics must be changed together with backend implementation. |
| `mod.glue` observes registrations and annotations but invokes no Glue contract and returns the program unchanged. | [`compiler/crates/beskid_analysis/src/mod_host/glue.rs`](../../compiler/crates/beskid_analysis/src/mod_host/glue.rs) | The seven contract IDs are not a working execution architecture yet. |
| Corelib declares `GlueTag`, `StdioBridgeMessage`, attributes, and seven contracts; its own README calls emitters, full probing, stdio protocol, and runtime integration 0.5 work. | [`compiler/corelib/packages/glue/`](../../compiler/corelib/packages/glue/) | The public vocabulary is a scaffold and must not be presented as usable bindings. |
| `ToolchainProbe` has typed specs and exact-path discovery, but currently reports no version/hash/target and does not execute tools. | [`compiler/crates/beskid_abi/src/toolchain.rs`](../../compiler/crates/beskid_abi/src/toolchain.rs) | It cannot yet establish a reproducible Rust/.NET external-build boundary. |
| Release evidence verifies Linux/macOS/Windows build results, source commits, artifact names, and checksums. | [`scripts/ci/woodpecker-release-evidence.mjs`](../../scripts/ci/woodpecker-release-evidence.mjs) | Preserve this provenance gate; add semantic test summaries/attestations to it rather than duplicate release qualification. |

## Plan A — establish the final HTTP/release owner

### 1. Create `openspec/changes/beskid-v0-5-http/` before implementation

Create the standard proposal/design/tasks structure (and `.openspec.yaml` to
match the two prerequisite changes). The proposal must state its dependency on
the completed Foundations and Networking changes and must name the final
acceptance inputs. The release split already fixes its minimum scope:

- bounded HTTP/1.1 parsing and serialization;
- routing, server lifecycle, cancellation/graceful shutdown, and compiling
  examples;
- release docs and final catalog/Tracker evidence;
- no TLS, HTTP/2/3, QUIC, WebSocket, pooling, proxying, compression, or
  streaming features outside the accepted scope.

The normative HTTP requirements should cite [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html)
for shared HTTP semantics and [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112.html)
for HTTP/1.1 message syntax/routing. The proposed first slice is deliberately
small: ASCII octet framing, a bounded header/body parser, fixed
`Content-Length` handling, explicit rejection of invalid or ambiguous message
framing, request/response serialization, and close-delimited lifecycle rules.
Chunked transfer, trailers, upgrade, and persistent connection reuse should be
separate explicit decisions, not accidental behavior. This follows RFC 9112's
framing authority and keeps the 0.5 non-goal boundary testable.

### 2. Put the release acceptance contract in that change, not in CI comments

Its OpenSpec deltas should extend or link:

- `core-library--...` capabilities for the public HTTP package only after its
  concrete API is selected;
- `compiler--conformance--conformance-evidence-policy`, which requires the
  three evidence tiers (analysis fixture, docs test, runtime e2e);
- `community--spec-maintenance--release-and-versioning-policy`, whose Git
  revision is the normative version axis; and
- `compiler--codegen-and-ir--extern-import-extraction-contract` only if HTTP
  introduces a foreign-boundary requirement (it should not by default).

The task file should designate `CYB-62` as the delivery coordination record,
but preserve OpenSpec as the behavioral authority. Completion conditions must
include prerequisite catalog revisions, an unchanged generated
`openspec/catalog.json` except through the generator, and a Tracker delivery
record that identifies the source commit, compiler submodule commit, catalog
revision, feature evidence locations, and all three target outcomes.

### 3. Implement after the change validates

Implementation should consume the public Network API only; it must not expose
the reactor's native handles or import OS constants. Add a bounded incremental
octet parser (not a Unicode line parser), a response writer with tested length
rules, and a server state machine whose shutdown drains/terminates according
to one specified deadline. This is a dependency on the Foundations ownership
and deadline model, not a replacement for it.

### HTTP acceptance matrix

| Gate | Required proof |
| --- | --- |
| Parser analysis/fixture | invalid start line, CR/LF and header syntax, duplicate/conflicting length framing, over-limit headers/body, invalid transfer coding, and invalid octets fail deterministically with stable diagnostics/errors. |
| Doc examples | documented router and shutdown examples compile against the published 0.5 API. |
| Runtime e2e | loopback request/response, partial reads/writes, bounded malformed-input rejection, cancellation/deadline, graceful shutdown, and no retained socket/fiber after completion. |
| Three native hosts | run the same network+HTTP e2e manifest on Linux x86_64, macOS arm64, and Windows x86_64—not only compiler bundle construction. |
| Final delivery | strict OpenSpec/catalog/conformance gates; source and compiler commits match; artifact hashes and behavioral-evidence hashes are retained with the existing Woodpecker handoff. |

## v0.6 deferred plan — complete Glue as one source-backend pipeline

### Architectural rules to preserve

1. Keep direct `Extern`/`[Export]` C ABI and Glue boundaries mutually exclusive.
   `reconcile-glue-ffi-extern-0-5` already selects this rule; implement its
   diagnostics before Glue emission so an item cannot produce both a linker
   import and a `GlueTag` path.
2. Keep `Interop.Contracts` (`beskid_abi::interop`) as the only typed boundary
   vocabulary. Rust and .NET mapping rules bind that model; they do not add
   duplicate shape/ownership enums.
3. `GlueTag` must become opaque, backend-qualified, and lifetime-managed. The
   current `i64 handle` declaration is a scaffold, not an ownership protocol.
   A final tag needs a stable library identity, backend kind, generation/valid
   state, and close/dispose route. It cannot leak raw OS/native addresses to
   user code.
4. Avoid a text-only `BackendArtifact`. The current `String` variants cannot
   describe a crate/project tree, generated manifest, native/link inputs,
   signature metadata, content hashes, or output root. Define one structured,
   deterministic `SourceBackendArtifact` with a list of relative files,
   content digests, resolved tools, target, ABI/conformance envelope, and
   declared outputs. Both Rust and .NET backends return that shape.

### Delivery waves

#### B1. Finish extraction and semantic boundary first

Implement all remaining tasks in:

- `openspec/changes/reconcile-glue-ffi-extern-0-5/` — conflict diagnostics,
  terminal rejection, and one-surface fixtures;
- `openspec/changes/extend-extern-import-extraction-glue-0-5/` — collect a
  typed `GlueTag` record for `[GlueImport]`, never an `ExternImport`; retain
  the converse C-ABI assertion.

Expected implementation focus: `beskid_analysis` attribute/semantic checks,
`beskid_codegen` input/extraction model, compiler fixture crates, and the
diagnostic registry. Do not implement an emitter until extraction emits a
deterministic, validated intermediate binding plan.

#### B2. Turn Glue contracts into an invoked, deterministic plan

Replace the no-op `run_glue` behavior in
`compiler/crates/beskid_analysis/src/mod_host/glue.rs` with ordered invocation
that yields a serializable binding plan. The plan must state each phase's
input/output and reject missing/ambiguous registrations. Suggested order:

```text
TypeMapping -> SignatureReader (when importing metadata) -> SymbolEmission
-> SignatureWriter -> LinkArgs -> StdioBridge -> ToolchainProbe
```

The exact ordering must become normative in the Glue capability rather than
being inferred from filenames. Add observer and incremental-replay fixtures,
because the existing conformance policy requires deterministic mod dispatch.
`ToolchainProbe` should validate inputs before any external command runs; its
result is then embedded in the emitted artifact manifest.

#### B3. Make tool discovery reproducible and fail closed

Extend `beskid_abi::toolchain` from structural discovery to:

- explicit path/prefix-only inputs (no ambient `PATH` search);
- platform-aware executable names and exact host/target interrogation;
- version parsing against a declared minimum/exact policy;
- SHA-256 verification of every executable that will be invoked;
- executable regular-file/permission validation;
- a bounded, captured command runner that records argv, exit result, selected
  environment allowlist, and tool digest without recording secrets;
- a lockable manifest committed or retained as build evidence.

The separate `rustc`, `cargo`, `dotnet`, linker, and `dotscope` requirements
must be backend-specific. Do not require .NET tooling for Rust-only output,
and do not make a missing optional backend alter `clif` builds.

#### B4. Implement Rust generation

Add a `RustSourceBackend` that maps validated `InteropSignature` data to a
structured crate tree: `Cargo.toml`, generated source, a narrow unsafe FFI
module, safe wrapper surface where the contract permits it, and generated
link metadata. Use an explicit C ABI at the foreign boundary. Rust's official
FFI guidance says foreign declarations must be accurate because Rust cannot
verify them, and unsafe native calls should be contained behind safe wrappers
where possible ([Rustonomicon FFI](https://doc.rust-lang.org/nomicon/ffi.html)).

Required constraints:

- generated native declarations are `unsafe extern "C"` (Rust 2024 requires
  `unsafe` on extern blocks; see the [Edition Guide](https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-extern.html));
- no Rust ABI is emitted for user-library boundaries; preserve the existing
  C-ABI-vs-runtime-Rust-ABI separation;
- ownership maps to explicit borrow/transfer wrappers and deterministic
  destructors; no GC-managed pointer is retained by foreign code unless the
  signature explicitly models transfer/opaque lifetime;
- generated public names and library identifiers are escaped/validated,
  preventing code-injection through source identifiers or paths;
- compile a generated fixture crate and execute import/export round trips
  against a small native fixture per supported host.

#### B5. Implement .NET generation and signature flow

`DotNetProjectBackend` should emit a structured SDK-style project plus source
and its signature manifest. Prefer compile-time `LibraryImport` declarations
for P/Invoke. Microsoft documents that `LibraryImport` generates marshalling
at compile time and supports Native AOT/trimming scenarios where runtime
`DllImport` stubs are unsuitable ([P/Invoke source generation](https://learn.microsoft.com/en-us/dotnet/standard/native-interop/pinvoke-source-generation)).

Use the .NET native-interoperability guidance to define explicit string,
buffer, bool, integer-width, error (`SetLastError`), calling convention, and
ownership mappings; do not rely on framework defaults
([native interop best practices](https://learn.microsoft.com/en-us/dotnet/standard/native-interop/best-practices)).
`dotscope` must read/write only the checked signature representation selected
by the normative `SignatureReader`/`SignatureWriter` contract. Its parsed
output needs schema/version validation before it can influence emitted source.

Run generated projects with `dotnet build`, and, if Native AOT is stated as a
support target, a Native AOT publish/run fixture on each supported host. Do
not claim Native AOT merely because the emitter uses `LibraryImport`.

#### B6. Implement the Stdio bridge only after Foundations

The present corelib declaration says a generated fiber sends
`StdioBridgeMessage` values on a channel. It therefore requires the generic,
traced channels, owner-routed wakes, deadlines, and scope cleanup from
Foundations. Specify the bridge protocol before writing it: deterministic
framing, request ID, protocol version, tag/library identity, operation,
payload length, response/error/cancellation, maximum frame size, and terminal
close. Tests must prove malformed/oversize messages fail closed, cancellation
does not deliver a late response to a recycled tag, and process/pipe teardown
releases both sides exactly once.

This bridge is independent of HTTP. Do not reuse HTTP parsing/framing unless
the protocol specification explicitly chooses that dependency; its security
and recovery rules are different.

### Glue validation gates

| Level | Gate |
| --- | --- |
| Semantic | dual ABI/Glue annotations fail; permitted types/ownership map exactly once; unsupported signatures fail before emission. |
| Intermediate plan | golden binding plans are deterministic, include the conformance envelope and tool manifest, and cannot contain both `ExternImport` and `GlueTag` for an item. |
| Generated source | Rust `cargo check/build` and .NET `dotnet build` succeed for valid fixtures; injection-like identifiers, invalid tool manifests, and invalid signature input fail closed. |
| Runtime | import/export round trip, buffer/string lifetime, opaque handle disposal, callback/cancellation if promised, and bridge framing/error teardown run against a native fixture. |
| Matrix | run Rust and .NET lanes only where their toolchains are explicitly provisioned; record unavailable tools as a failure for a promised backend, not a skipped success. |

## Plan C — extend existing cross-target evidence

The current Woodpecker design is a strong release-artifact provenance base:
the three platform builders produce artifacts, hand them off, and
`woodpecker-release-evidence.mjs` verifies identity and checksums before
aggregation. Retain that single release route.

Add a `feature-evidence-v1.json` alongside each platform result (or extend the
existing result schema in a backwards-incompatible versioned change). It
should contain:

- source/superproject/compiler commits and release version;
- target triple, OS/architecture, runner image/toolchain digests, and runtime
  kit manifest digest;
- exact executed command identifiers and result status for Foundations,
  Networking, and HTTP;
- hashes of test logs and required runtime artifacts;
- a list of conformance case IDs, not only a single boolean;

Then update `woodpecker-release-evidence.mjs`, its Node tests, platform build
script, and platform YAML jobs to require a successful semantic evidence file
for each promised capability. Continue checking the existing package assets;
the new schema supplements it rather than replacing it.

The three platform jobs should execute:

| Target | Native behavioral minimum |
| --- | --- |
| Linux `x86_64-unknown-linux-gnu` | runtime-kit validation and scheduler/network/HTTP loopback suite. |
| macOS `aarch64-apple-darwin` | the same suite with the native Darwin runtime kit and deployment target recorded. |
| Windows `x86_64-pc-windows-msvc` | the same suite with the native Windows runtime kit and selected MSVC ABI. |

This is particularly important because the release scripts currently establish
that `cli`, `lsp`, and bundle builds succeeded, while no field requires the
new behavioral tests. The final aggregate must reject a platform whose
behavioral evidence is missing, from a different source revision, claims an
unexecuted required case, or hashes do not match retained output.

## Sequencing and ownership

| Wave | Can run in parallel? | Exit condition |
| --- | --- | --- |
| 0. Create HTTP/release OpenSpec change | Yes, immediately | Third change validates and names acceptance contract. |
| 1. Foundations | No, serial critical path | Generic ownership/channel/deadline/Core.IO proof passes. |
| 2. Networking | After Foundations | Three-host DNS/TCP/UDP/reactor conformance passes. |
| 3. HTTP | After Networking and its OpenSpec change | Bounded HTTP requirements and three-host behavior pass. |
| 4. Final release acceptance | After waves 0–3 | Catalog/conformance/Tracker and extended Woodpecker evidence all agree on exact commits. |

## Risks and stop conditions

- **Deferred-scope leakage:** Generated bindings are v0.6 work. Do not add
  Glue acceptance cells, toolchain requirements, or bridge implementation to
  v0.5 by implication.
- **Protocol duplication:** Do not let a Glue bridge create a second scheduler,
  timer, or resource-lifetime mechanism. It must use Foundations.
- **Unsafe ABI drift:** Do not emit platform-default or Rust-ABI user bindings;
  make the selected C ABI, widths, layout, ownership, and error conventions
  part of each binding manifest and fixture.
- **Toolchain nondeterminism:** ambient PATH discovery, unchecked tool
  upgrades, mutable package restore, or unrecorded codegen output invalidate a
  successful release claim.
- **Evidence inflation:** a build or checksum pass is not a feature conformance
  pass. Final aggregation must remain fail-closed on absent behavior evidence.

## Recommended immediate actions

1. Create and strictly validate `beskid-v0-5-http`; assign CYB-62's exact
   completion evidence to its tasks.
2. Retain the existing fail-closed Glue CLI behavior through v0.5. Establish
   the separate v0.6 OpenSpec owner only when its complete binding and bridge
   requirements are ready for review.
3. Design `feature-evidence-v1.json` and its validator contract before
   changing platform CI; use the current three-platform release aggregator as
   the only acceptance entrypoint.
