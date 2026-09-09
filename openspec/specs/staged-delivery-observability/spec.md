# staged-delivery-observability Specification

## Purpose
Require AppVeyor gates before platform publication, immutable image identity, Watchtower-only production reconciliation, and end-to-end delivery traceability.
## Requirements
### Requirement: CI blocks unsafe integration
Pull-request and main-branch AppVeyor builds SHALL require relevant format, type, unit, integration, conformance, OpenSpec, Compose, and security gates before platform artifacts may be published.

#### Scenario: A required smoke or conformance gate fails
- **GIVEN** a platform image was built successfully
- **WHEN** any required validation gate fails
- **THEN** no immutable image or mutable production tag is published

### Requirement: Platform images retain immutable identities
The AppVeyor publication pipeline SHALL publish every platform image with an immutable full-commit `sha-*` tag and SHALL update its controlled `production` tag only after every platform validation and image-build gate in that publication job succeeds.

#### Scenario: A main build publishes the platform
- **GIVEN** a trusted main-branch AppVeyor build passed every platform gate
- **WHEN** the five platform images are published
- **THEN** each image is addressable as `cr.beskid-lang.org/beskid/<lane>:sha-<full-git-sha>` and by its controlled `production` tag

### Requirement: Watchtower is the exclusive platform deployment authority
Watchtower SHALL be the only automated component permitted to reconcile published platform images into production. AppVeyor and GitHub Actions MUST NOT start, replace, restart, roll back, or otherwise control production platform containers.

#### Scenario: CI publishes a new production tag
- **GIVEN** AppVeyor published a validated platform `production` tag
- **WHEN** production changes to that image
- **THEN** the change is attributable to Watchtower reconciliation rather than a CI deployment action

### Requirement: Delivery is traceable end to end
CI and deployment observations SHALL preserve the AppVeyor build identity, source commit, registry image identity, Watchtower reconciliation evidence, service startup, and public health result without granting CI deployment authority.

#### Scenario: Operator investigates a deployment
- **GIVEN** an AppVeyor build identity and a deployed platform image
- **WHEN** the operator follows its deployment evidence
- **THEN** the exact commit, OpenSpec revision, immutable registry tag, Watchtower status, and public health result are available

### Requirement: Production failures are never suppressed
Platform validation, registry login, image builds, publication, and production health observations MUST fail closed; missing credentials or non-success responses MUST NOT be converted to warnings or ignored exit codes.

#### Scenario: Registry credentials are unavailable
- **GIVEN** a trusted main-branch publication was requested
- **WHEN** required private-registry credentials are missing
- **THEN** the AppVeyor job stops before publication with a failing status

### Requirement: Pull requests cannot publish or deploy
Pull-request builds MUST NOT receive registry publication credentials, publish platform images, write production tags, or invoke a deployment controller.

#### Scenario: A pull request executes untrusted build code
- **GIVEN** AppVeyor is validating a pull request
- **WHEN** the pull request runs the platform lane
- **THEN** validation may run but registry publication and production reconciliation remain unavailable
