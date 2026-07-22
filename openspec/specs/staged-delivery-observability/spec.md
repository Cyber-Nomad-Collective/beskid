# staged-delivery-observability Specification

## Purpose
Require CI gates before promotion, digest-addressed artifact promotion, distinct staging and production environments, and end-to-end delivery traceability.
## Requirements
### Requirement: CI blocks unsafe integration
Pull-request and main-branch workflows SHALL require relevant format, type, unit, integration, conformance, OpenSpec, Compose, and security gates before artifacts may be promoted.

#### Scenario: A required smoke or conformance gate fails
- **GIVEN** an artifact was built successfully
- **WHEN** any required validation gate fails
- **THEN** no staging or production deployment job can start

### Requirement: Artifacts are built once and promoted by digest
The delivery pipeline SHALL publish immutable SHA-addressed artifacts with SBOM, provenance, vulnerability results, and signatures, then SHALL deploy the exact same digest manifest to staging and production without rebuilding or substituting mutable tags.

#### Scenario: A release is promoted
- **GIVEN** staging passed for a signed manifest
- **WHEN** the staging deployment, smoke checks, and rollback policy complete successfully
- **THEN** production receives the identical image digests verified in staging

### Requirement: Staging and production are distinct protected environments
The deployment system SHALL implement automatic staging deployment from main followed by automatic production promotion only after the same run's staging deployment, smoke checks, and rollback policy succeed. Production SHALL retain environment-specific secrets, URLs, policy gates, health checks, and rollback targets.

#### Scenario: Production health check fails
- **GIVEN** a previous healthy manifest exists
- **WHEN** post-deployment smoke or SLO checks fail
- **THEN** deployment is marked failed and rollback restores the previous manifest

### Requirement: Delivery is traceable end to end
CI and deployment jobs SHALL emit a shared correlation identifier and OpenTelemetry-compatible trace context across workflow, build, registry, deployment API, service startup, smoke checks, and rollback reporting.

#### Scenario: Operator investigates a deployment
- **GIVEN** a GitHub Actions run identifier
- **WHEN** the operator follows its deployment evidence
- **THEN** the exact commit, OpenSpec revision, artifact digests, environment, deployment status, smoke results, and trace identifier are available

### Requirement: Production failures are never suppressed
Production secret audits, deployment API calls, status polling, smoke checks, and release gates MUST fail closed; missing credentials or non-success responses MUST NOT be converted to warnings or ignored exit codes.

#### Scenario: OpenBao credentials are unavailable
- **GIVEN** a production deployment was requested
- **WHEN** required secret-audit credentials are missing
- **THEN** the workflow stops before deployment with a failing status
