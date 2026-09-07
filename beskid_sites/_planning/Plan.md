# beskid_sites — Master Plan

This is the master plan for the `beskid_sites/` initiative: a standalone pnpm
workspace that consolidates all Beskid web properties onto a single TanStack
Start + React 19 stack, sharing one canonical UI library
(`@cyber-nomad-collective/beskid-ui-react`) and one extracted shell
(`packages/shell-core` + `apps/shell-template`).

Per-service plans live in `*/Plan.md` (one directory per service). Research
docs that ground this plan:

- `infra-audit.md` — 50 findings on the existing Coolify-based platform
  (the basis for the Caddy migration).
- `publish-migration.md` — design for `cr.beskid-lang.org` self-hosted
  registry + SSH/Caddy deploy, replacing GHCR + Coolify.
- `nodebb-research.md` — NodeBB + Authelia/OIDC + pckg integration design
  for `community.beskid-lang.org`.
- `pckg-detail-pages-research.md` — audit of the existing pckg/web pages to
  preserve in the TanStack Start rewrite.

## Overall initiative

`beskid_sites/` is **not** a git submodule and **not** a member of the root
`pnpm-workspace.yaml` (see `DECISIONS.md` §1). It owns its own catalogs,
`biome.json`, `tsconfig.base.json`, and `.npmrc`. All shared UI ships from
`packages/beskid-ui-react`; all shell scaffolding ships from
`packages/shell-core` and the `apps/shell-template` reference app. Each
service app (`apps/<name>`) consumes the library via `workspace:*` and the
shell via copy-from-template.

The long-term goal: every public Beskid web property (website, platform-spec,
tracker, nexus, pckg, learn, community) is built and deployed from this one
workspace, fronted by Caddy, authenticated by Authelia (GitHub sole IdP), with
images pushed to `cr.beskid-lang.org` over SSH.

## Completed work

### Workspace foundation
- **`beskid_sites/` standalone pnpm workspace** created — own
  `pnpm-workspace.yaml`, `biome.json`, `tsconfig.base.json`, `.npmrc`,
  `package.json`. Not in root `pnpm-workspace.yaml`; not a submodule.
- **`packages/beskid-ui-react/`** — single canonical React shadcn library,
  copied from `beskid_web_common/packages/beskid-ui-react`. The
  `@beskid/material-theme` CSS (`theme.material.css`) is folded in so the lib
  has no external CSS alias dependency. `styles/*` exports: `shadcn-entry`,
  `beskid-tokens`, `shadcn-theme`, `hub`.
- **`packages/shell-core/`** — extracted shared shell primitives: `AppShell`,
  `AppSidebar`, `Topbar`, `UserMenu`, `GlobalSearch` (cmdk, Cmd/Ctrl+K),
  `PageTransition` + `AnimatedModeSwitcher` (framer-motion), and the
  Authelia OIDC auth factory (authorization-code flow, `jose` ID-token
  verification, HS256 session cookie).
- **`packages/gitnexus-shared/`** — vendored nexus type contracts
  (`GraphNode`, `GraphRelationship`, `NodeLabel`, `PipelineProgress`,
  `resilientFetch`).
- **`apps/shell-template/`** — reusable TanStack Start shell template; donor
  for all service apps. Ships the Authelia contract doc
  (`docs/authelia.md`) and the Authelia `configuration.yml` with per-app
  OIDC client registrations (`website`, `platform-spec`, `tracker`, `pckg`,
  `learn`, `nexus` commented as examples).
- Style tokens unified across all apps (single `tokens.css` in
  `beskid-ui-react`).

### Service apps (all migrated into `beskid_sites/apps/`)
- **`apps/website/`** — TanStack Start rewrite of the Astro website. 227 MDX
  files carried (Beskid Book + blog + landing + downloads). Starlight shell
  reimplemented in React; remark pipeline + Beskid Shiki grammar preserved;
  OpenSpec catalog hard-fail gate preserved; Giscus via `@giscus/react`;
  Pagefind search; `trailingSlash: 'always'` and legacy redirects preserved.
