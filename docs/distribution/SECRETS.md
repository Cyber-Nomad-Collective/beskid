# Distribution Pipeline Secrets

All secrets are configured on the **superrepo**
(`Cyber-Nomad-Collective/beskid`) under **Settings → Secrets and variables →
Actions**. Per-platform setup instructions live in `docs/<Platform>_Guide.md`.

| Secret | Required by | Scope / Notes |
|---|---|---|
| `DISTRIB_GH_PAT` | all platform jobs | Classic PAT, `repo` scope. Used to download `cli-latest`/`lsp-latest` assets from `beskid_compiler` and upload `.msi`/`.deb` back to those releases. If `beskid_compiler` is private, this PAT must have access to `Cyber-Nomad-Collective`. |
| `HOMEBREW_TAP_GIT_TOKEN` | `macos-brew` | Classic PAT, `repo` scope on `Cyber-Nomad-Collective/beskid_homebrew`. `homebrew-releaser` cross-pushes the formula, which the default `GITHUB_TOKEN` cannot do. |
| `SNAPCRAFT_STORE_CREDENTIALS` | `linux-snap` | Snap Store login credentials. Generate via `snapcraft export-login` (or the Snap Store dashboard). The legacy `SNAPCRAFT_TOKEN` is deprecated. |

## Release preflight

A full distribution is all-or-nothing at the completion-marker level.
The workflow checks every listed secret before it reads rolling release assets
or starts any platform publication. It fails without mutating release state
when a credential is absent. Operators verify secret names and update timestamps
only; GitHub Actions never reveals secret values.

If a platform publication fails after preflight, no `distrib-version.txt` marker
is written. Correct the external problem and rerun the same version: publication
steps are clobber/idempotent where the destination allows it, and the marker is
recorded only after all platform jobs have succeeded.

## Rotation

- PATs (`DISTRIB_GH_PAT`, `HOMEBREW_TAP_GIT_TOKEN`): rotate before GitHub's
  365-day expiry. Prefer fine-grained PATs scoped to the single required repo
  where possible.
- `SNAPCRAFT_STORE_CREDENTIALS`: re-export via `snapcraft export-login` and
  update the secret.
