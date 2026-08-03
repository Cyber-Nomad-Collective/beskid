# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Version numbering tracks the [Beskid normative spec](https://spec.beskid-lang.org).

## [Unreleased]

### Changed

- Correct the v0.4 tracker seed projection to use schema-valid in-progress
  statuses and require fresh reconciled-candidate evidence before corelib or
  release work can be marked Done.

## [0.4.0] — 2026-07-31

Compiler waves W0–W6 complete, HIR-free ISLE ABI-v5 native runtime, corelib gate stabilized, macOS arm64 + Windows x86-64 kits, tracker seed sync, platform-spec synced.

### Added

- Platform Spec Draft Context authoring: multi-document revision-pinned contexts,
  layout templates, restricted Tiptap WYSIWYG with Markdown SOT, reader
  “Propose change”, richer moderation with stale-revision fail-closed, merge/abandon
  webhooks, and Tracker `/api/v1/tasks` linking by `standardId` + `catalogRevision`.
- Platform-spec Node 22.12 / pnpm 10.17.1 runtime cutover (`node:sqlite` adapter,
  Node Nitro preset, Node Docker image).

### Fixed

- CYB-137: `enum_match` / applied generic enum layouts now resolve one-type-per-file
  type arguments such as `Core.Syscall.SyscallError` via the assembly module registry,
  so Corelib `SystemSyscallWriteTests` (and Syscall.Read ApiTests) generate CLIF without
  `MissingRuleOrFact` on discard/bind `Result` matches.
- Post-deploy smoke now asserts `/document.txt` is served as HTML (not attachment)
  for website SPA document routes; nginx `default.conf` aligns Content-Type handling.
- pnpm workspace contract covers Auth/Website/Platform Spec/Learn packageManager
  pins; pckg remains a .NET submodule with its own `web/` package (still Bun until
  a follow-up pckg cutover).
- Production promotion source validation now accepts the in-progress same-run
  `platform-delivery` workflow (conclusion still null) so automatic staging→production
  promote is not blocked by requiring a completed successful run conclusion.
- Coolify `pckg` crash loop: non-root uid 10001 could not create `/app/wwwroot/uploads`
  (image COPY left `/app` root-owned). Uploads now live under `/app/data/uploads` on the
  existing named volume; Dockerfile uses `COPY --chown` and entrypoint ensures the path.
- Compiler CI now bounds Clippy and native ABI-v5 runtime-kit staging/verification phases with
  explicit phase markers, so a pre-test stall fails with actionable evidence instead of consuming
  the whole Rust-gate job timeout (CYB-87).
- Corelib CI now bounds release CLI build, native runtime-kit staging, and test execution while
  retaining sanitized per-step failure reports (CYB-87).
- Complete root pnpm workspace cutover for Auth/Website/Platform Spec (Node SQLite
  adapters, pnpm lockfile, setup/sync scripts); Auth leaves Bun-only SQLite.
- Platform-spec Map / Facts DAG no longer crashes with `gm.Graph is not a constructor`
  when root lockfile hoists `@dagrejs/dagre@1.x` over ui-react's v3 named `Graph`
  export; pin override to `^3.0.0` and resolve Graph fail-closed in shared layout.
- Platform-spec route errors now use a Tracker-style error panel (friendly message,
  try-again / home actions, hide/show technical details) instead of TanStack's bare
  "Something went wrong! Hide Error" CatchBoundary.
- Parser output now supports heuristic recovery for small syntax gaps so AST
  construction can proceed with `parse.recovery` BSOL warnings.
- All parser/project diagnostics in the parse service now emit BSOL-formatted
  messages in the canonical schema `Error <code> { Message = \"...\"; }`.
- ISLE binary/unary lowering now emits float `fadd`/`fsub`/`fmul`/`fdiv`/`fcmp`/`fneg`
  and unsigned `i8` compares/`udiv`/`urem` for Beskid `u8` (signed remains for wider ints).

### Changed

- Port Auth, Platform Spec, and Tracker SQLite access to a pinned Node adapter
  with synchronous prepared statements and transactions; run affected web and
  VS Code tests on Node-native runners.
- Package workspaces now use pinned pnpm 10.17.1 lockfiles; setup, package
  authentication, and Beskid package refresh commands invoke pnpm instead of Bun.
- Parse recovery now uses shared repair primitives (`Insert` / `Delete`) with
  domain generators covering delimiters, separators, item stubs, and
  expressions/patterns (`services/parse_recovery/`), not semicolon-only heuristics.