- **`apps/platform-spec/`** — full copy from `site/platform-spec`. OpenSpec
  reader, Memgraph integration, git-sync PR flow, editor, tests all ported.
  Auth-hub surfaces removed; Authelia OIDC added.
- **`apps/tracker/`** — full copy from `beskid_tracker`. SQLite data layer
  preserved (source of truth); `node:sqlite` `DatabaseSync` unchanged.
  Auth-hub removed; Authelia OIDC added.
- **`apps/nexus/`** — full copy from `beskid_nexus/gitnexus-web`. Vite SPA
  shell components adapted to the shared shell. Sigma/graphology/mermaid
  explorer surface intact.
- **`apps/pckg/`** — TanStack Start rewrite. `PckgApiClient` lifted verbatim
  (contract tests intact). Docs mode + pckg mode with the animated
  switcher; NodeBB integration designed (per `nodebb-research.md`); community
  surfaces removed (NodeBB handles discussion).

### Backend / repo cleanup
- **pckg Rust backend refactored** — community code removed; Authelia
  forward-auth story replaced by the OIDC client model; `PckgApiClient`
  contract matched.
- **`.NET` pckg code removed from the repo** (the legacy backend is gone).

### Infra / deploy design
- **Infra audit completed** — 50 findings in `infra-audit.md` (5
  critical/high blockers, 18 medium, 27 low/positive).
- **Publish migration designed** — `cr.beskid-lang.org` registry + Caddy +
  SSH deploy flow, replacing GHCR + Coolify (`publish-migration.md`).
- **Caddy compose designed** — 13-service `deploy/docker-compose.yml`
  (Caddy, registry, Authelia, Postgres, Memgraph, website, platform-spec,
  tracker, nexus, pckg, learn, community, + Caddyfile). **Not yet
  activated** — runs alongside Coolify during cutover.
- **NodeBB + Authelia integration researched** — `community.beskid-lang.org`
  design, OIDC SSO plugin choice, pckg → NodeBB Write API provisioning flow
  (`nodebb-research.md`).

### Production deployment (current)
- All five Beskid site services are **live in production** behind the
  existing Coolify proxy with Caddy labels:
  - `beskid-lang.org` — `apps/website`
  - `spec.beskid-lang.org` — `apps/platform-spec`
  - `tracker.beskid-lang.org` — `apps/tracker`
  - `nexus.beskid-lang.org` — `apps/nexus`
  - `pckg.beskid-lang.org` — `apps/pckg`
- All services are running with **`SHELL_AUTH_MODE=mock`** — Authelia
  deployment is in progress (see Pending).

See **Current Deployment State** below for the full picture.

## Pending work

### In progress
- **Authelia OIDC deployment** (replacing mock auth across all 5 services).
  Authelia config and per-app OIDC client registrations exist in
  `apps/shell-template/compose/authelia/configuration.yml`; the production
  Authelia instance is being stood up.

### Blocking decisions (fail closed)
- **Cosign signing strategy outside GitHub Actions.** `reusable-image.yml`
  signs keylessly using GitHub OIDC (`id-token: write`). Outside Actions,
  keyless signing is unavailable. Options: (a) drop signing + relax
  `validate-release-manifest.sh` to allow `signed: false` via a flag, or
  (b) provision a cosign key pair in OpenBao and sign with `--key`. This is
  a blocking decision for the publish migration (Phase 6) — see
  `publish-migration.md` Open Question 5.

