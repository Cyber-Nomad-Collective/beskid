# Publish Process Migration: GitHub Pipelines → cr.beskid-lang.org

Research and design only. No files were modified to produce this document.

Scope: the **website** image (`ghcr.io/cyber-nomad-collective/beskid-site`) is the
first lane to move out of GitHub Actions into a self-hosted Docker registry at
`cr.beskid-lang.org`, deployed via Caddy + SSH instead of Coolify. The same
shape is intended to absorb the other service lanes (auth, platform-spec,
learn, tracker, nexus, pckg) later.

---

## Current State

### Pipeline orchestrator

`.github/workflows/platform-delivery.yml` is the single entry point. Triggers:

- `pull_request` to `main` (path-filtered, build-only — `push: false`).
- `push` to `main` — builds, pushes, signs, **auto-applies staging**.
- `workflow_dispatch` with inputs `publish`, `unstable`, `apply-staging`.

It runs two decoupled families of jobs in parallel:

1. **Quality gates** (via `reusable-quality.yml`, each running a
   `scripts/ci/*-gate.sh`): `openspec`, `conformance`, `integration`,
   `security`, `shared-ui-nexus`. These are branch-protection checks; they do
   not block delivery (see the `manifest` job `if` below).
2. **Image lanes** (via `reusable-image.yml`): `image-site`, `image-auth`,
   `image-learn`, `image-platform-spec`, `image-tracker`, `image-nexus`,
   `image-pckg`.

### Website image lane (`image-site`)

Defined at `platform-delivery.yml:95-116`:

```yaml
image-site:
  uses: ./.github/workflows/reusable-image.yml
  with:
    name: beskid-site
    repository: ghcr.io/cyber-nomad-collective/beskid-site
    context: .
    dockerfile: site/website/Dockerfile
    build-args: |
      BESKID_RELEASE_CHANNEL=${{ github.event_name == 'workflow_dispatch' && inputs.unstable && 'unstable' || 'stable' }}
    submodules: beskid_web_common
    push: ${{ github.event_name == 'push' || (workflow_dispatch && (publish || apply-staging || unstable)) }}
    sign: <same as push>
  secrets:
    GHCR_TOKEN: ${{ secrets.GHCR_TOKEN }}
```

Note: `image-site` does **not** pass `healthcheck-url` / `healthcheck-port` /
`healthcheck-env` (only `image-tracker` does, at `platform-delivery.yml:209-213`).
So the website image is published without a workflow-level container start
probe; readiness is only checked later by the Coolify deploy poller and the
post-deploy smoke script.

### `reusable-image.yml` — the shared build/push workflow

`.github/workflows/reusable-image.yml` runs on
`blacksmith-4vcpu-ubuntu-2404` (`runs-on:`), 45 min timeout. Steps in order:

1. `actions/checkout@v7` with `fetch-depth: 0`.
2. **Initialize image submodule** — `./scripts/ci/init-submodules.sh` for each
   space-separated `inputs.submodules` (website lane passes `beskid_web_common`).
3. **Log in to GHCR** (only when `push: true`) — `docker/login-action@v4`
   against `ghcr.io`, username `${{ github.actor }}`, password
   `${{ secrets.GHCR_TOKEN || github.token }}`. The comment block
   (`reusable-image.yml:111-119`) is load-bearing: the job `GITHUB_TOKEN` has
   `packages: write` for this repo; `GHCR_TOKEN` is only needed when a package
   is linked to a sibling repo (the `beskid-pckg` case). The releases PAT
   (`DISTRIB_GH_PAT`) is deliberately **not** usable here — it lacks
   `write:packages`.
4. **Setup Blacksmith builder** — `useblacksmith/setup-docker-builder@v1`.
5. **Build immutable image** (`build-push-action@v2`, `continue-on-error` only
   for `optional && push` lanes — website is not optional):
   - `context: .` (superrepo root), `file: site/website/Dockerfile`.
   - `tags: <repository>:sha-${{ github.sha }}` — single SHA tag, no `latest`,
     no channel tag.
   - `provenance: mode=min`, `sbom: true`.
   - `push` gated by the lane's push expression.
6. **Require immutable digest** — bash regex `^sha256:[0-9a-f]{64}$` on
   `steps.build.outputs.digest`. Hard-fails if the builder did not return a
   digest.
7. **Probe published image health** — skipped for the website lane (no
   `healthcheck-url`).
8. **Scan immutable image for vulnerabilities** — `trivy-action@v0.36.0`,
   `severity: HIGH,CRITICAL`, `ignore-unfixed: true`, **`exit-code: '0'`**
   (report-only, `continue-on-error: true`). Output: `trivy-<name>.sarif`.
