# Automatic Production Promotion Design

## Goal

Deploy production automatically from the same Platform delivery run after staging has completed successfully, using the exact immutable release manifest that staging deployed.

## Delivery Contract

The `platform-delivery.yml` workflow owns the complete promotion chain:

`images -> release manifest -> staging apply and smoke -> production apply and smoke`

The production reusable-workflow call depends directly on the staging job with `needs: staging` and runs only when both the manifest and staging jobs succeeded. It receives the originating workflow run ID, so it downloads and verifies the identical release-manifest artifact. Existing exact-digest verification, OpenBao synchronization, Coolify deployment, smoke checks, status polling, and rollback remain unchanged.

The manual `promote-production.yml` dispatch workflow is removed. It would be a second way to promote an artifact and would no longer satisfy the single-chain deployment model.

## Environment Policy

The checked-in workflow continues to name the `production` environment for production-only secrets and deployment records. A repository administrator must remove its required reviewers and self-review prevention in GitHub environment settings. The `main`-only branch policy remains enabled. This external setting cannot be changed by workflow YAML.

## Normative Change

Update staged-delivery observability so production promotion is automatic after a successful staging deployment, instead of occurring after manual approval. Production failures remain fail-closed and retain smoke/SLO/rollback behavior.

## Validation

- Workflow YAML includes production only after successful `manifest` and `staging` jobs.
- The production call uses the same `github.run_id` manifest source as staging.
- The manual workflow is absent.
- Shell delivery-policy tests and smoke-test scripts remain syntactically valid.
- OpenSpec catalog/standard validation accepts the revised requirement.

