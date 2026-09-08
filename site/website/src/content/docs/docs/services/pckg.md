---
title: Operate pckg
description: Run and verify the Rust package registry and its persistent stores.
audience:
  - package author
  - service operator
authority:
  status: security-sensitive
  sourceLabel: Pinned pckg service contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_pckg/blob/a490c7c7aa3fa7a7b28245e0c7564849d36eb19c/README.md
  limits: This page does not authorize registry mutations or disclose database or bearer credentials.
verified:
  revision: a490c7c7aa3fa7a7b28245e0c7564849d36eb19c
  date: 2026-09-08
---

Keep database and publisher credentials in OpenBao or an approved secret manager. Do not print, commit, or expose a credential in logs.

## Service contract

| Field | Verified value |
| --- | --- |
| Purpose | Rust package registry with a React catalogue client. |
| Audience | Consumers browse and download. Authorized package authors publish. Operators maintain storage. |
| Public boundary | `https://pckg.beskid-lang.org`; public catalogue and download routes can remain available. |
| Local boundary | The reference service listens on `http://localhost:8082` and uses a local PostgreSQL service. |
| Authentication | CLI publication uses pckg bearer keys. Protected browser mutations fail closed without a trusted forward-auth boundary. |
| Persistent state | PostgreSQL stores registry records. `pckg_packages` stores package artifacts at `/app/packages`. |
| Container image | `ghcr.io/cyber-nomad-collective/beskid-pckg`. |
| Health check | `GET /health/ready` on port `8082`. |
| Deployment owner | Root platform delivery builds the Rust service and web client, then Coolify runs the Compose profile. |
| Secret source | OpenBao path `secret/beskid/<lane>/pckg`; it supplies the canonical `PCKG_DATABASE_URL`. |
| Monitoring | Readiness, PostgreSQL health, and publication errors identify the failing boundary. |
| Recovery | Restore database and artifact volume as one consistent set. Roll back the image digest on a runtime regression. |

## Prerequisites

Confirm that the package registry PostgreSQL service responds and that `PCKG_DATABASE_URL` came from the lane secret path. Confirm that the artifact volume mount exists before publication.

## Actions

1. Verify the service contract at `http://localhost:8082/health/ready` from inside the service network.
2. Verify the public catalogue with a read-only request before any service contract mutation.
3. Check that PostgreSQL uses its documented persistent volume.
4. Check that `/app/packages` uses the `pckg_packages` volume.

## Expected result

The `/health/ready` request succeeds. PostgreSQL contains registry records, and the artifact volume contains the matching immutable package files.

## Recovery

If readiness fails, inspect database connectivity without showing `PCKG_DATABASE_URL`. If records and files differ, stop publication and restore a consistent backup. If a new image caused the failure, redeploy the previous digest.

## Next task

[Publish a package](/docs/packages/publish/).
