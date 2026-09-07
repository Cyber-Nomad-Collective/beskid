# Platform Infrastructure Audit

> Research-only audit of the current Coolify-based Beskid platform deployment,
> performed to inform a migration to Caddy + Docker Compose over SSH. Source:
> `beskid_infra/` (submodule at `beskid_infra/`), root `.github/workflows/`, and
> `scripts/ci/`. No files were modified.

## Executive Summary

The platform has a mature, digest-pinned, manifest-driven CI/CD pipeline
(`platform-delivery.yml` → `reusable-image.yml` → `reusable-promote.yml`) that is
let down by an **over-coupled Coolify control plane**. Coolify is used for five
things — TLS, domain routing, env injection, volume management, and deploy
triggering — but only the first two genuinely need it; the other three are
thin wrappers that hide drift between `domains.json`, `coolify-*.json`, and the
Compose file. The runtime Compose itself is reasonable (healthchecks
everywhere, `expose:`-only, digest-pinned Beskid images) but has real gaps: **no
network isolation**, **floating tags on all third-party images** (one with no
tag at all), **no resource limits**, **no log rotation**, **unauthenticated
Memgraph**, and **Alloy discovery hard-coded to Coolify container labels** that
will break the moment Coolify is removed. Secrets handling is the strongest
part (OpenBao KV v2, fail-closed sync), but the sync script's last step is a
Coolify API PATCH that becomes dead code without Coolify.

---

## Findings by Category

### 1. Coolify

**Severity: High (migration blocker) — Coolify is a thin wrapper over Compose
that adds coupling without adding capability.**

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 1.1 | **Coolify does five jobs; only two need it.** Coolify provides TLS termination, domain routing, env injection, volume management, and deploy triggering. Volumes are plain Docker named volumes (`volumes:` block, `compose/production/docker-compose.yml:209-217`), env injection is a single API PATCH (`scripts/ci/sync-runtime-env.sh:64-69`), and deploy triggering is `GET /deploy?uuid=…` (`scripts/ci/deploy-release-manifest.sh:130`). Only TLS + domain routing are non-trivial — and Caddy does both better. | High | `docs/deploy-matrix.md:12` ("Coolify \| TLS proxy, volumes, compose runtime") |
| 1.2 | **Service UUIDs are a hard external dependency.** Every deploy needs `COOLIFY_SERVICE_UUID` from GitHub env or `config/coolify-*.json` (`s4ir1ovgqtubarqeql3gf3pz` prod, `n2faf85soesljo4bng5g1gck` stg). These are opaque IDs that cannot be derived or recovered from the repo — losing them means a human must re-create the Coolify service. This is the exact "never invent UUIDs" rule in `AGENTS.md`. | Medium | `config/coolify-production.json:4`, `config/coolify.snapshot.json:14-19` |
| 1.3 | **The Coolify API is the deploy protocol.** `deploy-release-manifest.sh` (340 lines) is almost entirely Coolify REST: `PATCH /services/{uuid}` with base64 compose, `GET /deploy?force=true`, poll `/deployments/{id}`, poll `/services/{uuid}`, rollback by re-patching the previous payload. Replacing Coolify means rewriting this entire script — but the new version (SSH + `docker compose up -d`) is dramatically simpler. | High | `scripts/ci/deploy-release-manifest.sh:104-340` |
| 1.4 | **Alloy discovery is hard-coupled to Coolify labels.** `monitoring/alloy/config.alloy:13` filters containers by `coolify.projectName=beskid` and reads `coolify_serviceName`, `coolify_resourceName`, `coolify_projectName`, `coolify_environmentName` labels (lines 21, 26, 31, 36, 97-114). These labels are applied by Coolify at container creation. **Without Coolify, Alloy discovers zero containers.** This is the single most breaking monitoring dependency. | Critical | `monitoring/alloy/config.alloy:9-15, 21-38` |
| 1.5 | **Grafana runs as a separate Coolify service, not in the monitoring compose.** `compose/monitoring/grafana-provisioning.patch.yml` is a *patch* file documenting how to manually mount provisioning into a Coolify-managed Grafana (`config/coolify-monitoring-observability.json:5` `grafana_service_uuid: o143swr9kk3ph7d7r72lqnvb`). Grafana is not in `compose/monitoring/docker-compose.yml`. This is fragile and undocumented-as-code. | Medium | `compose/monitoring/grafana-provisioning.patch.yml`, `config/coolify-monitoring-observability.json` |
| 1.6 | **`coolify.snapshot.json` records legacy per-service apps removed 2026-05-29.** Good cleanup audit trail, but shows the platform already migrated *away* from per-service Coolify apps to a single compose service. The next step (away from Coolify entirely) is consistent with that direction. | Low | `config/coolify.snapshot.json:20-25` |
| 1.7 | **`production.tfvars` is stale.** It still has `enable_services = { tracker=false, nexus=false, pckg=false }` and `manage_environment=false`, referencing a Terraform-managed Coolify flow that no longer exists (the platform moved to Compose + API-driven deploys). The file is gitignored but present, and is misleading documentation of how infra is managed. | Low | `config/production.tfvars:10-17` |

