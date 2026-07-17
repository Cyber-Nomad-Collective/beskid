# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Version numbering tracks the [Beskid normative spec](https://spec.beskid-lang.org).

## [Unreleased]

### Changed

- Stage a freshly produced native-host ABI-v5 runtime kit for compiler and corelib CI gates,
  replacing Rust runtime-bridge setup.

### Added

- Generation-safe expanded-syntax semantic facts now cover cross-unit calls,
  trusted canonical-runtime intrinsics, and test metadata used by the CLI
  migration.
- Canonical runtime allocation ownership and descriptor pointer-map contracts,
  with mark/sweep regressions for rooted object graphs.
- Syntax-to-ISLE CLI build/run routing and a target/profile runtime-kit
  publication and provenance validation matrix.
- Prepared-syntax AOT lowering, transparent aggregate ABI facts, and native
  static/shared library-pair emission without an executable runtime-kit.
- Rust/React pckg registry delivery with GitHub-subject Auth Hub sessions,
  PostgreSQL-backed package persistence, validated package artifacts, and
  production Docker/Compose configuration.
- Complete pckg package browsing and community parity: safe README, structured
  documentation and source-tree browsing; PostgreSQL-backed profiles, boards,
  posts, comments, follows, votes, and notifications; and matching React
  package/community screens.
- Subject-scoped pckg API-key management with one-time plaintext issuance,
  hash-only PostgreSQL storage, scoped ownership-safe revocation, and React
  dashboard support for API keys and the current owner's packages.
- GitHub-subject pckg administration: explicit one-time superadmin bootstrap,
  role and publisher-verification management, resource grants, package-review
  audit decisions, and React administration screens.
- Public publisher discovery and catalog pages backed by verified profiles and
  visibility-filtered package ownership.
- Owner-authorized package deletion and version listing, with retained
  visibility and artifact-cleanup guarantees; retired unsupported dashboard
  routes now resolve through the normal 404 experience.

- Immutable compiler-release packaging for Windows MSI/EXE, macOS DMG and
  Homebrew, Debian, and Snap; the new Windows EXE is a WiX Burn bootstrapper
  and the DMG bundles CLI and LSP in `Beskid.app`.

- Bidirectional Book-to-OpenSpec traceability: catalog-derived public Book
  links, a reader panel that labels those guides informative, validation for
  the technical Book pilot, and expanded chapters on specification reading,
  documentation comments, and FFI.

- OpenSpec 1.4.1 as the pinned normative-standard workflow, with a validated
  repository change proposal, design, behavioral deltas, and phased migration
  plan.
- Semantic migration of 1,042 legacy platform-spec nodes into 184 OpenSpec
  capabilities and 418 reviewed or explicitly provisional requirements, while
  retaining all 1,042 source records and 3,189 artifact hashes for provenance.
- Direct OpenSpec catalog/content reading in the platform-spec site, versioned
  JSON/HTML requirement embeds, a dependency-free `<beskid-doc-embed>` element,
  and typed `spec`, `book`, `nexus`, and `bug` Markdown directives.
- OpenSpec catalog adapters for Tracker and Nexus, including stable requirement
  IDs, catalog revision metadata, legacy aliases, and Nexus cache invalidation.
- Repository `GUIDE.md` and `GLOSSARY.md` for cross-project operations and the
  new standard/authority terminology.
- Reusable CI/CD workflows for blocking quality gates, immutable image records,
  checksummed release manifests, and protected staging/production promotion.
- Fail-closed Coolify deployment polling with exact-digest Compose rendering,
  post-deploy smoke checks, automatic rollback, and W3C trace correlation.
- Local CI/CD contract tests covering manifest policy, immutable rendering,
  plan-only promotion, and failed-API handling.
- Blocking Trivy HIGH/CRITICAL image scans with retained SARIF evidence and a
  release-manifest policy that rejects unscanned artifacts.

### Fixed

- Publish the active shared UI package set and make the Nexus image consume the
  public settings export rather than an unavailable package subpath.
- Install the scoped Trudoc package required by the published shared UI so the
  website image can resolve its platform-spec navigation imports.
- Build the Platform Spec image from the root Bun workspace lockfile rather
  than a nonexistent site-local lockfile.
