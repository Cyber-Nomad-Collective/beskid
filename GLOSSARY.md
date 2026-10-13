# Glossary

## ABI v5

The direct-call native application binary interface for the rewritten Beskid compiler and runtime. It supports only little-endian 64-bit `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc`; all runtime exports are versioned `beskid_rt_v5_*` symbols and its exact contracts are generated from `compiler/runtime_manifest.bsol` into `abi.json`.

## AST semantic facts

Generation-scoped results computed by Salsa for expanded AST nodes, including resolution, types, signatures, call lowering, cast intent, control flow, and runtime-intrinsic authorization. They are keyed by `AstNodeKey` and replace HIR as the semantic input to tooling and code generation.

## Architecture map

An informative, checked-in conceptual map of the Beskid compiler and its direct boundaries. It resolves canonical public specification links from the OpenSpec catalog, presents implementation paths as evidence, and never replaces OpenSpec requirements as the normative authority.

## AOT run

The `beskid run` workflow that resolves and analyzes a program, compiles and
links a temporary native executable with the matching runtime kit, and starts
that executable in a subprocess. It is not an interactive JIT execution path.

## Authentik

The sole browser identity authority for Beskid services. Its embedded proxy
outpost authenticates users, forwards the verified subject and group claims to
each application, and provides the canonical account and sign-out surfaces.

## Beskid standard

The current normative requirements in `openspec/specs`. A text outside that directory is not part of the standard unless it is incorporated through a validated OpenSpec change.

## Beskid service licensing boundary

The licensing boundary under which Beskid-owned programs designed to accept
user requests over a network are AGPL-3.0-only, while reusable clients,
protocol contracts, SDKs, templates, core-library code, and runtime components
remain Apache-2.0. Third-party components retain their upstream terms; in
particular, the GitNexus-derived Nexus implementation remains PolyForm
Noncommercial rather than AGPL.

## Compiler output independence

The licensing rule that running the Apache-2.0 Beskid compiler does not impose
a Beskid license on input source or generated programs. Beskid runtime,
core-library, startup, template, or generated material incorporated into an
output is deliberately Apache-2.0 so that output may be licensed independently,
subject to any separately identified third-party material.

## Developer build box

The private NixOS-hosted, rootless Linux compiler executor used only for local
development checks. It is outside project CI, release qualification, and
release provenance: a successful build-box check is never evidence that a
Beskid release is valid. It may use private transport and caches without
creating a project release contract.

## Cleanup conversion

The one explicit error conversion used only by a scoped `use` cleanup. It is a
non-generic function marked `[CleanupConversion]` with exactly one
`DisposeError` parameter and a return type exactly equal to the enclosing
callable's `Result` error type. It is not a general error coercion and never
changes postfix `?` semantics.

## Cleanup region

The existing lexical local-root scope augmented with reverse-order scoped-use
disposal obligations. Every supported exit crosses this one region stack so
each active resource is disposed exactly once and cleanup-error precedence is
consistent.

## Bug-only GitHub synchronization

Tracker integration in which GitHub Issues represents public bugs and their supported status/discussion fields only. Roadmap tasks, versions, workstreams, milestones, and deliverables remain in Tracker's SQLite domain model.

## Canonical UI packages

`@beskid/ui-react` and `@beskid/beskid-ui`, sourced from `beskid_web_common`. They provide the only shared component and style implementation for Beskid web applications.

## Canonical pckg implementation

The single pckg product implementation: `beskid_pckg_server` is the sole registry/backend authority and `beskid_sites/apps/pckg` is the sole web application. Shared shell and UI behavior remains imported from its canonical packages rather than copied into pckg. Proven pckg-specific behavior is copied and minimally adapted from historical sources; maintaining two active web clients is not an accepted state.

## CLI root command inventory