### 2. Docker Compose

**Severity: Medium — the Compose file is competent but has isolation, pinning,
and hygiene gaps that a Caddy migration should fix in the same pass.**

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 2.1 | **No `networks:` section — every service shares the default bridge.** `compose/production/docker-compose.yml` defines zero networks. Memgraph (no auth, see 2.7), Postgres, and all app containers are mutually reachable by service name. There is no isolation between the public-facing apps (site, auth, platform-spec, learn) and the data stores, nor between pckg's Postgres and the rest of the platform. | High | `compose/production/docker-compose.yml` (no `networks:` key) |
| 2.2 | **Third-party images are tag-pinned, not digest-pinned.** `memgraph/memgraph-mage:3.6.2` (line 46), `postgres:16` (line 157, floating major), `prom/prometheus:v3.2.1` (`compose/monitoring/docker-compose.yml:8`), `grafana/loki:3.4.2` (line 29), `grafana/alloy:v1.8.1` (line 45). Beskid images are digest-pinned via `render-release-compose.sh`, but the entire data and observability layer is subject to silent upstream drift. | High | `compose/production/docker-compose.yml:46,157`; `compose/monitoring/docker-compose.yml:8,29,45` |
| 2.3 | **`grafana/grafana-oss` has NO tag at all.** Floating `latest`. This is the worst case: a `docker compose pull` can silently replace Grafana with a new major across deploys. | Critical | `compose/monitoring/grafana-provisioning.patch.yml:15` |
| 2.4 | **No resource limits on any service.** No `deploy.resources.limits`, no `mem_limit`, no `cpus`. On a single host, a memory leak in any service (Memgraph and Postgres are the likely culprits) can OOM the whole platform. | High | All services in `compose/production/docker-compose.yml` and `compose/monitoring/docker-compose.yml` |
| 2.5 | **No log driver / rotation config.** Default `json-file` driver with no `max-size`/`max-file`. Logs grow unbounded on disk. Alloy tails via docker.sock but does not replace the on-disk log files. | Medium | No `logging:` key in either compose file |
| 2.6 | **Memgraph has no authentication.** `memgraph` service (lines 45-58) exposes 7687 (Bolt) and 7444 (HTTP) with no `--auth-flag`/env. Any container on the default network can read/write the entire platform-spec graph. The healthcheck runs `RETURN 0;` via mgconsole with no credentials. | High | `compose/production/docker-compose.yml:45-58` |
| 2.7 | **Postgres is profile-coupled to pckg.** The `postgres` service is `profiles: [pckg]` (line 156). If any future service (e.g. the commented Authelia block, lines 271-302) needs Postgres, it must either join the `pckg` profile or a new Postgres service must be added. The commented block itself notes this ("a shared instance would need its own profile/volume", line 304-306). This coupling is a latent anti-pattern. | Medium | `compose/production/docker-compose.yml:155-170, 304-306` |
| 2.8 | **Fragmented data layer: SQLite + Memgraph + Postgres.** auth uses SQLite (`auth-data`), tracker uses SQLite (`tracker-data`), platform-spec uses Memgraph, nexus uses its own volume, pckg uses Postgres. Four different data stores on one host. Operationally complex; no shared backup story. May be intentional (small per-service state) but should be a conscious decision, not drift. | Medium | `compose/production/docker-compose.yml:36-37, 51-52, 84-85, 128-129, 146-147, 162-163, 199-200` |
| 2.9 | **No `depends_on` for `learn` on `auth`.** `learn` (lines 93-107) sets `BESKID_AUTH_HUB_URL` but has no `depends_on: auth`. Since it uses the *public* auth URL (not the container), this is technically correct, but means learn can start before auth is reachable and fail its healthcheck until auth is up. | Low | `compose/production/docker-compose.yml:93-107` |
| 2.10 | **Healthchecks are good — every running service has one.** site, auth, memgraph, platform-spec, learn, tracker, nexus, postgres, pckg, prometheus, loki, alloy, grafana all have healthchecks with sensible intervals and start periods. This is a strength. | Positive | All services |
| 2.11 | **`expose:` only, no `ports:` — correct.** No internal port is published to the host. Coolify proxy reaches containers via the Docker network. Caddy will need the same pattern (Caddy container on the same network, reverse_proxy to service names). | Positive | All services |
| 2.12 | **Restart policies consistent.** All `restart: unless-stopped`. | Positive | All services |
| 2.13 | **Monitoring compose uses relative bind mounts.** `../../monitoring/prometheus/prometheus.yml:...` (`compose/monitoring/docker-compose.yml:18, 34, 54`). This requires the compose file to be run with the correct working directory. Fragile if the deploy mechanism changes (e.g. SSH to a different path). | Low | `compose/monitoring/docker-compose.yml:18,34,54` |
| 2.14 | **Alloy mounts `docker.sock` read-only.** Correct, but the filter (`coolify.projectName=beskid`) means it only scrapes Coolify-labelled containers — see 1.4. | Medium | `compose/monitoring/docker-compose.yml:55`; `monitoring/alloy/config.alloy:13` |

