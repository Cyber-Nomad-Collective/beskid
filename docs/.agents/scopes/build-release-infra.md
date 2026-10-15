# Scope: build, release and infrastructure

How Beskid is validated, built, released, packaged and run in production.
Detailed operator documentation is in `docs/operations/woodpecker.md`.

## Authorities

| Authority | Does | Never does |
| --- | --- | --- |
| **Woodpecker** (`.woodpecker/`, `scripts/ci/`) | Validates trusted pushes; builds native Linux, Windows and macOS targets with durable, checksummed outputs; runs the manual release and editor lanes | Hold deployment credentials |
| **`release-publish` lane** | Publishes stable releases; manual, `main` only | Run on any other branch or trigger |
| **Watchtower** (`beskid_sites/deploy/`) | Reconciles production containers | Get driven by repository builds |
| **GitHub Actions** (`.github/workflows/`) | Repository-native maintenance: weekly security audit, ClamAV scan of pull requests, manual release announcements | Build, publish releases, or hold deployment credentials |

- Inside `release-publish`, a credential-free `verify-release` step proves the
  qualified state. Only the final `publish-release` step receives the scoped
  secret `compiler_release_token`.
- Woodpecker is also the only publisher to editor marketplaces (`editor.yml`).
- Before a stable release, the Linux, Windows and macOS result files are
  collected into one release workspace, a fail-closed release state is built,
  and immutable artifacts are published before rolling aliases
  (`cli-stable`, `cli-unstable`) move.

## GitHub workflows

| Workflow | Trigger | Does |
| --- | --- | --- |
| `cybersec-audit-sheduld.yml` | Tuesdays 21:37 UTC, manual | `pnpm audit` over every lockfile; Trivy for CVEs, secrets and misconfiguration; manual runs can propose `pnpm audit --fix` as a patch artifact |
| `pr-avscan.yml` | Pull requests | ClamAV scan of added and changed files with fresh signatures |
| `socmed-posting.yml` | Manual only | Announces on webhook, Discord, Mastodon and SMTP mail, each only when its `ANNOUNCE_*` secrets exist |

All three run with a read-only token. Actions are pinned by commit SHA, reusing
the pins from this repository's earlier workflows. Each file keeps the `# NOTE:`
line that requested it. Lint with `actionlint` (`just gate-full`).

## Distribution

`beskid_distrib/` holds packaging channels. AUR is intentionally left out;
keep the other channels.

## Production

- Standalone production Compose in `beskid_sites/deploy/`, with a private
  registry and Watchtower.
- Secrets in OpenBao. Memgraph for graph data. Grafana monitoring at
  <https://monitor.beskid-lang.org>.
- `beskid_infra/` supports secrets and monitoring. It is not the deployment
  authority.
- Coolify target URLs use explicit container ports per service
  (`https://<host>:<port>`). Public origins use standard HTTPS; staging uses the
  `stg-` prefix.

## Secrets

- Never commit secret values.
- Local `.beskid/` directories and `beskid_infra/config/openbao-*.env` (init and
  secrets) stay gitignored.
- Do not invent Coolify service UUIDs, GHCR package write grants or token
  values. Fail closed and write down the exact step a human admin must take.

## Local checks

| Task | Command |
| --- | --- |
| Fast host gates (lockfiles, frozen checks, standard validation) | `just gate` |
| Plus workflow policy checks (needs `actionlint`) | `just gate-full` |
| Build and release contract tests, no external changes | `bash scripts/ci/test/run-cicd-foundation-tests.sh` |
| Web and docs CI sanity | `./validate-ci-local.sh` |
| License metadata | `pnpm licenses:check` |

## Approval

Publishing, pushing images, changing credentials and touching external
services always need explicit approval from the owner, even during release
programs.