The public root commands of the pinned `beskid` Clap model. In 0.6.0 there are
14: `new`, `check`, `build`, `run`, `test`, `fmt`, `doc`, `add`, `remove`,
`update`, `package`, `toolchain`, `doctor` and `dev`. Compiler inspection and
maintenance commands are subcommands of `beskid dev`, not aliases of root
commands. A removed 0.5 root spelling (for example `analyze`, `pckg`, `up` or
`lsp`) is not dispatched; it fails with the name of its replacement. The
committed `site/website/src/data/pinned-cli-reference.json` snapshot records the
source revision, arguments, flags, defaults and subcommands that the public
reference must cover, and its source-blob map binds the fixture to the immutable
compiler object.

## Capability

An OpenSpec unit stored at `openspec/specs/<capability>/spec.md`. During migration, Beskid feature hubs become feature capabilities while domains and areas become taxonomy/governance capabilities.

## Coolify target URL

The `https://<host>:<container-port>` route descriptor sent to Coolify so its proxy selects the correct Compose service port. It is deployment configuration, not necessarily a public TLS listener; public health checks and API clients use the service's separate standard-HTTPS public URL.

## Documentation coverage catalogue

The checked-in, informative list that gives each non-compiler public surface a
stable machine key and maps it to one display label, Docs route, audience,
source boundary, page kind, and diagram policy. The catalogue is a completeness
assertion. It does not define normative behavior or replace the navigation model.

## Draft Context

A revision-pinned, ordered set of Platform Spec document operations authored in the
editor. It is a reviewable OpenSpec change bundle, never a second normative store.
Statuses include draft, submitted, approved, rejected, merged, abandoned, and superseded.

## Draft Context abandoned

Terminal status when the linked GitHub pull request closes without merge. Distinct from
moderator rejection of a submitted context.

## Derived external-wait capacity

The scheduler invariant that grants each live valid fiber exactly one active external-wait registration. Its usable admission capacity is therefore the live-fiber capacity, rather than the number of physically allocated wait records; a second registration for the same fiber is a duplicate failure, not capacity exhaustion. See `BSP-REQ-A0D58F1B3E21`.

## Descriptor domain

The native-operation domain carried by the existing syscall ABI: a nonnegative signed 32-bit file descriptor. On Linux and macOS it denotes a POSIX file descriptor; on Windows it denotes a descriptor in the supported application UCRT namespace. A source `Descriptor::Raw(i64)` is validated into this domain before narrowing. It is never a Win32 `HANDLE` or a raw pointer.

## Descriptor-owned native operation

An accepted syscall worker request that owns a private duplicate of its caller-supplied descriptor until the one native transfer has completed or been safely abandoned. It never changes or closes the caller's descriptor, and cancellation does not release the duplicate while the worker can still use it.

## Filesystem existence tri-state

The `Core.FS.Exists` outcome model in which an existing path is `Ok(true)`, a
missing path is `Ok(false)`, and an invalid input or adapter failure is a typed
`FsError`. Missing and failed are never collapsed into the same boolean.

## HIR-free

The compiler invariant that no high-level intermediate representation type, lowering pass, cache, adapter, serialization, or compatibility path exists between expanded AST/Salsa facts and ISLE/CLIF code generation.

## parse recovery diagnostics

Heuristic parse fallback diagnostics emitted when AST construction can still succeed after a syntax error. Shared repair primitives in `services/parse_recovery/` emit single-edit candidates (delimiters, separators, item stubs, expressions/patterns), retry parse, and emit a `parse.recovery` BSOL warning on success.

## single-token deletion recovery

An error-recovery heuristic that deletes one unexpected token when the following token is accepted by the parser’s expected-set (or is otherwise a safe continuation), then continues parsing from the recovered position. In this project it is used in sync recovery for punctuation-heavy and list-like syntax to reduce spurious cascading errors.

## Scoped-use acquisition

The proof that `use Type name = expression;` obtains sole lexical ownership:
either direct fresh construction or a recursively source-proven factory return
whose leaves are fresh constructions. Existing aliases, borrowed values,
unresolved/dynamic factories, and cyclic factory evidence fail closed.

## Immutable graph

A graph whose data and structure cannot be changed through its reader interface: users may inspect, select, pan, zoom, fit, and follow links, but cannot move, connect, delete, or edit nodes or edges.

## Immutable package coordinate

The identity formed by one package name and one semantic version. After publication, a different artifact cannot replace that coordinate. A corrected artifact requires a new version.