### Human / admin steps (fail closed — do not invent)
- **GitHub OAuth App callback URL registration for Authelia.** Reuse the
  existing Beskid GitHub OAuth App (the one `site/auth` used). Add the
  Authelia callback `${AUTHELIA_OIDC_ISSUER}/api/oidc/callback`. Store
  `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in OpenBao at
  `secret/beskid/production/auth`.
- **Coolify service UUIDs / GHCR grants** for any new images (e.g.
  `beskid-sites-pckg`, Authelia, NodeBB) — only if staying on Coolify. Per
  AGENTS.md, never invent UUIDs or grants; record them in
  `beskid_infra/config/coolify-*.json` after the admin creates them. Under
  the Caddy + `cr.beskid-lang.org` path these become unnecessary.
- **OpenBao secrets seeding** for new services: Authelia
  (`AUTHELIA_SESSION_SECRET`, `AUTHELIA_STORAGE_ENCRYPTION_KEY`,
  `AUTHELIA_OIDC_HMAC_SECRET`, `AUTHELIA_OIDC_JWKS_SECRET`), per-app
  `*_OIDC_CLIENT_SECRET`, Postgres/Memgraph passwords, registry
  `secret/beskid/registry/cr-beskid-lang-org` (`username` / `password`).
  See `deploy/README.md` §Prerequisites.

### Pending phases (see Roadmap)
- Standalone Caddy compose activation (replacing Coolify proxy).
- NodeBB `community.beskid-lang.org` deployment.
- Monitoring stack rewrite (Alloy/Prometheus/Loki/Grafana) off Coolify
  labels.
- Backups + disaster recovery.
- CI/CD pipeline migration (`cr.beskid-lang.org`, cosign, SSH deploy).
- `learn` app migration into `beskid_sites/apps/learn`.
- `nexus` TanStack Start conversion + full Authelia auth (currently Vite
  SPA shell-adapted, not a full TanStack Start app).

## Current Deployment State

| Service | Domain | Source app | Live? | Auth mode | Notes |
|---|---|---|---|---|---|
| website | `beskid-lang.org` | `apps/website` | yes | `mock` (public; auth only for edit surfaces) | TanStack Start rewrite of Astro site. 227 MDX. Giscus + Pagefind. |
| platform-spec | `spec.beskid-lang.org` | `apps/platform-spec` | yes | `mock` | Full copy from `site/platform-spec`. OpenSpec reader + Memgraph + git-sync PR. |
| tracker | `tracker.beskid-lang.org` | `apps/tracker` | yes | `mock` | Full copy from `beskid_tracker`. SQLite source of truth preserved. |
| nexus | `nexus.beskid-lang.org` | `apps/nexus` | yes | `mock` | Full copy from `beskid_nexus/gitnexus-web`. Vite SPA, not yet TanStack Start. |
| pckg | `pckg.beskid-lang.org` | `apps/pckg` | yes | `mock` | TanStack Start rewrite. Rust backend refactored; .NET removed. |
| learn | `learn.beskid-lang.org` | `site/learn` (legacy) | no (still on legacy `site/learn`) | legacy auth-hub JWT | Not yet migrated into `beskid_sites/`. See `learn/Plan.md`. |
| community | `community.beskid-lang.org` | (not yet deployed) | no | n/a | NodeBB deployment pending. See `nodebb-research.md`. |
| auth | `auth.beskid-lang.org:8090` | `site/auth` (legacy) | yes (legacy) | bespoke hub | Being retired; Authelia replaces it. See `auth/Plan.md`. |

Infra: production runs on Coolify with Caddy labels. The standalone Caddy
compose at `beskid_sites/deploy/` is designed but **not yet activated** — it
runs alongside Coolify during cutover (see `deploy/README.md` §Cutover).
OpenBao remains the secrets source of truth at `https://secrets.bdziam.dev`.

## Full Completion Roadmap

Ordered phases. Each phase lists its goal, dependencies, tasks, verification,
and blockers / human steps. Earlier phases are not strictly blocking for all
later phases (e.g. learn migration can start while monitoring is being
rewritten), but the order reflects recommended sequencing for risk
minimization.

### Phase 1 (current) — Authelia OIDC deployment

**Goal.** Replace `SHELL_AUTH_MODE=mock` with real Authelia-backed OIDC
across all 5 deployed services. Retire `site/auth`.

**Dependencies.** `apps/shell-template/compose/authelia/configuration.yml`
(written), `apps/shell-template/docs/authelia.md` (contract written).

