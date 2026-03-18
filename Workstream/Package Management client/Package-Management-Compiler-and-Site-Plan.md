# Beskid Package Management — Compiler, Client, Workspaces, and Site Plan

## 0) Scope and outcome

This plan defines a single package-management strategy across:

1. **Compiler/CLI (Rust)** dependency resolution and workspace orchestration.
2. **Registry client** (`beskid` CLI) for auth, publish, install, and lock workflows.
3. **Shared package format** readable by both Rust services and Blazor (`pckg`) server.
4. **Package manager site (`pckg`)** capabilities needed for package lifecycle operations.
5. **Docs expansion** under `site/website/src/content/docs` to publish the spec and usage model.

Target outcome: reproducible, secure, workspace-aware package flows from local development to registry publication.

---

## 1) Current baseline (what exists today)

### Compiler/project system

- `Project.proj` parsing and validation already exists.
- Dependency sources already modeled: `path`, `git`, `registry`.
- Compile-plan graph and unresolved dependency handling exist.
- `Project.lock` generation exists.
- Materialized dependency workspace in `obj/beskid/deps/src` exists.
- CLI commands exist: `fetch`, `lock`, `update`.

### pckg server/site

- Blazor + FastEndpoints foundation exists.
- Package listing/review/manage pages exist at baseline level.
- Identity and roles are present.

### Gap summary

- No formal **cross-runtime package artifact format**.
- No defined **registry protocol contract** between CLI and server.
- No **workspace manifest** for multi-project repos.
- No first-class CLI package lifecycle commands (`add`, `publish`, `login`, etc.).
- Docs describe operations but not compiler/format/protocol spec in detail.

---

## 2) Architecture decisions (proposed)

## 2.1 Canonical package artifact format

Adopt **`.bpk` (ZIP container)** for v1.

Why ZIP:
- Native support in Rust and .NET.
- Easy server-side inspection without custom binary parser.
- Deterministic packaging feasible with normalized timestamps/order.

`.bpk` structure:

- `package.json` — canonical package metadata and publish manifest (JSON schema v1).
- `Project.proj` — source project manifest snapshot.
- `src/**` — package source files.
- `README.md` (optional)
- `LICENSE` (optional)
- `checksums.sha256` — integrity table for included files.
- `signature.json` (optional v1.1) — signing metadata.

## 2.2 Registry wire format

Use **JSON over HTTPS** for metadata + **binary upload/download** for `.bpk`.

- Rust CLI: `reqwest` + `serde`.
- Blazor/FastEndpoints: `System.Text.Json` models shared by API contracts.

## 2.3 Shared schema contract

Define versioned schemas in one place:

- `package.json` schema id: `beskid.package.v1`.
- lock schema id: `beskid.lock.v1`.
- workspace schema id: `beskid.workspace.v1`.

Version policy:
- additive fields allowed in minor versions;
- breaking format moves to `v2` with explicit migration path.

## 2.4 Workspace model

Introduce `Workspace.proj` at repository root:

- member project list
- shared source policies
- dependency constraints/overrides
- shared lock mode behavior (`frozen`, `locked`, default)

Compiler resolves dependency graph from workspace root when present; falls back to single-project mode.

---

## 3) Project/manifest model expansion

## 3.1 `Project.proj` extensions (non-breaking)

Add optional fields:

- `project { description, license, repository, homepage }`
- `dependency "x" { source="registry", version="^1.2.0", registry="default" }`
- `publish { include=[...], exclude=[...], readme="README.md", license="LICENSE" }`

## 3.2 `Project.lock` v1 hardening

Augment lock entries to include:

- resolved version
- package digest (sha256)
- source registry URL alias
- artifact URL (or canonical package id + version)

This enables deterministic restore and integrity checks.

## 3.3 New `Workspace.proj`

Structure (high-level):

- `workspace { name, resolver="v1" }`
- multiple `member "..." { path="..." }`
- optional `override "dep" { version="..." }`
- optional `registry "default" { url="..." }`

---

## 4) Compiler + CLI implementation plan

## Phase A — Foundation and schema

1. Add schema definitions in Rust (`beskid_projects` / existing project module split if needed).
2. Implement parsing + validation for `Workspace.proj`.
3. Extend `Project.proj` parser for publish metadata and registry alias field.
4. Add lockfile model upgrade with backward-compatible reader.

Deliverables:
- parser tests
- validation tests
- migration tests (legacy lockfile still readable)

## Phase B — Resolver and workspace graph

1. Add workspace discovery (`Workspace.proj` search from cwd up).
2. Build workspace member graph + project graph merge.
3. Implement dependency override resolution rules.
4. Detect conflicting constraints and emit typed diagnostics.

Deliverables:
- deterministic graph build tests
- diagnostics for cycles/conflicts/unresolved dependencies

## Phase C — Package artifact builder/reader

1. Implement deterministic `.bpk` builder:
   - stable file ordering
   - normalized timestamps
   - checksum table generation
2. Implement `.bpk` validator/reader for restore/install.
3. Validate manifest/source consistency before publish.

Deliverables:
- reproducible package binary test (same input => same digest)
- corrupted archive/manifest mismatch tests

## Phase D — Registry client commands

Introduce `beskid pkg` command group:

- `beskid pkg login`
- `beskid pkg whoami`
- `beskid pkg publish [--dry-run]`
- `beskid pkg yank <id> <version>`
- `beskid pkg add <id>[@range]`
- `beskid pkg remove <id>`
- `beskid pkg search <query>`
- `beskid pkg install` (restore from lock)