## Lockfile policy

The project-resolution rule selected by CLI flags. `--locked` requires an existing `Project.lock` that matches resolution. `--frozen` also forbids an update to that lockfile. These policies preserve a reviewed lockfile, but they do not make initial registry-version selection exact.

## Global distribution version

The one release identity for all externally distributed Beskid artifacts. An
explicit stable release selects one monotonic semantic version after recording
the validated superrepo and compiler commits; every platform artifact and
installer must report that same version.

## Informative documentation

Book pages, READMEs, guides, generated API documentation, archived designs, and implementation comments that explain or provide evidence for the standard but cannot redefine normative behavior.

## ISLE rule layer

The exhaustive generated rule set that consumes typed AST shape plus AST semantic facts and emits stock CLIF. Every typed operation has exactly one rule, and every generated function must pass Cranelift verification.

## Legacy alias

A stable `/platform-spec/**` path mapped through `openspec/catalog.json` to a
canonical capability identity page. A fragment is retained only when it names
a requirement anchor that the destination renders. The path alone never
selects a requirement because some legacy documents contain more than one.
The production server generates exact redirects for known aliases and returns
the Standard-specific no-match page with a 404 status for unknown aliases.

## Managed object allocation

The ABI-v5 operation that validates a descriptor-backed `BeskidAllocationRequest`, reserves and zeroes the requested storage, and installs the `BeskidObjectHeader` at the returned base address. Allocation makes the object eligible for descriptor and root-frame traversal but does not itself root the object.

## Native runtime kit

The installed ABI-v5 target/profile directory containing `abi.json` and matching static and shared artifacts for the single hosted Beskid runtime. A kit is usable only when its ABI, target, profile, layouts, sources, symbols, and hashes exactly match the compiled program.

## Node SQLite adapter

The service-local synchronous SQLite boundary used by Node-hosted site apps.
Auth uses pinned `better-sqlite3`, preserving prepared statements and
transactions while keeping native SQLite out of browser bundles.

## Page kind

The frontmatter classification that defines the required structure of a
technical Docs page. A `task` has prerequisites, actions, an expected result,
a recovery path, and a next task. A `guide` has orientation, a decision or use
section, limits, and next steps. A `reference` states its scope and authority
and explains how to report a mismatch. Each numbered task step has one
observable reader action.

## Normative requirement

A named OpenSpec requirement using SHALL or MUST and one or more testable scenarios. It defines behavior required for Beskid conformance.

## Platform specification

The historical name for the separately deployed standard reader. That service is retired; the canonical website now renders the Beskid standard at `/docs/standard/`, while `openspec/specs` remains the sole normative source.

## Production verification boundary

The operational evidence boundary joining an immutable
`cr.beskid-lang.org/beskid/<lane>:sha-*` image, its controlled `production`
alias, Watchtower reconciliation status, and the service's public health result.
Repository build workers cannot start, replace, or roll back production
containers. Those actions belong to Watchtower and the production operator.

## Product-use guide

An informative Docs page for an ordinary product task, such as signing in,
reading Tracker, or exploring Nexus. It states the user role, observable
result, stop condition, and recovery route. It links to service-operation
guidance instead of including deployment, secret, state, or administrator
actions.

## Release platform identifier

The exact operating-system and architecture key shared by release metadata and the download UI. The closed public set is `linux-amd64`, `darwin-arm64`, and `windows-amd64`; broader platform names and separate architecture fields are invalid.

## Service operating contract

The verified public and local boundary for one deployed service. It identifies
the service purpose, audience, authentication boundary, persistent state,
container image, health check, deployment owner, secret source, monitoring
evidence, and recovery path without publishing credential values.

## Service-operation guide

An informative Docs page for an authorized operator. It explains service
availability, authentication, persistent state, containers, deployment,
monitoring, and recovery within a verified ownership boundary. It can present
a service operating contract, but it does not define normative Beskid
behavior.

## Playground

The authenticated Beskid Learn workspace for trying arbitrary Beskid source with
the analyzer. It is not a curriculum exercise: it uses the editor's current
Monaco model and the dedicated `playground` analyze target.