- Trusted CLIF primitives move from a broken `isle_generated` bridge to
  `ClifPrimitives` (extending loads, `ult`, f64/`fcvt`, stack scratch); coverage
  docs list SIMD/bitwise/`vmctx`/`br_table` as intentionally out of ISLE rules.
- Compiler CI now runs the native Windows ABI-v5 runtime-kit debug/release matrix, including
  COFF import-library checks and exact installed-prefix JIT/AOT smoke tests (CYB-112, CYB-116).
- Successful staging deployment now automatically promotes the exact release manifest to production; production retains environment-scoped secrets, smoke checks, and rollback behavior.
- OpenSpec task 2.1 closed: generation-bound indexed semantic facts cover resolution,
  typing, calls, casts, control flow, captures, legality, spans, bodies, and
  reachability; stale/foreign keys return explicit unavailable (CYB-64).
- Enum formatter output now treats nullary enum constructors as optional syntax and
  emits them without redundant `()` (for example, `Option::None` instead of
  `Option::None()`).

### Removed

- Remove Auth's Bun lockfile after admitting the service to the pnpm workspace.
- Retire LSP `ANALYSIS_CACHE_VERSION` residual after CYB-98/103: hard invalidation clears
  generation-bound syntax facts fail-closed and rebuild rebinds documentation/diagnostics
  (CYB-78).

### Fixed

- Auth admin pairing select restores Platform Spec via `@beskid/auth-client@0.2.9`
  (`AUTH_APP_IDS` / `AUTH_APP_META`); auth/tracker/nexus leave the old `0.2.0` lock behind.
- Auth admin `/admin/pairing/new` no longer crashes when `AUTH_APP_META` lags
  behind hardcoded app ids (prod lacked `platform-spec`); options are derived
  from catalogued meta only, with fail-closed labels.
- Platform-spec reader wraps `SpecViewModeProvider` in `ReaderChrome` so capability
  document routes no longer crash with `useSpecViewMode must be used within
  SpecViewModeProvider`.
- Production promote no longer deadlocks: `promote-production.yml` concurrency
  group no longer collides with `reusable-promote.yml`'s `promote-production`
  lane lock, so the nested environment gate can create pending reviewer
  deployments again.
- Pin `beskid_nexus` tip with exact-match Vitest aliases for `gitnexus-shared` (and
  `gitnexus-shared/test-helpers`) so the shared-ui-nexus unit gate resolves imports.
- Pin compiler tip that registers process-linked soft builtins for exact ABI-v5 JIT and
  types string `+` BinaryExpressions so Corelib Assert/Escape ISLE paths can clear.
- Pin compiler tip that forwards Windows COFF import libraries through
  `build_native_host` (CYB-112) and includes soft-builtin JIT allowlist + lexical
  Corelib path matching needed by the Corelib gate.
- Pin compiler tip that reads interop enum tags unaligned, ignores retired HIR lower_program beskid_tests, and audits static kits with verify_static_archive for Linux TLS (unblocks Rust gate).
- Pin compiler tip requiring exact-kit `beskid_rt_v5_closure_environment_root_current` provenance and Darwin arm64 JIT fail-closed closure allocate/root evidence (CYB-131 under CYB-79/CYB-109).
- Pin compiler tip allowing soft builtins in exact ABI-v5 JIT validation so
  Corelib tests clearing ISLE are not rejected for `interop_dispatch_*` kit
  allowlist absence.
- Pin compiler tip that lexically normalizes Corelib service source paths so
  materialized Foundation `Testing/Assert.bd` retains `__panic_str` CorelibService
  provenance without granting authority to user-project symlinks (Corelib gate).
- Pin compiler tip aligning unresolved reachability semantic_facts with direct_callees skip policy.
- Pin compiler tip restoring fail-closed unresolved Path call_lowering while keeping Extern contract Direct.
- Pin compiler tip regenerating abi-v5 artifacts after Bootstrap CYB-129 ValidatePointerMap guards.
- Platform-spec `/api/health` Memgraph check no longer fails closed on a live
  Bolt connection: neo4j-driver returns `Integer` for `RETURN 1`, so the old
  `=== 1` comparison always reported `memgraph: false` (staging smoke 503).
