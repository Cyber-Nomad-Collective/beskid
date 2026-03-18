---
title: Package Management
description: Maintainer controls for ownership, publishing, and security policy.
---

## Management capabilities

- Edit package visibility: `public`, `internal`, `unlisted`.
- Manage owners and role-based permissions.
- Rotate API keys with package-level scope.
- Attach policy notes for future reviewers.

## Security baseline

- Require verified email and strong MFA for maintainers.
- Notify maintainers on sensitive account changes.
- Enforce scoped API keys, not account-password publishing.
- Reserve short-lived OIDC publishing tokens for CI when available.

## Recommended API surfaces

- `GET /api/packages` for listing/filtering.
- `POST /api/packages/{id}/review-actions` for moderation outcomes.
- `PATCH /api/packages/{id}/policy` for visibility/owner/security policy updates.
- `POST /api/packages/{id}/api-keys` for scoped key provisioning.
