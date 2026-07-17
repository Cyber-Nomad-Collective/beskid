---
title: "v0.4: Platform services, auth, and delivery tooling"
description: "An in-progress delivery band for shared services, the roadmap product, hosting, and release infrastructure."
date: 2026-06-08
blogStatus: in-progress
release: v0.4
---

v0.4 is in progress. It begins after v0.3's cutoff at `aaddd32`; the tracker narrative currently covers the initial 26 May–7 June 2026 burst through `ee88edf`.

The landed work in that window includes the auth-hub and shared-web-package direction, tracker and nexus integration, container and web-workspace CI improvements, observability work, tracker SQLite source-of-truth work, scoped GitHub sync, and kanban UX fixes. It also includes continuing compiler and corelib stabilization work.

The tracker currently records **36 Done**, **11 In Progress**, and **5 Backlog** tasks. The distinction matters: the completed count is not a v0.4 closure claim. Remaining work includes, among other items, production OAuth and webhook validation, production nexus smoke coverage, release verification, and parts of the corelib matrix, package publishing, and editor integration.

Use [the Platform Spec](/platform-spec/) for normative behaviour. This post reports tracker status and is updated as the in-progress band changes.

## Provenance

[Tracker record](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.4/version.json) · [maintainer narrative](https://github.com/Cyber-Nomad-Collective/beskid_tracker/blob/main/data/v0.4/article.md) · [current narrative cutoff `ee88edf`](https://github.com/Cyber-Nomad-Collective/beskid/commit/ee88edf)
