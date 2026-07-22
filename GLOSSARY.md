# Glossary

## ABI v5

The direct-call native application binary interface for the rewritten Beskid compiler and runtime. It supports only little-endian 64-bit `x86_64-unknown-linux-gnu`, `aarch64-apple-darwin`, and `x86_64-pc-windows-msvc`; all runtime exports are versioned `beskid_rt_v5_*` symbols and its exact contracts are generated from `compiler/runtime_manifest.bsol` into `abi.json`.

## AST semantic facts

Generation-scoped results computed by Salsa for expanded AST nodes, including resolution, types, signatures, call lowering, cast intent, control flow, and runtime-intrinsic authorization. They are keyed by `AstNodeKey` and replace HIR as the semantic input to tooling and code generation.

## Architecture map

An informative, checked-in conceptual map of the Beskid compiler and its direct boundaries. It resolves canonical public specification links from the OpenSpec catalog, presents implementation paths as evidence, and never replaces OpenSpec requirements as the normative authority.

## Auth Hub

The central `site/auth` service. It is the only browser identity authority for pckg and authenticates users through the GitHub application login flow. pckg consumes a paired handoff and retains only pckg-specific authorization and profile data.

## Beskid standard

The current normative requirements in `openspec/specs`. A text outside that directory is not part of the standard unless it is incorporated through a validated OpenSpec change.

## Bug-only GitHub synchronization

Tracker integration in which GitHub Issues represents public bugs and their supported status/discussion fields only. Roadmap tasks, versions, workstreams, milestones, and deliverables remain in Tracker's SQLite domain model.

## Canonical UI packages

`@beskid/ui-react` and `@beskid/beskid-ui`, sourced from `beskid_web_common`. They provide the only shared component and style implementation for Beskid web applications.

## Capability

An OpenSpec unit stored at `openspec/specs/<capability>/spec.md`. During migration, Beskid feature hubs become feature capabilities while domains and areas become taxonomy/governance capabilities.

## HIR-free

The compiler invariant that no high-level intermediate representation type, lowering pass, cache, adapter, serialization, or compatibility path exists between expanded AST/Salsa facts and ISLE/CLIF code generation.

## Immutable graph

A graph whose data and structure cannot be changed through its reader interface: users may inspect, select, pan, zoom, fit, and follow links, but cannot move, connect, delete, or edit nodes or edges.

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

The service-local compatibility boundary backed by pinned `better-sqlite3`. It
preserves the synchronous prepared-statement and transaction behavior used by
Auth, Platform Spec, and Tracker while keeping the native dependency out of
browser bundles.

## Normative requirement

A named OpenSpec requirement using SHALL or MUST and one or more testable scenarios. It defines behavior required for Beskid conformance.

## Platform specification

The public reader and service that renders the Beskid standard. It is a presentation and integration surface; `openspec/specs` is its source of authority.

## Provenance catalog

The deterministic `openspec/catalog.json` mapping stable capability/requirement identifiers to source hashes, legacy slugs, canonical paths, statuses, aliases, and informative document references.

## Provisional capability

An OpenSpec capability retained for discoverability and historical coverage when its migrated material contained no explicit normative claim. Its single provisional requirement says that the capability cannot be cited for conformance until a reviewed OpenSpec change adds testable requirements.

## Runtime intrinsic

A manifest-declared primitive or platform operation available only while compiling the canonical Beskid runtime under a non-forgeable trusted compiler capability. User packages cannot name, import, inherit, or invoke runtime intrinsics.

## Source provenance

Informative text and hashes retained inside OpenSpec capabilities and `openspec/catalog.json` to explain where migrated requirements came from. Provenance preserves history but is not itself normative.

## Semantic review

The process of turning preserved descriptive migration text into precise, independently testable OpenSpec requirements without inventing behavior or losing source rationale.

## Staged promotion

A delivery process that builds an artifact once, verifies and deploys its immutable digest to staging, then automatically promotes that exact digest to production after staging succeeds, with environment-scoped secrets, smoke/SLO gates, and rollback evidence.

## Typed Markdown directive

A readable Markdown block or link that identifies a `spec`, `book`, `nexus`, or `bug` target and can be enhanced into an embed by supported renderers while remaining understandable in generic Markdown.

## Traversable graph

An immutable graph that remains usable for exploration: pointer, touch, and keyboard users can pan, zoom, fit, select nodes, inspect connected relationships, activate canonical links, and focus named paths without altering graph data.

## word

The lowercase Beskid source primitive for an unsigned pointer-width machine value. `word` maps to the target native integer during semantic typing and ISLE lowering; ABI-v5 manifests and generated headers retain `usize` as their wire/layout term.
## Tracker delivery relation

A typed Nexus edge from a Tracker entity to an OpenSpec standard identifier. Its graph identity includes both the Tracker ID and catalog revision, so a link cannot be silently reused against a different catalog revision.