**Tasks.**
1. Stand up the production Authelia instance (Coolify service or part of the
   new Caddy compose — see Phase 3).
2. Configure GitHub as the sole identity provider
   (`authentication_backend.oauth2: provider: github`), reusing the existing
   Beskid GitHub OAuth App.
3. Register OIDC clients for `website`, `platform-spec`, `tracker`, `pckg`,
   `nexus` (uncomment their blocks in `configuration.yml`); set per-app
   `*_OIDC_CLIENT_SECRET` from OpenBao.
4. Switch each service env from `SHELL_AUTH_MODE=mock` to
   `SHELL_AUTH_MODE=authelia`; set `AUTHELIA_OIDC_ISSUER`, per-app
   `*_OIDC_CLIENT_SECRET`, and `SESSION_SECRET`.
5. Retire `site/auth`: remove the `auth` Coolify service, the `auth-data`
   volume, the `beskid-auth` GHCR image, OpenBao path
   `secret/beskid/production/auth` (after the new Authelia secrets are in
   their own paths). Deprecate `@beskid/auth-client` on GitHub Packages.
6. Open an OpenSpec change retiring `tooling--auth-hub--design-model` and
   `tooling--auth-hub--contracts-and-edge-cases` and introducing an
   Authelia-based auth capability with SHALL requirements (per AGENTS.md:
   update spec before observable behavior changes).

**Verification.** Sign-in flow works on each service; `requireShellGroup`
gating works for admin surfaces; `beskid-admins` group maps correctly;
logout clears the session cookie; avatar fallback
(`https://github.com/<username>.png`) renders.

**Blockers / human steps.**
- GitHub OAuth App callback URL registration for Authelia (human).
- OpenBao seeding of Authelia secrets + per-app `*_OIDC_CLIENT_SECRET`
  (human, fail closed).
