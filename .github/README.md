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

On a fresh trusted push to `main`, the three native compiler jobs must first
complete the `compiler-validation` fan-in. Only then does `linux-platform`
run the remaining gates and publish these images to the private registry:

- `cr.beskid-lang.org/beskid/site`
- `cr.beskid-lang.org/beskid/learn`
- `cr.beskid-lang.org/beskid/tracker`
- `cr.beskid-lang.org/beskid/nexus`
- `cr.beskid-lang.org/beskid/pckg`

The platform lane first pushes only `sha-<full-commit>` identities and records
their registry digests. After live package publication succeeds, it pulls those
immutable images and advances the five `production` tags; it never rebuilds for
promotion. The resulting AppVeyor artifact contains exactly five digest-backed
image records plus the source, build, and job identities. Pull requests, tags,
manual/API and scheduled builds, rebuilds, and incomplete-job reruns cannot
mutate either registry. AppVeyor requires `REGISTRY_USERNAME`,
`REGISTRY_PASSWORD`, and `BESKID_PCKG_API_KEY` as secure variables with
pull-request access disabled.

CI stops after publication. It does not invoke Compose, Coolify, Watchtower, or
any production control API. The production Compose project under
[`beskid_sites/deploy/`](../beskid_sites/deploy/) is the runtime authority, and
Watchtower alone reconciles its `production` tags asynchronously. Five registry
repositories cannot be promoted atomically, so the digest manifest establishes
the intended common source SHA; operator observation establishes eventual
production convergence.

The repository behavior is contract-tested, but activation remains pending a
live AppVeyor account proof: the complete hosted `linux-platform` job must fit
within the fixed 60-minute limit or move to a private/BYOC worker. Private
nested-submodule checkout also needs a pinned-commit, no-secret-PR proof on all
three native workers (or a deliberately redesigned PR gate) before AppVeyor is
made a required publishing authority.

The compiler release workflow is manual by design. Its inputs bind the release
to the exact AppVeyor source SHA, build identity, and successful gate result.
Set `COMPILER_RELEASE_TOKEN` (or `COMPILER_SUBMODULE_TOKEN`) with `contents: write`
on `beskid_compiler` when publishing a release.

## Local validation

- Full replacement contracts: `bash scripts/ci/test/run-cicd-foundation-tests.sh`
- AppVeyor event/publish contract: `bash scripts/ci/test/appveyor-migration-contract.test.sh`
- Production runtime contract: `bash scripts/ci/test/production-watchtower-contract.test.sh`
- Aggregate local checks: `./validate-ci-local.sh`