### 3. Secrets Management

**Severity: Low (strongest area) — but the sync script's final step is Coolify-coupled.**

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 3.1 | **OpenBao KV v2 layout is clean and lane-scoped.** `secret/beskid/{production,staging}/{service}` with per-service key tables in `docs/openbao-layout.md`. CI sync reads only the services listed in `coolify-*.json` `openbao_services`. Fail-closed: missing required keys abort the deploy. | Positive | `docs/openbao-layout.md`, `scripts/ci/sync-runtime-env.sh:33-42` |
| 3.2 | **The sync script's final step is a Coolify API PATCH.** `sync-runtime-env.sh:64-69` does `PATCH /api/v1/services/{uuid}/envs/bulk`. Without Coolify, this step is dead. The *merge* logic (lines 31-60: static_env + per-service OpenBao + COMPOSE_PROFILES + traceparent) is reusable and should be repurposed to render an `env_file` or `.env` on the host via SSH. | High | `scripts/ci/sync-runtime-env.sh:31-69` |
| 3.3 | **`configure-external-openbao.sh` seeds `GITHUB_REPO_NAME=beskid_normative_spec` but compose defaults to `beskid`.** The OpenBao seed (line 175-177) sets `GITHUB_REPO_NAME=beskid_normative_spec` for platform-spec, but `compose/production/docker-compose.yml:76` defaults `GITHUB_REPO_NAME` to `beskid`. At runtime the OpenBao value wins (sync merges over static_env), but the compose default is misleading and would be wrong if OpenBao were ever empty. | Medium | `scripts/configure-external-openbao.sh:175-177`; `compose/production/docker-compose.yml:76` |
| 3.4 | **`AUTH_HUB_SECRET` is set in compose but documented as deprecated.** `compose/production/docker-compose.yml:29` sets `AUTH_HUB_SECRET`, and `docs/deploy-matrix.md:75` says "Deprecated: `AUTH_HUB_SECRET` (legacy shared handoff). New deployments use per-app service tokens from pairing." Stale env var still wired. | Low | `compose/production/docker-compose.yml:29`; `docs/deploy-matrix.md:75` |
| 3.5 | **Local `.env` and `openbao-secrets.env` contain real secrets.** `beskid_infra/.env` (gitignored, present locally) has a real `COOLIFY_API_TOKEN`, `OPENBAO_TOKEN`, and `OPENBAO_UNSEAL_KEY` in plaintext. The unseal key living next to the token in a flat file is a hygiene risk (unseal keys should be split / stored separately). Not committed (verified `git ls-files` returns nothing), but the pattern is fragile. | Medium | `beskid_infra/.env:5,13,14` (local, gitignored) |
| 3.6 | **OpenBao is a single external instance.** `https://secrets.bdziam.dev` is the only secrets endpoint. If it is down, no deploy can sync env. No HA, no documented fallback. | Medium | `beskid_infra/.env:12`; `docs/openbao-layout.md:3` |
| 3.7 | **Per-service `SESSION_SECRET` is correctly distinct.** `configure-external-openbao.sh:65-69` generates independent `SESSION_SECRET` values for auth, tracker, nexus, platform-spec. `docs/deploy-matrix.md:71` documents this. Good practice. | Positive | `scripts/configure-external-openbao.sh:65-69` |

### 4. Monitoring