9. **Upload vulnerability report** — `actions/upload-artifact@v7`, 90-day
   retention, `if-no-files-found: warn`.
10. **Keyless signing** (when `sign: true`) — `sigstore/cosign-installer@v3.10.1`
    then `./scripts/ci/sign-image.sh "<repo>@<digest>"` which runs
    `COSIGN_EXPERIMENTAL=1 cosign sign --yes`.
11. **Write image manifest record** — `jq -n` produces
    `image-record/<name>.json` with `{name, repository, digest, sbom: true,
    provenance: true, vulnerabilities: "passed", signed: <bool>}`.
12. **Upload image manifest record** — `actions/upload-artifact@v7`,
    `name: image-record-<name>`, 90-day retention.

Permissions (`reusable-image.yml:78-82`): `contents: read`, `packages: write`,
`id-token: write` (the last is required for keyless cosign).

### Release manifest

`reusable-release-manifest.yml` (`manifest` job, `platform-delivery.yml:272-303`)
`needs` all five quality gates **and** all seven image lanes. Its `if` requires
every image lane `result == 'success'` AND (on `push`/dispatch) either
`inputs.unstable` or all five quality gates `result == 'success'`. It downloads
all `image-record-*` artifacts, runs `scripts/ci/build-release-manifest.sh` →
`release-manifest.json` + `.sha256`, and validates with
`scripts/ci/validate-release-manifest.sh`.

`validate-release-manifest.sh` enforces `schema_version: 1`, a 40-char commit
SHA, `policy.{sbom,provenance,vulnerability_scan,signature}_required == true`,
unique image names + repositories, and per-image `digest` matching
`^sha256:[0-9a-f]{64}$` with `sbom/provenance/signed == true` and
`vulnerabilities == "passed"`.

### Promotion (Coolify apply)

`reusable-promote.yml` runs the `staging` and `production` jobs
(`platform-delivery.yml:305-339`):

- `staging` `needs: manifest`, auto-applies on `push` to main
  (`apply: ${{ github.event_name == 'push' || ... }}`).
- `production` `needs: [manifest, staging]`, `apply: true`, gated by the
  protected `production` GitHub environment (manual approval).

Both call `scripts/ci/deploy-release-manifest.sh` with
`--lane <staging|production> --manifest release/release-manifest.json
--compose beskid_infra/compose/production/docker-compose.yml
--smoke-script ./scripts/ci/post-deploy-smoke.sh --apply`. Before that,
`scripts/ci/sync-runtime-env.sh <lane> <config>` pushes OpenBao secrets into
the Coolify service env via `PATCH /services/{uuid}/envs/bulk`.

`deploy-release-manifest.sh` flow:

1. `render-release-compose.sh` rewrites every
   `ghcr.io/cyber-nomad-collective/beskid-*` image in the compose template to
   `repo@sha256:<digest>` from the manifest. Core services missing from the
   manifest hard-fail; optional (profile-gated) services not delivered are
   dropped. A final `rg` hard-fails if any mutable `beskid-*:tag` reference
   remains.
2. Reads the previous `docker_compose_raw` from Coolify (for rollback).
3. `PATCH /services/{uuid}` with base64 compose + `urls` from
   `beskid_infra/config/domains.json` (production site:
   `https://beskid-lang.org:80`; staging: `https://stg.beskid-lang.org:80`).
4. `GET /deploy?uuid=...&force=true`, polls the deployment to a terminal
   state, then polls the service until every active release application is
   `running:healthy` with the exact pinned image.
5. `coolify-diagnostics.sh` (evidence only, non-blocking).
6. `post-deploy-smoke.sh <lane>` — canonical HTTPS probes derived from
   `domains.json` (site: `/` and `/document.txt`, expecting HTML and no
   `Content-Disposition: attachment`).
7. On any failure: `rollback()` re-PATCHes the previous compose payload and
   polls the rollback deployment.

### Website Dockerfile

`site/website/Dockerfile` (44 lines, `# syntax=docker/dockerfile:1.7`):

- **Build stage** `node:24-alpine`: installs `git`, activates pnpm 10.17.1 via
  corepack, copies root `package.json`/`pnpm-lock.yaml`/`pnpm-workspace.yaml`/
  `.npmrc` plus per-app `package.json` for `site/{auth,website,platform-spec,
  learn}` and the `beskid_web_common` submodule (required because the lockfile
  has `file:` links into it), `pnpm install --frozen-lockfile`, copies
  `site/website`, `site/platform-spec`, `openspec/`, hard-fails if
  `openspec/catalog.json` is missing/empty, sets
  `BESKID_REQUIRE_OPENSPEC_CATALOG=1`, `NODE_ENV=production`,
  `BESKID_WEBSITE_ROOT=/app/site/website`, `BESKID_RELEASE_CHANNEL` (build
  arg), runs `pnpm --dir site/website sync:release-version` then
  `pnpm --filter beskid-website build`.
