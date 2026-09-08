---
title: Operate Nexus
description: Run the repository graph service behind its verified trust boundary.
pageKind: task
diagramPolicy: not-needed
diagramOmissionReason: The service contract table is clearer than a diagram for one service.
audience:
  - maintainer
  - service operator
authority:
  status: security-sensitive
  sourceLabel: Pinned Nexus deployment contract
  sourceHref: https://github.com/Cyber-Nomad-Collective/beskid_nexus/blob/eb207de7985ea110c1c0ea7e23f89dd94a66583d/COOLIFY.md
  limits: Nexus inherits third-party licensing and uses its own authentication boundary. This page does not replace that contract.
verified:
  revision: eb207de7985ea110c1c0ea7e23f89dd94a66583d
  date: 2026-09-08
---

Store Nexus tokens in the deployment secret manager. Do not print, commit, or expose `NEXUS_MCP_AUTH_TOKEN`, webhook secrets, or provider keys.

## Service contract

| Field | Verified value |
| --- | --- |
| Purpose | Interactive repository graph, indexed catalogue, and optional MCP access. |
| Audience | Readers inspect public graphs. Authorized maintainers manage repositories and MCP connections. |
| Public boundary | The public hostname must pass through the configured proxy trust boundary. Do not publish port `8452` directly. |
| Local boundary | Compose binds `127.0.0.1:8452`; the service stores data below `GITNEXUS_HOME`. |
| Authentication | The pinned Nexus contract uses Caddy and Authentik forward-auth headers. MCP can require a bearer token. |
| Persistent state | `nexus-data` persists `/data/gitnexus`, including indexes and generated code documentation. |
| Container image | `ghcr.io/cyber-nomad-collective/beskid-nexus`. |
| Health check | `GET /api/health` on port `8452`. |
| Deployment owner | The Nexus repository builds its service image. The platform lane supplies the runtime boundary. |
| Secret source | Deployment secrets include optional MCP, webhook, and OpenRouter values. Keep them in the configured lane store. |
| Monitoring | Health, index completion, and graph-load results show separate failure boundaries. |
| Recovery | Restore `nexus-data`, verify the proxy boundary, and re-index only after the stored catalogue is safe. |

## Prerequisites

Confirm the repository graph task and the configured `GITNEXUS_HOME`. Confirm that the forward-auth proxy protects the public hostname.

## Actions

1. Verify the service contract at `http://127.0.0.1:8452/api/health` without exposing port `8452` publicly.
2. Open the proxy-protected hostname.
3. Verify the repository catalogue.
4. Run one authorized catalogue analysis.
5. Wait for its terminal result.

## Expected result

The `/api/health` request succeeds. The selected repository graph loads from persistent state, and forward-auth controls management functions.

## Recovery

If health fails, inspect the image and `nexus-data` mount. If only sign-in fails, restore the proxy header contract and redeploy. If an index is corrupt, restore its data or remove only that verified index, then run a controlled re-index.

## Next task

[Review service containers and volumes](/docs/operations/containers/).