## Playground

The authenticated Beskid Learn workspace for trying arbitrary Beskid source with
the analyzer. It is not a curriculum exercise: it uses the editor's current
Monaco model and the dedicated `playground` analyze target.

## Platform Spec document identity

The resolver-derived catalog identity of a taxonomy domain, taxonomy area, feature specification, feature-owned article, or feature-owned decision. It fixes the canonical source path, public slug, parent capability, layout, authority, disposition, title, and source hash; taxonomy hubs remain provisional, features own normative requirements, and articles or decisions remain informative.

## One-type-per-file module

A Foundation packaging convention where a public type such as `SyscallError` lives in its own unit whose module path ends with the type name (`Core.Syscall.SyscallError`). Qualified type references therefore name both the module and the type; semantic facts must resolve the type via the assembly module registry when ordinary parent-module lookup misses.

## Provenance catalog

The deterministic `openspec/catalog.json` mapping stable capability/requirement identifiers to source hashes, legacy slugs, canonical paths, statuses, aliases, and informative document references.

## Provisional capability

An OpenSpec capability retained for discoverability and historical coverage when its migrated material contained no explicit normative claim. Its single provisional requirement says that the capability cannot be cited for conformance until a reviewed OpenSpec change adds testable requirements.

## Project manifest

The single `.bproj` file that identifies one Beskid project, its source root, targets, and dependencies.

## Runtime intrinsic

A manifest-declared primitive or platform operation available only while compiling the canonical Beskid runtime under a non-forgeable trusted compiler capability. User packages cannot name, import, inherit, or invoke runtime intrinsics.

## run_once

The Fibers 0.1.13 executor operation that polls at most one ready unit of work
and reports `ran`, `waiting`, or `complete`; it does not spin or execute an
unwoken not-ready unit.

## Source provenance

Informative text and hashes retained inside OpenSpec capabilities and `openspec/catalog.json` to explain where migrated requirements came from. Provenance preserves history but is not itself normative.

## Standard identity page

An informative website page generated from `openspec/catalog.json` for one
capability or requirement. Its stable URL, identifier, status, catalog
revision, and canonical source link help readers find and cite the normative
OpenSpec text without copying that text into Docs.

## Workspace manifest

A `.bws` file that names a set of project-member directories. Each member directory contains exactly one project manifest.

## Woodpecker build service

The single repository build service for beskid. A Linux Docker worker validates
trusted pushes and builds Linux targets; dedicated local-backend workers build
Windows amd64 and macOS arm64 targets for manual or version-tag requests. Each
worker produces durable, checksummed evidence but has no release-publication or
production-deployment authority.

## Semantic review

The process of turning preserved descriptive migration text into precise, independently testable OpenSpec requirements without inventing behavior or losing source rationale.

## Typed Markdown directive

A readable Markdown block or link that identifies a `spec`, `book`, `nexus`, or `bug` target and can be enhanced into an embed by supported renderers while remaining understandable in generic Markdown.

## Traversable graph

An immutable graph that remains usable for exploration: pointer, touch, and keyboard users can pan, zoom, fit, select nodes, inspect connected relationships, activate canonical links, and focus named paths without altering graph data.

## word

The lowercase Beskid source primitive for an unsigned pointer-width machine value. `word` maps to the target native integer during semantic typing and ISLE lowering; ABI-v5 manifests and generated headers retain `usize` as their wire/layout term.

## Tracker delivery relation

A typed Nexus edge from a Tracker entity to an OpenSpec standard identifier. Its graph identity includes both the Tracker ID and catalog revision, so a link cannot be silently reused against a different catalog revision.

## Typed array growth

The single manifest-owned ABI-v5 operation that increases managed array
capacity while preserving the array's element descriptor, logical length,
initialized values, roots, and pointer barriers. Element get/set remains
direct bounds-checked ISLE lowering rather than part of this runtime call.

## Guided lesson step

A learner-facing unit in Beskid Learn that pairs explanatory copy with an optional editor focus range and source or command check. Steps are ordered, visibly tracked, and must pass before the next locked step becomes available.

## Fixed lesson tile mosaic