- **Runtime stage** `nginx:1.27-alpine`: copies `dist/` to
  `/usr/share/nginx/html`, copies `site/website/nginx/default.conf` (SPA
  fallback + legacy `/corelib`, `/execution`, `/packages`, `/platform-spec/`
  redirects), `EXPOSE 80`, `CMD ["nginx","-g","daemon off;"]`.
- **No `HEALTHCHECK`** in the Dockerfile. The compose healthcheck
  (`wget -q --spider http://127.0.0.1/`, 30s/5s/3 retries/10s start) is what
  Coolify polls.

### Compose references to the website image

- `site/docker-compose.yml` (single-service reference, `IMAGE_TAG`-based):
  `ghcr.io/cyber-nomad-collective/beskid-site:${IMAGE_TAG:-main}`.
- `site/docker-compose.build.yml` (local build-from-source, context `..`).
- `beskid_infra/compose/production/docker-compose.yml` (the Coolify template,
  `site` service): `ghcr.io/cyber-nomad-collective/beskid-site:${BESKID_RELEASE_TAG:?render an immutable release manifest}` — refuses a mutable tag, requires a rendered manifest.

### Secrets and lane config

- OpenBao at `https://secrets.bdziam.dev`, KV v2 paths
  `secret/beskid/{staging,production}/{service}`. Website (`site`) only has
  optional `PUBLIC_GISCUS_*` keys (`openbao-layout.md`); it is **not** in the
  `openbao_services` list of `coolify-{staging,production}.json`, so
  `sync-runtime-env.sh` does not read it.
- Coolify service UUIDs: staging
  `n2faf85soesljo4bng5g1gck` (`coolify-staging.json`), production
  `s4ir1ovgqtubarqeql3gf3pz` (`coolify-production.json`). These are real UUIDs
  checked into the repo; the `openbao-*.env` files are gitignored.
- Domains: `beskid_infra/config/domains.json` — production `site` =
  `{host: "beskid-lang.org", port: 80}`, staging =
  `{host: "stg.beskid-lang.org", port: 80}`.

### Gates that run before push today

For the website lane specifically, the gates that exist on a `push` to main
before the image is published and staging is applied:

- `openspec` — `scripts/ci/openspec-gate.sh`.
- `conformance` — `scripts/ci/conformance-gate.sh`.
- `integration` — `scripts/ci/platform-integration-gate.sh`.
- `security` — `scripts/ci/security-policy-gate.sh`.
- `shared-ui-nexus` — `scripts/ci/shared-ui-nexus-gate.sh`.
- The `manifest` job `if` requires all five to be `success` (unless
  `unstable` is set), plus all seven image lanes `success`.
- The website's own build gate (`scripts/ci/site-build-gate.sh website`) runs
  `pnpm install --frozen-lockfile`, the OpenSpec catalog non-empty check, and
  `BESKID_REQUIRE_OPENSPEC_CATALOG=1 pnpm --dir site/website build`. This gate
  is **not** wired into `platform-delivery.yml` directly; the Docker build
  itself enforces the catalog check (`Dockerfile:25-27`).

### Summary of what GitHub Actions owns today

1. Checkout + submodule init (`beskid_web_common`).
2. GHCR login (`GHCR_TOKEN || github.token`).
3. BuildKit build via Blacksmith, SHA tag, provenance + SBOM.
4. Digest validation, Trivy scan (report-only), cosign keyless sign.
5. Image-record JSON artifact.
6. Manifest aggregation + checksum.
7. OpenBao → Coolify env sync.
8. Compose render (digest-pinned), Coolify PATCH, deploy poll, smoke, rollback.

---

## Target State

A self-hosted Docker registry at `cr.beskid-lang.org` replaces GHCR as the
image store. Caddy replaces Coolify as the TLS proxy + service orchestrator
on the deploy host. SSH replaces the Coolify API as the deploy control plane.

Principles preserved from the current system:

- **Immutable, digest-pinned deploys.** No mutable `:latest` or `:main` tags
  ever reach the deploy host. The deploy unit is `repo@sha256:<digest>`.
- **Build-once, promote-by-digest.** The same image digest moves staging →
  production; production never rebuilds.
