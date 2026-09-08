---
title: Operate Authentication
description: Configure and recover the central Beskid authentication boundary.
audience:
  - service operator
  - maintainer
authority:
  status: security-sensitive
  sourceLabel: Pinned auth hub contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid/blob/90c40a91fefa8150134663de120afcb1ef582f2a/site/auth/README.md
  limits: This page does not contain credentials. The deployed auth and infrastructure contracts control the service.
verified:
  revision: 90c40a91fefa8150134663de120afcb1ef582f2a
  date: 2026-09-08
---

Store every credential in OpenBao or another approved secret manager. Do not print, commit, or copy a secret into this page, a command argument, or an issue.

## Service contract

| Field | Verified value |
| --- | --- |
| Purpose | Central GitHub OAuth, account UI, and handoff for paired services. |
| Audience | Users sign in. Hub administrators pair and recover services. |
| Public boundary | `https://auth.beskid-lang.org`; the proxy terminates public TLS. |
| Local boundary | The service listens on `http://localhost:8090` in the local reference setup. |
| Authentication | GitHub OAuth stays in the hub. A pairing code creates a per-service service token. |
| Persistent state | SQLite data persists in the `auth-data` volume. |
| Container image | `ghcr.io/cyber-nomad-collective/beskid-auth`. |
| Health check | `GET /api/v1/health` on port `8090`. |
| Deployment owner | The root platform delivery publishes the image. The Coolify Compose lane runs it. |
| Secret source | OpenBao path `secret/beskid/<lane>/auth`. |
| Monitoring | Container health and the public health request identify service availability. |
| Recovery | An existing administrator adds a login. A controlled setup-token procedure is the next option. Restore SQLite before destructive recovery. |

## Prerequisites

Confirm that the public URL uses GitHub OAuth and that `AUTH_HUB_PUBLIC_URL` is the exact external origin. Obtain authorized access to the lane secret manager.

## Actions

1. Confirm that `SESSION_SECRET`, the GitHub OAuth values, and `AUTH_HUB_PUBLIC_URL` exist in the lane secret path without displaying their values.
2. Verify the service contract with `https://auth.beskid-lang.org/api/v1/health` and record only its status.
3. Use `/admin/pairing` to create a short-lived pairing code for the named consumer service.
4. Complete pairing from the consumer and verify the returned service token stays in the consumer secret store.

## Expected result

The health endpoint succeeds. A pairing code creates a service token for the selected service. GitHub OAuth returns the user to that service, and SQLite retains hub configuration across a redeploy.

## Recovery

If pairing fails, discard the pairing code and create a new code. If administrator access fails, ask an existing administrator to restore access. Use the documented setup-token recovery only in a controlled session, then rotate the token and redeploy. Restore the `auth-data` backup before you clear stored administrators.

## Next task

[Deploy and roll back services](/docs/operations/deployment/).