The immutable Beskid Learn workspace arrangement derived from a lesson's declared visible tiles. It sizes and splits the editor, terminal, lesson content, and optional lesson views automatically. Learners cannot open, close, reorder, or resize its tiles.

## Typed Docs annotation

A schema-checked record on a public technical guide that names its audience,
status, authoritative source, limits, verification revision, and verification
date. The shared page-title renderer displays the record after the title so
readers can distinguish informative guidance from normative OpenSpec text.

## Verified procedure

An informative Docs task whose commands, prerequisites, expected result,
recovery path, and evidence revision match a checked repository or generated
contract. Verification shows what maintainers tested at that revision. It does
not make the procedure normative or guarantee a later deployment.

## Beskid.Glue

The Beskid interop layer that connects Beskid code to code in another language.
In 0.6.0 its delivered form is Rust Glue: an in-process call path through a
checked C ABI between a Glue consumer image and Rust owner images. Bindings are
`Extern` contracts and `[GlueHandle]` types whose `Library` names a manifest
`glue` block. The 0.6 boundary vocabulary is `GlueLogicalType` (primitives,
arrays, generic positions and branded handles); its unification with
`Interop.Contracts` is deferred to `v061-glue-extensions`.

## Interop.Contracts

The language-agnostic boundary vocabulary in `beskid_abi::interop`: type-shape classes (`Scalar`, `OpaqueHandle`, `Buffer`, `StringLike`, `Never`), call-shape classes, ownership classes (`Borrow`, `Transfer`, `OpaqueBorrow`), and a conformance envelope. C and Rust ABI profiles bind these primitives rather than redefining them. The 0.6 Glue code path does not yet lower to it.

## Glue backend

The codegen backend selected with `beskid build --backend`. `clif` is the
default Cranelift path. `glue-rust` builds a `Lib` target as a shared Glue
consumer plus one Rust owner image per referenced `glue` block, and requires
explicit Rust tools. `glue-dotnet` is parsed but unavailable in 0.6.

## Glue owner block

The top-level project manifest block `glue "<library>" { backend = rust path = "<dir>" }`.
The label is the canonical owner library identity and equals the `Library`
string of the `Extern` contracts and `GlueHandle` types the owner implements.
`path` is the project-relative Rust owner source directory. Only `backend` and
`path` are accepted (E1867 for any other key).

## GlueHandle

The attribute `[GlueHandle(Library: "<library>", Nullable: <bool>)]` on a type
declaration. It brands the type as an opaque foreign handle owned by that
library. A nominal type crosses the Glue boundary only with exactly one
`GlueHandle` brand; plain records are rejected in 0.6.

## RustOwner

The attribute that maps a Glue binding to a Rust path. On an `Extern` contract
method it is `[RustOwner(Path: .., Fallible: ..)]`, both optional; without it the
default path is `implementation::<symbol>`. On a `GlueHandle` type `Path` is
required and `Fallible` is rejected. A path starts with the generated
`implementation` module and may not use crate roots, relative roots, keywords or
generic arguments.

## Rust owner image

The shared native image built from a `glue` block's Rust sources by a hermetic
Cargo build with the tools named on the command line. It implements the imports
of one library and carries its own admission record.

## Glue admission record

The immutable record that each Glue image compiles into itself before the link:
the consumer through a generated C object
(`beskid_glue_artifact_v1_admission_record`), a Rust owner through a generated
`static` (`beskid_glue_rust_owner_v1_admission_record`). The host reads it from
the file bytes before any image code runs. A record is evidence, not trust: the
consumer image digest arrives through the build's own result output, the
consumer record pins every Rust owner image by digest, and a record from another
compiler version is not admitted.

## Glue stdio bridge

The provisional process-isolated Glue transport in `Core.Glue` (envelope,
binary codec, pump, session) and the `beskid_glue` crate. It has no 0.6 delivery
obligation, its release cases fail closed, and there is no fallback between it
and the in-process path (`v06-glue-stdio-bridge-provisional`).

## ToolchainProbe

