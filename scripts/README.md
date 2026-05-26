# Superrepo scripts

## Environment setup

[`setup-environment.sh`](setup-environment.sh) is the main entry for a fresh or partial checkout:

```bash
./scripts/setup-environment.sh
```

It installs [Google's `repo` tool](https://gerrit.googlesource.com/git-repo/) (via [`install-repo-tool.sh`](install-repo-tool.sh)), checks whether `repo` is on `PATH` (and prints shell profile hints if not), runs `repo init` / `repo sync` against [`manifests/default.xml`](../manifests/default.xml), and runs `bun install` at the monorepo root when Bun is available.

Set `REPO_VERBOSE=1` for full `repo version` output from `install-repo-tool.sh`.

### Alternatives

| Goal | Command |
|------|---------|
| Git submodules only (no `repo`) | `./scripts/setup-environment.sh --submodules` |
| Include optional `references/bsharp` | `./scripts/setup-environment.sh --bsharp` or `BESKID_WITH_BSHARP=1` |
| Skip JS install | `BESKID_SKIP_JS_INSTALL=1 ./scripts/setup-environment.sh` |
| Manifest with bsharp by default | `BESKID_MANIFEST_FILE=manifests/with-bsharp.xml ./scripts/setup-environment.sh` |

### Fresh directory (repo-only workflow)

```bash
mkdir beskid && cd beskid
export PATH="${HOME}/.local/bin:${PATH}"
../beskid/scripts/install-repo-tool.sh   # or curl repo into ~/.local/bin
repo init -u https://github.com/Cyber-Nomad-Collective/beskid.git -m manifests/default.xml
repo sync
./scripts/setup-environment.sh         # from synced tree; skips re-init if .repo exists
```

### Local manifest overrides

Copy [`manifests/local_manifest.example.xml`](../manifests/local_manifest.example.xml) to `local_manifest.xml` at the repo root (gitignored) to pin project revisions without editing the checked-in manifest.

`repo init` reads the manifest from the **remote** branch (`BESKID_MANIFEST_URL` / `BESKID_MANIFEST_BRANCH`). Until `manifests/` is on that branch, use `git clone` plus `./scripts/setup-environment.sh` (falls back to `git submodule` when `repo init` fails) or pass `--submodules`.

## Manifests

See [`manifests/default.xml`](../manifests/default.xml). Project paths match [`.gitmodules`](../.gitmodules), including nested `compiler/corelib` (`beskid_standard`).
