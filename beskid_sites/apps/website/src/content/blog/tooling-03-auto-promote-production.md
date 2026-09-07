---
title: "Green Staging Means Production: The Auto-Promotion Contract"
description: "July 2026. Beskid CI learned to auto-promote production after staging passed. No manual approval gates. No 'someone should click the button.' If staging is green, production follows. The contract, the Coolify sync, and why this matters."
date: 2026-07-23
blogStatus: released
release: Tooling
---

Most teams have a staging environment. Most teams have a production environment. Most teams have a gap between them filled by a human being clicking a button labeled "Promote to Production."

That button is the most dangerous piece of infrastructure in the entire pipeline.

In July 2026, Beskid CI learned to auto-promote. The design doc landed at commit [`c93d4736`](https://github.com/Cyber-Nomad-Collective/beskid/commit/c93d4736) — "docs: design automatic production promotion." The implementation followed at [`b2e9b830`](https://github.com/Cyber-Nomad-Collective/beskid/commit/b2e9b830) — "ci: auto-promote production after staging." The contract is simple: if staging is green, production follows. No exceptions. No manual gates. No "someone should click the button."

## Why manual promotion breaks things

Manual promotion creates divergence. The sequence is always the same:

1. Staging passes. The "Promote" button appears.
2. Someone is busy. The button waits.
3. While the button waits, someone hotfixes production directly — a config change, a secret rotation, a DNS update.
4. The button is finally clicked. Production now reflects staging-plus-three-weeks of drift. The deployment fails in a way staging didn't predict.
5. The postmortem blames "the deployment process." The deployment process was fine. The human bottleneck was the problem.

This is not hypothetical. Every team that runs a manual promotion gate has a story about the time staging was green and production went red. The root cause is never "the code was wrong." The code passed staging. The root cause is that staging and production diverged while someone was deciding whether to click a button.

The [Book chapter "Green tests, red production"](/book/00-why-beskid-exists/green-tests-red-production/) covers this in detail. A green test suite is not a guarantee of correctness. It is a guarantee that the code behaves the way the tests expect. If the production environment has diverged from the staging environment — different configs, different secrets, different network topology, different data — then the tests are testing the wrong thing. The fastest way to create that divergence is to put a human in the promotion path.

## The implementation

The auto-promotion pipeline is not a single commit. It is a sequence of commits, each fixing a thing that broke when the previous commit deployed. This is honest build engineering: the initial implementation is never the final one.

**The design doc** (`c93d4736`) established the contract: staging CI passes → production deploy triggers automatically. No approval gate. No manual trigger. The design called out the risks — what if staging passes but the test coverage has a gap? — and answered them: the gap is a test problem, not a process problem. Fix the tests. Do not add a human to paper over missing coverage.

**The implementation** (`b2e9b830`) wired the trigger: the staging workflow, on success, emits a `production-promote` event. The production workflow listens for that event. If the event fires, production deploys. The trigger is a workflow dispatch, not a webhook — it runs inside GitHub Actions, not across a network boundary. One less thing to time out.

**The fixes** came in waves:

- `allow same-run production promotion source` — The initial implementation required the promotion event to come from a different workflow run. That meant staging had to finish, then a separate workflow had to fire. That's a race condition. The fix allowed the staging workflow to promote production in the same run, atomically.
- `unblock production promote environment gate` — The production environment had a protection rule: "require manual approval." That was the whole thing we were trying to remove. The rule was deleted.
- `Coolify staging deploy without deployment UUID` — Coolify, the deployment orchestrator, normally requires a deployment UUID to track the deploy lifecycle. Staging deploys don't need lifecycle tracking; they need to run and report pass/fail. The fix made UUID optional for staging.
- `Coolify Compose deploy without deployment UUID` — Same fix, different Coolify path. Compose-based services got the same treatment.
- `Pin beskid_infra Coolify staging UUID` — For the services that do need lifecycle tracking (production), the UUID is pinned in `beskid_infra`, not generated at deploy time. Generated UUIDs are different every time; pinned UUIDs let Coolify correlate deploys across runs.

**The Coolify sync.** The lane JSON maps service UUIDs to Coolify services. OpenBao stores secrets — GHCR tokens, deployment keys, webhook signatures. The auto-promotion pipeline pulls secrets from OpenBao at deploy time, not at workflow start. If a secret rotates between staging passing and production deploying — a window of about ninety seconds — production gets the new secret, not the cached one.

## The contract

The auto-promotion contract is not: "staging is a perfect predictor of production." No staging environment is. The contract is: "staging and production are the same environment, deployed by the same process, from the same artifact, with the same config, in the same order, every time."

The process is the invariant. If the process is identical, and staging passes, and production fails — that is useful information. It means the environments have diverged in a way the process doesn't control. Fix the divergence. Do not add a human.

If the process is not identical — if staging is deployed by CI and production is deployed by a human clicking a button — then production failures are noise. You cannot distinguish "the code is wrong" from "the human clicked the wrong button" from "the environments drifted while the human was deciding whether to click."

## What this enables

Auto-promotion is not a feature. It is an enabler. It enables:

- **Deploy-on-merge.** Merge to main, staging deploys, tests pass, production deploys. Total latency: under five minutes. No human in the loop means no queuing delay.
- **Rollback safety.** If production fails, the previous deploy's artifact is still in the registry. Rollback is a re-deploy of the last-known-good artifact, not a git revert that needs its own CI run.
- **Audit trail.** Every production deploy is a workflow run with a timestamp, a commit SHA, and a full log. No "who clicked the button and when" — the log is the button.

The Beskid platform now deploys this way. The spec site, the tracker, the package registry, the monitor dashboard — all auto-promoted from green staging. The process is boring. It should be.

## Provenance

[`c93d4736` — design automatic production promotion](https://github.com/Cyber-Nomad-Collective/beskid/commit/c93d4736) · [`b2e9b830` — auto-promote production after staging](https://github.com/Cyber-Nomad-Collective/beskid/commit/b2e9b830)
