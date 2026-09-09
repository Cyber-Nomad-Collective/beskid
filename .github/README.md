# GitHub-native workflows

AppVeyor is the root CI authority for validation, compiler gates, package
publication, and the five platform images. The canonical configuration is
[`appveyor.yml`](../appveyor.yml), with implementation in
[`scripts/ci/`](../scripts/ci/).

GitHub Actions is retained only where the operation is intrinsically tied to
GitHub releases, distribution, editor marketplaces, or repository maintenance:

| Workflow | Purpose |
|----------|---------|
| `compiler-handoff-cleanup.yml` | Remove expired compiler release handoffs |
| `compiler-release.yml` | Explicitly publish CLI/LSP releases after recording a successful AppVeyor source build |
| `distribute.yml` | Publish compiler release artifacts to GitHub-native distribution channels |
| `publish-open-vsx.yml` | Publish the VS Code extension to Open VSX |
| `publish-zed-extension.yml` | Publish the Zed extension |

## Platform boundary

On a trusted `main` push, AppVeyor validates all gates and publishes these
images to the private registry:

- `cr.beskid-lang.org/beskid/site`
- `cr.beskid-lang.org/beskid/learn`
- `cr.beskid-lang.org/beskid/tracker`
- `cr.beskid-lang.org/beskid/nexus`
- `cr.beskid-lang.org/beskid/pckg`

Every published image receives `sha-<full-commit>` and `production` tags. Pull
requests and other untrusted events build without registry credentials and
cannot publish. AppVeyor requires `REGISTRY_USERNAME`, `REGISTRY_PASSWORD`, and
`BESKID_PCKG_API_KEY` as secure variables with pull-request access disabled.

CI stops after publication. It does not invoke Compose, Coolify, Watchtower, or
any production control API. The production Compose project under
[`beskid_sites/deploy/`](../beskid_sites/deploy/) is the runtime authority, and
Watchtower alone reconciles its `production` tags.

The compiler release workflow is manual by design. Its inputs bind the release
to the exact AppVeyor source SHA, build identity, and successful gate result.
Set `COMPILER_RELEASE_TOKEN` (or `COMPILER_SUBMODULE_TOKEN`) with `contents: write`
on `beskid_compiler` when publishing a release.

## Local validation

- Full replacement contracts: `bash scripts/ci/test/run-cicd-foundation-tests.sh`
- AppVeyor event/publish contract: `bash scripts/ci/test/appveyor-migration-contract.test.sh`
- Production runtime contract: `bash scripts/ci/test/production-watchtower-contract.test.sh`
- Aggregate local checks: `./validate-ci-local.sh`
