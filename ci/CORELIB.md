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
- Jobs: `version` + `publish` on `main` and `v*` tags
- Nox session: `publish_corelib` (in `compiler/corelib/noxfile.py`)
- Script: `compiler/corelib/ci/publish_corelib.py`
- Auth secret: `BESKID_PCKG_KEY` (mapped to `BESKID_PCKG_API_KEY`)
- Package identity: `beskid_corelib`
- Version source: VSCode-mirrored semver logic in `compiler/corelib/ci/version.py`
