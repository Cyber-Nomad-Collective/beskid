## ADDED Requirements

### Requirement: Required platform images prepare an exact dependency graph

Before a required Node-based platform image performs a frozen package install,
its Docker build SHALL contain every workspace manifest and every local `file:`
package source resolved by that image's selected lockfile. The selected
lockfile SHALL match those manifests. A missing source, an unresolved package
alias, or a stale lockfile MUST fail the image build before publication.

When the Docker context excludes generated output and a file-linked shared
package exports compiled artifacts, the image SHALL build that package after
the frozen install and before the consuming application build. The image MUST
NOT depend on generated artifacts from a developer checkout or from a prior
Docker cache layer.

#### Scenario: A Node image consumes shared Beskid packages

- **GIVEN** an image dependency graph contains packages from
  `beskid_web_common`
- **WHEN** the immutable image is built
- **THEN** the Docker build receives those package sources before its frozen
  install and the install resolves them without registry fallback

#### Scenario: A shared package exports a generated entrypoint

- **GIVEN** the Docker context excludes generated `dist` directories and a
  consumed shared package exports `dist/index.js`
- **WHEN** the immutable image builds its application
- **THEN** it rebuilds the shared package after its frozen install, so the
  application resolves the linked export without relying on ambient artifacts

#### Scenario: A compiler-backed image stages an ABI-v5 runtime kit

- **GIVEN** a required platform image builds a release CLI and invokes the canonical
  `compiler/scripts/stage-native-runtime-kit.sh` entrypoint
- **WHEN** its immutable compiler stage is assembled
- **THEN** the stage contains that entrypoint and its required compiler-script helpers before
  invocation, builds and stages the CLI and kit in one cache-mounted instruction under one
  explicit Cargo target prefix, copies both into a durable image-layer directory, and publishes
  only that CLI with the resulting installed runtime kit

#### Scenario: A Linux compiler image stages native runtime objects

- **GIVEN** a Linux compiler-backed image invokes canonical ABI-v5 runtime-kit staging
- **WHEN** it assembles native context, TLS, and host-shim objects
- **THEN** the build stage installs and proves availability of the canonical `clang`/`lld`
  toolchain before staging; a missing linker remains a hard failure

#### Scenario: An image lockfile is stale

- **GIVEN** a selected image lockfile does not match a copied package manifest
- **WHEN** its frozen install runs
- **THEN** the image build fails before it can publish a digest

#### Scenario: A required image lane is evaluated

- **GIVEN** platform delivery evaluates required image lanes
- **WHEN** repository delivery-contract tests run
- **THEN** they verify each lane's declared build context can provide its
  selected lockfile, all required local workspace sources, and every canonical
  compiler staging entrypoint invoked by the image

#### Scenario: A delivered image is rendered into Compose

- **GIVEN** a required platform image repository is present in the immutable
  release manifest
- **WHEN** the release Compose template is rendered
- **THEN** exactly one Compose service references that repository; a required
  lane's service is active in the default Compose topology whenever its lane
  health URL is included in post-deploy smoke checks, and a missing, duplicate,
  or profile-gated required mapping fails before deployment

### Requirement: Local delivery validation uses Podman

Developer-machine Compose validation SHALL invoke Podman through one checked
container-engine boundary. GitHub Actions image publication SHALL retain its
Docker BuildKit implementation. A missing selected engine or an unsupported
engine selector MUST fail before release planning can continue.

#### Scenario: A developer validates an immutable release plan

- **GIVEN** release planning runs outside GitHub Actions without an explicit
  container-engine override
- **WHEN** it validates the rendered Compose document
- **THEN** it invokes `podman-compose` and fails if that Podman provider is unavailable

#### Scenario: GitHub Actions validates an immutable release plan

- **GIVEN** release planning runs in GitHub Actions
- **WHEN** it validates the rendered Compose document
- **THEN** it invokes Docker Compose and leaves Docker BuildKit image publication unchanged
