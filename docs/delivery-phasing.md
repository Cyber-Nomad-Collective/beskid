# Delivery phasing (GHCR, Coolify, beskid_infra)

This documents the **locked** rollout order for platform delivery. It implements the viability assessment: fix the verify≠deploy split before full secrets/IaC automation.

## Phase decision

| Phase | Scope | Blocker for next? |
|-------|--------|-------------------|
| **1 — GHCR (now)** | GitHub Actions build and push images; Coolify pulls `ghcr.io/cyber-nomad-collective/*:${IMAGE_TAG}` | No — do not wait for OpenBao or OpenTofu |
| **2 — Coolify image cutover** | Point production/staging apps at GHCR; register GHCR pull credentials on the server; remove VPS `NODE_AUTH_TOKEN` build secrets | Staging branch + isolated secrets |
| **3 — Staging environment** | `staging` branch → `:staging` tags; separate DB volumes and OAuth (see [staging-environment.md](staging-environment.md)) | Smoke on auth + site |
| **4 — Satellite images** | `beskid-tracker`, `beskid-nexus`, `beskid-pckg` workflows in their repos | GHCR pull on Coolify |
| **5 — beskid_infra + OpenBao** | OpenTofu apply via GitHub Environments; secrets in KV; optional Drone later | Operator bootstrap only |

**Not in phase 1:** Coolify Git build-pack, server-side `docker compose build`, or duplicating secrets in Coolify UI after OpenBao migration.

## CI ownership

- **GitHub Actions** — verify on PR (`docs-site.yml`, etc.) and **container images** on push to `main` / `staging` (`.github/workflows/container-images.yml`).
- **beskid_infra** — OpenTofu plan/apply (`.github/workflows/tofu-plan-apply.yml`); secrets from OpenBao at apply time.
- **Coolify** — runtime only (pull image, env from OpenTofu or manual until phase 5).

## Related docs

- [site/COOLIFY.md](../site/COOLIFY.md) — site + auth
- [beskid_infra/docs/deploy-matrix.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/deploy-matrix.md)
- [beskid_infra/docs/openbao-layout.md](https://github.com/Cyber-Nomad-Collective/beskid_infra/blob/main/docs/openbao-layout.md)
