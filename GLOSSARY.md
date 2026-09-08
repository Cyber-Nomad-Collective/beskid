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

## Bug-only GitHub synchronization

Tracker integration in which GitHub Issues represents public bugs and their supported status/discussion fields only. Roadmap tasks, versions, workstreams, milestones, and deliverables remain in Tracker's SQLite domain model.

## Canonical UI packages

`@beskid/ui-react` and `@beskid/beskid-ui`, sourced from `beskid_web_common`. They provide the only shared component and style implementation for Beskid web applications.

## Capability

An OpenSpec unit stored at `openspec/specs/<capability>/spec.md`. During migration, Beskid feature hubs become feature capabilities while domains and areas become taxonomy/governance capabilities.

## Coolify target URL

The `https://<host>:<container-port>` route descriptor sent to Coolify so its proxy selects the correct Compose service port. It is deployment configuration, not necessarily a public TLS listener; public health checks and API clients use the service's separate standard-HTTPS public URL.

## Draft Context

A revision-pinned, ordered set of Platform Spec document operations authored in the
editor. It is a reviewable OpenSpec change bundle, never a second normative store.
Statuses include draft, submitted, approved, rejected, merged, abandoned, and superseded.

## Draft Context abandoned

Terminal status when the linked GitHub pull request closes without merge. Distinct from
moderator rejection of a submitted context.

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

## Immutable graph

A graph whose data and structure cannot be changed through its reader interface: users may inspect, select, pan, zoom, fit, and follow links, but cannot move, connect, delete, or edit nodes or edges.

## Immutable package coordinate

The identity formed by one package name and one semantic version. After publication, a different artifact cannot replace that coordinate. A corrected artifact requires a new version.

## Lockfile policy

The project-resolution rule selected by CLI flags. `--locked` requires an existing `Project.lock` that matches resolution. `--frozen` also forbids an update to that lockfile. These policies preserve a reviewed lockfile, but they do not make initial registry-version selection exact.

## Global distribution version

The one release identity for all externally distributed Beskid artifacts. Compiler CI on `main` mints it exactly as `0.4.<GITHUB_RUN_NUMBER>` and emits it for downstream consumers; tags, commits, manifests, and downstream workflow run numbers cannot create an alternate value.

## Informative documentation

Book pages, READMEs, guides, generated API documentation, archived designs, and implementation comments that explain or provide evidence for the standard but cannot redefine normative behavior.

## ISLE rule layer

The exhaustive generated rule set that consumes typed AST shape plus AST semantic facts and emits stock CLIF. Every typed operation has exactly one rule, and every generated function must pass Cranelift verification.

## Legacy alias

A stable `/platform-spec/**` path mapped through `openspec/catalog.json` to a canonical capability or requirement, preserving existing Book, Tracker, Nexus, and external links.

## Managed object allocation

The ABI-v5 operation that validates a descriptor-backed `BeskidAllocationRequest`, reserves and zeroes the requested storage, and installs the `BeskidObjectHeader` at the returned base address. Allocation makes the object eligible for descriptor and root-frame traversal but does not itself root the object.

## Native runtime kit

The installed ABI-v5 target/profile directory containing `abi.json` and matching static and shared artifacts for the single hosted Beskid runtime. A kit is usable only when its ABI, target, profile, layouts, sources, symbols, and hashes exactly match the compiled program.

## Node SQLite adapter

The service-local synchronous SQLite boundary used by Node-hosted site apps.
Auth uses pinned `better-sqlite3`, preserving prepared statements and
transactions while keeping native SQLite out of browser bundles.

## Normative requirement

A named OpenSpec requirement using SHALL or MUST and one or more testable scenarios. It defines behavior required for Beskid conformance.

## Platform specification

The historical name for the separately deployed standard reader. That service is retired; the canonical website now renders the Beskid standard at `/docs/standard/`, while `openspec/specs` remains the sole normative source.

## Production verification boundary

The current root workflow boundary that validates a checksummed release
manifest, verifies its source run, waits for externally controlled Watchtower,
and runs public smoke checks. It cannot start, replace, or roll back production
containers; the production operator owns those actions.

## Release platform identifier

