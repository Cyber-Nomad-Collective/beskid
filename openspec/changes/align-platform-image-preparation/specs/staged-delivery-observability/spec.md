## ADDED Requirements

### Requirement: Required platform images prepare an exact dependency graph

Before a required Node-based platform image performs a frozen package install,
its Docker build SHALL contain every workspace manifest and every local `file:`
package source resolved by that image's selected lockfile. The selected
lockfile SHALL match those manifests. A missing source, an unresolved package
alias, or a stale lockfile MUST fail the image build before publication.

#### Scenario: A Node image consumes shared Beskid packages

- **GIVEN** an image dependency graph contains packages from
  `beskid_web_common`
- **WHEN** the immutable image is built
- **THEN** the Docker build receives those package sources before its frozen
  install and the install resolves them without registry fallback

#### Scenario: An image lockfile is stale

- **GIVEN** a selected image lockfile does not match a copied package manifest
- **WHEN** its frozen install runs
- **THEN** the image build fails before it can publish a digest

#### Scenario: A required image lane is evaluated

- **GIVEN** platform delivery evaluates required image lanes
- **WHEN** repository delivery-contract tests run
- **THEN** they verify each lane's declared build context can provide its
  selected lockfile and all required local workspace sources
