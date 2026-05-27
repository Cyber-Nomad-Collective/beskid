# Staging branch and Coolify environment

Staging validates GHCR images and Coolify config **before** production cutover on `main`.

## Git branch

- Branch name: **`staging`**
- Create from current `main` (operators):

  ```bash
  git checkout main && git pull
  git checkout -b staging
  git push -u origin staging
  ```

- Protect `staging` in GitHub (require PR or restrict who can push, optional required checks: Docs site, Container images).

## Image tags

| Branch | GHCR tags | Coolify `IMAGE_TAG` |
|--------|-----------|---------------------|
| `main` | `main`, `sha-<7>` | `main` |
| `staging` | `staging`, `sha-<7>` | `staging` |

Workflow: [`.github/workflows/container-images.yml`](../.github/workflows/container-images.yml).

## Coolify

- One project (e.g. **Beskid**), environment **`staging`** (separate from **`production`**).
- Use `docker-compose.yml` per service with `IMAGE_TAG=staging`.
- Prefer Coolify wildcard auto-domains for staging hostnames unless OpenTofu sets explicit FQDNs.

## Isolation (required)

Do **not** share production data or OAuth with staging.

| Concern | Production | Staging |
|---------|------------|---------|
| **Auth hub** | `https://auth.beskid-lang.org` | Separate URL (Coolify auto-domain or `auth-staging.*`) |
| **GitHub OAuth** | Production OAuth app | **Separate** OAuth app or extra callback URLs on a dedicated staging app |
| **OpenBao** | `secret/beskid/production/{service}` | `secret/beskid/staging/{service}` — distinct `SESSION_SECRET`, DB URLs |
| **Auth SQLite** | Production volume | **New** volume (`auth-data` in compose) |
| **pckg Postgres** | Production `pckg_pg_data` | **New** Postgres service/volume; never reuse connection strings |
| **Nexus** | `GITNEXUS_HOME` prod volume | Separate `nexus-data` volume |
| **Tracker** | Production `tracker-data` | Separate volume |

### Auth hub staging checklist

1. Populate OpenBao `secret/beskid/staging/auth` (or Coolify env until OpenTofu): `AUTH_HUB_PUBLIC_URL`, `SESSION_SECRET`, `GITHUB_*`, `AUTH_SETUP_TOKEN`.
2. Deploy auth from `ghcr.io/cyber-nomad-collective/beskid-auth:staging`.
3. Run hub onboarding on staging URL only.
4. Pair staging tracker/nexus/pckg against **staging** hub URL (`AUTH_HUB_PUBLIC_URL` on each consumer).

### OAuth

- **Recommended:** second GitHub OAuth application for staging with callback `https://<staging-auth-host>/...`.
- **Alternative:** add staging callback URLs to the production app only if you accept shared client id (still use separate `SESSION_SECRET` and hub URL).

## Promotion to production

1. Merge `staging` → `main` after smoke tests.
2. Container workflow publishes `:main` images.
3. Coolify production apps use `IMAGE_TAG=main` (manual redeploy or OpenTofu apply on `beskid_infra` `main`).