- Authelia group lockout recovery procedure documented (no first-sign-in
  bootstrap under Authelia — see `auth/Plan.md` Risk #5).
- OpenSpec change for the auth capability (procedural).

### Phase 2 — NodeBB `community.beskid-lang.org`

**Goal.** Stand up NodeBB as the community forum at
`community.beskid-lang.org`, integrated with Authelia (OIDC RP) and pckg
(Write API provisioning of per-package subforums).

**Dependencies.** Phase 1 (Authelia must be live so NodeBB can be an OIDC
client). `nodebb-research.md` (design).

**Tasks.**
1. Decide the OIDC plugin path: fork `Alexkin2609/nodebb-plugin-sso-oidc`
   into `Cyber-Nomad-Collective` and maintain it for NodeBB v4, **or**
   extend the official `nodebb-plugin-sso-oauth` with ID-token verification,
   **or** write a thin bespoke OIDC plugin. Verify the chosen plugin runs
   on NodeBB v4 before committing. (`nodebb-research.md` Open Question 1.)
2. Register a `nodebb` OIDC client in Authelia's `configuration.yml`
   (`client_id: nodebb`, redirect URI per the plugin's callback path —
   confirm before registering).
3. Deploy NodeBB (`ghcr.io/nodebb/nodebb`, pinned to a digest) with
   Postgres (separate `nodebb` db/role or a dedicated instance — operator
   decision). Optional Redis for sessions at scale.
4. Generate `config.json` from OpenBao via the `sync-runtime-env.sh`
   pattern (NodeBB expects secrets in `config.json`, not env).
5. Bootstrap: create a "Packages" parent category; record its `cid` as
   `NODEBB_PACKAGES_PARENT_CID` in pckg env. Create a `pckg-bot` admin user;
   mint an admin token (`POST /api/v3/admin/tokens`); store it in OpenBao
   `secret/beskid/production/nodebb`.
6. Wire pckg → NodeBB provisioning: on package publish, idempotently
   create/lock a subforum under "Packages"; persist `{ packageSlug → cid }`
   in pckg's DB; render a "Discuss" link on the package detail page.
7. Open an OpenSpec change introducing a `community--forum` capability with
   SHALL requirements (per AGENTS.md — adding a community forum is an
   observable platform behavior).

**Verification.** Sign-in on NodeBB via Authelia SSO; `beskid-admins` group
maps to NodeBB admin/moderator groups (custom hook if the plugin does not
provision groups — `nodebb-research.md` Open Question 2); pckg publish
creates a locked, readable subforum; "Discuss" link resolves; republish is
idempotent.

**Blockers / human steps.**
- OIDC plugin maturity decision (above).
- Exact OIDC callback path — confirm against the deployed plugin's routes
  before registering the redirect URI in Authelia.
- NodeBB Postgres topology decision (separate instance vs. shared).
- Coolify service UUID + GHCR pull grant for NodeBB (if staying on Coolify)
  — human, fail closed.
- OpenBao path `secret/beskid/production/nodebb` (human, fail closed).
- `config.json` secret delivery extension to `sync-runtime-env.sh`.
- OpenSpec change for `community--forum`.

### Phase 3 — Standalone Caddy compose (replace Coolify)

**Goal.** Flip production traffic from the Coolify proxy to the standalone
Caddy stack at `beskid_sites/deploy/`. Coolify is decommissioned for Beskid
services.

**Dependencies.** Phase 1 (Authelia must run in the new stack). Phases 1–2
can run on Coolify first; this phase moves the runtime. `infra-audit.md`
(findings cited inline in `deploy/README.md`). `publish-migration.md`
(registry + SSH deploy flow).

**Tasks.**
1. Stand up `cr.beskid-lang.org` (DNS, `registry:2` + Caddy TLS, htpasswd
   or Caddy basic auth, OpenBao `secret/beskid/registry/cr-beskid-lang-org`).
2. Build + push all service images to `cr.beskid-lang.org/beskid/<name>`
   (digest-pinned). Record digests in the release manifest.
3. SSH-deploy the `beskid_sites/deploy/docker-compose.yml` stack alongside
   Coolify (dark run); verify each container is healthy on the host.
4. Per-domain cutover: lower DNS TTL → verify new container → flip DNS →
   wait for Caddy auto-HTTPS → run smoke → soak 1–3 days → decommission the
   matching Coolify service. Order: `cr.beskid-lang.org` and
   `auth.beskid-lang.org` first (no user-facing risk), then
   `beskid-lang.org`, then the rest.
5. Rewrite `deploy-release-manifest.sh` for SSH + Compose (replace the
   Coolify REST flow). Keep `render-release-compose.sh` and
   `post-deploy-smoke.sh` (Coolify-independent); drop explicit `:port` from
   public URLs (audit 6.2).
6. Rewrite `sync-runtime-env.sh` to emit an `env_file` instead of a
   Coolify PATCH (audit 3.2).
7. Fold Grafana into the monitoring compose (audit 1.5, 4.3, 6.6) — see
   Phase 4.

**Verification.** `./deploy.sh --smoke-only` passes for every public
endpoint; rollback by restoring `docker-compose.prev.yml` on the host
works; Coolify decommission completes for all Beskid services.

**Blockers / human steps.**
- DNS A records for every subdomain (human) — see `deploy/README.md`
  §Prerequisites.
- Registry htpasswd + OpenBao `secret/beskid/registry/cr-beskid-lang-org`
  (human, fail closed).
- Deploy host SSH key (human).
- Backup of the current Coolify production compose payload for cutover
  fallback (human).
- Cosign signing decision (Phase 6 blocker; can be deferred for the first
  cut by relaxing the manifest validator with `--allow-unsigned`).

### Phase 4 — Monitoring stack rewrite

**Goal.** Move monitoring off Coolify-coupled discovery onto a
Beskid-defined label scheme; fold Grafana into the monitoring compose; add
alerting.

**Dependencies.** Phase 3 (Caddy stack live; Alloy must scrape non-Coolify
containers). `infra-audit.md` findings 1.4, 4.1, 4.3, 4.4, 6.6.

**Tasks.**
1. Rewrite `monitoring/alloy/config.alloy` to filter on a Beskid-defined
   Docker label (e.g. `beskid.scrape=true`) instead of
   `coolify.projectName=beskid`. Replace `coolify_serviceName` /
   `coolify_resourceName` / `coolify_projectName` / `coolify_environmentName`
   label reads with `beskid.service` / `beskid.environment`. Alternatively,
   use a static `scrape_configs` block in `prometheus.yml` (simpler, more
   robust). Apply the new labels in `deploy/docker-compose.yml`.
2. Add a `grafana` service to the monitoring compose with the provisioning
   mounts from `grafana-provisioning.patch.yml` inlined. Replace
   `SERVICE_USER_POSTGRES` / `SERVICE_PASSWORD_POSTGRES` (Coolify-injected)
   with a real Grafana Postgres config from OpenBao/env.
3. Route `monitor.beskid-lang.org` via Caddy (fold the separate Coolify
   Grafana service into the stack).
4. Add alerting: `up{project="beskid"} == 0` for >2m, 5xx ratio >5% for >5m,
   Prometheus/Loki/Alloy `up == 0`. Alertmanager or Grafana contact points
   to a real channel.
5. Verify the dashboard queries (`http_requests_total`,
   `http_request_duration_seconds_bucket`) match metrics emitted by every
   service; add missing emitters where blank (audit 4.5).

**Verification.** Alloy discovers and scrapes every Beskid container;
Grafana dashboards populate; alert rules fire on induced failures; no
`/metrics` route is publicly exposed (audit 4.7).

**Blockers / human steps.**
- Alerting channel (Slack/email/PagerDuty) — human configures the contact
  point.
- Grafana Postgres credentials in OpenBao (human, fail closed).

### Phase 5 — Backups + disaster recovery

**Goal.** Documented, automated backup + restore for all persistent
volumes and data stores.

**Dependencies.** Phase 3 (volumes are owned by the new compose).
`infra-audit.md` finding 7.8 (no backup strategy documented).

**Tasks.**
1. Cron + `docker run --volumes-from` tar of `auth-data`, `tracker-data`,
   `memgraph-data`, `pckg_pg_data`, `platform-spec-data`, `nexus-data`,
   `registry-data`, `nodebb-pg-data`, `postgres-data` to off-host storage
   (S3/B2).
2. `pg_dump` for all Postgres databases (Authelia, pckg, NodeBB, Grafana).
3. Document restore in `beskid_sites/deploy/README.md` (or a dedicated
   `docs/backup-restore.md`).
4. Document the single-host, no-HA limitation (audit 7.7) as a known
   constraint; do not silently carry it forward.

**Verification.** Restore drill: rebuild a service from a backup on a fresh
host; verify data integrity.

**Blockers / human steps.**
- Off-host storage target credentials (human).
- Backup retention policy (human decision).

### Phase 6 — CI/CD pipeline migration

**Goal.** Move the publish flow from GitHub Actions + GHCR + Coolify to a
build host + `cr.beskid-lang.org` + SSH deploy, preserving the
build-once/promote-by-digest contract and the gate sequence.

**Dependencies.** Phase 3 (registry + SSH deploy path live).
`publish-migration.md` (full design + 12 open questions).

**Tasks.**
1. Stand up the build host (Docker/BuildKit, pnpm, git, cosign, trivy,
   submodule access, registry credentials in env from OpenBao).
2. Run the existing gates on the build host (`openspec`, `conformance`,
   `integration`, `security`, `shared-ui-nexus`, per-lane build gates).
   Decide gate scoping per lane (`publish-migration.md` Open Question 7).
3. Build images with the same `docker build` invocation the GitHub Actions
   lane uses (context = superrepo root, submodules initialized).
4. Validate digests (`^sha256:[0-9a-f]{64}$`), run Trivy (report-only),
   sign (per the cosign decision below).
5. Push to `cr.beskid-lang.org/beskid/<name>:sha-<sha>`; capture the digest
   into an image-record JSON.
6. Build + validate the release manifest with
   `scripts/ci/build-release-manifest.sh` and
   `scripts/ci/validate-release-manifest.sh`.
7. Render the deploy-host compose (retargeted to `cr.beskid-lang.org/beskid/*`,
   digest-pinned); hard-fail on any mutable reference.
8. SSH-deploy + smoke + rollback (Phase 3 task 5).
9. Decommission the GHCR lanes and Coolify services once the new stack is
   stable for a full release cycle.

**Verification.** End-to-end publish of one lane (website first per
`publish-migration.md`); digest immutability gate; smoke pass; rollback
drill.

**Blockers / human steps.**
- **Cosign signing strategy** (blocking decision): drop signing + relax
  `validate-release-manifest.sh` with `--allow-unsigned`, **or** provision
  a cosign key pair in OpenBao and sign with `--key`. The current validator
  hard-requires `signed: true`.
- Trivy scan report destination (Loki / local dir / drop) —
  `publish-migration.md` Open Question 6.
- Build host identity (operator's machine / dedicated VM / deploy host) —
  Open Question 8.
- Trigger model (manual / registry webhook / cron / GitHub-Actions-only-SSH
  hybrid) — Open Question 9.
- OpenBao-on-deploy-host vs. ship-`.env`-over-SSH decision — Open Question 10.

### Phase 7 — `learn` app migration

**Goal.** Migrate `site/learn` into `beskid_sites/apps/learn` on TanStack
Start + the shell template + Authelia.

**Dependencies.** Phase 1 (Authelia). `learn/Plan.md` (full research).

**Tasks.** (Summary — see `learn/Plan.md` for the full phased approach.)
1. Scaffold `beskid_sites/apps/learn` from the shell template; port the
   pure-React components + `learningCatalog.ts` + `curriculum/` with imports
   re-homed to `@cyber-nomad-collective/beskid-ui-react`. Introduce a
   TanStack Start route tree (`/`, `/lesson/:slug`, `/playground`).
2. Reimplement the `/api/check` Nitro server route (compiler-spawning,
   sandboxed temp file, timeout/SIGKILL, expected-output matching, ABI-v5
   runtime-kit staging). Replace `Bun.which`/`Bun.file` with Node
   equivalents.
3. Replace the hand-rolled JWT session + auth-hub handoff with the
   template's Authelia integration. Migrate `.beskid-learn-progress.json`
   to a `learn_progress` table in shared Postgres keyed by user + exercise.
4. Adopt the shell template's sidebar-items + topbar nav-slot services
   (view-mode toggle in left slot, user/avatar in right slot). Remove the
   compact `Sheet` fallback once the template's sidebar-disabled avatar
   dropdown covers it.
5. Update the Dockerfile (preserve the Rust stage + staged native runtime
   kit; switch the web stage to TanStack Start Nitro + Node).
6. Remove `site/learn` from the root `pnpm-workspace.yaml`; point
   `learn.beskid-lang.org` at the new Nitro service; retire `site/learn`.

**Verification.** `/api/check` smoke checks pass (per `COOLIFY.md:38-41`);
lessons load; progress persists across sessions; auth via Authelia works;
the ABI-v5 runtime kit is reachable at runtime.

**Blockers / human steps.**
- Decision on whether the new `beskid_sites` workspace can reach
  `compiler/scripts/*` and `compiler/target/*` at runtime for the native
  runtime kit (`learn/Plan.md` Risk: ABI-v5 runtime kit staging) — keep
  learn depending on a repo-root compiler checkout, or ship the kit as a
  downloadable artifact.
- Decide whether in-memory lesson CRUD is ported with persistence or
  dropped (it is already non-durable today).

### Phase 8 — `nexus` TanStack Start conversion + full auth

**Goal.** Convert `apps/nexus` from the Vite SPA shell-adapted state into a
full TanStack Start app with the shell template, Authelia OIDC, and the
`gitnexus` server serving only the API + graph index.

**Dependencies.** Phase 1 (Authelia). `nexus/Plan.md` (full research).

**Tasks.** (Summary — see `nexus/Plan.md` for the full phased approach.)
1. **Decide the serving model** (blocking): separate Nitro server vs.
   static bundle hosted by `gitnexus serve`. This gates the auth + data
   layer phases.
2. **Decide `gitnexus-shared` provenance**: copy into
   `beskid_sites/packages/beskid-nexus-shared` (already vendored — confirm
   it is the canonical source), publish to GitHub Packages as
   `@cyber-nomad-collective/beskid-nexus-shared`, or keep a `file:` link.
3. Scaffold the TanStack Start app from the shell template; port the
   React/Sigma/graphology/mermaid explorer surface, `services/backend-client.ts`,
   `services/nexus-api.ts`, `hooks/*`, `lib/*`. Re-home `@beskid/ui-react`
   → `@cyber-nomad-collective/beskid-ui-react`; drop `@beskid/beskid-ui`
   once `BeskidHub`/theme CSS are confirmed in the new lib; drop
   `@cyber-nomad-collective/trudoc` (unused). Introduce a real route tree
   (`/`, `/repo/:id`); guard Sigma/Mermaid/syntax-highlighter imports with
   `clientOnly`.
4. Adopt the shell template's topbar nav-slot services (left slot: repo
   selector + `SymbolSearch`; right slot: settings, Connect MCP, theme
   toggle, `BeskidHub`, avatar). Replace the `OAuthSetupWizard` +
   `fetchAuthMe` / `githubLoginUrl` + `setup` phase with the template's
   Authelia OIDC integration.
5. Explorer consolidation into the shared lib: decide `FileTreePanel`
   consolidation (generalize `beskid-ui-react/explorer`'s `FileExplorer` to
   accept a `GraphNode[]` source, or keep nexus's tree app-local); lift
   `CodeReferencesPanel`'s syntax-highlighted file viewer as a `CodeViewer`
   into the lib (the cross-service shared-explorer-dialog surface). Decide
   whether the Sigma whole-repo explorer moves into a new
   `@cyber-nomad-collective/beskid-ui-react/graph-sigma` subpath or stays
   app-local.
6. Finalize the `/api` proxy (Nitro dev-proxy + production same-origin or
   CORS). Verify the streaming `connectToServer` graph download and
   `connectHeartbeat` survive the new fetch/runtime.
7. Update the Dockerfile: either the Start build produces a static bundle
   copied into `gitnexus/web/` (minimal server change) or a separate Nitro
   server image is built and the compose runs both. Remove
   `beskid_nexus/gitnexus-web` once `beskid_sites/apps/nexus` is canonical.

**Verification.** Graph explorer renders under SSR-with-`clientOnly` guards;
sign-in via Authelia; `/api` proxy works under the chosen serving model;
Playwright e2e re-pointed to the Start dev server passes; heartbeat crosses
origins correctly if split-deployed.

**Blockers / human steps.**
- Serving model decision (above) — biggest open decision.
- `gitnexus-shared` provenance decision (above).
- Server-side `@beskid/auth-client` on the `gitnexus` CLI is a separate
  decision (the CLI's auth is out of scope for the web port).

## Cross-phase constraints (apply throughout)

- **Do not invent** Coolify service UUIDs, GHCR package Write grants, or
  secret token values — fail closed and document the exact human admin
  step (AGENTS.md).
- **Spec before behavior.** Any observable platform change (auth cutover,
  community forum, registry migration) moves through a real OpenSpec change
  with SHALL requirements + scenarios, not a stub fill.
- **Single implementation per construct.** The shared lib
  (`beskid-ui-react`), the shell (`shell-core` + `shell-template`), and the
  deploy stack (`beskid_sites/deploy/`) are the only homes for their
  surfaces. Service apps do not fork shared primitives; they consume them.
- **No git operations without explicit user request.** This plan does not
  commit, push, or merge anything.
