# Beskid Distribution CI/CD — Design

Date: 2026-06-18
Status: Approved (proceeding to implementation)
Branch: `feat/beskid-distrib-distribution`

## Goal

Wrap the already-built Beskid CLI/LSP binaries into per-platform installers and
publish them, in a single CI run that fires automatically whenever the compiler
publishes a new rolling release. Produce platform-specific installers for
Windows, macOS, Ubuntu/Debian, and Snap. Also publish container images to
GHCR for Docker and CI runner usage.

## Non-goals (v1)

- No code signing (Windows Authenticode, macOS Developer ID notarization).
  Installers ship unsigned; the guides document the SmartScreen/Gatekeeper
  bypass. The architecture leaves room to add signing later without restructuring.
- No rebuild of the compiler. The distrib pipeline consumes the rolling
  `cli-latest` / `lsp-latest` release assets already produced by
  `.github/workflows/compiler.yml` on `Cyber-Nomad-Collective/beskid_compiler`.
- No Intel macOS. compiler.yml today builds only `aarch64-apple-darwin`; the
  brew formula covers Apple Silicon only. Adding Intel later requires extending
  the compiler build matrix first.
- No AUR (retired). Arch Linux was supported in earlier designs but has been
  removed from the pipeline.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Where CI lives | Superrepo (`.github/workflows/distribute.yml`), per the repo convention. `beskid_distrib` submodule is content-only. |
