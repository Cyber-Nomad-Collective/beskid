# Nested `corelib` (beskid_standard)

The compiler lists `corelib` in [compiler/.gitmodules](/home/fp-pmikstacki/Private/pecan/compiler/.gitmodules) pointing at `beskid_standard`. When that submodule is initialized in your clone:

1. Add a `noxfile.py` at the root of **beskid_standard** (same pattern as [pckg/noxfile.py](/home/fp-pmikstacki/Private/pecan/pckg/noxfile.py) — sessions + `ci/requirements.txt` with Nox).
2. Optionally add `.github/workflows/ci.yml` that runs `pip install -r ci/requirements.txt` and `python -m nox --non-interactive -s <sessions>`.
3. Wire calls from the compiler aggregate CI only if the standard library gains its own build/test steps that must run on every compiler PR.

Until `corelib` is checked out and its real build commands are known, no automation was added inside that submodule in this migration.
