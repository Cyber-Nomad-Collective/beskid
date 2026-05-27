# GHCR delivery plan: viability and rollout

This document is the definitive reference for migrating from Coolify server-side builds to GHCR-pulled container images. It replaces ad-hoc submodule patches and documents why the current approach is structurally broken.

## Current state: what's broken

Two unrelated pipelines produce the same artifacts, but they never meet:

```
GitHub Actions (beskid)          Coolify VPS (per app)
─────────────────────            ─────────────────────
docs-site.yml ──► green ✓        git clone + shallow submodules
runtime-ci.yml                   docker compose build on server
publish-open-vsx.yml             NODE_AUTH_TOKEN + env in Coolify UI
           │
           ▼
  "CI is green"       ──✕──►    Production URLs
  (no artifact handoff)
```

Green CI **does not mean deployment works**. Recent `main` history confirms this: submodule pointer fixes, `active = false` in `.gitmodules`, pckg SHA reachability patches, and `COOLIFY.md` edits are all symptoms of building on the wrong machine with the wrong git graph.

### Why Coolify deploys fail while CI passes

| Pain point | CI (GHA) | Coolify VPS | Root cause |
|------------|----------|-------------|------------|
| Clone semantics | `fetch-depth: 0`, init only `beskid_web_common` with `--depth 1` | `git clone --recurse-submodules --shallow-submodules` touches every gitlink, including `active = false` entries | Different clone strategies |
| Build context | Superrepo root + `.git` for platform-spec git-meta | Shallow clone breaks `git log --follow` | Depth mismatch |
| Secrets | GitHub Secrets (per-workflow) | Coolify UI + `NODE_AUTH_TOKEN` as build secret on server | Secret sprawl, rotation drift |
| Artifact | "Build succeeded" badge | No promoted artifact — VPS rebuilds from scratch | Verify ≠ deploy |

The last row is the structural bug: **a passing `docs-site.yml` never produces the image production runs**. Coolify rebuilds from a different git graph every time.

## Plan target

```
GitHub Actions (beskid)          Coolify VPS (per app)
─────────────────────            ─────────────────────
docs-site.yml (verify on PR)
container-images.yml ──► GHCR ──► docker compose pull
                                    IMAGE_TAG=main|staging
                                    GHCR pull secret on server
```

CI **builds and pushes**. Coolify **pulls and runs**. No server-side git clone. No server-side `NODE_AUTH_TOKEN`.

## Verification: what works now

| Workflow | Status | Notes |
|----------|--------|-------|
| `docs-site.yml` | Passing | Fetch-depth 0, `beskid_web_common` init only |
| `semgrep.yml` | New | Replaces `security-audits.yml`; 3 jobs: Rust, .NET, TS |
| `container-images.yml` | In progress | Both `beskid-site` and `beskid-auth` had build errors (Dockerfile workspace resolution); fixes pushed in `92a3449` |
| `publish-open-vsx.yml` | Passing | Cross-platform matrix build |
| `pckg-ci.yml` | Active | `dotnet test` unit tests |
| `runtime-ci.yml` | Active | Compiler smoke tests |

### Dockerfile fixes (commit `92a3449`)

Both Dockerfiles were restructured to copy **all source before `bun install`**, rather than the (cache-optimal but broken) pattern of copying package.jsons → install → copy source. The monorepo uses `file:` and `workspace:` dependencies that require source present for Bun to set up proper symlinks and for Vite/Rollup to resolve sub-path exports.

- **`site/website/Dockerfile`**: was failing `Rollup failed to resolve "@cyber-nomad-collective/trudoc/layout"` because `beskid-ui`'s `file:../trudoc` dependency couldn't resolve its `./layout` sub-path export without the full trudoc source present during install.
- **`site/auth/Dockerfile`**: was failing `Tsconfig not found /app/beskid_web_common/tsconfig.base.json` because only individual package directories were copied, missing the root `tsconfig.base.json` that `beskid-ui-react/tsconfig.json` extends via `../../tsconfig.base.json`.

## Phase viability

### High viability — do first

**GHCR workflows in GitHub Actions** (`container-images.yml`)

- Reuses proven patterns from `docs-site.yml`: `fetch-depth: 0`, explicit submodule init, `NODE_AUTH_TOKEN` as build secret, Bun aligned across CI and Docker.
- Pilot scope: `beskid-site` + `beskid-auth` only (superrepo, shared context) — biggest submodule pain, highest deploy frequency.
- Tags: `main`, `staging`, `sha-<short>` per service.
- Immediate win without OpenTofu: push images on main; manually point Coolify apps at `ghcr.io/.../:main`; remove server-side `build:` blocks and `NODE_AUTH_TOKEN` build secrets entirely for those apps.

**Compose contract preserved** — keep healthchecks, ports, volumes in repo compose files; swap `build:` → `image: ghcr.io/cyber-nomad-collective/...:${IMAGE_TAG}`.

### Medium viability — needed for full platform

**Staging branch + Coolify environment**

- `staging` branch does not exist yet; must be created and protected like `main`.
- Staging secrets/DB/OAuth must be isolated (see [staging-environment.md](staging-environment.md)).
- OAuth: separate GitHub app or extra callback URLs — operational decision before staging is useful.

**Satellite GHCR** (tracker, nexus, pckg)

- Dockerfiles and COOLIFY docs exist; missing piece is per-repo `container-images.yml`.
- `pckg` is the hardest: Postgres in compose, EF migrations, staging DB volume.

**Merge docs-site verify + container push**

- Sensible end state; start as parallel workflows (verify on PR, push on main/staging) to avoid blocking image publish on unrelated path filters.

### Lower viability / highest risk — defer or pilot

**OpenTofu + SierraJC/coolify provider**

