# Beskid platform — Caddy deploy

Production deployment of the Beskid platform on a Caddy-based Docker Compose
stack, replacing the Coolify control plane. This directory ships the full
runtime: Caddy reverse proxy, private Docker registry, Authelia (OIDC
provider, GitHub sole IdP), shared Postgres, Memgraph, and all Beskid site
apps.

This stack runs **alongside** the existing Coolify-managed services on
`root@bdziam.dev` during cutover. DNS is flipped per-domain once each
service is verified. See [Cutover](#cutover) below.

Design is grounded in `beskid_sites/_planning/infra-audit.md` (findings cited
inline) and `beskid_sites/_planning/publish-migration.md` (registry + publish
flow).

## Architecture

```
                      Internet
                         │
                    80/443 (HTTP/3)
                         │
                 ┌───────┴────────┐
                 │     Caddy      │  auto-HTTPS (Let's Encrypt), reverse proxy,
                 │  (beskid-      │  basicauth for registry, forward-auth for
                 │   frontend +   │  protected apps, security headers.
                 │   backend)     │
                 └───┬────────┬───┘
        beskid-frontend│        │beskid-backend
         ┌─────────────┴──┐  ┌──┴──────────────┐
         │  website:80    │  │  postgres:5432  │  shared: Authelia + pckg +
         │  platform-spec │  │  memgraph:7687   │  community (audit 2.7)
         │  tracker       │  │                  │
         │  nexus         │  │  (backend-only;  │
         │  pckg          │  │   no public port)│
         │  learn         │  └──────────────────┘
         │  community    │
         │  registry:5000│  (registry on frontend; Caddy enforces basicauth)
         │  authelia:9091 │  (authelia on both networks)
         └────────────────┘
```

**Networks** (audit finding 2.1):
- `beskid-frontend` — Caddy + all public-facing apps + registry + authelia.
- `beskid-backend` — data stores (postgres, memgraph) + their clients
  (platform-spec, pckg, community, authelia). Caddy is the only service on
  both; data stores are not reachable from the public apps that don't need
  them.

**What this replaces from the Coolify stack:**
- Coolify Traefik proxy → Caddy (audit 1.1).
- Coolify service UUIDs + REST deploy → SSH + `docker compose up` (audit 1.2, 1.3, 5.4).
- Coolify env bulk PATCH → `env_file` from OpenBao (audit 3.2).
- Explicit `:port` public URLs → 443-only (audit 6.2, 6.3).

**What this preserves:**
- Digest-pinned Beskid images (fail-closed env pattern).
- Healthchecks on every service (audit 2.10).
- `expose:`-only for internal services (audit 2.11).
- `restart: unless-stopped` (audit 2.12).
- OpenBao KV v2 lane-scoped secrets (audit 3.1).
- Progressive delivery: staging auto-applies on green `main`, production
  requires approval (audit 5.6, 5.7).

## Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | The full runtime stack. |
| `Caddyfile` | Reverse proxy, TLS, forward-auth, basicauth, headers. |
| `authelia/configuration.yml` | Authelia OIDC provider + GitHub IdP + ACL. |
| `registry/config.yml` | registry:2 config (HTTP-only; Caddy enforces auth). |
| `registry/htpasswd` | **Gitignored.** bcrypt hash for registry basicauth. |
| `.env.example` | Template for all secrets + runtime config. |
| `.env` | **Gitignored.** Real secrets, populated from OpenBao. |
| `deploy.sh` | SSH deploy + smoke checks. |

## Prerequisites (human admin — fail closed)

These cannot be automated and must be done by an operator before the first
deploy. The design fails closed on each.

1. **SSH access.** A key for `root@bdziam.dev` (or set `DEPLOY_HOST`).
   Reuse the `deploy` user from the Ansible `coolify_host` role if present.
2. **DNS.** A records for every subdomain pointing at the deploy host:
   `beskid-lang.org`, `www.beskid-lang.org`, `cr.beskid-lang.org`,
   `auth.beskid-lang.org`, `spec.beskid-lang.org`, `tracker.beskid-lang.org`,
   `nexus.beskid-lang.org`, `pckg.beskid-lang.org`, `learn.beskid-lang.org`,
   `community.beskid-lang.org`. Lower TTL to 300s before cutover.
3. **Registry credentials.** Populate OpenBao at
   `secret/beskid/registry/cr-beskid-lang-org` with `username` / `password`.
   Generate the htpasswd locally:
   `htpasswd -Bbn <user> <pass> > registry/htpasswd` (gitignored).
4. **GitHub OAuth App.** Reuse the existing Beskid GitHub OAuth App (the one
   `site/auth` used). Add the Authelia callback:
   `https://auth.beskid-lang.org/api/oidc/callback`. Store
   `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` in OpenBao at
   `secret/beskid/production/auth`.
5. **Authelia secrets.** Generate and store in OpenBao:
   - `AUTHELIA_SESSION_SECRET` — `openssl rand -hex 32`
   - `AUTHELIA_STORAGE_ENCRYPTION_KEY` — `openssl rand -hex 32`
   - `AUTHELIA_OIDC_HMAC_SECRET` — `openssl rand -hex 32`
   - `AUTHELIA_OIDC_JWKS_SECRET` — RSA private key PEM (single line):
     `openssl genrsa -out jwks.pem 2048 && awk '{printf "%s\\n", $0}' jwks.pem`
6. **Per-app OIDC client secrets + session secrets.** One per app
   (`openssl rand -hex 32`). Store in OpenBao per-service paths.
7. **Postgres + Memgraph passwords.** Strong passwords in OpenBao at
   `secret/beskid/production/postgres` and `.../memgraph`.
8. **Image digests.** The publish flow (see `publish-migration.md`) builds
   images, pushes to `cr.beskid-lang.org`, and emits a release manifest with
   `sha256:` digests. Populate `*_IMAGE_DIGEST` in `.env` from the manifest.
9. **OpenBao token.** `OPENBAO_TOKEN` with read access to
   `secret/beskid/production/*` (for `--from-openbao`).

## Deploy

```bash
cd beskid_sites/deploy

# Option A: populate .env from OpenBao (requires OPENBAO_TOKEN)
OPENBAO_TOKEN=... ./deploy.sh --from-openbao

# Option B: hand-fill .env
cp .env.example .env
# edit .env ...
./deploy.sh

# Dry run (ship files, do not start)
./deploy.sh --no-deploy

# Smoke checks only (against a running stack)
./deploy.sh --smoke-only
```

`deploy.sh`:
1. Validates local files + required secrets (fails closed).
2. Populates `.env` from OpenBao (or uses an existing one).
3. `scp`s compose, Caddyfile, authelia config, registry config, htpasswd,
   and `.env` to `${REMOTE_DIR:-/opt/beskid}` on the host.
4. `docker login cr.beskid-lang.org` with the registry credentials.
5. Backs up the previous compose to `docker-compose.prev.yml`.
6. `docker compose up -d --wait` (waits for healthchecks).
7. Runs HTTPS smoke checks against every public endpoint.

## Cutover

The stack runs alongside Coolify during cutover. Order per domain:

1. **Lower DNS TTL** to 300s for the target subdomain.
2. **Verify the new container** is healthy on the host:
   `ssh root@bdziam.dev 'cd /opt/beskid && docker compose ps'`.
3. **Flip DNS** for the subdomain to the deploy host.
4. **Wait for TLS** — Caddy auto-provisions the Let's Encrypt cert on first
   request. Probe: `curl -I https://<subdomain>.beskid-lang.org`.
5. **Run smoke** for that domain: `./deploy.sh --smoke-only`.
6. **Soak 1–3 days**, keeping the Coolify-managed service as rollback.
7. **Decommission** the Coolify service for that lane after a stable cycle.

Start with `cr.beskid-lang.org` and `auth.beskid-lang.org` (no user-facing
risk), then `beskid-lang.org`, then the rest.

## Rollback

**During cutover (Coolify still warm):** flip DNS back to the Coolify-managed
service. The Coolify stack and its GHCR images remain the fallback for one
release cycle.

**After Coolify decommission:** restore the previous compose on the host:

```bash
ssh root@bdziam.dev '
  cd /opt/beskid
  cp docker-compose.prev.yml docker-compose.yml
  docker compose up -d --wait
'
```

The previous pinned image digests remain in the local Docker cache and the
registry (keep N digests per repo for rollback — see Registry maintenance).

## Self-service: add a new service

1. **Image.** Build + push to `cr.beskid-lang.org/beskid/<name>` via the
   publish flow; record the digest in the release manifest.
2. **Compose.** Add a service block to `docker-compose.yml`:
   - `image: cr.beskid-lang.org/beskid/<name>@${<NAME>_IMAGE_DIGEST:?...}`
   - `networks:` `beskid-frontend` (and `beskid-backend` if it needs a data
     store).
   - `expose:` the internal port (never `ports:`).
   - `env_file: [.env]`, `restart: unless-stopped`, healthcheck, logging,
     resource limits (copy an existing app block).
3. **Caddyfile.** Add a site block. Use `import protected <name>:<port>` for
   an auth-gated app, or a plain `reverse_proxy` for a public one.
4. **Authelia.** If the app is an OIDC client, add a client block to
   `authelia/configuration.yml` with its `client_id`, `client_secret` env,
   and `redirect_uris`.
5. **.env.example.** Add `<NAME>_IMAGE_DIGEST` and any new secrets.
6. **OpenBao.** Seed the new secrets at `secret/beskid/production/<name>`.
7. **Deploy.** `./deploy.sh --from-openbao`.

## Secret management (OpenBao)

OpenBao KV v2 at `https://secrets.bdziam.dev`. Lane-scoped paths mirror the
existing layout (`beskid_infra/docs/openbao-layout.md`):

| Path | Keys |
|------|------|
| `secret/beskid/production/auth` | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`, per-app `*_OIDC_CLIENT_SECRET` |
| `secret/beskid/production/postgres` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `AUTHELIA_POSTGRES_DB`, `PCKG_POSTGRES_DB`, `COMMUNITY_POSTGRES_DB` |
| `secret/beskid/production/memgraph` | `MEMGRAPH_USERNAME`, `MEMGRAPH_PASSWORD` |
| `secret/beskid/production/platform-spec` | `PLATFORM_SPEC_SESSION_SECRET`, `GITHUB_SYNC_TOKEN`, `GITHUB_WEBHOOK_SECRET`, ... |
| `secret/beskid/production/tracker` | `TRACKER_SESSION_SECRET`, `GITHUB_SYNC_TOKEN`, ... |
| `secret/beskid/production/nexus` | `NEXUS_SESSION_SECRET` |
| `secret/beskid/production/pckg` | `PCKG_OIDC_CLIENT_SECRET`, `GITHUB_SYNC_TOKEN`, ... |
| `secret/beskid/production/learn` | `LEARN_SESSION_SECRET`, `LEARN_AUTH_SERVICE_TOKEN` |
| `secret/beskid/registry/cr-beskid-lang-org` | `REGISTRY_USER`, `REGISTRY_PASS` |
| `secret/beskid/openbao/token` | `OPENBAO_TOKEN` |

`deploy.sh --from-openbao` reads each service path and overlays it onto
`.env` (starting from `.env.example` for non-secret defaults). Missing
required keys fail closed.

**Never commit** `.env`, `registry/htpasswd`, or any secret value. Both are
gitignored (see `.gitignore`).

## Registry maintenance

- **Garbage collection.** After untagging old digests, run on the host:
  `docker exec beskid-platform-registry-1 registry garbage-collect /etc/docker/registry/config.yml`
  Schedule via cron (weekly). Keep N=10 digests per repo for rollback.
- **Backup.** The `registry-data` volume holds all images. Back up with the
  same policy as `postgres-data` and `memgraph-data` (audit finding 7.8 —
  backup strategy is a separate TODO).

## Rate limiting

Stock Caddy has no rate limiting. To add it, build a custom Caddy image with
the [`caddy-ratelimit`](https://github.com/mholt/caddy-ratelimit) module and
add a `rate_limit` directive to the relevant site blocks. Not included by
default to keep the base image stock.

## Known limitations / TODOs

- **Third-party images are version-pinned, not digest-pinned** (audit 2.2).
  A future CI gate will digest-pin `caddy`, `registry`, `authelia`,
  `postgres`, `memgraph`, `nodebb`.
- **No backups** (audit 7.8). A cron + off-host backup of `postgres-data`,
  `memgraph-data`, `auth-data`, `tracker-data`, `nexus-data`, `pckg-data`,
  `registry-data` is a separate task.
- **No alerting** (audit 4.4). The monitoring stack (Prometheus/Loki/Grafana)
  is not yet folded into this compose; `monitor.beskid-lang.org` is stubbed
  in the Caddyfile.
- **Alloy discovery** (audit 1.4) must be rewritten to use Beskid-defined
  Docker labels instead of Coolify labels when monitoring is merged.
- **Single host, no HA** (audit 7.7). Acceptable at current scale; documented
  as a known limitation.
- **NodeBB image tag** (`nodebb/docker:3.12`) and OIDC callback path must be
  verified against the deployed NodeBB + SSO plugin version.