**Severity: High — the stack is well-designed but Coolify-coupled and incomplete.**

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 4.1 | **Alloy discovery is Coolify-label-coupled (see 1.4).** This is the critical monitoring finding. Removing Coolify breaks all metric scraping and log shipping unless the Alloy config is rewritten to use Docker labels applied by the new compose (e.g. `beskid.scrape=true`, `beskid.service=auth`, `beskid.port=8090`) or a static scrape config. | Critical | `monitoring/alloy/config.alloy:9-15, 21-38, 93-120` |
| 4.2 | **Prometheus has empty `scrape_configs`.** `monitoring/prometheus/prometheus.yml:7` is `scrape_configs: []`. All scraping is via Alloy remote_write. This is fine, but means the Prometheus config is useless without Alloy — single point of failure in the scrape path. | Medium | `monitoring/prometheus/prometheus.yml:7` |
| 4.3 | **Grafana is not in the monitoring compose.** It is a separate Coolify service with a manual provisioning patch (`compose/monitoring/grafana-provisioning.patch.yml`). The patch file is documentation, not executable compose. Grafana's Postgres backend uses `SERVICE_USER_POSTGRES` / `SERVICE_PASSWORD_POSTGRES` (lines 21-22) — Coolify-injected service variables that do not exist in the Beskid compose. Grafana will not start under plain Compose without re-adding these. | High | `compose/monitoring/grafana-provisioning.patch.yml:14-23`; `config/coolify-monitoring-observability.json:5` |
| 4.4 | **Only one dashboard, no alerting.** `monitoring/grafana/dashboards/beskid-platform-overview.json` is the only dashboard (request rate, 5xx ratio, p95, up targets, error logs). No alert rules, no notification channels. The platform has observability but no one is paged when it breaks. | Medium | `monitoring/grafana/dashboards/` (1 file) |
| 4.5 | **Dashboard queries assume `http_requests_total` and `http_request_duration_seconds_bucket` metrics.** If any service does not emit these standard Prometheus metrics, its panels are blank. No evidence in infra that all services emit these (would need to check each app). The Alloy config drops `site` and `postgres` from scraping (line 43-45), so site has no metrics by design. | Low | `monitoring/grafana/dashboards/beskid-platform-overview.json:26,48,68`; `monitoring/alloy/config.alloy:43-45` |
| 4.6 | **Loki retention 720h (30d), Prometheus retention 30d.** Consistent. Loki uses filesystem storage with `replication_factor: 1` — no HA, single host. | Low | `monitoring/loki/loki-config.yml:28`; `compose/monitoring/docker-compose.yml:13` |
| 4.7 | **`/metrics` is not exposed publicly (correct).** Alloy reaches containers via Docker network IPs. `docs/observability.md:14` documents this. Caddy migration must preserve: no `/metrics` route on public domains. | Positive | `docs/observability.md:14, 82-83` |

### 5. CI/CD

**Severity: Low (strongest area) — the pipeline is excellent; only the deploy tail is Coolify-coupled.**

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 5.1 | **`reusable-image.yml` is a high-quality build gate.** Digest-pinned output, SBOM + provenance (`provenance: mode=min`, `sbom: true`), keyless cosign signing, Trivy scan (non-blocking SARIF), optional health probe of the published image, `continue-on-error` for optional lanes. GHCR auth uses `secrets.GHCR_TOKEN \|\| github.token` with a clear comment explaining scope (lines 110-119). | Positive | `.github/workflows/reusable-image.yml:106-145, 181-213` |
| 5.2 | **Delivery is decoupled from quality gates.** `platform-delivery.yml:96-99` comment: images push regardless of gate results; gates run in parallel as branch-protection. The manifest job (line 272-301) requires all image lanes + (gates OR `unstable`). This means a flaky gate does not block artifact production, but a failed image lane does. Good design. | Positive | `.github/workflows/platform-delivery.yml:96-99, 272-301` |
| 5.3 | **`render-release-compose.sh` hard-fails on mutable Beskid image refs.** Line 122: `rg -n 'ghcr\.io/cyber-nomad-collective/beskid-[^@[:space:]]+:'` — any Beskid image not pinned to `@sha256:` fails the render. Core services with undelivered images hard-error; optional (profile-gated) services are dropped. Excellent immutability enforcement. | Positive | `scripts/ci/render-release-compose.sh:54-69, 122-125` |
| 5.4 | **`deploy-release-manifest.sh` is Coolify-REST end-to-end.** 340 lines, almost all Coolify API. The rollback path (lines 291-306) re-patches the previous base64 compose payload and re-polls. This is the entire deploy tail that must be rewritten for SSH+Compose. The good news: the new script is ~30 lines (`ssh host 'cd /opt/beskid && docker compose up -d --wait'`). | High | `scripts/ci/deploy-release-manifest.sh:104-340` |
| 5.5 | **Smoke checks are canonical and trace-correlated.** `post-deploy-smoke.sh` derives endpoints from `domains.json`, requires `BESKID_SMOKE_URLS` to *exactly* match canonical URLs if set (lines 72-78), sends `traceparent` header, and special-cases `/document.txt` content-type. Strong. | Positive | `scripts/ci/post-deploy-smoke.sh:41-78, 80-112` |
| 5.6 | **Staging auto-applies on green main; production requires staging success + approval.** `platform-delivery.yml:305-339`. Production job (line 324) `needs: [manifest, staging]` and `apply: true`. Promotes the *same* manifest, never rebuilds. Correct progressive delivery. | Positive | `.github/workflows/platform-delivery.yml:305-339` |
| 5.7 | **`reusable-promote.yml` validates promotion source for production.** Lines 80-91: fetches the workflow run JSON and runs `validate-promotion-source.sh` to ensure the manifest came from a main-branch run. Prevents promoting a PR-built manifest. | Positive | `.github/workflows/reusable-promote.yml:80-91` |
| 5.8 | **No Dagger gates in `beskid_infra/dagger/`.** `AGENTS.md` says "other gates in `beskid_infra/dagger/`", but the directory does not exist. The compiler gate runs via Blacksmith Testbox (`compiler-gate-testbox.yml`), and other gates are shell scripts in `scripts/ci/`. Documentation drift, not a functional issue. | Low | `AGENTS.md` (Toolchain section); `beskid_infra/dagger/` absent |

