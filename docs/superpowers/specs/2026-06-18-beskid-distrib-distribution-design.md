# Beskid Distribution CI/CD — Design

Date: 2026-06-18
Status: Approved (proceeding to implementation)
Branch: `feat/beskid-distrib-distribution`

## Goal

Wrap the already-built Beskid CLI/LSP binaries into per-platform installers and
publish them, in a single CI run that fires automatically whenever the compiler
publishes a new rolling release. Produce platform-specific installers for
Windows, macOS, Arch, Ubuntu/Debian, and Snap.

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

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Where CI lives | Superrepo (`.github/workflows/distribute.yml`), per the repo convention. `beskid_distrib` submodule is content-only. |
| Trigger | `workflow_run` on the `Compiler` workflow completing successfully. Decoupled from `compiler.yml`. |
| Signing | Unsigned v1. |
| Linux scope | Arch (AUR) + Ubuntu/Debian (.deb) + Snap. |
| Windows format | WiX MSI (`wix build`, WiX v4 via `dotnet tool`). PATH set via WiX `<Environment>` element. |
| Homebrew tap repo | `Cyber-Nomad-Collective/beskid_homebrew` |
| Homebrew action | `Justintime50/homebrew-releaser@v3` |
| macOS arch | Apple Silicon only (`aarch64-apple-darwin`). |
| AUR action | `KSXGitHub/github-actions-deploy-aur@v3` |
| Snap actions | `canonical/action-build@v1` + `canonical/action-publish@v1` |
| Debian method | `dpkg-deb --build` over a templated `DEBIAN/` tree (wraps a prebuilt binary; cargo-deb is not a fit because we don't rebuild from Cargo). |

## Per-platform methods (researched, most-common GHA approach)

| Platform | Method | Why this one |
|---|---|---|
| Windows | WiX v4 via `dotnet tool install -g wix` then `wix build` | WiX is the user directive; no dominant wrapper action, raw `wix build` is idiomatic; `<Environment>` gives reboot-persistent PATH. |
| macOS | `Justintime50/homebrew-releaser@v3` (`strategy: bin`) | Most-referenced dedicated brew action; commits the formula to the tap repo on each run. |
| Arch | `KSXGitHub/github-actions-deploy-aur@v3` | De-facto standard; pushes PKGBUILD + .SRCINFO to AUR over SSH. |
| Ubuntu/Debian | `dpkg-deb --build` | Simplest dependency-free way to wrap a prebuilt binary; no Debian packaging machinery. |
| Snap | `canonical/action-build@v1` + `canonical/action-publish@v1` | Canonical-maintained standard pair; recommended on the Snapcraft forum. |

## Architecture

### Trigger & guard

`distribute.yml` triggers on `workflow_run` when the `Compiler` workflow
completes successfully. Because `compiler.yml` also runs on PRs (where the
publish jobs are skipped), the first job guards on whether the rolling release
actually exists and was updated more recently than the last distrib run:

1. Fetch the `cli-latest` release from `beskid_compiler`.
2. Read its `cli-version.txt` asset.
3. Compare against the version recorded in the distrib repo's last published
   commit on the tap/AUR/deb/snap targets. If unchanged, skip (no-op).
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
   ├─► windows-msi   (windows-latest)  → uploads .msi to GH release on beskid_compiler
   ├─► macos-brew    (ubuntu-latest)   → homebrew-releaser pushes formula to beskid_homebrew
   ├─► arch-aur      (ubuntu-latest)   → github-actions-deploy-aur pushes PKGBUILD to AUR
   ├─► ubuntu-deb    (ubuntu-latest)   → uploads .deb to GH release on beskid_compiler
   └─► linux-snap    (ubuntu-latest)   → action-build → action-publish to Snap Store
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
- **Arch** → AUR package `beskid-bin`. Users `yay -S beskid-bin`.
- **Snap** → Snap Store under the registered snap name `beskid`. Users
  `snap install beskid --classic`.

## Repository layout

```
beskid_distrib/                          # submodule, content only
  README.md
  SECRETS.md                             # consolidated secret inventory
  docs/
    Windows_Guide.md
    MacOS_Guide.md
    Arch_Guide.md
    Ubuntu_Guide.md
    Snap_Guide.md
  assets/icons/
    beskid.ico                           # Windows MSI icon
    beskid-256.png  beskid-512.png       # Snap/desktop icon
    beskid-logo.svg                      # source SVG
  windows/
    beskid.wxs                           # WiX v4 source: install dir + PATH env + uninstall
    build-msi.sh
  macos/Formula/beskid.rb.tpl            # homebrew-releaser renders version+sha into this
  arch/
    PKGBUILD
  deb/
    debian/{control,postinst,prerm}
    build-deb.sh
  snap/snapcraft.yaml
  scripts/
    fetch-rolling-assets.sh
    resolve-version.sh
```

Superrepo additions:
- `.gitmodules` — new `beskid_distrib` entry (relative URL `../beskid_distrib.git`).
- `.github/workflows/distribute.yml` — the orchestration.
- `docs/distribution/SECRETS.md` — copy of the secret inventory (so it's
  readable without checking out the submodule).

## homebrew-releaser cross-repo constraint

`homebrew-releaser` reads its release from the workflow's own repo
(`github.repository`). The CLI binaries live on `beskid_compiler`, not the
superrepo. **Resolution:** the `macos-brew` job first downloads the
`aarch64-apple-darwin` asset from `beskid_compiler`'s `cli-latest` release,
computes its sha256, then runs `homebrew-releaser` with `strategy: bin` plus a
pre-rendered formula passed via `homebrew_releaser_formula_path` — i.e. we
generate `Formula/beskid.rb` ourselves from the template (with the correct
cross-repo download URL + sha256 + version), and the action only commits it to
the tap. This sidesteps the action's same-repo release assumption while still
using it for the tap-push mechanics and PAT handling.

## Secrets inventory (full list in SECRETS.md)

| Secret | Used by | Purpose |
|---|---|---|
| `DISTRIB_GH_PAT` | all platform jobs | PAT with `repo` (+ `read:packages`) scope to read `beskid_compiler` releases (private org) and upload assets back. |
| `HOMEBREW_TAP_GIT_TOKEN` | macos-brew | PAT with `repo` on `beskid_homebrew` (homebrew-releaser cross-pushes). |
| `AUR_SSH_PRIVATE_KEY` | arch-aur | AUR deploy key (ed25519). |
| `AUR_USERNAME` / `AUR_EMAIL` | arch-aur | Commit identity for AUR commits. |
| `SNAPCRAFT_STORE_CREDENTIALS` | linux-snap | Snap Store login (legacy `SNAPCRAFT_TOKEN` deprecated). |

## Testing / verification

- `distribute.yml` is gated by the version-unchanged guard, so re-runs are cheap.
- Each platform job uses `continue-on-error: false` but the matrix is
  `fail-fast: false`, so partial publishes are visible.
- Manual `workflow_dispatch` input (`force: true`) bypasses the version guard
  for forced re-publishes.
- The workflow is linted locally via `actionlint` before commit (already used
  elsewhere in the repo's CI hygiene).