- Make the manual Compiler Testbox workflow dispatch-only so pull requests no
  longer start a job without its required Testbox session identifier.
- Make the local supply-chain policy gate inspect only superrepo-tracked
  workflows, matching its non-recursive GitHub checkout.
- Reject hidden artifact paths outside the root `.beskid/docs` metadata tree
  before any package documentation or source is exposed.
- Validate Corelib workspace member aliases against their explicit registry
  package declarations and keep Rust Clippy iterator checks warning-free.
- Stabilize Open VSX extension gates across randomized Bun test ordering and
  Windows/macOS runners by completing shared VS Code mocks, using portable file
  URL conversion, and provisioning ripgrep before compiler parity checks.
- Package the canonical OpenSpec catalog into the Nexus image through an
  explicit named BuildKit context while retaining the service-local Docker
  build context.
- Retain the generic resizable-panel dependency used by the shared UI primitive
  after removing the legacy platform-spec component bundle.
- Initialize selected CI submodules recursively and include the compiler in the
  platform integration gate so nested Corelib validation is always available.
- Keep main-branch staging promotion in fail-safe plan mode and require an
  explicit workflow dispatch before mutating the external staging lane.
- Default Tracker non-bug task synchronization to disabled while preserving the
  bug synchronization path behind focused regression coverage.
- Replace Nexus's legacy website-MDX standard index with the revisioned OpenSpec
  catalog and render typed authority-aware standard links in the graph explorer.
- Require platform smoke success before the existing platform deploy job.
- Block release image publication and production deployment on release gates.
- Propagate Coolify deploy and OpenBao synchronization failures instead of
  reporting a successful deployment after suppressed errors.

### Removed

- The `site/spec-content` custom `spec.json`/`content.md`/`layout.json` corpus
  and its submodule registration after strict provenance and alias validation.
- The root custom spec CLI entry point and migration-only regeneration path;
  canonical authoring now happens through OpenSpec changes.
- The obsolete shared `spec-core` and `spec-cli` source packages and the
  platform-spec dependency that could recreate them through `workspace:*`.
- Legacy Dagger, OpenTofu, duplicate container/deploy workflows, and mutable-tag
  delivery paths superseded by the staged GitHub Actions pipeline.

### Security

- Enable SBOM and minimal BuildKit provenance in the replacement image workflow,
  with an explicit keyless image-signing hook and OIDC permission boundary.

## [0.4.0] - TBD

### Added

- **beskid_bsol** submodule for standalone BSOL workspace
- Byte operations support in corelib
- Generic assertions for corelib test infrastructure
- `<beskid-hub>` web component and platform-spec catalog generation
- Composite action `action.yml` and CI workflows for site services
- Reusable composite action `build-beskid-service`
- GitNexus ingest setup for code intelligence indexing
- Compiler test coverage instrumentation
- Auth/tracker autopairing and GitHub sync

### Changed

- Updated the BSOL analysis pipeline, the native compiler runtime migration,
  the registry web application, and the shared authentication handoff client.

- **CI/CD migration from Dagger to Blacksmith Testbox**
  - Compiler gate runs via Testbox scripts instead of Dagger
  - Migrated workflows to Blacksmith runners
  - Added Blacksmith testbox configuration and gate job timeout caps (6 h)
  - Bumped beskid_infra to Debian gate images
- Compiler type checker refactor and pipeline unification
- Compiler DRY refactor across SDK crates
- Corelib expansions: shapes, concurrency stack, runtime stabilization
- Progress toward full corelib test pass
- BSOL stability pass; updated normative and informative docs
- Project model unification across compiler modules
- Site deps migrated to published `@beskid/beskid-ui` and `trudoc` packages
- Bumped astro from 6.2.2 to 6.4.6 in `site/website`
- Dropped `.claude` directory
- Removed duplicate `beskid_normative_spec` submodule entry
- Unified CICD approach across superrepo
- Multiple compiler submodule bumps for type checker refactor, clippy gate fixes, corelib matrix stability, AOT entrypoint, Core.Results smoke tests, and expression-bodied method parser

### Fixed