### 6. Networking

**Severity: High — domain routing is Coolify-coupled and the URL scheme is non-standard.**

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 6.1 | **Domains are applied from `domains.json` via Coolify `urls` on deploy.** `deploy-release-manifest.sh:86-102` validates `domains.json`, builds `https://<host>:<port>` URLs, and PATCHes them as Coolify service `urls` (line 115-117). Coolify then routes each URL to the matching compose service. Without Coolify, Caddy must read the same `domains.json` (or a Caddyfile generated from it) and reverse_proxy to container names. | High | `scripts/ci/deploy-release-manifest.sh:86-117`; `config/domains.json` |
| 6.2 | **URLs include explicit ports (`https://auth.beskid-lang.org:8090`).** `domains.json:5-11` and `docs/deploy-matrix.md:22-31`. This is a Coolify pattern (one port per service on the proxy). For Caddy, the public URL should be `https://auth.beskid-lang.org` (443) and Caddy reverse_proxies to the internal container port. Keeping `:8090` in the public URL is user-hostile and breaks cookie origins. **The Caddy migration must drop explicit ports from public URLs.** | High | `config/domains.json:5-11`; `docs/deploy-matrix.md:22-31` |
| 6.3 | **`site` and `learn` use container port 80.** `domains.json:4,7` map them to host port 80. Coolify URL becomes `https://beskid-lang.org:80`. HTTPS on port 80 is unusual; Coolify handles it via its proxy. Caddy should serve these on 443 and proxy to the container's 80. | Medium | `config/domains.json:4,7` |
| 6.4 | **App-facing `*_PUBLIC_URL` env values omit the port (correct).** `AUTH_HUB_PUBLIC_URL=https://auth.beskid-lang.org` (no `:8090`). This is what apps see and what OAuth callbacks use. The port-suffixed URL is only for Coolify routing. This split is a source of drift: the public URL and the Coolify URL differ, and `domains.json` is the only place they meet. | Medium | `config/coolify-production.json:12-16`; `docs/deploy-matrix.md:18` |
| 6.5 | **No DNS / TLS automation documented outside Coolify.** Coolify handles Let's Encrypt. Caddy does this automatically via `tls { automation }` — but the migration must ensure DNS for all subdomains (`auth.`, `spec.`, `tracker.`, `pckg.`, `nexus.`, `learn.`, `monitor.`, `stg-*`) points to the new host before cutover. No runbook for this exists in `docs/`. | Medium | `docs/deploy-compose.md`, `docs/deploy-matrix.md` (no DNS section) |
| 6.6 | **`monitor.beskid-lang.org` Grafana is a separate Coolify service.** Not part of the platform compose. Its TLS/routing is independent. Caddy migration should fold Grafana into the monitoring compose and route it via Caddy like everything else. | Medium | `config/coolify-monitoring-observability.json:4-5`; `compose/monitoring/grafana-provisioning.patch.yml` |

