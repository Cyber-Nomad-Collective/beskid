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
- Registry packages (workspace members): `corelib`, `corelib_foundation`, `corelib_runtime`, `corelib_compiler_sdk`, `corelib_console`, `corelib_concurrency` — metadata in `workspace.package.json` and upserted before publish
- Publish: CI builds `beskid_cli`, runs `beskid pckg pack` per member to generate `.beskid/docs/`, zips the workspace (`Workspace.proj` + members), and calls `POST /api/workspaces/publish` so **pckg** assigns semver per package and rewrites path dependencies to registry references. Script prints `PCKG_PUBLISHED_VERSION=<package>@<version>` per member. Optional helper: `compiler/corelib/ci/version.py` (`nox -s compute_version`).
