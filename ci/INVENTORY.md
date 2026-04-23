# CI job → Nox session mapping

Superrepo ([pecan](/home/fp-pmikstacki/Private/pecan)) — workflows under [.github/workflows](/home/fp-pmikstacki/Private/pecan/.github/workflows), sessions in [noxfile.py](/home/fp-pmikstacki/Private/pecan/noxfile.py).

| Workflow | GitHub job | Nox session | Notes |
|----------|------------|-------------|--------|
| runtime-ci.yml | runtime-linux | `runtime_linux` | Submodule `compiler`, Rust stable |
| runtime-ci.yml | runtime-e2e-linux | `runtime_e2e_linux` | |
| runtime-ci.yml | runtime-linux-sanitized | `runtime_asan_linux` | Nightly + ASan env |
| runtime-ci.yml | runtime-macos-check | `runtime_macos_check` | |
| runtime-ci.yml | runtime-windows-check | `runtime_windows_check` | |
| pckg-ci.yml | test | `pckg_unit_tests` | Submodule `pckg`, .NET 10 |
| publish-open-vsx.yml | publish (matrix) | `open_vsx_publish` | Env: `OPENVSX_PLATFORM`, `OPENVSX_BIN_NAME`, `OVSX_TOKEN` |

Compiler submodule ([compiler](/home/fp-pmikstacki/Private/pecan/compiler)) — [.github/workflows/ci.yml](/home/fp-pmikstacki/Private/pecan/compiler/.github/workflows/ci.yml), sessions in [compiler/noxfile.py](/home/fp-pmikstacki/Private/pecan/compiler/noxfile.py).

| Job | Nox session |
|-----|-------------|
| workspace-check | `workspace_check` |
| test | `test` |
| abi-contracts | `abi_contracts` |
| bench-compile | `bench_compile` |
| e2e-linux | `e2e_linux` |
| runtime-asan-linux | `runtime_asan_linux` |
| extern-engine-security | `extern_engine_security` |
| e2e-macos-smoke | `e2e_macos_smoke` |
| e2e-windows-smoke | `e2e_windows_smoke` |
| version | `compute_version` | Env: `GITHUB_REF`, `GITHUB_REF_NAME`, `GITHUB_EVENT_NAME`, `GITHUB_OUTPUT` |
| release-cli-build | `release_cli` | Env: `RELEASE_VERSION`, `MATRIX_TARGET`, `MATRIX_ASSET_NAME`, `RUNNER_OS`; uploads artifact per matrix row |
| release-cli-publish | `softprops/action-gh-release@v2.3.3` | `permissions: contents: write`; downloads matrix artifacts then creates/updates release for tag `cli-latest` with `target_commitish` `${{ github.sha }}` |

pckg submodule — [pckg/noxfile.py](/home/fp-pmikstacki/Private/pecan/pckg/noxfile.py), standalone workflow [pckg/.github/workflows/ci.yml](/home/fp-pmikstacki/Private/pecan/pckg/.github/workflows/ci.yml).

| Context | Nox session |
|---------|-------------|
| Unit tests (Server.Tests.Unit) | `unit_tests` |

Nested **corelib** (`beskid_standard`, path `compiler/corelib`): not checked out in this tree. When the submodule is present, add a `noxfile.py` there using the same pattern as `pckg` (sessions callable from compiler CI). See [ci/README.md](README.md#nested-corelib-beskid_standard).