The typed fail-closed model for external tools in `beskid_abi::toolchain`
(`ToolSpec`, `ResolvedTool`, `ToolchainError`), modeled on runtime-kit
validation: exact paths, no search-path fallback. It is no longer a Glue Mod
contract; the 0.6 Rust Glue build takes its tools from explicit CLI flags.

## cargo-binstall

The contributor and CI bootstrap tool for Rust command-line binaries. It prefers
prebuilt release artifacts over compiling tools from source; it does not change
how Cargo resolves or compiles project dependencies.

## mold linker

The fast ELF linker used for Beskid's Linux Rust builds through the `clang`
linker driver. Beskid's macOS and Windows builds retain their platform-specific
linkers because this configuration is Linux-only.

## Glue contracts cutoff (0.4)

Historical. The 0.4 Glue delivery: the OpenSpec contract, the `Interop.Contracts` typed model, the `Backend` trait, seven Glue Mod contracts with the `[Glue]`, `[GlueImport]` and `[GlueExport]` attributes, a stdio bridge design and the `ToolchainProbe` scaffold. 0.6.0 deletes the Mod contracts and attributes (`v06-rust-glue-integration`).

## Glue generation (0.5)

Historical. The planned 0.5 Glue obligation (Rust and .NET emitters, .NET signature reading, stdio protocol, full `ToolchainProbe`). It did not ship in 0.5. 0.6.0 replaces it with in-process Rust Glue; .NET stays unavailable.

## Ridge identity

The user-selected beskid logo: two solid, asymmetric mountain shoulders separated by an open diagonal, paired with a lowercase wordmark. Its canonical geometry and generated asset family live in [`site/beskid_brand`](site/beskid_brand/); usage is defined in [`BRAND.md`](site/beskid_brand/BRAND.md).

## Query gate

The `beskid_queries` typing and legality authority. In 0.6.0 it is the only
semantic front end: `check`, `build`, `run`, `test` and the language server run
the same gate, and a program it accepts is never judged again by a second type
system (`v06-query-front-end`).

## Executable front end

The value the query gate produces for an executable build: the rewritten syntax
assembly plus composition authority (`ExecutableFrontEnd`). Codegen builds
`TypedProgram` and `CodegenInput` from it and lowers through ISLE. A failure
after the gate accepts a program is a compiler gap, not a user error.

## Function value

A value of a function type. It is a GC-managed closure record (header, code
pointer, environment pointer) whose ABI is one pointer. A named non-generic
function used as a value has a null environment. Captures are by-value
snapshots taken when the record is created (`v06-function-values`).

## Native Mod host

The process that loads and runs compiled Mod executables for project
preparation. The CLI uses its own executable (`beskid dev native-mod-worker`);
the language server uses the `beskid` CLI next to it unless the `modHost`
initialization option selects another executable and runtime kit.

## Mod artifact descriptor

The `mod.descriptor.json` file beside a compiled Mod executable
(`ModArtifactDescriptor`, schema 3, host ABI 2). It records the package
identity, target triple, compiler version, contract registrations, callable
identities, source, SDK and dependency digests, the runtime binding, and each
build tool by executable digest and captured version output. A Mod artifact is
loaded only when its descriptor matches the current sources and Mod host.

## Release case

One mandatory entry of `scripts/ci/release-cases-v06.json`. It names its
requirement ids, the project or harness that executes it, the exact test ids it
binds, and its execution kind (`installed_native` or `installed_host_harness`).
Every release case must pass on every release target against the installed
candidate; unbound or missing cases reject the release. 0.6.0 has 86.

## Provisional release case

An entry of `provisional_cases` in the release case manifest. It records an
obligation that is not part of the release (in 0.6.0, the 15 stdio bridge
cases). Provisional cases are not evaluated and cannot count as passed.

## Heap and fiber stack limits

The process-wide runtime limits read at `beskid_rt_v5_process_init`.
`BESKID_HEAP_MAX` installs a managed heap cap (decimal bytes, optional `k`, `m`
or `g` suffix); without it the heap has no fixed cap. `BESKID_FIBER_STACK_MAX`
sets the per-fiber stack reservation (default 8 MiB, a whole multiple of the
64 KiB initial commit). An invalid value traps with the variable name.