### 7. Drift & Anti-patterns

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| 7.1 | **`OTEL_RESOURCE_ATTRIBUTES` label name is inconsistent.** `coolify-production.json:16` sets `deployment.environment.name=production` but `compose/production/docker-compose.yml:184` defaults to `deployment.environment=production`. Different label keys. The Coolify static_env wins at runtime (sync merges over compose defaults), so production gets `.name=production`, but a local `docker compose up` without Coolify gets `deployment.environment=production`. Metrics label drift between local and prod. | Medium | `config/coolify-production.json:16`; `compose/production/docker-compose.yml:184` |
| 7.2 | **Public URLs are duplicated in three places.** `AUTH_HUB_PUBLIC_URL` appears in `coolify-production.json:12` (static_env), `domains.json:13` (public_urls), and `compose/production/docker-compose.yml:27` (env default). Three sources of truth for one value. The sync merges them (static_env wins), but editing one without the others causes drift. | Medium | `config/coolify-production.json:12`; `config/domains.json:13`; `compose/production/docker-compose.yml:27` |
| 7.3 | **Staging has no compose file — only a README.** `compose/staging/` contains only `README.md` pointing at the production template. CI renders staging by changing the project name (`deploy-release-manifest.sh:34-38`). Good DRY, but means no per-lane compose overrides (e.g. staging cannot have different resource limits or a debug sidecar). | Low | `compose/staging/README.md`; `scripts/ci/deploy-release-manifest.sh:34-38` |
| 7.4 | **`coolify-production.json` and `coolify-staging.json` are structurally identical.** Same keys, only UUIDs/profiles/URLs differ. The structure is duplicated; a single template with lane overrides would be DRYer. | Low | `config/coolify-production.json`, `config/coolify-staging.json` |
| 7.5 | **`production.tfvars` is stale legacy.** References a Terraform-managed Coolify flow (`enable_services`, `manage_environment`) that no longer exists. Gitignored but present. Should be deleted or replaced with a doc noting the move to Compose. | Low | `config/production.tfvars:10-17` |
| 7.6 | **`learn` README says "domain is applied by the configured Coolify lane" but `domains.json` has learn.** `compose/production/README.md:14,29` says learn's domain is applied by the lane, implying it is not in the standard table. But `domains.json:7,23` includes learn with host+port, and `post-deploy-smoke.sh:46,60` includes learn in canonical smoke URLs. Doc drift. | Low | `compose/production/README.md:14,29`; `config/domains.json:7,23` |
| 7.7 | **Single host, no HA anywhere.** One Coolify server (`coolify.snapshot.json:6-9`), one OpenBao, one Memgraph, one Postgres, one Prometheus, one Loki. Every component is a single point of failure. Acceptable for the current scale, but the Caddy migration should at least document this as a known limitation rather than carry it forward silently. | Medium | `config/coolify.snapshot.json:6-9`; `docs/observability.md` |
| 7.8 | **No backup strategy documented.** Eight named volumes (`compose/production/docker-compose.yml:209-217`) plus three monitoring volumes. No `docs/` page on backup/restore. SQLite (auth, tracker), Memgraph data, Postgres data, and Grafana data are all unbacked-up as far as the repo documents. | High | `compose/production/docker-compose.yml:209-217`; `docs/` (no backup page) |
| 7.9 | **Commented shell-template/Authelia block is 70+ lines of dead code.** `compose/production/docker-compose.yml:219-309` is a commented-out future service with Authelia OIDC. It is valuable design documentation, but living in the production compose as a comment makes the file harder to scan and risks someone uncommenting it without the required human admin steps. Should be a separate doc. | Low | `compose/production/docker-compose.yml:219-309` |
| 7.10 | **`scripts/lib/deploy-lane.sh` is a near-no-op.** Two functions, one echoes "production", the other maps lane names. Could be inlined or removed. | Low | `beskid_infra/scripts/lib/deploy-lane.sh` |

---

## Recommendations for Caddy Migration

Prioritized by severity. Each item maps to a finding above.

### Must fix (Critical/High)

