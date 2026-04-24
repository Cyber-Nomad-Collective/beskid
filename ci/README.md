# Pecan CI scripting

Build and test logic lives in **Python + Nox** so GitHub Actions stays a thin trigger layer (checkout, toolchain setup, cache, one `nox` invocation).

## Layout

- [requirements.txt](requirements.txt) — install with `pip install -r ci/requirements.txt` before running Nox at the superrepo root.
- [INVENTORY.md](INVENTORY.md) — mapping from workflow jobs to Nox sessions.
- [submodules.py](submodules.py) — `git submodule` helpers for aggregate CI.
- [open_vsx.py](open_vsx.py) — Open VSX publish steps (LSP build, bundle, VSIX, `ovsx`).
- [docker/](docker/) — optional local images (Rust / .NET) for reproducible runs; GitHub-hosted runners still use `actions/*` setup + host `cargo`/`dotnet` for cache compatibility.

## Superrepo usage

From repository root (after submodules and toolchains are on `PATH`):

```bash
python -m venv .venv && . .venv/bin/activate
pip install -r ci/requirements.txt
python -m nox --non-interactive -s runtime_linux
```

On distributions with PEP 668 (e.g. Arch), use a virtual environment as above instead of `pip install` to the system interpreter.

## Optional Docker (local)

If `PECAN_CI_DOCKER=1` and `docker` is available, some sessions can be extended to run inside `ci/docker/*` images. Default paths use the host toolchain so GitHub Actions `rust-cache` and native macOS/Windows jobs behave like today.

## Nested corelib (beskid_standard)

Corelib quality validation runs in compiler CI, while publishing authority is in `beskid_standard` CI:

- compiler CI runs `corelib-quality` (`python -m nox -s corelib_quality`) for integration safety;
- `beskid_standard` CI publishes **`corelib`** on `main`/`v*` through its local workflow and `noxfile.py`;
- `beskid_standard` publish uses `BESKID_PCKG_KEY` (mapped to `BESKID_PCKG_API_KEY`) and installs/downloads Beskid CLI for `pckg pack/upload`.

See [CORELIB.md](CORELIB.md) for the detailed flow.
