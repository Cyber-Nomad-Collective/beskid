# GitHub Actions (disabled quality/security workflows)

GitHub Actions remains the CI platform, but active pipelines are intentionally limited to **build/publish** lanes.

These workflow files are kept for reference only. They are **not** executed while they remain in this folder (GitHub only runs `.github/workflows/`).

## Active policy

- Keep build/publish workflows active in `.github/workflows/`.
- Do not run quality/test/security checks as required CI gates in pipelines.
- Run validation/quality checks manually or in separate non-gating flows when needed.

| Disabled workflow | Reason |
|-------------------|--------|
| `docs-site.yml` | quality/verification lane |
| `pckg-ci.yml` | test lane |
| `runtime-ci.yml` | runtime test lane |
| `platform-spec-contracts.yml` | contract verification lane |
| `semgrep.yml` | security quality scan lane |

`publish-open-vsx.yml` stays active because it is a release/build publishing workflow, not a quality gate.