- Platform image builds for CI gates
- Platform-spec moderation loader import protection
- CI gates for corelib workspace deps and stack-heavy tests
- Windows CLI build
- Tracker Dockerfile path in container-images workflow
- Container image lockfile verification on tracker and nexus jobs
- Bundling errors for TypeScript services
- Coolify API 422 errors
- OpenBao CLI task failures
- Kanban board drag interaction
- Dagger engine segfaults (reverted v0.21.5 and v0.21.6, landed on v0.21.0)
- Dagger module `bun.lock` conflict (Dagger uses npm for deps)
- `NODE_AUTH_TOKEN` propagation to platform-lockfile-gate
- Alpine package manager changes in submodules

## [0.3.0] - 2026-05-28

Eight-track orchestrated release: compiler-mod-execution, native DI codegen/runtime,
export-FFI link-time, corelib tiering and collections/FS API, foreign-lib-import CLI,
runtime phase B GC/syscall, dynamic-types codegen, and tooling/packageKind/formatter.

### Added

- **v0.3 feature tracks (all merged 2026-05-23)**
  - Native DI codegen and runtime end-to-end
  - Export FFI link-time with traceability
  - Compiler-mod-execution with mod-host-bridge
  - Corelib tiering, collections, and FS API shape
  - Foreign-lib-import CLI with `beskid import lib` and ExternalLibrary closed registry
  - Runtime phase B GC opt-in
  - Dynamic-types codegen
  - packageKind tool Standard and formatter feature hub
- **New submodules**
  - `beskid_nexus` for compiler knowledge graph
  - `beskid_treesitter` for grammar integration
  - `beskid_tracker` with repo manifests and hub UI
- **Infrastructure**
  - Greenfield Coolify project via OpenTofu pipeline apply
  - Vendored Coolify provider 1.1.18-beskid with `destination_uuid` support
- **Macro system**
  - Macro expand pass
  - Macro registry wiring in compiler
- **Docs and site UI**
  - `trudoc` and docs-ui packages moved to `beskid_web_common`
  - Giscus comments integration
  - Platform-spec frontmatter verification
  - Platform-spec home UX: tabs, map height, zoom, typography
  - Spec page header and layout styles for navigation and responsiveness
  - ADRs for corelib API shape and tier classification
  - Beskid grammar support in trudoc
  - Orchestration handoffs and verification evidence for all 8 subplanner tracks
- **CI**
  - Open VSX publishing workflow with darwin-arm64 VSIX and cross-compiled Intel LSP
  - Open VSX version derived from tags and commits
  - `beskid_vscode` submodule added for extension development
  - Nox-driven aggregate workflows
  - Centralized Nox/CI logging and submodule diagnostics

### Changed

- Changed hosting model of beskid services to Coolify
- Multiple compiler submodule bumps across the period (CI fixes, corelib, e2e, format, ABI, graph tests, Linux corelib gate, release-profile prelude lowering, RUST_MIN_STACK, serialized prelude lowering, artifact sources, stack overflow, macro expand/registry, corelib publish CI, e2e build output assertions, corelib-quality, runtime bridge and ffi_v03)
- Multiple pckg submodule bumps (bootstrap onboarding, docs browser, reCAPTCHA, PackageDocs, docs/dashboard)
- Bumped beskid_vscode submodule to main
- Bumped beskid_nexus submodule for CI smoke, Docker fixes, and Ladybug native CI
- Dockerfile updated to include git for platform-spec generation
- Consolidated platform-spec cutover and stabilized website container build

### Fixed

- Open VSX semver build metadata acceptance and strict patch progression
- VS Code extension package source tracking
- Monorepo bun lockfile usage in site image build
- VS Code extension pinned to canonical GitHub URL
- Inactive submodules skipped on Coolify shallow clone
- Platform-spec registry-api-reference MDX build for Astro
- Book page title frontmatter
- Runtime bridge built before AOT e2e tests
- Runtime CI triggered on compiler submodule pointer bumps
- Layout-report merge conflict and submodule pinning
- YAML frontmatter quoting for colons and backticks in spec
- ASan bridge archive wired for runtime tests
- `references/bsharp` submodule registered and later removed entirely
- Auth Vite dedupe for workspace packages
- CI checkout order in reusable workflows
- OpenTofu provider lock and Coolify provider checksums
- Coolify `destination_uuid` for localhost server
- Coolify provider base64 encoding of `docker_compose_raw`
- Coolify production environment 409 (skip existing)
- GH Packages auth and container build configuration
- Dagger, OpenTofu, and platform deploy workflow repairs
- Security audits replaced with Semgrep
- OpenBao stale tfplan after targeted apply
- bun.lock regenerated with bun 1.3.14 for CI/Docker parity
- Trudoc paths stabilized for web workspace CI and Coolify
- Legacy URL redirects and Coolify deploy guidance
- CodeQL alert addressed