- **Gates before push.** The quality gates (openspec, conformance,
  integration, security, shared-ui-nexus) and the website build gate stay
  mandatory before any image is pushed to `cr.beskid-lang.org`.
- **Smoke + rollback.** Post-deploy HTTPS smoke against the canonical lane
  URLs; automatic rollback to the previous pinned image on failure.
- **Fail closed on human-only steps.** Registry credentials, TLS certs, SSH
  keys, and Caddy config are operator-provided; this design does not invent
  them.

What changes:

- **Registry:** `ghcr.io/cyber-nomad-collective/beskid-*` →
  `cr.beskid-lang.org/beskid/*`.
- **Build location:** Blacksmith GitHub runner → a build host (local dev
  machine, a dedicated build VM, or the deploy host itself). The build host
  must have Docker/BuildKit, pnpm, git, and submodule access.
- **Push auth:** GitHub OIDC → GHCR → registry username/password or token to
  `cr.beskid-lang.org`.
- **Deploy trigger:** Coolify API PATCH + `/deploy?force=true` → SSH
  `docker compose pull && docker compose up -d` on the deploy host.
- **TLS/proxy:** Coolify's built-in Traefik → Caddy reverse proxy with
  automatic HTTPS (Let's Encrypt / ZeroSSL).
- **Secrets:** OpenBao stays the source of truth; the deploy host reads from
  it (or receives a rendered `.env` over SSH) instead of Coolify's env bulk
  PATCH.

---

## Registry Setup

### Host and TLS

`cr.beskid-lang.org` is a DNS A record pointing at the registry host. The
registry is the official `registry:2` image (or a distribution/distribution
build). Two viable TLS topologies:

1. **Caddy in front of the registry** (recommended, consistent with the
   Caddy-first direction). Caddy terminates TLS for
   `cr.beskid-lang.org` (auto-HTTPS via Let's Encrypt) and reverse-proxies to
   the registry container on an internal port. The registry itself listens
   on HTTP only inside the Docker network. Caddyfile fragment:

   ```caddyfile
   cr.beskid-lang.org {
       reverse_proxy registry:5000
       # Optional: enforce basic auth here instead of htpasswd in the
       # registry container. See "Authentication" below.
   }
   ```

2. **Registry terminates its own TLS** with certs mounted from a known path.
   More moving parts (cert renewal plumbing); only choose this if the
   registry must run without Caddy in front.

This design assumes option 1 (Caddy in front). The exact Caddyfile, cert
issuer, and registry container compose are **operator steps** — see Open
Questions.

### Authentication

Docker registry auth is HTTP Basic over TLS. Two layers, pick one:

- **htpasswd in the registry container** (`REGISTRY_AUTH=htpasswd`,
  `REGISTRY_AUTH_HTPASSWD_PATH=/auth/htpasswd`,
  `REGISTRY_AUTH_HTPASSWD_REALM=Beskid Registry`). Generate with
  `htpasswd -Bbn <user> > htpasswd`. One push account, one pull account (or a
  single read-write account for the deploy host).
- **Caddy-level basic auth** (`basicauth` directive) in front of the
  registry. Keeps the registry container unauthenticated on the internal
  network; Caddy enforces auth on the public face.

Either way, the credentials live in OpenBao at a new path, e.g.
`secret/beskid/registry/cr-beskid-lang-org` with keys `username` /
`password` (or `htpasswd`). The `.env` on the build host and deploy host
reads these via the same `sync-runtime-env.sh` pattern (extended for the new
secret path) or a small dedicated script. **Do not commit the htpasswd file
or the plaintext password.**

A token-based alternative (registry:2 supports bearer token auth via an
external auth service) is overkill for a single-org registry; basic auth
over TLS is sufficient and matches the fail-closed rule (one human admin
creates the htpasswd entry).

### Image naming

- Repository: `cr.beskid-lang.org/beskid/site` (singular `site`, matching the
  compose service name and the current `beskid-site` GHCR package). Other
  lanes follow the same pattern: `cr.beskid-lang.org/beskid/auth`,
  `.../platform-spec`, `.../learn`, `.../tracker`, `.../nexus`, `.../pckg`.
- Tags: keep the `sha-<git-sha>` convention for traceability, plus the
  immutable digest as the source of truth. No `latest`, no `main`, no
  channel tags. The deploy host always references `repo@sha256:<digest>`.
- Optional: a `staging` / `production` tag is **not** needed because the
  release manifest carries the digest and the deploy script pins it.

### Storage and garbage collection

- Registry data volume (`/var/lib/registry`) on the registry host, backed
  up with the same policy as the OpenBao data.
- `registry garbage-collect /etc/docker/registry/config.yml` on a schedule
  (cron + manual after untagging old digests). Keep at least N digests per
  repository for rollback (e.g. 10).

### Compose reference shape

The deploy-host compose (replacing `beskid_infra/compose/production/docker-compose.yml`
for the website) becomes:

```yaml
services:
  site:
    image: cr.beskid-lang.org/beskid/site@sha256:<digest>
    restart: unless-stopped
    expose:
      - "80"
    healthcheck:
      test: ["CMD-SHELL", "wget -q --spider http://127.0.0.1/ || exit 1"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
```

The `@sha256:<digest>` pin is mandatory; the deploy script refuses to apply
a compose with a mutable `cr.beskid-lang.org/beskid/site:<tag>` reference
(mirror of `render-release-compose.sh`'s final `rg` check).

---

## New Publish Flow

The flow replaces steps 1–8 of "What GitHub Actions owns today" with a
build-host script plus an SSH deploy script. The release manifest stays as
the promotion boundary.

### Step 1 — Build host prerequisites

The build host (local machine or a build VM) must have:

- Docker with BuildKit (`DOCKER_BUILDKIT=1`).
- `pnpm` 10.17.1, `git`, `jq`, `curl`, `cosign` (if signing is kept — see
  Open Questions), `trivy` (if the scan is kept).
- A checkout of the superrepo with submodules (`./scripts/setup-environment.sh`
  or `./scripts/ci/init-submodules.sh beskid_web_common`).
- Registry credentials in env: `CR_BESKID_USER`, `CR_BESKID_PASSWORD` (read
  from OpenBao or a local gitignored `.env`).

### Step 2 — Run gates (mandatory, before push)

Run the same gates the `manifest` job requires, on the build host:

```bash
bash scripts/ci/openspec-gate.sh
bash scripts/ci/conformance-gate.sh
bash scripts/ci/platform-integration-gate.sh
bash scripts/ci/security-policy-gate.sh
bash scripts/ci/shared-ui-nexus-gate.sh
bash scripts/ci/site-build-gate.sh website
```

Any failure stops the publish. This preserves the current "gates before
push" contract. (For the website-only first cut, the integration and
shared-ui-nexus gates may be over-broad; see Open Questions about scoping
gates per lane.)

### Step 3 — Build the image

```bash
DOCKER_BUILDKIT=1 docker build \
  -f site/website/Dockerfile \
  --build-arg BESKID_RELEASE_CHANNEL=stable \
  -t cr.beskid-lang.org/beskid/site:sha-$(git rev-parse HEAD) \
  .
```

Context is the superrepo root (`.`), identical to the GitHub Actions
`context: .`. The `beskid_web_common` submodule must be initialized first.

### Step 4 — Validate digest, scan, sign (mirror `reusable-image.yml`)

```bash
digest=$(docker inspect --format='{{index .RepoDigests 0}}' \
  cr.beskid-lang.org/beskid/site:sha-<sha> | sed 's/.*@//')
[[ "$digest" =~ ^sha256:[0-9a-f]{64}$ ]] || exit 1

# Trivy, report-only (matches exit-code: '0' in the workflow)
trivy image --severity HIGH,CRITICAL --ignore-unfixed \
  --format sarif --output trivy-site.sarif \
  cr.beskid-lang.org/beskid/site@${digest} || true

# Cosign keyless sign — requires id-token, which does not exist outside
# GitHub Actions. See Open Questions: either use a cosign key pair, or drop
# signing for the self-hosted registry first cut.
```

### Step 5 — Push to `cr.beskid-lang.org`

```bash
echo "$CR_BESKID_PASSWORD" | docker login cr.beskid-lang.org \
  -u "$CR_BESKID_USER" --password-stdin
docker push cr.beskid-lang.org/beskid/site:sha-<sha>
```

The push must succeed and the digest recorded. Capture the digest into an
image-record JSON identical to the one `reusable-image.yml` writes:

```json
{
  "name": "beskid-site",
  "repository": "cr.beskid-lang.org/beskid/site",
  "digest": "sha256:...",
  "sbom": true,
  "provenance": true,
  "vulnerabilities": "passed",
  "signed": false
}
```

### Step 6 — Build the release manifest

Reuse `scripts/ci/build-release-manifest.sh image-records release-manifest.json`
and `scripts/ci/validate-release-manifest.sh release-manifest.json`. The
validator currently requires `signed == true` (`validate-release-manifest.sh:28`).
For the first cut without cosign keyless, either:

- relax the validator to allow `signed == false` when a `--allow-unsigned`
  flag is passed (preferred — keeps the schema, makes signing optional), or
- set up a cosign key pair stored in OpenBao and sign with it (see Open
  Questions).

The manifest is the promotion boundary: staging and production both consume
the same manifest, exactly as today.

### Step 7 — Render the deploy-host compose

A new script (or an extension of `render-release-compose.sh`) rewrites the
deploy-host compose template, pinning `cr.beskid-lang.org/beskid/site` to
`repo@sha256:<digest>` from the manifest. The renderer must:

- Hard-fail if a core service image is missing from the manifest.
- Hard-fail if any mutable `cr.beskid-lang.org/beskid/*:<tag>` reference
  remains in the output (mirror the existing `rg` check, retargeted to the
  new registry prefix).
- Drop optional (profile-gated) services not in the manifest.

### Step 8 — SSH deploy

The deploy host runs the rendered compose. The build host (or an operator)
SSHes into the deploy host and runs:

```bash
ssh deploy@<deploy-host> '
  set -euo pipefail
  cd /opt/beskid/<lane>
  # Pull the exact digest before touching the running container.
  docker compose pull site
  # Record the previous image for rollback.
  prev=$(docker inspect --format="{{index .Config.Image}}" beskid-<lane>-site-1 2>/dev/null || true)
  # Apply.
  docker compose up -d --no-deps site
  # Wait for health.
  for i in $(seq 1 30); do
    status=$(docker inspect --format="{{.State.Health.Status}}" beskid-<lane>-site-1 2>/dev/null || echo "")
    [ "$status" = "healthy" ] && break
    sleep 2
  done
  [ "$status" = "healthy" ] || { echo "unhealthy; rolling back"; [ -n "$prev" ] && docker compose up -d --no-deps --force-recreate site; exit 1; }
'
```

The rendered compose is shipped to the deploy host over SSH (scp or a git
pull of a deploy branch). Secrets come from OpenBao: either the deploy host
runs `sync-runtime-env.sh` (retargeted to write a `.env` file instead of
PATCHing Coolify), or the build host renders the `.env` and ships it over
SSH. The website lane needs only `PUBLIC_GISCUS_*` (optional), so the first
cut is trivial; the pattern matters for the later lanes.

### Step 9 — Smoke

Reuse `scripts/ci/post-deploy-smoke.sh <lane>` unchanged. It derives the
canonical URLs from `beskid_infra/config/domains.json` and probes them over
HTTPS. Caddy must be serving `beskid-lang.org` (production) /
`stg.beskid-lang.org` (staging) before this runs. On failure, the SSH deploy
script rolls back to the previous pinned image and re-runs the smoke.

### Step 10 — Rollback

Rollback is local and fast: the deploy host keeps the previous N pinned
images (Docker layer cache + the registry keeps N digests), and the deploy
script re-applies the previous compose. No Coolify API call, no previous
payload read from a remote service. The previous compose file is kept on
the deploy host at `/opt/beskid/<lane>/compose.prev.yml`.

### Trigger model

For the first cut, **manual** is the simplest and safest trigger:

- Operator runs `just publish-website-staging` (a new Justfile target) on the
  build host after a green `main`. This runs gates → build → push → manifest
  → SSH-deploy to staging → smoke.
- Promotion to production is a second manual command
  (`just promote-website-production`) that takes the same manifest and
  SSH-deploys to the production host.

Later, this can be wired to:

- A **webhook** on the registry (registry:2 supports webhook notifications
  on push) that triggers the deploy host to pull and recreate.
- A **cron** on the deploy host that polls the registry for a new
  `sha-<main-sha>` tag and deploys.
- A **GitHub Actions workflow** that only does the SSH deploy (no build,
  no push) — keeping the build off GitHub Actions but retaining the green
  `main` trigger. This is a hybrid option and may be the smoothest
  migration step (see Migration Steps).

---

## Migration Steps

Ordered. Each step is independently shippable and reversible.

### 0. Prerequisites (human admin — fail closed)

- [ ] DNS: `cr.beskid-lang.org` A record → registry host IP.
- [ ] Registry host: `registry:2` container + persistent volume.
- [ ] Caddy on the registry host terminating TLS for
      `cr.beskid-lang.org` (auto-HTTPS) and reverse-proxying to the registry.
- [ ] htpasswd (or Caddy basic auth) with a push account and a pull account.
- [ ] OpenBao path `secret/beskid/registry/cr-beskid-lang-org` populated
      with `username` / `password` (push) and a read-only pull credential.
- [ ] Deploy host(s) for staging and production: Docker, docker compose,
      Caddy serving `stg.beskid-lang.org` / `beskid-lang.org` → the `site`
      container on port 80.
- [ ] SSH key for the build/deploy operator → deploy host `deploy` user.
- [ ] Backup of the current Coolify production compose payload (the
      `docker_compose_raw` Coolify holds) so cutover can fall back to Coolify
      if the new stack misbehaves.

### 1. Stand up the registry and push a test image

- Run the registry + Caddy. Verify `docker login cr.beskid-lang.org` works
  with the OpenBao credentials.
- Build and push a throwaway image (e.g. `hello-world` retagged) to confirm
  push + pull + TLS. Tear it down.

### 2. Add a parallel `cr.beskid-lang.org` image lane (no deploy yet)

- Extend `reusable-image.yml` (or add a sibling `reusable-image-cr.yml`)
  to optionally push to `cr.beskid-lang.org` in addition to GHCR. Keep GHCR
  as the deploy source so Coolify staging/production are untouched.
- This proves the registry push path end-to-end on every green `main`
  without changing the deploy target. Compare digests: the BuildKit build is
  deterministic enough that the `cr.beskid-lang.org` and GHCR digests should
  match for the same SHA + build args (provenance/SBOM aside).

### 3. Add the SSH-deploy script for staging, dark run

- Write `scripts/ci/ssh-deploy.sh <lane> <manifest>` that renders the
  deploy-host compose (retargeted to `cr.beskid-lang.org/beskid/site`) and
  SSH-deploys it to the staging deploy host.
- Run it manually against staging, but **do not point Caddy at the new
  container yet** — keep Coolify serving `stg.beskid-lang.org`. Verify the
  new container starts healthy on the deploy host on a private port.
- Run `post-deploy-smoke.sh staging` against the new container's private
  URL (override `BESKID_SMOKE_URLS` to the deploy host's internal address).

### 4. Cutover staging Caddy → new container

- Flip Caddy on the staging deploy host to reverse-proxy
  `stg.beskid-lang.org` to the new `site` container.
- Run `post-deploy-smoke.sh staging` against the public URL. Soak for 1–3
  days.
- Coolify staging stays warm as the rollback target (its compose still
  points at GHCR). To roll back, repoint Caddy at the Coolify-managed
  container (or just change DNS back if Coolify owns the public IP).

### 5. Cutover production

- Repeat steps 3–4 for production: dark run on the production deploy host,
  then flip Caddy for `beskid-lang.org`.
- Keep the GHCR image lane and the Coolify production service intact for
  one full release cycle as the rollback path.

### 6. Decommission the GHCR website lane and Coolify staging/production site service

- Remove `image-site` from `platform-delivery.yml` (or retarget it to
  `cr.beskid-lang.org` only).
- Remove the `site` service from
  `beskid_infra/compose/production/docker-compose.yml` (it is now deployed
  by the SSH flow, not the Coolify platform stack).
- Delete the Coolify staging/production `site` application once the new
  stack has been stable for a full release cycle.
- Keep the `beskid-site` GHCR package as a read-only historical artifact
  for one cycle, then delete.

### 7. Repeat for the other lanes

- Apply the same shape to `auth`, `platform-spec`, `learn`, `tracker`,
  `nexus`, `pckg`. Each lane adds its own OpenBao secrets to the SSH-deploy
  `.env` rendering. The `pckg` lane has the extra GHCR-package-ownership
  wrinkle (sibling repo `beskid_pckg` owns the GHCR package) — moving to
  `cr.beskid-lang.org` eliminates that wrinkle entirely, since the
  self-hosted registry has no per-repo package ownership.

### Rollback strategy at every step

- **Steps 1–2:** no production impact; rollback = stop pushing to
  `cr.beskid-lang.org`.
- **Steps 3–4 (staging):** repoint Caddy at the Coolify-managed staging
  container; the GHCR image and Coolify service are still live.
- **Step 5 (production):** repoint Caddy at the Coolify-managed production
  container. The Coolify production service and its current `site` application
  remain the fallback for the full release cycle.
- **Step 6:** once Coolify is decommissioned, rollback is the SSH-deploy
  script applying the previous pinned digest (`compose.prev.yml`). This is
  the steady-state rollback path.

---

## Open Questions

These need human/admin input. The design fails closed on each.

1. **Registry host and TLS.** Where does `cr.beskid-lang.org` resolve? Is
   Caddy already running there, or does the operator need to stand it up?
   Is auto-HTTPS (Let's Encrypt) acceptable, or is a manually-issued cert
   required? The Caddyfile and registry compose are operator deliverables.

2. **Registry credentials.** What username/password (or htpasswd entries)
   should exist? This design assumes one push account (build host) and one
   pull account (deploy host), stored in OpenBao at
   `secret/beskid/registry/cr-beskid-lang-org`. A human admin must create
   the htpasswd entry and seed OpenBao. Do not commit the htpasswd file.

3. **Deploy host SSH access.** What is the deploy host address(es) for
   staging and production? Is there an existing `deploy` user with Docker
   access, or does the operator need to create one (the Ansible
   `coolify_host` role at `beskid_infra/ansible/roles/coolify_host/` creates
   a `deploy` user in the `docker` group — reuse it)? What SSH key should
   the build host use, and where is its private key stored (OpenBao or a
   local gitignored file)?

4. **Caddy config for the public sites.** Is Caddy already serving
   `beskid-lang.org` / `stg.beskid-lang.org`, or does the operator need to
   stand it up? The current Coolify service owns TLS for these domains;
   cutover requires Caddy to take over certificate issuance. The Caddyfile
   for the public sites is an operator deliverable.

5. **Image signing.** `reusable-image.yml` signs keylessly with cosign
   using GitHub OIDC (`id-token: write`). Outside GitHub Actions, keyless
   signing is not available. Options: (a) drop signing for the first cut
   and relax `validate-release-manifest.sh` to allow `signed: false` via a
   flag; (b) provision a cosign key pair, store it in OpenBao, and sign
   with `cosign sign --key <path>`. Which does the operator want? The
   current `validate-release-manifest.sh:28` hard-requires `signed: true`,
   so this is a blocking decision.

6. **Trivy scan retention.** The workflow uploads `trivy-<name>.sarif` as a
   90-day artifact. Outside GitHub Actions, where do scan reports go? A
   local directory on the build host? Loki (already running per
   `observability.md`)? Or drop the scan entirely for the first cut? The
   scan is report-only (`exit-code: '0'`), so it never blocked delivery,
   but the audit trail is lost without a decision.

7. **Gate scoping.** The `manifest` job requires all five quality gates
   plus all seven image lanes. For a website-only publish, running the
   full integration / shared-ui-nexus / security gates is correct for
   `main` but heavy for a fast-iterate staging push. Should the
   website-only publish path run a subset (openspec + conformance +
   site-build-gate), or always the full set? This is a policy decision,
   not a technical one.

8. **Build host identity.** Is the build host the operator's local
   machine, a dedicated build VM, or the deploy host itself? Building on
   the deploy host removes the push step (build → local registry socket)
   but couples build and deploy. Building on a separate host keeps them
   decoupled (matching the current Blacksmith runner model) but requires
   registry push credentials on the build host. Which does the operator
   prefer?

9. **Trigger.** Manual for the first cut is assumed. Does the operator
   want a registry webhook, a cron poller, or a GitHub-Actions-only-SSH
   hybrid as the eventual trigger? The hybrid (GitHub Actions runs the
   SSH deploy on green `main`, no build/push) is the smallest delta from
   the current auto-apply-staging behavior and keeps the green-`main`
   contract.

10. **OpenBao on the deploy host.** Does the deploy host have an OpenBao
    token to read `secret/beskid/{lane}/*` directly, or does the build
    host render the `.env` and ship it over SSH? The former mirrors the
    current `sync-runtime-env.sh` model; the latter is simpler but ships
    secrets over SSH (acceptable if SSH is the only channel, but worth
    an explicit decision). The website lane has only optional
    `PUBLIC_GISCUS_*` secrets, so this is non-blocking for the first cut
    but must be decided before the `auth` lane migrates.

11. **Monitoring.** The current `beskid-platform-production` Coolify
    service is scraped by Alloy for `/metrics` and container logs
    (`observability.md`). The website image (nginx) does not expose
    `/metrics`, but the deploy-host Caddy and the registry container
    should be added to the Alloy Docker SD filter so logs and (if any)
    metrics continue to flow to Loki/Prometheus/Grafana. Confirm the
    Alloy `docker.sock` filter (`coolify.projectName=beskid`) needs
    widening for non-Coolify containers.

12. **`beskid_web_common` submodule on the build host.** The Dockerfile
    copies `beskid_web_common` for the `file:` links. The build host must
    have the submodule initialized (`./scripts/ci/init-submodules.sh
    beskid_web_common`). Confirm the build host checkout strategy
    (shallow vs. full) — the website README notes the build context
    includes `.git` for `git log --follow` in the prebuild, so a
    non-shallow clone is preferred.