| Trigger | `workflow_run` on the `Compiler` workflow completing successfully. Decoupled from `compiler.yml`. |
| Signing | Unsigned v1. |
| Linux scope | Ubuntu/Debian (.deb) + Snap. |
| Windows format | WiX MSI (`wix build`, WiX v4 via `dotnet tool`). PATH set via WiX `<Environment>` element. |
| Homebrew tap repo | `Cyber-Nomad-Collective/beskid_homebrew` |
| Homebrew method | Manual git push of rendered formula template (homebrew-releaser incompatible with cross-repo setup) |
| macOS arch | Apple Silicon only (`aarch64-apple-darwin`). |
| Snap actions | `canonical/action-build@v1` + `canonical/action-publish@v1` |
| Debian method | `dpkg-deb --build` over a templated `DEBIAN/` tree (wraps a prebuilt binary; cargo-deb is not a fit because we don't rebuild from Cargo). |
| Container images | `docker/build-push-action@v6` → GHCR |

## Per-platform methods (researched, most-common GHA approach)

| Platform | Method | Why this one |
|---|---|---|
| Windows | WiX v4 via `dotnet tool install -g wix` then `wix build` | WiX is the user directive; no dominant wrapper action, raw `wix build` is idiomatic; `<Environment>` gives reboot-persistent PATH. |
| macOS | Manual git push of rendered formula | Pushes the formula template directly via git (homebrew-releaser incompatible with monorepo/cross-repo setup). |
| Ubuntu/Debian | `dpkg-deb --build` | Simplest dependency-free way to wrap a prebuilt binary; no Debian packaging machinery. |
| Snap | `canonical/action-build@v1` + `canonical/action-publish@v1` | Canonical-maintained standard pair; recommended on the Snapcraft forum. |
| Container images | `docker/build-push-action@v6` | Buildx-backed multi-arch push to GHCR. |

## Architecture

### Trigger & guard

`distribute.yml` triggers on `workflow_run` when the `Compiler` workflow
completes successfully. Because `compiler.yml` also runs on PRs (where the
publish jobs are skipped), the first job guards on whether the rolling release
actually exists and was updated more recently than the last distrib run:

1. Fetch the `cli-latest` release from `beskid_compiler`.
2. Read its `cli-version.txt` asset.
3. Compare against the version recorded in the distrib repo's last published
   commit on the tap/deb/snap targets. If unchanged, skip (no-op).
4. If changed, fan out to the platform packaging jobs.

This avoids burning runner minutes on PR-triggered Compiler runs and on
re-runs that didn't actually produce a new rolling build.

### Job graph

```
on: workflow_run (Compiler, completed: success)
        │
        ▼
  resolve-rolling  ── (guard: skip if version unchanged)
   │  reads cli-latest + lsp-latest from beskid_compiler
   │  outputs: version, compiler_sha, asset download URLs
   │
   ├─► windows-msi       (windows-latest)  → uploads .msi + .exe to GH release on beskid_compiler
   ├─► macos-brew        (ubuntu-latest)   → pushes formula to beskid_homebrew (optional: HOMEBREW_TAP_GIT_TOKEN)
   ├─► macos-dmg         (macos-latest)    → uploads .dmg to GH release on beskid_compiler
   ├─► ubuntu-deb        (ubuntu-latest)   → uploads .deb to GH release on beskid_compiler
   ├─► linux-snap        (ubuntu-latest)   → action-build → action-publish to Snap Store (optional: SNAPCRAFT_STORE_CREDENTIALS)
   └─► container-images  (ubuntu-latest)   → docker/build-push-action to GHCR
```

All platform jobs `needs: resolve-rolling` and run in parallel
(`fail-fast: false`). Each has its own `timeout-minutes`. A failure on one
platform does not block the others.

### Where artifacts land

- **Windows .msi, Ubuntu .deb** → uploaded as additional assets on the
  `cli-latest` (and `cli-v<ver>`) release on `beskid_compiler`, alongside the
  raw binaries. One place to download everything for a version.
- **macOS** → `beskid_homebrew` tap repo (`Formula/beskid.rb`). Users
  `brew tap cyber-nomad-collective/beskid` then `brew install beskid`.
- **Snap** → Snap Store under the registered snap name `beskid`. Users
  `snap install beskid --classic`.
- **Container images** → `ghcr.io/cyber-nomad-collective/beskid:<version>`
  and `ghcr.io/cyber-nomad-collective/beskid-runner:<version>`. Users
  `docker run ghcr.io/cyber-nomad-collective/beskid:latest --version`.

## Repository layout

```
beskid_distrib/                          # submodule, content only
  README.md
  SECRETS.md                             # consolidated secret inventory
  docs/
    Windows_Guide.md
    MacOS_Guide.md
    Ubuntu_Guide.md
    Snap_Guide.md
  assets/icons/
    beskid.ico                           # Windows MSI icon
    beskid-256.png  beskid-512.png       # Snap/desktop icon
    beskid-logo.svg                      # source SVG
  windows/
    beskid.wxs                           # WiX v4 source: install dir + PATH env + uninstall
    build-msi.sh
  macos/Formula/beskid.rb.tpl            # rendered by macos-brew CI job with version+sha
  deb/
    debian/{control,postinst,prerm}
    build-deb.sh
  snap/snapcraft.yaml
  docker/
    Dockerfile                            # generic CLI image
    Dockerfile.runner                     # GHA runner image
    docker-compose.yml
  scripts/
    fetch-release-assets.sh
    fetch-rolling-assets.sh
    resolve-version.sh
    target-map.sh                         # shared target→asset mapping
```

Superrepo additions:
- `.gitmodules` — new `beskid_distrib` entry (relative URL `../beskid_distrib.git`).
- `.github/workflows/distribute.yml` — the orchestration.
- `docs/distribution/SECRETS.md` — copy of the secret inventory (so it's
  readable without checking out the submodule).

## Homebrew formula push

The `macos-brew` job pushes the formula directly via git rather than using
`Justintime50/homebrew-releaser`. That action is incompatible with monorepos,
always reads the release from the workflow's own repo, and names the formula
after the repo — none of which fit the cross-repo setup (release lives on
`beskid_compiler`; workflow runs in the superrepo; we want `brew install beskid`,
not `beskid_compiler`). **Resolution:** the `macos-brew` job clones the
`beskid_homebrew` tap repo, renders `Formula/beskid.rb` from the template with
the version + sha256, and pushes it directly. Uses `HOMEBREW_TAP_GIT_TOKEN` for
cross-repo write access.

## Secrets inventory (full list in SECRETS.md)

| Secret | Used by | Purpose |
|---|---|---|
| `DISTRIB_GH_PAT` | all platform jobs | PAT with `repo` scope to read `beskid_compiler` releases (private org) and upload assets back. |
| `HOMEBREW_TAP_GIT_TOKEN` | macos-brew (optional) | PAT with `repo` on `beskid_homebrew` for cross-repo formula push. If absent, macos-brew is skipped. |
| `SNAPCRAFT_STORE_CREDENTIALS` | linux-snap (optional) | Snap Store login. If absent, linux-snap is skipped. |
| `GHCR_TOKEN` (or `GITHUB_TOKEN` with `packages:write`) | container-images | Push container images to GHCR. |

## setup-beskid GitHub Action

A composite GitHub Action (`.github/actions/setup-beskid/`) installs the Beskid
CLI in CI runners without pre-building. It detects the runner OS and arch,
downloads the binary from the `cli-latest` (or `cli-v<version>` if pinned)
release on `beskid_compiler`, installs to `RUNNER_TOOL_CACHE`, and verifies
with `beskid --version`.

Inputs:
- `version` (string, default `latest`): semver or `latest` for rolling.
- `token` (string, default `${{ github.token }}`): GH token for release download.

Outputs:
- `beskid-version`: the installed version.
- `beskid-path`: path to the binary.

Supported platforms: linux-x64, darwin-arm64, win32-x64.

Usage:
```yaml
- uses: ./.github/actions/setup-beskid
  with:
    version: 'latest'
```

## Container images

Two Docker images are published to GHCR:

- **`ghcr.io/cyber-nomad-collective/beskid:<version>`** — minimal runtime
  (`debian:bookworm-slim`) with the beskid CLI at `/usr/local/bin/beskid`.
  Entrypoint is `beskid`. Built from `beskid_distrib/docker/Dockerfile`.

- **`ghcr.io/cyber-nomad-collective/beskid-runner:<version>`** — extends the
  generic image with GitHub Actions runner dependencies (curl, jq, git). Built
  from `beskid_distrib/docker/Dockerfile.runner`.

Usage:
```sh
docker run ghcr.io/cyber-nomad-collective/beskid:latest --version
docker run -v $(pwd):/workspace ghcr.io/cyber-nomad-collective/beskid:latest build
```

In GitHub Actions:
```yaml
- uses: docker://ghcr.io/cyber-nomad-collective/beskid:latest
```

## Testing / verification

- `distribute.yml` is gated by the version-unchanged guard, so re-runs are cheap.
- Each platform job uses `continue-on-error: false` but the matrix is
  `fail-fast: false`, so partial publishes are visible.
- Manual `workflow_dispatch` input (`force: true`) bypasses the version guard
  for forced re-publishes.
- The workflow is linted locally via `actionlint` before commit (already used
  elsewhere in the repo's CI hygiene).
