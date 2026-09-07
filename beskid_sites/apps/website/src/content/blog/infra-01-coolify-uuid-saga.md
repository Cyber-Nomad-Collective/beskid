---
title: "The Coolify UUID That Took Three Days to Find, and the GHCR Token That Had Scope Mismatch"
description: "July 2026. Beskid's staging deploy broke because Coolify needed a service UUID that nobody had documented. Then GHCR accepted the login but rejected the push because the token had read:packages but not write:packages. Infrastructure is a distributed systems problem."
date: 2026-07-22
blogStatus: released
release: Infrastructure
---

Infrastructure configuration is not configuration. It is a distributed consensus problem where the participants are YAML files, shell scripts, CI environments, and a container registry that silently accepts tokens with insufficient scope. The Coolify staging deploy saga is how Beskid learned this — over three days, across five commits, through two separate root causes that had nothing to do with each other except that they both blocked the deploy.

The commits: `08c630ca` (Pin beskid_infra with Coolify staging service UUID), `a178056c` (unblock Coolify startup uploads permissions), `7a825384` (Coolify staging deploy without deployment UUID), `af696b8f` (fall back to lane service_uuid for Coolify sync), `42289e61` (Pin beskid_infra Coolify staging UUID). Five commits. One staging deploy. Three days.

## Day 1: The missing UUID

The staging deploy failed with an error nobody had seen before: Coolify Compose needed a service UUID. The deploy script didn't have one. Nobody knew where the UUID was supposed to come from. The Coolify documentation mentioned service UUIDs in passing — "each service has a UUID for identification" — but didn't explain where they were stored or how to retrieve them programmatically.

The answer: the UUID lives in `beskid_infra/config/coolify-*.json`, in a field called `service_uuid` inside the lane JSON configuration. Each deployment lane — staging, production, preview — has its own Coolify config file. Each config file has a service UUID assigned by Coolify when the service was created. The deploy script just wasn't reading it.

`af696b8f` added the fallback: if the deploy script can't find the UUID in the environment, it reads the lane JSON from `beskid_infra/config/` and extracts `service_uuid`. `08c630ca` pinned the staging UUID explicitly in the deploy configuration so the fallback wouldn't be needed on every deploy. `42289e61` pinned it again after a configuration drift undone the first pin.

The pattern is familiar to anyone who has done infrastructure work: you add a fallback, the fallback works, you pin the value so the fallback becomes dead code, the pin drifts, you re-pin it. Infrastructure configuration is not a one-time setup. It is a garden that grows weeds when you're not looking.

## Day 2: The GHCR token scope mismatch

The UUID was fixed. The deploy still failed. This time the error came from GHCR — the GitHub Container Registry. The deploy script logged in successfully. The push failed with "denied: requested access to the resource is denied."

The error message was misleading. "Access denied" usually means the token is wrong or expired. The token was fresh. The login had succeeded. What the error actually meant: the token had `read:packages` scope but not `write:packages` scope. GHCR accepted the token for login because login only requires read access. The push required write access, and GHCR rejected it — not with "insufficient scope" but with "access denied."

`a178056c` fixed the permissions: the GitHub Actions workflow that generates the GHCR token was updated to request `write:packages` scope. The fix was one line in a workflow YAML file. Finding it took a day of ruling out every other possible cause: the image tag, the registry URL, the Docker daemon version, the network egress rules.

## The OpenBao secrets layer

Underneath both problems runs a secrets management pipeline: OpenBao at `secret/beskid/staging/*`, synchronized via `just sync-env-staging` and `sync-runtime-env.sh`. The Coolify service UUID lives in GitHub staging environment secrets, synced from OpenBao. The GHCR token lives in GitHub Actions secrets, also synced from OpenBao. The sync scripts are shell. The secrets are JSON. The pipeline is three tools and two handoffs.

When the UUID was missing, the sync had worked — the secret existed in OpenBao and in GitHub. The deploy script just wasn't reading the right variable name. The secret was present and ignored. When the GHCR token had the wrong scope, the secret was present and used — it was just the wrong secret for the operation. Both failures look like "missing configuration" but are actually different classes of error: one is a wiring bug (the variable isn't connected), the other is a semantic bug (the value is wrong for the operation).

## What infrastructure work actually is

The Coolify staging deploy saga is not glamorous. Coolify Compose, OpenBao secrets, GHCR tokens, lane JSON — none of these are the language. None of them are the compiler. None of them will ever appear in a conference talk about Beskid's type system or its GC design. They are the reason the staging environment exists.

Infrastructure work is the work that makes other work visible. Without the staging deploy, nobody can see the compiler's latest changes running in a production-like environment. Without the staging deploy, the CI pipeline that runs integration tests against a live service is testing against stale binaries. The Coolify UUID is not important. The staging deploy it unblocked is. The GHCR token scope is not important. The container push it enabled is.

Cross-reference Book chapter "It works on my machine." The chapter is about the gap between development and production. The Coolify UUID saga is that gap in physical form: a configuration value that exists on one machine and not another, a token that works for one operation and not another, a deploy that succeeds on a laptop and fails in CI. The gap is not a metaphor. It is a service UUID in a JSON file that nobody documented.

Infrastructure failures are never about the thing that broke. They are about the assumption that broke it: "the UUID will be in the environment," "the token has write scope," "the sync script ran successfully." Every one of those assumptions was reasonable. Every one of them was wrong. The three days were spent finding which assumptions were wrong and which ones were just untested.

## Provenance

[`08c630ca` — Pin beskid_infra with Coolify staging service UUID](https://github.com/Cyber-Nomad-Collective/beskid/commit/08c630ca) — [`a178056c` — unblock Coolify startup uploads permissions](https://github.com/Cyber-Nomad-Collective/beskid/commit/a178056c) — [`42289e61` — Pin beskid_infra Coolify staging UUID](https://github.com/Cyber-Nomad-Collective/beskid/commit/42289e61)
