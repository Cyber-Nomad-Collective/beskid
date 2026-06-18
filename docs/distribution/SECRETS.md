# Distribution Pipeline Secrets

All secrets are configured on the **superrepo**
(`Cyber-Nomad-Collective/beskid`) under **Settings → Secrets and variables →
Actions**. Per-platform setup instructions live in `docs/<Platform>_Guide.md`.

| Secret | Required by | Scope / Notes |
|---|---|---|
| `DISTRIB_GH_PAT` | all platform jobs | Classic PAT, `repo` scope. Used to download `cli-latest`/`lsp-latest` assets from `beskid_compiler` and upload `.msi`/`.deb` back to those releases. If `beskid_compiler` is private, this PAT must have access to `Cyber-Nomad-Collective`. |
| `HOMEBREW_TAP_GIT_TOKEN` | `macos-brew` | Classic PAT, `repo` scope on `Cyber-Nomad-Collective/beskid_homebrew`. `homebrew-releaser` cross-pushes the formula, which the default `GITHUB_TOKEN` cannot do. |
| `AUR_SSH_PRIVATE_KEY` | `arch-aur` | OpenSSH private key (ed25519) registered as an AUR deploy key on the `beskid-bin` package. Include the full PEM including `-----BEGIN/END...-----` markers. |
| `AUR_USERNAME` | `arch-aur` | Commit author name for AUR commits (e.g. `Piotr Mikstacki`). |
| `AUR_EMAIL` | `arch-aur` | Commit author email for AUR commits. |
| `SNAPCRAFT_STORE_CREDENTIALS` | `linux-snap` | Snap Store login credentials. Generate via `snapcraft export-login` (or the Snap Store dashboard). The legacy `SNAPCRAFT_TOKEN` is deprecated. |

## Minimum viable set

To ship a subset of platforms, only the corresponding secrets are needed; the
workflow guards each job on its own secret being present and skips cleanly
when missing (same pattern as `publish-open-vsx.yml`'s `check-token` job).

- **Windows + Ubuntu only:** `DISTRIB_GH_PAT`.
- **+ macOS:** add `HOMEBREW_TAP_GIT_TOKEN`.
- **+ Arch:** add `AUR_SSH_PRIVATE_KEY`, `AUR_USERNAME`, `AUR_EMAIL`.
- **+ Snap:** add `SNAPCRAFT_STORE_CREDENTIALS`.

## Rotation

- PATs (`DISTRIB_GH_PAT`, `HOMEBREW_TAP_GIT_TOKEN`): rotate before GitHub's
  365-day expiry. Prefer fine-grained PATs scoped to the single required repo
  where possible.
- `AUR_SSH_PRIVATE_KEY`: rotate by generating a new ed25519 key, adding it as
  an AUR deploy key, then updating the secret.
- `SNAPCRAFT_STORE_CREDENTIALS`: re-export via `snapcraft export-login` and
  update the secret.
