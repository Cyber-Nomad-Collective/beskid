# Corelib CI Notes

Corelib verification in this aggregate workspace is driven by compiler CI, while publishing authority is in `beskid_standard` CI.

## Quality gate

- Workflow: `compiler/.github/workflows/ci.yml`
- Job: `corelib-quality`
- Nox session: `corelib_quality`
- Checks:
  - `cargo test -p beskid_tests projects::corelib::`

## Release publish flow

- Workflow: `compiler/corelib/.github/workflows/ci.yml` (inside `beskid_standard`)
- Jobs: `publish` on `main` and `v*` tags (after `quality`)
- Nox session: `publish_corelib` (in `compiler/corelib/noxfile.py`)
- Script: `compiler/corelib/ci/publish_corelib.py`
- Auth secret: `BESKID_PCKG_KEY` (mapped to `BESKID_PCKG_API_KEY`)
- Package identity: `corelib` (sources under `compiler/corelib/beskid_corelib/`)
- Publish: CI builds `beskid_cli` from `beskid_compiler` and sets `BESKID_CLI_BIN` so `beskid pckg pack` / `upload` match the current registry protocol. `beskid pckg pack` writes semver into the artifact’s `package.json`; `upload` omits multipart `version` so **pckg** assigns the published semver (see `publish_corelib.py` output / `PCKG_PUBLISHED_VERSION=`). Optional helper: `compiler/corelib/ci/version.py` (`nox -s compute_version`).
