# pckg React and Rust Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace pckg's Blazor/.NET surfaces with canonical React UI, Auth Hub-only GitHub sign-in, and a compatibility-first Rust service.

**Architecture:** Restore the canonical shared UI packages first. Build a standalone pckg React client with no duplicated primitives. Add an Axum server crate with contract tests and Auth Hub handoff, then incrementally port API capabilities from .NET.

**Tech Stack:** Bun, React 19, TanStack Router/Query/Start, Tailwind 4, `@beskid/ui-react`, Rust, Axum, Tower, SQLx, PostgreSQL.

## Global Constraints

- Canonical shared UI is `beskid_web_common/packages/beskid-ui` and `beskid-ui-react`.
- Auth Hub GitHub OAuth is the only browser identity provider.
- Preserve pckg public API URLs, multipart fields, status codes, package artifact format, and port 8082.
- No local pckg passwords, registration, or ASP.NET Identity compatibility path.
- All new production behavior starts with a failing automated test.

---

### Task 1: Restore canonical shared UI packages

**Files:**
- Restore: `beskid_web_common/packages/beskid-ui/**`
- Restore: `beskid_web_common/packages/beskid-ui-react/**`

- [ ] Restore the tracked package trees exactly from the submodule HEAD.
- [ ] Run the shared package typecheck and focused UI tests.
- [ ] Verify dependent package exports include `BeskidHub`, styles, `Button`, `Card`, and `AuthPageShell`.

### Task 2: Make Auth Hub the pckg identity provider

**Files:**
- Modify: `site/auth/**` only if its public Auth Hub contract lacks a stable pckg subject required by the Rust consumer.
- Create: Rust Auth Hub handoff tests and implementation under `compiler/crates/beskid_pckg_auth/**`.

- [ ] Write a failing test that verifies a `pckg` handoff and rejects another app.
- [ ] Implement handoff verification and a pckg session identity mapping that contains no GitHub token or password.
- [ ] Run the focused Rust and Auth Hub tests.

### Task 3: Create the React pckg frontend

**Files:**
- Create: `pckg/web/**`

- [ ] Write failing route/client tests for public package browse, package detail, Auth Hub redirect/finish/logout, and dashboard guard.
- [ ] Create the Bun React application using the existing Auth/Tracker Vite and shared package patterns.
- [ ] Implement routes with shared UI primitives and route error/not-found boundaries.
- [ ] Run frontend tests, typecheck, and production build.

### Task 4: Establish the Rust pckg server compatibility core

**Files:**
- Create: `compiler/crates/beskid_pckg_contract/**`
- Create: `compiler/crates/beskid_pckg_server/**`
- Modify: `compiler/Cargo.toml`

- [ ] Write failing HTTP tests for health, public package listing/detail, Auth Hub session guard, API-key guard, and error compatibility.
- [ ] Implement Axum routing, configuration, rate-limit middleware, JSON errors, health/metrics, and OpenAPI skeleton on port 8082.
- [ ] Run focused crate tests and `cargo check`.

### Task 5: Port package registry behavior in vertical slices

**Files:**
- Create: `compiler/crates/beskid_pckg_artifact/**`
- Create: `compiler/crates/beskid_pckg_domain/**`
- Create: `compiler/crates/beskid_pckg_store/**`

- [ ] Port existing xUnit package endpoint behaviors as failing Rust black-box tests before each endpoint family.
- [ ] Port public browse/download, package version lifecycle, documentation/source, then publish/workspace publishing.
- [ ] Compare Rust responses against the existing CLI/CI client fixtures.

### Task 6: Cut over runtime, deployment, and remove legacy host

**Files:**
- Modify: `pckg/Dockerfile`, `pckg/docker-compose*.yml`, `pckg/README.md`
- Remove after parity: `pckg/src/Server/**`, `pckg/src/pckg.AppHost/**`, `pckg/src/pckg.ServiceDefaults/**`

- [ ] Update Compose to run the Rust server and serve the React build.
- [ ] Run end-to-end publish/download, Auth Hub, and browser smoke tests.
- [ ] Run GitNexus change detection, update CHANGELOG and GLOSSARY, and remove only parity-covered .NET files.

### Task 7: Package and artifact parity

**Files:**
- Create: `compiler/crates/beskid_pckg_store/**`, `compiler/crates/beskid_pckg_artifact/**`, `compiler/crates/beskid_pckg_domain/**`
- Test: `compiler/crates/beskid_pckg_server/tests/package_contract.rs`

- [ ] Port the existing package integration fixtures before implementation: search/list/detail/version/download/yank/unyank/private 404 semantics, source/docs, embeds, reviews, and workspace publishing.
- [ ] Preserve `.bpk` checksum, immutable version, latest-non-yanked, and ZIP path-validation semantics.
- [ ] Prove all package paths against PostgreSQL plus a temporary artifact root.

### Task 8: Community, API-key, and Auth Hub parity

**Files:**
- Create: `compiler/crates/beskid_pckg_community/**`
- Test: `compiler/crates/beskid_pckg_server/tests/community_contract.rs`

- [ ] Replace local users with Auth Hub subjects while retaining profiles, publisher state, follows, boards, votes, comments, API keys, and resource permissions.
- [ ] Enforce `read` and `publish` API-key scopes and role checks through pckg-owned authorization records.
- [ ] Test each retained user, board, follow, and API-key API response and authorization failure.

### Task 9: Operations parity

**Files:**
- Create: `compiler/crates/beskid_pckg_operations/**`
- Test: `compiler/crates/beskid_pckg_server/tests/operations_contract.rs`

- [ ] Port administration, blocked links, registry activity, notifications/preferences, upload profiles, metrics, and health behavior.
- [ ] Replace SignalR/Wolverine with a documented Rust websocket or polling contract only after browser compatibility tests establish the replacement.
- [ ] Move non-identity notification email secrets out of database rows and retain failure telemetry.

### Task 10: Legacy removal gate

**Files:**
- Remove only after all prior tests pass: `pckg/src/Server/**`, `pckg/src/Server.Tests/**`, `pckg/src/pckg.AppHost/**`, `pckg/src/pckg.ServiceDefaults/**`, `pckg/src/pckg.slnx`, .NET build artifacts

- [ ] Run the complete Rust contract suite against a PostgreSQL fixture and package artifact fixture corpus.
- [ ] Run CLI publish/download and browser route smoke tests against the Rust container.
- [ ] Delete C# sources only after every mapped retained endpoint has a passing Rust contract test; retain a versioned database migration/reconciliation utility.