1. **Rewrite `deploy-release-manifest.sh` for SSH + Compose.** Replace the Coolify REST flow (PATCH compose, GET /deploy, poll /deployments, rollback by re-patch) with: `scp` rendered compose + env file to host, `ssh host 'docker compose up -d --wait --remove-orphans'`, poll healthchecks via `docker inspect`, rollback by `git revert`-style previous compose restore. Keep `render-release-compose.sh` and `post-deploy-smoke.sh` as-is — they are Coolify-independent. *(Fixes 1.3, 5.4)*
2. **Rewrite `sync-runtime-env.sh` to emit an env_file instead of a Coolify PATCH.** Keep the merge logic (lines 31-60: static_env + OpenBao per-service + COMPOSE_PROFILES + traceparent), but write the result to a `.env` file shipped to the host (or rendered into the compose `env_file:`). The Coolify PATCH (lines 64-69) becomes dead code. *(Fixes 1.2, 3.2)*
3. **Rewrite Alloy discovery to not depend on Coolify labels.** Replace `coolify.projectName=beskid` filter with a Beskid-defined Docker label (e.g. `beskid.scrape=true`) applied in the new compose. Replace `coolify_serviceName`/`coolify_resourceName`/`coolify_projectName`/`coolify_environmentName` label reads with `beskid.service`/`beskid.environment`. Alternatively, use a static `scrape_configs` block in `prometheus.yml` listing each service by DNS name — simpler and more robust. *(Fixes 1.4, 4.1)*
4. **Fold Grafana into `compose/monitoring/docker-compose.yml`.** Remove the separate Coolify Grafana service. Add a `grafana` service to the monitoring compose with the provisioning mounts from `grafana-provisioning.patch.yml` inlined. Replace `SERVICE_USER_POSTGRES`/`SERVICE_PASSWORD_POSTGRES` (Coolify-injected) with a real Grafana Postgres (or SQLite file) config from OpenBao/env. *(Fixes 1.5, 4.3, 6.6)*
5. **Drop explicit ports from public URLs.** Caddyfile should be `auth.beskid-lang.org { reverse_proxy auth:8090 }` — public URL is `https://auth.beskid-lang.org` (443), not `:8090`. Update `domains.json` to separate `public_host` (no port) from `container_port` (internal). Update `post-deploy-smoke.sh` to probe `https://auth.beskid-lang.org/api/v1/health` without `:8090`. *(Fixes 6.2, 6.3, 6.4)*
6. **Add network isolation.** Define at least two networks in the compose: `edge` (Caddy + public apps) and `data` (Memgraph, Postgres, and the apps that need them). Only Caddy touches `edge`; only data-store clients touch `data`. Memgraph and Postgres should not be reachable from site/learn. *(Fixes 2.1, 2.6)*
7. **Digest-pin all third-party images.** Pin `memgraph/memgraph-mage`, `postgres:16`, `prom/prometheus`, `grafana/loki`, `grafana/alloy`, `grafana/grafana-oss` to `@sha256:…`. Add a CI check that fails if any image in the compose is not digest-pinned (extend `render-release-compose.sh` or add a new gate). *(Fixes 2.2, 2.3)*
8. **Add resource limits and log rotation.** Add `deploy.resources.limits` (memory/cpu) to every service. Add `logging: { driver: json-file, options: { max-size: "10m", max-file: "3" } }` at the top level or per service. *(Fixes 2.4, 2.5)*
9. **Add Memgraph auth.** Set `MEMGRAPH_AUTH=true` env and a `MEMGRAPH_USERNAME`/`MEMGRAPH_PASSWORD` from OpenBao. Update platform-spec `MEMGRAPH_URI` to include credentials. *(Fixes 2.6)*
10. **Document and automate backups.** At minimum, a cron + `docker run --volumes-from` tar of `auth-data`, `tracker-data`, `memgraph-data`, `pckg_pg_data`, `platform-spec-data` to off-host storage (S3/B2). `pg_dump` for Postgres. Document restore in `docs/`. *(Fixes 7.8)*

### Should fix (Medium)

11. **Decouple Postgres from the `pckg` profile.** Make `postgres` a core service (no profile) or move it to a `data` profile that is always enabled. Future services (Authelia) can then share it. *(Fixes 2.7)*
12. **Consolidate public URLs to one source of truth.** `domains.json` should be the only place public URLs are defined; `coolify-*.json` `static_env` and compose env defaults should derive from it (or be removed). Generate `static_env` from `domains.json` in CI. *(Fixes 7.2, 7.4)*
13. **Fix `OTEL_RESOURCE_ATTRIBUTES` label consistency.** Pick one key (`deployment.environment.name` is the OTel-semconv-correct one) and use it in both compose defaults and `coolify-*.json`. *(Fixes 7.1)*
14. **Fix `GITHUB_REPO_NAME` default in compose.** Default to `beskid_normative_spec` for platform-spec (matching the OpenBao seed), or remove the default and require it from OpenBao. *(Fixes 3.3)*
15. **Remove `AUTH_HUB_SECRET` from compose.** It is deprecated; remove the env line and the OpenBao key. *(Fixes 3.4)*
16. **Add alerting.** At least: `up{project="beskid"} == 0` for >2m, 5xx ratio >5% for >5m, Prometheus/Loki/Alloy `up == 0`. Alertmanager or Grafana contact points to a real channel. *(Fixes 4.4)*
17. **Delete `production.tfvars` or replace with a doc.** It references a dead Terraform flow. *(Fixes 7.5)*
18. **Move the commented shell-template/Authelia block to a doc.** Keep `compose/production/docker-compose.yml` scannable. *(Fixes 7.9)*
19. **Add a DNS cutover runbook.** Document the order: lower TTL, add Caddy, verify certs, switch DNS, monitor. *(Fixes 6.5)*