Integrate with existing:
- `fetch` / `lock` / `update` should delegate to shared resolver/service APIs.

Deliverables:
- end-to-end CLI integration tests against test registry fixture
- auth token storage and renewal behavior tests

## Phase E — Security and policy

1. Add checksum verification on download/install.
2. Add optional signature verification hook.
3. Enforce role policy during publish (`Publisher`/`SuperAdmin`).
4. Add abuse/rate-limiting and publish quotas at API level.

Deliverables:
- tampered package rejection test
- unauthorized publish test

---

## 5) pckg server + site implementation plan

## Phase S1 — API contract completion

Add/standardize endpoints:

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/packages`, `GET /api/packages/{id}`
- `GET /api/packages/{id}/versions/{version}/download`
- `POST /api/packages/publish` (multipart `.bpk` + metadata)
- `POST /api/packages/{id}/yank`
- `POST /api/packages/{id}/unyank`
- `GET /api/search`

## Phase S2 — publish pipeline

1. Receive `.bpk` upload.
2. Validate archive structure and `package.json` schema.
3. Verify checksum table.
4. Persist metadata + blob storage reference.
5. Trigger moderation/review flow.

## Phase S3 — Blazor UX completion

1. Package details page: versions, integrity/provenance, readme.
2. Publisher workspace:
   - publish package
   - manage owners
   - yanked versions
   - API tokens
3. Review console:
   - pending/rejected/approved queues
   - decision audit trail

## Phase S4 — operational hardening

1. Idempotent publish handling.
2. Index regeneration/background jobs.
3. Caching for listing/search and package details.
4. Structured telemetry around publish/restore latency and failures.

---

## 6) Data and protocol contracts

## 6.1 `package.json` core fields (v1)

- `schema`: `"beskid.package.v1"`
- `id`: package name
- `version`: semver
- `authors`: []
- `description`
- `license`
- `repository`
- `targets`: list from `Project.proj`
- `dependencies`: normalized dependency list
- `publishedAt` (server-side authoritative)

## 6.2 Lockfile fields

Per dependency:

- `name`
- `version`
- `source` (`path|git|registry`)
- `registry`
- `artifactDigest`
- `resolvedAt`

## 6.3 API compatibility policy

- Response envelopes stable for v1.
- New fields optional by default.
- Breaking changes require `/v2` routes and docs migration section.

---

## 7) Testing strategy

## Compiler/CLI

- parser/validator unit tests (project/workspace/lock)
- resolver graph tests (workspace overrides + conflict diagnostics)
- reproducible packaging tests
- CLI black-box tests for publish/install/add/update

## Server/site

- endpoint contract tests
- upload validation tests
- role/authorization tests
- integration tests: publish -> review -> approve -> install

## Cross-system

- golden `.bpk` fixtures read by Rust + .NET validators
- lockfile roundtrip tests between CLI and server responses

---

## 8) Rollout sequencing

1. **M0** schemas + parser extensions (no behavioral break).
2. **M1** workspace resolution + lock upgrades.
3. **M2** `.bpk` build/read and local install flows.
4. **M3** publish/download API and CLI package commands.
5. **M4** Blazor publisher/review UX completion.
6. **M5** security hardening + observability + docs finalization.

Definition of done per milestone:
- tests green,
- docs updated,
- migration notes included,
- no unresolved compatibility warnings.

---

## 9) Documentation expansion plan (`site/website/src/content/docs`)

Add a package-management documentation set with implementation-level clarity.

Proposed files:

- `packages/client-cli.md`
  - command reference and examples (`pkg login`, `pkg publish`, `pkg add`, etc.)
- `packages/workspaces.md`
  - `Workspace.proj` structure, member resolution, overrides
- `packages/package-format.md`
  - `.bpk` archive spec + deterministic build rules
- `packages/registry-protocol.md`
  - endpoint contracts, auth, error codes, pagination
- `packages/lockfile.md`
  - lock semantics, frozen/locked modes, integrity fields
- `guides/publish-first-package.md`
  - practical flow from project init to published version
- `guides/workspace-monorepo.md`
  - multi-project repo setup and dependency sharing
- `spec/package-json-v1.md`
  - normative schema field definitions and constraints
- `spec/workspace-proj-v1.md`
  - grammar/validation rules
- `spec/project-lock-v1.md`
  - normative lockfile specification

Also update:
- `packages/index.mdx` to link compiler + CLI + workspace + protocol docs.
- top-level docs nav config to surface new package-management sections prominently.

---

## 10) Risks and mitigations

1. **Format drift between Rust and .NET**
   - Mitigation: shared golden fixtures + schema version checks in CI.

2. **Resolver complexity in workspaces**
   - Mitigation: deterministic precedence rules + conflict diagnostics early.

3. **Publish pipeline abuse**
   - Mitigation: role checks, rate limiting, size limits, moderation gating.

4. **Non-reproducible builds**
   - Mitigation: deterministic packaging and digest verification tests.

---

## 11) Immediate next execution batch

1. Implement `Workspace.proj` parser and validator (compiler crate).
2. Define and commit `package.json` + lock schema docs (spec pages).
3. Build `.bpk` pack/unpack library with deterministic archive tests.
4. Add `beskid pkg publish --dry-run` backed by local package validation.
5. Implement server endpoint to validate uploaded `.bpk` and return structured diagnostics.

This batch delivers the first end-to-end, testable foundation without overcommitting to full production rollout in one pass.