The exact operating-system and architecture key shared by release metadata and the download UI. The closed public set is `linux-amd64`, `darwin-arm64`, and `windows-amd64`; broader platform names and separate architecture fields are invalid.

## Service operating contract

The verified public and local boundary for one deployed service. It identifies
the service purpose, audience, authentication boundary, persistent state,
container image, health check, deployment owner, secret source, monitoring
evidence, and recovery path without publishing credential values.

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

## Workspace manifest

A `.bws` file that names a set of project-member directories. Each member directory contains exactly one project manifest.

## Semantic review

The process of turning preserved descriptive migration text into precise, independently testable OpenSpec requirements without inventing behavior or losing source rationale.

## Staged promotion

A GitHub Actions-controlled delivery process that builds an image once, publishes it to GHCR, deploys its immutable digest to Coolify staging, then automatically promotes that exact digest to production after staging succeeds, with environment-scoped secrets, smoke/SLO gates, and rollback evidence. Host-side image watchers and private-registry deployment paths are outside this process.

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

## Document annotation

A short statement on a public technical guide that identifies its status, authoritative source, and limits. Beskid Docs uses annotations to distinguish informative guidance from normative OpenSpec requirements.

## Beskid.Glue

The generator/reader layer that lets Beskid integrate with multiple target languages through a common model. It instantiates the `Interop.Contracts` vocabulary as typed values and adds glue-specific generation and reading constructs; it does not redefine the boundary vocabulary.

## Interop.Contracts

The normative language-agnostic boundary vocabulary: type-shape classes (`Scalar`, `OpaqueHandle`, `Buffer`, `StringLike`, `Never`), call-shape classes, ownership classes (`Borrow`, `Transfer`, `OpaqueBorrow`), and a conformance envelope. C and Rust ABI profiles bind these primitives rather than redefining them.

## Glue backend

A `Backend` trait implementation at the `CodegenInput` boundary that emits a non-CLIF artifact (Rust source, .NET project) instead of Cranelift CLIF. Backends are selected by a manifest flag, not by a new mod contract kind; the existing Cranelift path is the `CraneliftClif` backend.

## Glue contract

One of seven atomized, single-purpose, closed-set contracts a per-language glue mod implements: `TypeMapping`, `SymbolEmission`, `LinkArgs`, `SignatureReader`, `SignatureWriter`, `ToolchainProbe`, and `StdioBridge`. The set mirrors the existing mod SDK closed contract pattern.

## Glue mod

A Beskid package (`type = Mod`) implementing the seven glue contracts' rules (type mappings, emission templates, toolchain allowlists, stdio protocol) as Beskid data and typed AST contributions. The host dispatches the contracts; the host seam stays Rust.

## Stdio bridge fiber

A Beskid cooperative `Fiber` generated by the glue system from `[GlueImport]` attributes that proxies calls between the Beskid runtime and a foreign library over a stdio message protocol, for cases that cannot be direct FFI. It owns a registry of host typed tag objects, one per imported library.

## Host typed tag object

An `OpaqueHandle`-shaped, Beskid.Glue-typed handle representing one imported foreign library, used by the stdio bridge fiber to route messages.

## ToolchainProbe

A fail-closed glue contract, modeled on the ABI-v5 runtime-kit validation pattern, that discovers and verifies external tools (rustc, cargo, dotnet, linkers) by exact path, sha256, version, and capability, and rejects drift before link or load.

## Glue contracts cutoff (0.4)

The 0.4 delivery obligation for Beskid.Glue: the normative OpenSpec contract, the `Interop.Contracts` typed model, the `Backend` trait with three variants (`CraneliftClif` wired, `RustSource` and `DotnetProject` declared), the seven glue contracts declared as Beskid contracts and attributes, the stdio bridge fiber design, and the `ToolchainProbe` contract scaffold. No language-specific emission code ships in 0.4.

## Glue generation (0.5)

The 0.5 delivery obligation for Beskid.Glue: language-specific code generation (Rust and .NET emitters), dotscope-based .NET signature reading, corelib/runtime stdio and other-protocol implementation, full `ToolchainProbe` implementation, and extending glue projects in Beskid to insert rust, C#, or any language.