### Nice to have (Low)

20. **Add `depends_on: auth` (service_healthy) to `learn`.** Even though it uses the public URL, the healthcheck will be more reliable. *(Fixes 2.9)*
21. **Fix `learn` doc drift in `compose/production/README.md`.** *(Fixes 7.6)*
22. **Inline or delete `scripts/lib/deploy-lane.sh`.** *(Fixes 7.10)*
23. **Document single-host HA limitation in `docs/`.** *(Fixes 7.7)*
24. **Move the local `OPENBAO_UNSEAL_KEY` out of `.env`.** Store unseal keys separately from the token (e.g. in a password manager or split across operators). *(Fixes 3.5)*

---

## What to Preserve

The current setup gets several things right that the Caddy migration must keep:

1. **Manifest-driven digest pinning.** `platform-delivery.yml` → `reusable-image.yml` → `reusable-release-manifest.yml` → `render-release-compose.sh` is an excellent build-once, promote-by-digest pipeline. Keep it entirely. Only the deploy tail (`deploy-release-manifest.sh`) changes. *(5.1, 5.2, 5.3)*
2. **OpenBao KV v2 lane-scoped secrets.** The `secret/beskid/{lane}/{service}` layout, fail-closed sync, and per-service `SESSION_SECRET` are correct. Keep the layout and the merge logic; only the final delivery target changes (env_file instead of Coolify API). *(3.1, 3.7)*
3. **Healthchecks on every service.** Universal, with sensible intervals and start periods. Keep all healthcheck blocks as-is. *(2.10)*
4. **`expose:`-only, no `ports:`.** Correct for a reverse-proxy fronted deployment. Caddy uses the same pattern. *(2.11)*
5. **`restart: unless-stopped` everywhere.** Consistent and correct. *(2.12)*
6. **Progressive delivery: staging auto-applies on green main, production requires staging success + approval.** Keep this gate sequence. *(5.6, 5.7)*
7. **Canonical, trace-correlated smoke checks.** `post-deploy-smoke.sh` deriving endpoints from `domains.json` and sending `traceparent` is strong. Keep it; only the URL format changes (drop `:port`). *(5.5)*
8. **`/metrics` not exposed publicly.** Alloy reaches containers via Docker network IPs. Preserve this in Caddy (no `/metrics` route). *(4.7)*
9. **Immutability enforcement in render.** `render-release-compose.sh` hard-fails on mutable Beskid image refs and on undelivered core images. Keep this gate. *(5.3)*
10. **GHCR auth pattern.** `secrets.GHCR_TOKEN || github.token` with the documented scope caveat. Do not re-add or weaken. *(5.1)*
11. **OpenBao seed script.** `configure-external-openbao.sh` generates distinct session secrets and sensible per-service defaults. Reusable as-is. *(3.7)*
12. **Lane isolation via separate project names + volumes + OpenBao prefixes.** Staging and production share a template but isolate state. Keep this. *(7.3)*

---

## Audit metadata

- **Scope:** `beskid_infra/` (submodule), root `.github/workflows/`, `scripts/ci/`
- **Method:** File reads only; no code modified, no network calls, no secrets accessed.
- **Key files inspected:** `compose/production/docker-compose.yml` (310 lines), `compose/monitoring/docker-compose.yml` (73 lines), `compose/monitoring/grafana-provisioning.patch.yml`, `config/coolify-{production,staging,monitoring-observability,snapshot}.json`, `config/domains.json`, `monitoring/alloy/config.alloy`, `monitoring/prometheus/prometheus.yml`, `monitoring/loki/loki-config.yml`, `monitoring/grafana/dashboards/beskid-platform-overview.json`, `scripts/ci/{sync-runtime-env,deploy-release-manifest,render-release-compose,post-deploy-smoke,coolify-diagnostics}.sh`, `scripts/configure-external-openbao.sh`, `.github/workflows/{reusable-image,reusable-promote,platform-delivery,coolify-diagnostics,tracker-platform-delivery}.yml`, `docs/{deploy-compose,deploy-matrix,observability,openbao-layout}.md`, `ansible/roles/coolify_host/`
- **Findings:** 7 categories, 50 findings (5 critical/high blockers, 18 medium, 27 low/positive)
- **Output:** This document at `beskid_sites/_planning/infra-audit.md`
