# GitHub Actions (disabled)

CI moved to **self-hosted [Drone CI](https://www.drone.io/)**. Pipelines live in each repo’s `.drone.yml`.

Infrastructure (OpenTofu → Coolify): [Cyber-Nomad-Collective/beskid_infra](https://github.com/Cyber-Nomad-Collective/beskid_infra).

These workflow files are kept for reference only. They are **not** executed while they remain in this folder (GitHub only runs `.github/workflows/`).

| Former workflow | Replaced by |
|-----------------|-------------|
| `docs-site.yml` | `beskid` `.drone.yml` → `site-verify` |
| `pckg-ci.yml` | Drone on `beskid` / `beskid_pckg` (migrate when ready) |
| `runtime-ci.yml`, `platform-spec-contracts.yml`, `security-audits.yml` | Drone (to be added) |
| `publish-open-vsx.yml` | Drone on `beskid_vscode` (to be added) |

Re-enable Actions only if Drone is unavailable; do not run both in parallel on the same branches.