- Plan correctly flags partial provider coverage; recommends auth app pilot + `tofu import`.
- Empty `beskid_infra` + new OpenBao cluster = weeks of ops, not days.
- Fallback that delivers 80% of value: GHCR + documented Coolify image tags + secrets stay in Coolify UI until OpenBao/tofu is stable.

**OpenBao**

- Right long-term model for 5 services × 2 environments.
- Blocker for CI apply: GitHub Environment OIDC → OpenBao auth must be designed and hosted before `tofu apply` in Actions is safe.
- Until then: GitHub Secrets for `NODE_AUTH_TOKEN` + manual/env-file bootstrap for Coolify API token is fine.

## Comparison: fix current CI/CD vs this plan

| Approach | Fixes deploy? | Fixes secret sprawl? | Effort |
|----------|---------------|----------------------|--------|
| More COOLIFY.md + submodule tweaks (current trajectory) | Partial, recurring | No | Low, unbounded |
| GHCR only, Coolify still click-ops | Yes (main pain) | No | Medium |
| Full plan (GHCR + OpenBao + beskid_infra) | Yes | Yes | High |

Continuing doc-only fixes does not remove the verify ≠ deploy split. Recent `main` commits (submodule `active = false`, pckg pointer, COOLIFY wording) are symptoms of building on the wrong machine with the wrong git graph.

## Recommended phasing

```
Phase 1 ──► Phase 2 ──► Phase 3 ──► Phase 4 ──► Phase 5
GHCR         Coolify       staging       satellites    OpenTofu
site+auth    pull-only     branch+env    +pckg DB      OpenBao
                                         (optional)
```

### Phase 1: GHCR for site + auth (now)

- [x] `.github/workflows/container-images.yml` — builds and pushes `beskid-site` and `beskid-auth` on push to `main`/`staging`
- [x] `site/docker-compose.yml` — GHCR image pull, defaults to `IMAGE_TAG=main`
- [x] `site/auth/docker-compose.yml` — GHCR image pull, defaults to `IMAGE_TAG=main`
- [x] `site/docker-compose.build.yml` — local build-based compose (preserved)
- [x] `site/auth/docker-compose.build.yml` — local build-based compose (preserved)
- [x] Dockerfile fixes for workspace resolution
- [x] `.dockerignore` — exclude unused submodules from Docker context
- [x] Semgrep SAST replacing per-ecosystem security-audits (`semgrep.yml`)
- [x] GHCR packages verified — `beskid-site:main` and `beskid-auth:main` pushed
- [x] First successful image push to GHCR

### Phase 2: Coolify image pull

- [ ] Register GHCR pull credentials on Coolify server (PAT with `read:packages`)
- [x] `docker-compose.yml` files are now GHCR-based — Coolify picks them up on next git pull
- [ ] Redeploy `beskid-site` Coolify app to pull `ghcr.io/cyber-nomad-collective/beskid-site:main`
- [ ] Remove `NODE_AUTH_TOKEN` build secret from Coolify for site/auth (now in GHA only)
- [ ] Verify production URLs after switch

### Phase 3: Staging environment

- [ ] Create `staging` branch from `main`
- [ ] Protect `staging` in GitHub (require PR or restrict push)
- [ ] Create Coolify `staging` environment (separate from `production`)
- [ ] Isolate staging data: separate volumes, separate OAuth app, separate `SESSION_SECRET`
- [ ] Set `IMAGE_TAG=staging` on staging apps

### Phase 4: Satellite images

- [ ] `beskid_tracker` — per-repo `container-images.yml` + Coolify pull
- [ ] `beskid_nexus` — per-repo `container-images.yml` + Coolify pull
- [ ] `beskid_pckg` — per-repo `container-images.yml` + Coolify pull (Postgres + EF migrations)
- [ ] Staging DB isolation for pckg

### Phase 5: OpenTofu + OpenBao

- [x] `beskid_infra` scaffolded with `coolify_image_app` module
- [x] Production and staging environments defined in OpenTofu
- [x] CI: `.github/workflows/tofu-plan-apply.yml` in `beskid_infra`
- [x] OpenBao KV paths documented for all services × environments (see [beskid_infra/docs/openbao-layout.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/openbao-layout.md))
- [x] Bootstrap guide: [beskid_infra/docs/bootstrap.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/bootstrap.md)
- [ ] `tofu import` existing Coolify resources (project, server, site app)
- [ ] `tofu apply` to create `beskid-auth` app
- [ ] Populate OpenBao with production secrets
- [ ] Move Terraform state to remote backend

## CI ownership

| Scope | Responsible | Tooling |
|-------|-------------|---------|
| Verify (lint, test, audit) | GitHub Actions (`beskid`) | `docs-site.yml`, `semgrep.yml`, `pckg-ci.yml` |
| Build + push images | GitHub Actions (`beskid`) | `container-images.yml` → GHCR |
| **Infrastructure (apps, env)** | **OpenTofu** (`beskid_infra`) | `tofu-plan-apply.yml` → Coolify provider |
| Runtime deploy | Coolify | Pull `ghcr.io/...:${IMAGE_TAG}`, run compose |
| Secrets (runtime) | OpenBao KV | `beskid_infra` reads at apply time |
| Secrets (CI) | GitHub Secrets | `NODE_AUTH_TOKEN`, `SEMGREP_APP_TOKEN` |

## Related docs

- [site/COOLIFY.md](../site/COOLIFY.md) — site deployment notes
- [site/auth/COOLIFY.md](../site/auth/COOLIFY.md) — auth deployment notes
- [staging-environment.md](staging-environment.md) — staging branch and isolation
- [beskid_infra deploy-matrix](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/deploy-matrix.md)
- [beskid_infra openbao-layout](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/openbao-layout.md)