## [0.1.0] - 2026-04-22

Initial public release. Project bootstrapped as "Pecan" and renamed to "Beskid".

### Added

- **Project bootstrap**
  - Initial commit and rename from Pecan to Beskid
  - Workspace reorganized from `src/` to `crates/` directory structure
  - `beskid_abi` crate
  - Astro documentation site infrastructure with Node.js tooling
  - `beskid_standard` submodule as corelib
  - `beskid_vscode` workspace member moved to root
- **HIR and semantic analysis**
  - HIR documentation structure and phase-indexed shared-core model
  - Resolver with module graph, local scopes, resolution tables, and path/type resolution
  - `diagnostic_kinds` module with 60+ error/warning variants
  - LSP services: hover, definition, references, completions, symbol extraction
- **Type system and language features**
  - String interpolation with desugaring to binary concatenation
  - Builtin symbols: `SYS_PRINT`, `SYS_PRINTLN`, `STR_LEN`, `STR_CONCAT`
  - Attribute and lambda expression support in grammar and HIR
  - `AttributeTargetKind` with diagnostic integration
  - Impl block syntax with method receiver validation and call lowering
  - Method call support with receiver-based resolution and `this` binding
- **GC and runtime scaffolding**
  - `gc-arena` crate with derive macro and comprehensive documentation
  - Runtime GC scaffolding documentation
- **Analysis and normalization**
  - HIR normalization pass (for-loop to while-loop desugaring)
  - Analysis services: input/project resolution, parsing, analysis utilities
  - Visitor pattern for control flow, name resolution, and type checking
- **CI/CD**
  - CI workflow with workspace checks, interop freshness, ABI/dispatch parity, AOT smoke tests
  - Multi-platform CLI release pipeline with SeaweedFS distribution (later replaced by submodule approach)
  - Open VSX publishing workflow
- **Docs**
  - Trait-based lowering architecture roadmap
  - Execution plan with Phase 1/2 completion status
  - Semantic analysis docs with diagnostic codes and type system progress
  - Package management planning documentation
  - Standard library artifact manifest
  - Language book and module docs aligned with file-scoped semantics
  - Site landing and downloads surfaces redesigned
- **VS Code extension**
  - SVG/PNG favicon assets for extension icon
  - LSP defaults to bundled server; cargo launch gated behind devMode

### Changed

- Migrated from local corelib to `beskid_standard` submodule
- Extracted interop tooling from `beskid_cli` into standalone `beskid_interop_tooling` crate
- Removed `expression_walk` module; refactored to `HirWalker` visitor
- Removed unused traversal module
- Removed `gc-arena` UI tests
- Refactored nested if-let chains to let-chains syntax
- Reformatted imports to alphabetical ordering across `beskid_abi` and `beskid_analysis`
- Removed documentation files; migrated to Astro-based site
- Reorganized docs into spec/execution/standard-library/guides structure
- Removed numeric prefixes from documentation filenames
- VS Code extension icon redesigned (circular background, soft logo shadow)
- Consolidated platform-spec cutover and stabilized website container build
- Multiple compiler and pckg submodule bumps for CI fixes, stdlib cleanup, module compatibility, e2e isolation, corelib pckg versioning, registry activity, CLI publish UX, and VS Code extension updates

### Fixed

- `SourceSpan::new` length parameter type conversion
- Use-before-declaration analysis for pending variables
- `INTEROP_DISPATCH_USIZE` return type corrected to I64
- Runtime CI submodule checkout
- Site docs frontmatter and client script build errors
- VS Code extension icon rejection by vsce (SVG incompatible; switched to PNG)
- CI PAT secret for private pckg submodule checkout
- CI auto-creation of Open VSX namespace before publish
- CI version extraction script using `python3` for cross-platform compatibility
- CI authentication for compiler and pckg submodules
- Windows decode crash in Open VSX namespace check