- Staging Coolify compose waits for Memgraph via `mgconsole` healthcheck before starting platform-spec; staging profiles omit `pckg` until GHCR write exists.
- Pin compiler tip ignoring Linux process-symbol `extern_tests` SIGSEGV after syntax-ISLE Extern Path prepare (follow-up link fix).
- Pin compiler tip that omits Extern contract methods from direct_callees so engine extern prepare reachability succeeds.
- Coolify Compose promote accepts `GET /deploy` responses that return
  `resource_uuid` + message without a `deployment_uuid` (Coolify 4.x service
  shape), polls service status instead, and base64-encodes rollback
  `docker_compose_raw` patches so staging promote no longer fails closed then
  422s on rollback.
- Pin compiler tip aligning canonical-runtime source tests with wrapping ValidatePointerMap / bare-if descriptorOk guards (unblocks Rust gate after #169).
- Pin compiler tip that resolves `[Extern] Contract.method` Path calls through syntax ISLE so Linux `extern_tests` can prepare again after W1/W2 acceptance.
- Pin compiler tip that accepts valid ABI-v5 closure descriptors under post-CYB-129
  signed `word` compares, updates the ValidatePointerMap source contract, and resolves
  Extern Path/`[Extern] Contract.method` calls through syntax ISLE (CYB-129;
  `beskid_compiler` #22–#27).

### Changed

- Pinned `beskid_infra` to wire Coolify staging lane UUID
  `n2faf85soesljo4bng5g1gck` (`beskid-platform-staging`) for main→staging
  promote (CYB-130).

- W3 exact ABI-v5 runtime-kit route: public AOT host emitters require opaque
  canonical-corpus authority and always lower Bootstrap for platform pairs;
  JIT/AOT continue to fail closed on missing/mismatched/tampered installed
  kits with no prebuilt fallback (CYB-20/21/22/76/82 under CYB-7).

### Added

- Add one fail-closed Platform Spec document identity model across catalog
  generation, reader routes, static seeds, and Memgraph seeds for taxonomy
  domains/areas, normative features, and informative articles/decisions.
- Specify the manifest-derived ABI-v5 managed-object allocation boundary, including
  fail-closed descriptor validation, single-path closure delegation, zeroed header
  initialization, and explicit root-frame ownership (CYB-157).
- Platform Spec now presents an informative, immutable compiler architecture map with canonical OpenSpec links, evidence details, and build, IDE, and specification-to-code traversals.
- Platform Spec navigation now uses one searchable, highlighted specification tree with independently scrolling desktop and mobile reader surfaces.
- Compiler W1/W2 acceptance: production parsed-project harness covers inline methods, capture
  facts with fail-closed capturing lambdas, and canonical-runtime trusted intrinsics; method
  reachability facts include `MethodDefinition`; LSP member completion uses syntax-only
  completion without a legacy analysis snapshot (CYB-12, CYB-15, CYB-16, CYB-19, CYB-64).
- Compiler CI now mints the only global distribution identity as
  `0.4.<GITHUB_RUN_NUMBER>` and emits it as an artifact for release consumers;
  Open VSX consumes that exact artifact instead of independently deriving a
  version (CYB-108).
- Sanitized CYB-102 release-gate summary that records reviewed integrations and
  actionable blockers without carrying raw host-specific evidence logs into the
  release branch.
- Root release gate for shared UI Vitest/jsdom and Nexus `gitnexus-web` unit +
  Playwright E2E (`scripts/ci/shared-ui-nexus-gate.sh`, root
  `gate:shared-ui-nexus` / mirrored test scripts, `platform-delivery`
  `shared-ui-nexus` job, `validate-ci-local.sh` parity). See
  `docs/orchestrate/shared-ui-nexus-gate.md` (CYB-93).
- Draft CYB-70 documentation/OpenSpec closure packet for Codex review of
  CYB-42 (mechanical evidence only; no OpenSpec checkbox or release claim).
- Nexus `gitnexus-web` package gate scripts: authoritative Vitest/jsdom unit
  (`bun run test` / `test:unit`), Playwright E2E (`test:e2e` + `test:e2e:install`),
  and `test:gate` that runs both for release evidence (CYB-90; root wiring CYB-93).

### Fixed

- ISLE `if`/`while`/`for` no longer plant a trap on a reachable merge or leave
  nested arm/body blocks unterminated; `return` after a bare `if` lowers again,
  fixing macOS arm64 SIGILL when JIT calls
  `beskid_rt_v5_fiber_spawn_with_cancel_slot` (CYB-129).
- Distribute consumes the Compiler `release-version` artifact on `workflow_run`
  and fail-closes unless the value is strict `0.4.<build>` (CYB-108).

- Tracker platform delivery job-level `BUN_INSTALL_CACHE_DIR` no longer uses
  `runner.temp` (invalid at job `env`); use `/tmp/beskid-bun-install-cache` so
  the workflow parses on `main` (CYB-130).
- Platform delivery pckg/tracker images frozen-install `beskid_web_common` before
  `file:` `@beskid/*` consumers (npm 0.2.8 lacks graph/explorer); restore
  `NODE_AUTH_TOKEN` on reusable quality-gate commands for submodule installs.
- `scripts/ci/sync-runtime-env.sh` falls back to lane-config `service_uuid` when
  `COOLIFY_SERVICE_UUID` is unset (local `just sync-env-*`), with a clearer error
  naming the config path; production UUID remains in
  `beskid_infra/config/coolify-production.json`.
- Platform delivery image lanes that still resolve `@beskid/*` via
  `file:…/beskid_web_common` now copy/init that submodule before
  `bun install --frozen-lockfile` (pckg web-build + tracker named BuildKit
  context); drifted `beskid_web_common` / `pckg/web` lockfiles refreshed.
- `resolve-beskid-version` contract unsets ambient `GITHUB_RUN_NUMBER` so the
  “main requires a run number” assertion does not inherit Actions’ job env.
- Pin `beskid_nexus` vitest exact aliases for `gitnexus-shared` (+ test-helpers),
  `pckg`/`beskid_tracker` `@beskid/*` GitHub Packages image pins + `@xyflow/react`,
  and compiler clippy `collapsible_if` fix for the Rust gate (CYB-130).
- Tracker platform delivery initializes `beskid_web_common` and sets
  `BUN_INSTALL_CACHE_DIR` so `file:` / scoped-registry installs match image lanes
  (CYB-130).
- `deploy-release-manifest.sh` uses the same lane-config `service_uuid` fallback
  as `sync-runtime-env.sh` when `COOLIFY_SERVICE_UUID` is unset (CYB-130).
- Use `bun run --cwd=DIR` (equals form) in the shared-ui/Nexus root gate and
  package scripts so Bun actually executes Vitest/Playwright instead of
  printing script help with exit 0 (`bun --cwd DIR run SCRIPT` space form).
- Keep Bun's built-in `bun test` from loading Nexus Playwright `e2e/*.spec.ts`
  (`bunfig.toml` pathIgnorePatterns + preload redirect) so E2E hooks are not
  invoked outside Playwright; use `bun run test` / `bun run test:e2e` instead.
- Remove duplicate `@cyber-nomad-collective/trudoc` dependency entry from
  `site/website/package.json` so `validate-ci-local.sh` no longer fails local
  frozen-install and matching package-lock resolution.

- Sync root `bun.lock` with website/platform-spec `file:` pins for
  `@beskid/beskid-ui` / `@beskid/ui-react` so `bun install --frozen-lockfile`
  (openspec CI gate) succeeds after the shared AST/facts explorer landing.
- Plan-only release promotion no longer fails `docker compose config` when
  `POSTGRES_PASSWORD` is unset; placeholders cover required Compose
  interpolation, and real secrets remain OpenBao-only on `--apply`.
- Surface ISLE `MissingRuleOrFact` sites as `path#gN:nN Construct@line:col-line:col`
  (not only `#gN:nN`) on FAIL lines and isle.missing traces.
- Unblock Corelib gate progress: specialize generic factories, lower Assert/String through syntax ISLE, export Text.Parser helpers, and rewrite syscall/output tests off privileged builtins.
- Drop a ghost Nexus plan path from `openspec/catalog.json` so catalog regen
  matches the pinned `beskid_nexus` tree (revision `96e1c447`).
- Clear `clippy::cloned_ref_to_slice_refs` in `beskid_pckg_operations` so the
  Compiler Rust gate and Open VSX publish jobs compile under `-D warnings`.
- Push platform images to GHCR with the job's `GITHUB_TOKEN` (which carries
  `packages: write`) instead of the releases PAT `DISTRIB_GH_PAT`, which lacks
  `write:packages` and made every image lane fail its push with "the token
  provided does not match expected scopes". `GHCR_TOKEN` remains an optional
  override for packages linked to sibling repos.
- Keep the image Trivy gate report-only and stop a missing SARIF from failing a
  lane after the image has already been pushed (`if-no-files-found: warn`).
- Rebuild OpenSpec document hashes after AGENTS.md memory updates, and restore
  the compiler submodule to the ABI-v5 runtime-kit tip so CI stage scripts and
  `beskid_pckg_server` workspace members resolve again.
- Make OpenSpec catalog rebuild prune missing documents and initialize
  document-bearing submodules in the tracker projection job so revision hashes
  stay deterministic in CI.

### Removed

- AUR (`beskid-bin`) distribution channel: Arch packaging job, PKGBUILD, and
  related GitHub Actions secrets are no longer part of the distribute pipeline.
  Remaining channels: Windows MSI/EXE, macOS DMG/Homebrew, Debian `.deb`, Snap.

### Changed

- Define the canonical ABI-v5 fiber-spawn boundary in the normative OpenSpec,
  including exact-kit provenance, cancellation-slot initialization, and the
  prohibition on legacy dispatch/envelope or Rust bridge fallback (CYB-126).
- Define the canonical ABI-v5 current-root closure helper in the normative
  OpenSpec and expose it through manifest, generated headers/bindings,
  and Bootstrap runtime for current-thread closure-rooting (CYB-127).
- Define the manifest-derived ABI-v5 closure-environment helper contract in the
  normative OpenSpec, requiring the generated bindings, runtime-kit allowlist,
  and canonical Bootstrap provenance to agree on exact names and signatures
  (CYB-122).
- Consolidate all local 0.4 worktree histories onto repository `main` branches, preserving
  unfinished compiler/runtime work as explicit checkpoints and restoring Codex ownership of
  critical-path acceptance while Cursor supplies bounded configuration, fixture, and evidence
  handoffs.
- Define the Linear execution design for the full 0.4 scope: preserve the
  dependency-ordered W1–W7 hierarchy, map every work item back to OpenSpec,
  reserve architectural work and release decisions for Codex, and constrain
  Cursor to bounded documentation, configuration, fixture, and evidence tasks.
- Refresh the 0.4 closure plan and readiness report with the pushed multi-agent
  integration checkpoint, exact commit evidence, completed CYB-13/CYB-14 gates,
  and the remaining release-finalization blockers.
- Make Platform Spec use the root Bun workspace authority in CI and containers,
  initialize the shared web package before delivery checks, and align generated
  TanStack routes, auth result narrowing, OpenSpec PR root resolution, and
  Memgraph/test typings with the current dependency APIs.
- Advance the compiler pin to the reviewed W1 catalogue and verifier-site work:
  exhaustive typed-operation classification with semantic-family coverage, plus
  source-owned stock-CLIF verification diagnostics exercised through the real
  multi-function module boundary.
- Align the 0.4 OpenSpec execution ledger and release plan with the fresh W1
  readiness audit: keep AST-owned verifier diagnostics open, separate platform
  delivery plumbing from compiler blockers, and map CYB-5 through CYB-44 to
  evidence-backed compiler, runtime, retirement, and sign-off gates.
- Align post-migration OpenSpec consumers: AGENTS.md cites `openspec/specs` as
  sole normative SOT (Tracker is delivery/version authority); fill archive TBD
  Purpose headers; hard-fail TBD Purpose placeholders in
  `validate-standard.ts`; retarget platform-spec home DAG paths to
  `openspec/specs`; scrub hub `content.md` wording in eight migrated specs;
  archive `add-tracker-platform-delivery-sync` as
  `tracker-platform-delivery`.
- Promote twelve feature-level provisional capabilities to explicit SHALL
  requirements (`promote-provisional-wave-1`): tooling CLI/BSOL, language-meta
  lexical/resolution/modules/enums, core collections/regex/time, and semantic
  pipeline stage ordering. Taxonomy hubs remain provisional for a later wave.
- Promote provisional waves 2–4 (28 more feature capabilities): tooling
  contracts/LSP/import/formatter/nexus/symbol-docs, remaining language-meta
  feature stubs, and corelib runtime-registration/syscall/text-cursor. Catalog
  provisional count 80→52; empty architecture/governance stubs and tooling
  design-model/decisions-record stubs stay provisional by design.
- Close out Tracker/Platform Spec delivery sync: catalog import reconciles
  without overwriting local conflicts, CI runs a real `reconcile:plan` dry-run
  instead of a printf stub, Platform Spec PRs go only through
  `git-sync/pr` (ledger/idempotency; orphan `openspec/pr-sync` removed), and
  the false `backfill:apply` script claim is dropped.
- Hard-gate the `beskid-pckg` image lane in `platform-delivery.yml` (remove
  `optional: true`): a failed pckg build/push fails the whole delivery.
  Sibling-package Write or `GHCR_TOKEN` with `write:packages` is required;
  Compose `profiles: [pckg]` remains deploy-profile gating only.
- Auto-apply staging Coolify on every green `push` to `main`
  (`apply: push || (dispatch && apply-staging)`); production promotion stays
  explicit via `promote-production.yml`.
- Website and platform-spec Docker builds hard-fail when `openspec/catalog.json`
  is missing or has zero entries; website Book remark aliases throw in
  CI/production when the catalog is absent/empty. Site-build and
  platform-integration gates now include a website lane.
- `scripts/sync-beskid-packages.sh` includes `site/platform-spec` and `pckg/web`,
  skips temporary `file:` pins (website, platform-spec, pckg, tracker ui-react)
  until `@beskid/ui-react` 0.2.9 / `@beskid/beskid-ui` 0.2.8 publish to GitHub
  Packages, then documents switching back to `^0.2.0` ranges.
- Produce and retain a sanitized detailed Corelib Markdown build report for
  every native gate outcome, including compiler trace evidence, command
  durations, runtime-kit metadata, and concise failure diagnostics.
- Stage a freshly produced native-host ABI-v5 runtime kit for compiler and corelib CI gates,
  replacing Rust runtime-bridge setup.

- Learn now renders curriculum Markdown structurally, adopts shared React UI styling and hub navigation, and presents its lesson rail as an off-canvas drawer below desktop widths.

- The runtime OpenSpec now records the Fibers 0.1.13 poll-driven compatibility
  contract: deterministic in-place `run_once`, ready/not-ready wake behavior,
  monitor result/error truth, linked cancellation, and the deprecated
  stackful-yield mapping to the canonical scheduler.
- Parser recovery was restructured around shared sync-boundary primitives and
  expanded to cover more statement/expression boundary shapes, including operator
  starts and wider syntax-start coverage for semicolon synchronization.
- Parser recovery member/index heuristics now handle `Pos(0)` parser-fallback
  failures by anchoring to tail-line syntax markers (`.` / `[`), enabling robust
  placeholder insertion for missing field/index tails in incomplete expressions.

### Added

- Add the Beskid 0.5 release split and executable planning baseline: the
  `beskid-v0-5-foundations` and `beskid-v0-5-networking` OpenSpec proposals, Foundation/Networking/HTTP
  implementation plans, CYB-59–62 coordination links, and a clearly
  non-normative Book roadmap for the prerequisite fiber, channel, scheduler,
  resource-scope, bytes/encoding, and Core.IO work.
- Website book demo `14-from-source-to-runs/ast-facts-graph` mounts linked AST →
  facts DAG (`LinkedAstFactsShell`); `@beskid/beskid-ui` 0.2.8 ships matching
  Astro shells for Starlight islands.
- Platform-spec map mode mounts shared `FactsDagView` (catalog-derived DAG) with
  open-in-editor links; index chrome keeps Login reachable and declares local
  `@beskid/beskid-ui` / `@beskid/ui-react` deps.
- Tracker task/spec linking mounts shared `RepoExplorerDialog` (`RepoPathField`)
  on create-task and issue detail, persisting repo-relative paths as task
  metadata (`repoPaths` / schema v9 `repo_paths_json`), linking local
  `@beskid/ui-react` 0.2.9 (`./explorer` + `./graph`). `/docs` remains a
  platform-spec redirect (no in-app AST viewer).
- pckg docs/source view mounts `PackageSourceGraphPanel` (`RepoExplorerDialog` +
  fixture AST/facts) on `/packages/$packageName/docs`, linking local
  `@beskid/ui-react` 0.2.9.
- `@beskid/ui-react` `./graph` and `./explorer` subpaths: `AstTreeView` (ReactFlow +
  d3-hierarchy), `FactsDagView` (ReactFlow + dagre), AST→facts linking via
  `useAstFactsLink`, `RepoExplorerDialog` (local entries / remote `listChildren`),
  canonical `openInEditorUrl` (cursor/vscode on local hosts, else GitHub blob),
  and sample fixtures for P1 surface integrations.
- Generation-safe expanded-syntax semantic facts now cover cross-unit calls,
  trusted canonical-runtime intrinsics, and test metadata used by the CLI
  migration.
- Canonical runtime allocation ownership and descriptor pointer-map contracts,
  with mark/sweep regressions for rooted object graphs.
- Syntax-to-ISLE CLI build/run routing and a target/profile runtime-kit
  publication and provenance validation matrix.
- Prepared-syntax AOT lowering, transparent aggregate ABI facts, and native
  static/shared library-pair emission without an executable runtime-kit.
- Add Tracker delivery consumption across the downloads page and Nexus, with
  revision-keyed Tracker-to-OpenSpec relations and non-mutating PR/main gates.
- Publish Tracker delivery versions and deterministic, reviewed history-backfill
  proposals with explicit unmapped commit handling.
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
- Starlight-native release-blog index with chronological status-labelled cards,
  accessible hover/focus treatment, and reduced-motion-safe transitions.
- Six sourced release and runtime-migration posts, including explicit delivery
  status and tracker provenance for the in-progress v0.4 band.
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

- Render compiler lower-spine type mismatches with source-level type names instead of internal IDs.
- Build the pckg image from the repository-root context and publish its existing
  .NET 10 server application, without a stale compiler workspace dependency.
- Authenticate the pckg web image build against the existing GitHub Packages
  registry for its published `@beskid` dependencies.
- Route pckg web dependency resolution to GitHub Packages through the same
  ephemeral build secret used by the other platform images.
- Resolve pckg's material-theme alias from the installed GitHub Packages
  artifact rather than a monorepo-only path.
- Initialize the Beskid BSOL submodule for pckg's compiler-backed server
  image build.
- Restore valid distribution workflow scheduling by removing the retired
  `stamp-marker` dependency from macOS DMG packaging.
- Point release integration at the published Tracker revision so fresh CI
  checkouts can initialize its required submodule.
- Keep pull-request image validation enabled by guarding manual-dispatch inputs
  outside workflow-dispatch events.
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

- CLIF lowering now retains declaration-ordered generic type arguments, derives
  contextual enum constructors from the enclosing specialization, and discovers
  explicit generic calls from the complete indexed call inventory of reachable
  source units.
- Enum match statements now execute the final expression statement of every arm
  block, including correctly accepting empty arms, while enum and aggregate
  constructors provide pointer ABI evidence for inferred generic calls.
- String interpolation operands now retain their contextual string-add intent,
  and logical negation produces canonical boolean values instead of bitwise
  complements that remain truthy.
- Complete generation-safe CLIF lowering for the Corelib gate surface, make the
  61-entry typecheck matrix and 14-entry codegen spine pass without ignored
  gate tests, and isolate parallel runtime-kit test artifacts.
- Reusable promotion now always derives its smoke endpoints from the canonical
  lane domains configuration instead of accepting a stale environment override
  that can force an otherwise healthy deployment to roll back.
- Native ABI-v5 runtime-kit staging now exposes Darwin's anonymous-memory
  mapping definitions when compiling the guarded-stack host bridge, restoring
  local release Corelib verification on macOS.
- Reusable staged promotion now binds its apply job to the requested GitHub
  environment, making lane-scoped OpenBao and Coolify configuration available
  during a verified release. Leaving the job unbound had also dropped every
  environment-scoped variable (`OPENBAO_ADDR`, `COOLIFY_SERVICE_UUID`,
  `BESKID_SMOKE_URLS`), so production's manual approval is now governed by the
  `production` environment's own protection rules rather than by unbinding the
  job.
- Empty string literals now reserve an addressable sentinel byte in JIT data
  storage while retaining their logical zero length, satisfying the runtime
  string-pointer invariant for syscall calls.
- Learn's dedicated frozen pnpm lock now matches its release manifest, while
  the corelib test-spine catalog and GitNexus Bun lock stay in parity with
  their respective CI gates.
- Platform Spec now bundles the shared sidebar and Beskid Hub styles, restoring
  the desktop sidebar and properly styled service launcher. Learn and pckg now
  compile the shared React component utilities and theme tokens as well; the
  production checks enforce these stylesheet contracts before a release ships.
- Coolify promotion now verifies every lane-active immutable Compose application
  at its exact digest and healthy runtime state before accepting deployment;
  applied promotions always run canonical HTTPS smoke checks for the lane.
- Runtime environment sync now requires an explicit `OPENBAO_ADDR` (or
  `VAULT_ADDR`) instead of falling back to a hardcoded secrets host, so a
  missing lane variable fails the promotion rather than sending `OPENBAO_TOKEN`
  to an unintended endpoint.
- Platform Spec's Node SSR build now resolves `tslib` through its ESM entry and
  verifies the generated production SSR chunk can be imported with safe runtime
  configuration, preventing a startup crash from the bundled CommonJS interop wrapper.
- Runtime OpenSpec now parses its callback, scheduler, and composition
  requirements strictly, and records the mandatory scheduler result trampoline
  plus Process adapter-binding and string-ownership contracts before code.
- Tracker's immutable image now builds and invokes the Node server runtime
  consistently, and defers shell-only server-function modules until the Start
  runtime is initialized; the image gate starts the published digest and proves
  its health endpoint before release-manifest promotion.
- Canonical runtime lowering now selects manifest exports and their direct-call
  closure, attributes failed ISLE lowering to the leaf AST node, and
  materializes compiler-owned layout constants at the exact direct-call ABI
  width without permitting literal or untrusted-source coercion.
- Scheduler fiber context metadata and context entrypoints are now derived from
  the selected ABI-v5 target manifest, with exact assembly-export validation;
  runtime layout constants also materialize at authorized intrinsic ABI widths.
- Scheduler stacks now reserve a no-access lower guard with a writable bounded
  usable suffix through manifest-owned Linux, Darwin, and Windows adapters;
  nested canonical intrinsic layout constants retain their exact ABI widths.

- Canonical scheduler state now has one separately allocated ABI-owned table at
  the manifest-declared runtime-state field, and its legacy duplicate spawn
  stub has been removed in favor of the canonical ABI-v5 export.
- Canonical scheduler implementation is now OpenSpec-gated on ABI-owned state,
  manifest-derived contexts and stacks, production ISLE execution coverage, and
  Phase-A/main-fiber lifecycle proof before it can claim target support.
- Local immutable-release Compose validation now uses `podman-compose` through
  one checked engine boundary; GitHub Actions retains Docker Compose and its
  Docker BuildKit publication path.
- The canonical-runtime OpenSpec now requires one registry-backed
  `gc_external_root_count` export, with external-root lifecycle coverage that
  distinguishes registered roots from temporary handles.
- Learn's production container now uses the pinned Bun runtime required by its
  `Bun.serve`/`Bun.file` server, with a CI contract preventing a Node-only
  runtime regression that would fail its healthcheck at startup.
- Platform delivery now creates a release manifest only after every required
  quality and image lane succeeds, preventing partial-image promotion and
  staging or production deployment after a failed validation.
- Required Node image lanes now prepare their complete file-linked workspace
  graph before frozen dependency installation; CI rejects incomplete build
  contexts before publication.
- Image dependency locks and shared package identities now stay synchronized
  across Auth, Learn, Platform Spec, Tracker, Nexus, and pckg delivery lanes.
- Docker images rebuild file-linked shared package exports after frozen install,
  so ignored generated output cannot mask a missing production dependency.
- Learn's release image now uses the canonical compiler shell API, removing a
  stale re-export that prevented its release CLI build.
- Nexus's isolated image build now declares its direct compiler dependencies
  instead of relying on transitive packages omitted by frozen installation.
- Nexus's bundled web build now locks Trudoc to the copied local package source
  in both Bun and pnpm, eliminating unavailable private-registry fetches during
  image construction and quality checks.
- Learn's compiler image now maps analysis constants explicitly in LSP document
  symbols and semantic tokens, keeping the release CLI build exhaustive.
- Learn's compiler image now copies the canonical runtime-kit staging scripts before invoking
  them, so the immutable release image can package its ABI-v5 runtime kit.
- Learn's compiler stage now uses one explicit Cargo target prefix and the canonical
  `beskid_cli` executable for runtime-kit staging and final-image publication.
- Learn's runtime output is now copied out of the ephemeral Cargo cache in the same build step
  that stages it, so the final image receives the CLI and ABI-v5 kit.
- Learn's runtime-kit stage now installs the required canonical `clang`/`lld` Linux toolchain,
  preventing native runtime object assembly from failing with an unavailable linker.
- The release Compose topology now maps every manifest image exactly once,
  including the profile-gated Learn service, before staging promotion.
- Canonical runtime lowering now supports integer `|`, `<<`, and `>>` through
  generation-safe syntax facts and stock CLIF; contextual runtime parameter names
  `parent` and `event` no longer collide with structural grammar roles.
- AOT fixtures and the parsed-project ISLE harness now use the production
  syntax-to-CodegenInput lowering entrypoint rather than legacy HIR lowering.
- Formatter test classification now recognizes constant declarations, restoring
  compilation of the AOT and module-constants test paths.
- Formatter goldens now match canonical parenthesis-free nullary enum constructors.
- Nexus graph-first startup now initializes its Sigma callback before capture;
  its repository API test routes are exact and no longer shadow one another.

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

## [0.4.0] - 2025-07-17

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
